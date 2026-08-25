#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function parseArgs(argv) {
  const options = {
    plan: "scratch/visual-generation/expanded-mobile-memory-v2/manifest.json",
    assetRoot: "assets/images/words/memory",
    basePath: "assets/images/words/memory",
    output: "js/visual_assets.js"
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--plan") options.plan = argv[++i];
    else if (arg === "--asset-root") options.assetRoot = argv[++i];
    else if (arg === "--base-path") options.basePath = argv[++i];
    else if (arg === "--output") options.output = argv[++i];
    else if (arg === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function readCurrentManifest(filename) {
  if (!fs.existsSync(filename)) return { assets: {} };
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), sandbox, { filename });
  return sandbox.window.visualAssetManifest || { assets: {} };
}

function collectCompletedAssets(plan, assetRoot) {
  const completed = {};
  for (const [wordId, entry] of Object.entries(plan.assets || {})) {
    if (!entry || !entry.file) continue;
    if (fs.existsSync(path.join(assetRoot, entry.file))) completed[wordId] = entry.file.replace(/\\/g, "/");
  }
  return completed;
}

function collectWordAssets(assetRoot) {
  if (!fs.existsSync(assetRoot)) return {};
  const assets = {};
  for (const filename of fs.readdirSync(assetRoot)) {
    const match = /^((?:v|ve|vx)_\d+)\.webp$/i.exec(filename);
    if (match) assets[match[1].toLowerCase()] = filename;
  }
  return assets;
}

// Kept as an alias for callers created before expanded/example deck assets
// could be published directly by word ID.
const collectStandardAssets = collectWordAssets;

function keepExistingAssets(assets, assetRoot) {
  const existing = {};
  for (const [wordId, filename] of Object.entries(assets || {})) {
    if (typeof filename !== "string" || !filename) continue;
    if (fs.existsSync(path.join(assetRoot, filename))) existing[wordId] = filename.replace(/\\/g, "/");
  }
  return existing;
}

function sortAssets(assets) {
  return Object.fromEntries(Object.entries(assets).sort(([left], [right]) =>
    left.localeCompare(right, undefined, { numeric: true })
  ));
}

function serializeManifest({ version, basePath, target, assets }) {
  return `// Generated visual asset manifest. Keep this small and cacheable on mobile.\n` +
    `window.visualAssetManifest = Object.freeze({\n` +
    `  version: ${JSON.stringify(version)},\n` +
    `  basePath: ${JSON.stringify(basePath)},\n` +
    `  target: Object.freeze(${JSON.stringify(target)}),\n` +
    `  assets: Object.freeze(${JSON.stringify(assets, null, 2).replace(/^/gm, "  ").trimStart()})\n` +
    `});\n`;
}

function writeRuntimeManifest(options, repoRoot = path.resolve(__dirname, "..")) {
  const planPath = path.resolve(repoRoot, options.plan);
  const assetRoot = path.resolve(repoRoot, options.assetRoot);
  const outputPath = path.resolve(repoRoot, options.output);
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const current = readCurrentManifest(outputPath);
  const retained = keepExistingAssets(current.assets, assetRoot);
  const localWords = collectWordAssets(assetRoot);
  const completed = collectCompletedAssets(plan, assetRoot);
  const assets = sortAssets({ ...retained, ...localWords, ...completed });
  const source = serializeManifest({
    version: plan.version || current.version || "mobile-memory-v2",
    basePath: options.basePath,
    target: plan.target || current.target || { width: 768, height: 512, format: "webp", maxBytes: 100000 },
    assets
  });
  fs.writeFileSync(outputPath, source, "utf8");
  return {
    outputPath,
    previousAssets: Object.keys(current.assets || {}).length,
    retainedAssets: Object.keys(retained).length,
    localWordAssets: Object.keys(localWords).length,
    completedMappings: Object.keys(completed).length,
    totalAssets: Object.keys(assets).length
  };
}

function printHelp() {
  console.log(`Usage: node scripts/write-visual-runtime-manifest.js [options]\n\n` +
    `  --plan PATH        Planner manifest.json\n` +
    `  --asset-root PATH  Local root used to verify completed WebPs\n` +
    `  --base-path PATH   Runtime local/CDN base URL\n` +
    `  --output PATH      Runtime JavaScript manifest\n`);
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) printHelp();
    else console.log(JSON.stringify(writeRuntimeManifest(options), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  parseArgs,
  readCurrentManifest,
  collectCompletedAssets,
  collectWordAssets,
  collectStandardAssets,
  keepExistingAssets,
  sortAssets,
  serializeManifest,
  writeRuntimeManifest
};
