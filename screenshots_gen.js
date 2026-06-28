/**
 * Google Play Store Screenshot Generator
 * Captures polished screenshots at phone & tablet dimensions.
 *
 * Phone  : 1080 × 1920  (portrait, 2x DPR → renders at 540×960 CSS px)
 * Tablet : 1600 × 2560  (portrait, 2x DPR → renders at 800×1280 CSS px)
 *
 * Run:  node screenshots_gen.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const OUT_DIR  = path.join(__dirname, 'screenshots');

// ── Seed data injected via localStorage ──────────────────────────────────────
const SEED_SCRIPT = `
  (function() {
    const now = Date.now();
    const day = 86400000;

    // SRS progress: put several words in boxes 3-5
    const srs = {};
    for (let i = 1; i <= 50; i++) {
      const box = (i % 5) + 1;
      srs['v_' + i] = {
        box,
        nextReview: now - day * (i % 3),
        lastReview: now - day * (i % 5 + 1),
        correct: box * 3,
        incorrect: Math.max(0, box - 2),
        starred: i % 7 === 0
      };
    }
    localStorage.setItem('voc_russian_srs', JSON.stringify(srs));

    // XP & stats
    localStorage.setItem('voc_russian_xp', '1240');
    localStorage.setItem('voc_russian_streak', '7');
    localStorage.setItem('voc_russian_streak_max', '12');
    localStorage.setItem('voc_russian_level', 'B1');

    // Theme
    const settings = JSON.parse(localStorage.getItem('voc_russian_settings') || '{}');
    settings.theme = 'privyetik';
    settings.nativeLanguage = 'en';
    localStorage.setItem('voc_russian_settings', JSON.stringify(settings));

    // Weekly XP history
    const hist = {};
    const today = new Date();
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today); dt.setDate(dt.getDate() - d);
      const key = dt.toISOString().split('T')[0];
      hist[key] = 30 + Math.round(Math.random() * 120);
    }
    localStorage.setItem('voc_russian_xp_history', JSON.stringify(hist));
  })();
`;

// Force-apply theme-privyetik directly on <body> — bypasses app.js entirely
const FORCE_THEME = () => {
  document.body.classList.remove(
    'theme-midnight', 'theme-emerald', 'theme-cyberpunk', 'theme-light', 'theme-privyetik'
  );
  document.body.classList.add('theme-privyetik');
};

// ── Viewport configs ──────────────────────────────────────────────────────────
const VIEWPORTS = [
  {
    label: 'phone',
    width: 540,
    height: 960,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  {
    label: 'tablet',
    width: 800,
    height: 1280,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
];

// ── Screenshot specs ──────────────────────────────────────────────────────────
const SHOTS = [
  { name: '1_dashboard',   nav: 'dashboard',   wait: 1200 },
  { name: '2_dictionary',  nav: 'dictionary',  wait: 800  },
  { name: '3_study',       nav: 'study-select',wait: 600  },
  { name: '4_grammar',     nav: 'grammar',     wait: 800  },
  { name: '5_alphabet',    nav: 'alphabet',    wait: 800  },
  { name: '6_stats',       nav: 'stats',       wait: 800  },
];

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const physW = vp.width  * vp.deviceScaleFactor;
    const physH = vp.height * vp.deviceScaleFactor;
    console.log(`\n── ${vp.label.toUpperCase()} (${physW}×${physH} physical) ──`);

    const ctx = await browser.newContext({
      viewport:          { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile:          vp.isMobile,
      hasTouch:          vp.hasTouch,
    });
    const page = await ctx.newPage();

    // 1. Load the app
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    // 2. Dismiss landing page
    const cta = page.locator('#landing-cta-start');
    if (await cta.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cta.click();
      await page.waitForTimeout(800);
    }

    // 3. Inject seed data and reload
    await page.evaluate(SEED_SCRIPT);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);

    // Dismiss landing again after reload
    const cta2 = page.locator('#landing-cta-start');
    if (await cta2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cta2.click();
      await page.waitForTimeout(800);
    }

    // Force Privyetik theme directly on <body>
    await page.evaluate(FORCE_THEME);

    // 4. Take each screenshot
    for (const shot of SHOTS) {
      console.log(`  → ${shot.name}`);
      const navBtn = page.locator(`.nav-item[data-target="${shot.nav}"]`).first();
      await navBtn.click({ force: true });
      await page.waitForTimeout(shot.wait);

      // Re-apply after each nav in case JS re-runs applyTheme
      await page.evaluate(FORCE_THEME);
      await page.waitForTimeout(150);

      const file = path.join(OUT_DIR, `${vp.label}_${shot.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`     ✓ saved ${path.basename(file)}`);
    }

    await ctx.close();
  }

  await browser.close();
  console.log(`\n✅  All screenshots saved to:\n    ${OUT_DIR}`);
}

run().catch(err => { console.error(err); process.exit(1); });
