#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROMPT_VERSION = "mobile-memory-v2";
const TARGET = Object.freeze({
  width: 768,
  height: 512,
  format: "webp",
  maxBytes: 100000
});

const BUILTIN_GENERATION = Object.freeze({
  mode: "built-in-imagegen",
  callsPerAsset: 1,
  sourceFormat: "png"
});

const CEFR_PRIORITY = Object.freeze({ A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 });

const DECKS = Object.freeze({
  standard: { file: "js/db.js", globalName: "defaultVocabulary" },
  expanded: { file: "js/db_expanded.js", globalName: "expandedVocabulary" },
  example: { file: "js/db_example.js", globalName: "exampleVocabulary" }
});

function getCefrLevel(word) {
  const explicit = String(word && word.level || "").toUpperCase();
  if (CEFR_PRIORITY[explicit]) return explicit;
  const categoryMatch = String(word && word.category || "").toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
  return categoryMatch ? categoryMatch[1] : "unranked";
}

function normalizeConcept(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function conceptKey(word) {
  const semanticKey = `${normalizeConcept(word.translation)}|${normalizeConcept(word.pos)}`;
  const digest = crypto.createHash("sha256").update(semanticKey).digest("hex").slice(0, 16);
  return `concept-${digest}`;
}

function cleanPromptValue(value, maxLength = 260) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function buildPrompt(word) {
  const translation = cleanPromptValue(word.translation, 100) || "the vocabulary concept";
  const context = cleanPromptValue(word.exampleEn);
  const category = cleanPromptValue(word.category, 100);
  const partOfSpeech = cleanPromptValue(word.pos, 40);

  return [
    "Use case: stylized-concept",
    "Asset type: slim mobile vocabulary mnemonic card",
    `Primary request: create one instantly recognizable visual mnemonic for the concept “${translation}”.`,
    context
      ? `Scene/backdrop: use this example only to clarify the visual action or setting: “${context}”.`
      : "Scene/backdrop: a simple real-world setting that makes the concept immediately understandable.",
    `Subject: a single clear object, person, or action expressing “${translation}”${partOfSpeech ? ` (${partOfSpeech})` : ""}${category ? `; category context: ${category}` : ""}.`,
    "Style/medium: premium cinematic editorial illustration with tactile 3D-painted forms; expressive but not childish.",
    "Composition/framing: 3:2 landscape; keep the complete semantic subject inside the center 60%; generous crop-safe margins; no tiny details; readable at 320 CSS pixels wide.",
    "Lighting/mood: soft volumetric light with a calm, memorable atmosphere.",
    "Color palette: rich midnight navy with luminous teal and restrained warm coral accents.",
    "Constraints: one focal concept; no text, letters, numbers, flags, logos, watermark, border, or UI.",
    "Avoid: collages, split scenes, decorative clutter, ambiguous gestures, illegible background details."
  ].join("\n");
}

function loadDeck(deckName, repoRoot = path.resolve(__dirname, "..")) {
  const config = DECKS[deckName];
  if (!config) throw new Error(`Unknown deck “${deckName}”. Choose: ${Object.keys(DECKS).join(", ")}.`);

  const source = fs.readFileSync(path.join(repoRoot, config.file), "utf8");
  const sandbox = { window: {}, module: { exports: {} } };
  vm.runInNewContext(source, sandbox, { filename: config.file });
  const words = sandbox.window[config.globalName] || sandbox.module.exports[config.globalName];
  if (!Array.isArray(words)) throw new Error(`Could not load ${config.globalName} from ${config.file}.`);
  return words;
}

function buildVisualPlan(words, { deck = "expanded" } = {}) {
  const concepts = new Map();
  const wordMap = {};

  for (const word of words) {
    if (!word || !word.id || !word.translation) continue;
    const id = conceptKey(word);
    if (!concepts.has(id)) concepts.set(id, { conceptId: id, representative: word, wordIds: [] });
    concepts.get(id).wordIds.push(word.id);
    wordMap[word.id] = {
      conceptId: id,
      file: `${deck}/concepts/${id}.${TARGET.format}`
    };
  }

  const jobs = Array.from(concepts.values()).map(({ conceptId, representative, wordIds }) => {
    const cefrLevel = getCefrLevel(representative);
    return {
    conceptId,
    representativeWordId: representative.id,
    wordIds,
    cefrLevel,
    priorityRank: CEFR_PRIORITY[cefrLevel] || 99,
    promptVersion: PROMPT_VERSION,
    prompt: buildPrompt(representative),
    generationMode: BUILTIN_GENERATION.mode,
    callsPerAsset: BUILTIN_GENERATION.callsPerAsset,
    sourceFile: `${deck}/staging/${conceptId}.png`,
    finalFile: `${deck}/concepts/${conceptId}.${TARGET.format}`
  };
  }).sort((left, right) =>
    left.priorityRank - right.priorityRank ||
    left.representativeWordId.localeCompare(right.representativeWordId, undefined, { numeric: true })
  );

  return {
    version: PROMPT_VERSION,
    deck,
    target: TARGET,
    stats: {
      words: Object.keys(wordMap).length,
      uniqueConcepts: jobs.length,
      reusedMappings: Object.keys(wordMap).length - jobs.length
    },
    jobs,
    wordMap
  };
}

function parseArgs(argv) {
  const options = { deck: "expanded", batchSize: 100, limit: null, output: null, existingRoot: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--deck") options.deck = argv[++i];
    else if (arg === "--batch-size") options.batchSize = Number(argv[++i]);
    else if (arg === "--limit") options.limit = Number(argv[++i]);
    else if (arg === "--output") options.output = argv[++i];
    else if (arg === "--existing-root") options.existingRoot = argv[++i];
    else if (arg === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1) {
    throw new Error("--batch-size must be a positive integer.");
  }
  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }
  return options;
}

function clearGeneratedBatchFiles(batchRoot) {
  if (!fs.existsSync(batchRoot)) return 0;
  let removed = 0;
  for (const filename of fs.readdirSync(batchRoot)) {
    if (!/^batch-\d{4}-of-\d{4}\.jsonl$/.test(filename)) continue;
    fs.unlinkSync(path.join(batchRoot, filename));
    removed += 1;
  }
  return removed;
}

function writePlan(plan, options, repoRoot = path.resolve(__dirname, "..")) {
  const outputRoot = path.resolve(repoRoot, options.output || `scratch/visual-generation/${plan.deck}-${PROMPT_VERSION}`);
  const batchRoot = path.join(outputRoot, "batches");
  fs.mkdirSync(batchRoot, { recursive: true });
  clearGeneratedBatchFiles(batchRoot);

  const eligibleJobs = options.existingRoot
    ? plan.jobs.filter(job => !fs.existsSync(path.resolve(repoRoot, options.existingRoot, job.finalFile)))
    : plan.jobs;
  const pendingJobs = options.limit === null ? eligibleJobs : eligibleJobs.slice(0, options.limit);
  const batches = [];
  const batchCount = Math.ceil(pendingJobs.length / options.batchSize);

  for (let index = 0; index < batchCount; index += 1) {
    const jobs = pendingJobs.slice(index * options.batchSize, (index + 1) * options.batchSize);
    const filename = `batch-${String(index + 1).padStart(4, "0")}-of-${String(batchCount).padStart(4, "0")}.jsonl`;
    fs.writeFileSync(
      path.join(batchRoot, filename),
      `${jobs.map(job => JSON.stringify(job)).join("\n")}\n`,
      "utf8"
    );
    batches.push(`batches/${filename}`);
  }

  const manifest = {
    version: plan.version,
    deck: plan.deck,
    target: plan.target,
    stats: {
      ...plan.stats,
      pendingConcepts: eligibleJobs.length,
      plannedConcepts: pendingJobs.length,
      batches: batchCount
    },
    batches,
    assets: plan.wordMap
  };
  fs.writeFileSync(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(outputRoot, "plan.json"), `${JSON.stringify({ ...manifest, jobs: pendingJobs }, null, 2)}\n`, "utf8");
  return { outputRoot, manifest };
}

function printHelp() {
  console.log(`Usage: node scripts/plan-visual-generation.js [options]\n\n` +
    `  --deck standard|expanded|example  Deck to plan (default: expanded)\n` +
    `  --batch-size N                   Prompts per resumable JSONL batch (default: 100)\n` +
    `  --limit N                        Plan only the first N pending concepts (pilot runs)\n` +
    `  --output PATH                    Output directory (default: scratch/visual-generation/...)\n` +
    `  --existing-root PATH             Skip concepts whose final WebP already exists\n`);
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      process.exit(0);
    }
    const words = loadDeck(options.deck);
    const plan = buildVisualPlan(words, { deck: options.deck });
    const { outputRoot, manifest } = writePlan(plan, options);
    console.log(JSON.stringify({ outputRoot, ...manifest.stats, target: manifest.target }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  PROMPT_VERSION,
  TARGET,
  BUILTIN_GENERATION,
  CEFR_PRIORITY,
  getCefrLevel,
  normalizeConcept,
  conceptKey,
  buildPrompt,
  loadDeck,
  buildVisualPlan,
  parseArgs,
  clearGeneratedBatchFiles,
  writePlan
};
