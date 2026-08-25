#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

function parseArgs(argv) {
  const options = {
    input: "assets/images/words/memory",
    output: "assets/images/words/memory",
    width: 768,
    height: 512,
    quality: 0.72,
    maxBytes: 100000,
    force: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") options.input = argv[++i];
    else if (arg === "--output") options.output = argv[++i];
    else if (arg === "--width") options.width = Number(argv[++i]);
    else if (arg === "--height") options.height = Number(argv[++i]);
    else if (arg === "--quality") options.quality = Number(argv[++i]);
    else if (arg === "--max-bytes") options.maxBytes = Number(argv[++i]);
    else if (arg === "--force") options.force = true;
    else if (arg === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.width) || !Number.isInteger(options.height) || options.width < 1 || options.height < 1) {
    throw new Error("--width and --height must be positive integers.");
  }
  if (!(options.quality > 0 && options.quality <= 1)) throw new Error("--quality must be between 0 and 1.");
  if (!Number.isInteger(options.maxBytes) || options.maxBytes < 1024) throw new Error("--max-bytes must be at least 1024.");
  return options;
}

async function encodeWebp(page, sourceBuffer, mimeType, options) {
  const sourceUrl = `data:${mimeType};base64,${sourceBuffer.toString("base64")}`;
  let quality = options.quality;
  let encoded = null;

  while (quality >= 0.42) {
    const dataUrl = await page.evaluate(async ({ sourceUrl, width, height, quality }) => {
      const image = new Image();
      image.src = sourceUrl;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#071118";
      context.fillRect(0, 0, width, height);

      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      const sourceX = (image.naturalWidth - sourceWidth) / 2;
      const sourceY = (image.naturalHeight - sourceHeight) / 2;
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob) throw new Error("This browser could not encode WebP.");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }, { sourceUrl, width: options.width, height: options.height, quality });

    encoded = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
    if (encoded.length <= options.maxBytes) break;
    quality = Number((quality - 0.06).toFixed(2));
  }

  return { buffer: encoded, quality };
}

async function optimizeDirectory(options, repoRoot = path.resolve(__dirname, "..")) {
  const inputRoot = path.resolve(repoRoot, options.input);
  const outputRoot = path.resolve(repoRoot, options.output);
  const sourceFiles = fs.readdirSync(inputRoot)
    .filter(filename => /\.(png|jpe?g)$/i.test(filename))
    .sort();
  fs.mkdirSync(outputRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  try {
    for (const filename of sourceFiles) {
      const inputPath = path.join(inputRoot, filename);
      const outputPath = path.join(outputRoot, `${path.parse(filename).name}.webp`);
      if (!options.force && fs.existsSync(outputPath)) {
        results.push({ filename, skipped: true, outputPath });
        continue;
      }

      const source = fs.readFileSync(inputPath);
      const mimeType = /\.png$/i.test(filename) ? "image/png" : "image/jpeg";
      const encoded = await encodeWebp(page, source, mimeType, options);
      fs.writeFileSync(outputPath, encoded.buffer);
      results.push({
        filename,
        inputBytes: source.length,
        outputBytes: encoded.buffer.length,
        quality: encoded.quality,
        outputPath
      });
    }
  } finally {
    await browser.close();
  }

  const converted = results.filter(result => !result.skipped);
  const inputBytes = converted.reduce((sum, result) => sum + result.inputBytes, 0);
  const outputBytes = converted.reduce((sum, result) => sum + result.outputBytes, 0);
  const oversized = converted.filter(result => result.outputBytes > options.maxBytes);
  return {
    results,
    summary: {
      converted: converted.length,
      skipped: results.length - converted.length,
      inputBytes,
      outputBytes,
      reductionPercent: inputBytes ? Number(((1 - outputBytes / inputBytes) * 100).toFixed(1)) : 0,
      oversized: oversized.map(result => path.basename(result.outputPath))
    }
  };
}

function printHelp() {
  console.log(`Usage: node scripts/optimize-visual-assets.js [options]\n\n` +
    `  --input PATH       Source PNG/JPEG directory\n` +
    `  --output PATH      Destination WebP directory\n` +
    `  --width N          Output width (default: 768)\n` +
    `  --height N         Output height (default: 512)\n` +
    `  --quality 0..1     Starting WebP quality (default: 0.72)\n` +
    `  --max-bytes N      Per-image byte budget (default: 100000)\n` +
    `  --force            Replace existing WebP outputs\n`);
}

if (require.main === module) {
  (async () => {
    try {
      const options = parseArgs(process.argv.slice(2));
      if (options.help) {
        printHelp();
        return;
      }
      const report = await optimizeDirectory(options);
      console.log(JSON.stringify(report, null, 2));
      if (report.summary.oversized.length) process.exitCode = 1;
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  })();
}

module.exports = { parseArgs, encodeWebp, optimizeDirectory };
