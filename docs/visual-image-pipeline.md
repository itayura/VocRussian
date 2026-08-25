# Mobile visual-image pipeline

Visual Recall should not bundle full-resolution generation outputs. The mobile delivery target is a **768×512 WebP under 100 KB**, with the semantic subject kept inside the center 60% so the same asset survives compact and portrait crops.

## Current delivery contract

- Source generations remain lossless PNG masters outside the shipped app.
- App assets are 3:2 WebP files at 768×512.
- `js/visual_assets.js` is the small runtime manifest that maps a word ID to an available asset.
- Standard-deck words without generated scenes use the existing storybook fallback.
- Expanded/example words enter Visual Recall only after their ID is present in the manifest, so the app never displays thousands of broken URLs.
- Images are fetched lazily and cached by the service worker after use. Do not pre-cache the expanded deck.

## Scale estimate

The expanded deck contains 3,376 word records. Exact normalized translation + part-of-speech grouping produces roughly 2,886 visual concepts, allowing about 490 word-to-image mappings to reuse an image safely.

At the enforced 100 KB ceiling, all expanded assets would still be up to about 282 MB. At an expected average near 60 KB they are about 169 MB. They should therefore live in object storage/CDN and be downloaded on demand, not inside the APK/PWA install.

## 1. Plan resumable prompt batches

```powershell
npm run visual:plan
```

This reads `js/db_expanded.js` and writes ignored scratch artifacts under:

```text
scratch/visual-generation/expanded-mobile-memory-v2/
  manifest.json
  plan.json
  batches/batch-0001-of-0029.jsonl
  ...
```

Each JSONL row contains one distinct concept, its word mappings, a complete crop-safe prompt, its CEFR priority, and the workspace paths for its source and mobile assets. Defaults are batches of 100 so generation can resume without restarting the deck. Jobs are ordered A1 → C2.

Useful options:

```powershell
node scripts/plan-visual-generation.js --deck expanded --batch-size 50
node scripts/plan-visual-generation.js --deck expanded --limit 5 --batch-size 5 --output scratch/visual-generation/expanded-pilot-mobile-memory-v2
node scripts/plan-visual-generation.js --deck expanded --existing-root assets/images/words/memory
node scripts/plan-visual-generation.js --deck example --output scratch/visual-generation/example
```

## 2. Generate through built-in ImageGen

This project uses the built-in ChatGPT/Codex ImageGen tool only. It needs no `OPENAI_API_KEY` and does not make paid API requests. ChatGPT usage limits still apply, so deck coverage grows through small resumable batches rather than one unattended 2,886-image run.

Create the next five-job queue:

```powershell
npm run visual:pilot:plan
```

For each JSONL row, the Codex task should:

1. Skip a `finalFile` that already exists.
2. Make one built-in ImageGen call using that row's prompt; never combine concepts into a collage.
3. Copy the generated PNG into the row's `sourceFile` staging path.
4. Optimize completed masters and inspect them in the mobile card.
5. Publish the manifest only after the batch passes review.
6. Re-run the planner with `--existing-root assets/images/words/memory` to produce the next pending queue.

File existence is the completion ledger, so a task can stop at any point without losing progress. Concept deduplication also lets about 490 word mappings reuse an existing image. Keep the prompt version in every result so rejected scenes can be regenerated incrementally after a style change.

## 3. Optimize masters for mobile

```powershell
node scripts/optimize-visual-assets.js `
  --input scratch/visual-generation/expanded-mobile-memory-v2/staging `
  --output assets/images/words/memory/expanded/concepts
```

The optimizer uses the project's Chromium runtime, not a new image dependency. It center-crops to 3:2, emits 768×512 WebP, and lowers quality until the image meets the 100 KB budget. It leaves source masters untouched.

## 4. Quality gate

Before publishing a batch, verify:

- output dimensions are exactly 768×512;
- file size is at most 100 KB;
- the focal concept remains readable at 320 CSS pixels wide;
- no text, logos, watermarks, flags, split scenes, or ambiguous gestures;
- the representative word and example genuinely match the scene;
- a random sample is viewed in the flipped mobile card, not only as standalone images.

Reject individual concepts rather than discarding a whole successful batch.

## 5. Publish without growing the app bundle

Upload final WebPs to versioned object storage, for example:

```text
visuals/mobile-memory-v2/expanded/concepts/concept-abc123.webp
```

Publish the manifest last. The client manifest may use a CDN `basePath`; the existing `getWordVisualArtUrl()` already consumes manifest entries instead of assuming every word has a local file.

For locally mirrored outputs, update the runtime manifest with only files that really exist:

```powershell
npm run visual:manifest
```

For CDN delivery, pass the versioned public base URL while retaining a local mirror for completion checks:

```powershell
node scripts/write-visual-runtime-manifest.js `
  --asset-root assets/images/words/memory `
  --base-path https://cdn.example.com/visuals/mobile-memory-v2
```

For mobile sessions, prefetch only the next 5–10 due-card images. Keep a bounded runtime cache (for example 100–200 recently used images) and evict least-recently-used entries. This gives useful offline study coverage without turning first install into a several-hundred-megabyte download.

## Rollout order

1. Generate A1 and A2 due vocabulary first.
2. Measure recognition quality, average bytes, generation failure rate, and cache hit rate.
3. Continue by CEFR level in resumable batches.
4. Regenerate rejected concepts only.
5. Enable expanded Visual Recall progressively as manifest coverage grows.
