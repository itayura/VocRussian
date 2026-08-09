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
    const progress = {};

    for (let i = 1; i <= 50; i++) {
      const box = (i % 5) + 1;
      progress['v_' + i] = {
        box,
        nextReview: now - day * (i % 3),
        lastReview: now - day * (i % 5 + 1),
        correctCount: box * 3,
        wrongCount: Math.max(0, box - 2),
        starred: i % 7 === 0,
        hidden: false,
        reviewEvents: []
      };
    }

    const dailyXpLog = {};
    const today = new Date();
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      dailyXpLog[date.toISOString().split('T')[0]] = 30 + ((6 - d) * 15);
    }

    localStorage.setItem('voc_russian_progress', JSON.stringify(progress));
    localStorage.setItem('voc_russian_stats', JSON.stringify({
      xp: 1240,
      streak: 7,
      lastActiveDate: today.toISOString().split('T')[0],
      totalCorrect: 640,
      totalAttempts: 720,
      dailyXpLog,
      settings: {
        theme: 'privyetik',
        nativeLanguage: 'en',
        maxStreak: 12,
        animationsEnabled: false
      },
      updatedAt: now
    }));
    localStorage.setItem('voc_russian_active_db', 'standard');
    localStorage.setItem('voc_onboarding_completed_v1', 'true');
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
    label: 'tablet7',
    width: 600,
    height: 960,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
  {
    label: 'tablet10',
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
  { 
    name: '4_grammar',     
    nav: 'grammar',     
    wait: 800,
    setup: async (page, vp) => {
      // Show the Practice Arena tab with the subjects available
      await page.locator('#grammar-tab-practice').click();
      await page.waitForTimeout(400);
    }
  },
  { name: '5_alphabet',    nav: 'alphabet',    wait: 800  },
  { name: '6_stats',       nav: 'stats',       wait: 800  },
  {
    name: '7_genitive_quiz',
    nav: 'grammar',
    wait: 800,
    setup: async (page, vp) => {
      // 1. Mock SupabaseSync to satisfy ensureCloudConnected()
      await page.evaluate(() => {
        window.SupabaseSync = window.SupabaseSync || {};
        window.SupabaseSync.connectionState = "connected";
        window.SupabaseSync.user = { id: "mock-user-id", email: "learner@example.com" };
        window.SupabaseSync.client = {
          auth: {
            getSession: async () => ({ data: { session: { access_token: "mock-token" } }, error: null })
          }
        };
      });

      // 2. Click Practice Arena tab
      await page.locator('#grammar-tab-practice').click();
      await page.waitForTimeout(300);

      // 3. Select Genitive Case in the checkbox list
      await page.evaluate(() => {
        document.querySelectorAll('#custom-topics-checkboxes .topic-checkbox').forEach(cb => cb.checked = false);
      });
      await page.locator('#custom-topics-checkboxes input[value="genitive_case"]').check();
      await page.waitForTimeout(200);

      // 4. Inject the quiz questions into the local storage buffer matching the selected options
      await page.evaluate(() => {
        const cefr = document.getElementById("practice-quiz-level").value || "all";
        const count = parseInt(document.getElementById("practice-quiz-count").value, 10) || 5;
        const buffer = {
          cefr: cefr,
          topicParam: "Genitive Case",
          count: count,
          questions: [
            {
              sentencePattern: "У меня́ нет [blank] (кни́га).",
              translation: "I don't have a book.",
              answer: "кни́ги",
              choices: ["кни́ги", "кни́гу", "кни́гой", "кни́ге"],
              explanation: "The Genitive case (книги) is used here because of the negation 'нет' (do not have)."
            }
          ]
        };
        localStorage.setItem("voc_grammar_quiz_buffer", JSON.stringify(buffer));
      });

      // 5. Click Start AI Quiz
      await page.locator('#practice-start-btn').click();
      
      // 6. Wait for the active quiz screen to be visible
      await page.waitForSelector('#practice-active-screen', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);

      // 7. Click the correct answer choice button
      const correctBtn = page.locator('#quiz-choices-container button', { hasText: 'кни́ги' }).first();
      await correctBtn.click();
      
      // Wait 3000ms for the confetti animation to finish
      await page.waitForTimeout(3000);
      
      // Scroll down to show the explanation
      await page.evaluate(() => {
        const activeScreen = document.getElementById('practice-active-screen');
        if (activeScreen) {
          activeScreen.scrollTop = activeScreen.scrollHeight;
        }
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(300);

      // Click a word in the sentence to trigger the translation / add-to-vocab popup
      const cyrWord = page.locator('#quiz-sentence-prompt .cyrillic-word', { hasText: 'меня́' }).first();
      if (await cyrWord.isVisible().catch(() => false)) {
        await cyrWord.click();
        await page.waitForTimeout(500);
      }
    }
  },
  {
    name: '8_tutor_explanation',
    nav: 'grammar',
    wait: 800,
    setup: async (page, vp) => {
      // 1. Mock SupabaseSync to satisfy ensureCloudConnected()
      await page.evaluate(() => {
        window.SupabaseSync = window.SupabaseSync || {};
        window.SupabaseSync.connectionState = "connected";
        window.SupabaseSync.user = { id: "mock-user-id", email: "learner@example.com" };
      });

      // 2. Inject Genitive Case explanation into the local storage cache
      await page.evaluate(() => {
        const cacheKey = "voc_grammar_explanations_cache";
        const explanationPayload = {
          title: "Genitive Case (Роди́тельный паде́ж)",
          explanation: "The Genitive Case is primarily used to show possession (like 'of' or 's in English), negation (with нет), and after certain prepositions (у, без, для).",
          rules: [
            { ending: "Masculine nouns: +а / +я", rule: "Add -а for hard consonants, -я for soft consonants.", example: "стол -> стола́" },
            { ending: "Feminine nouns: -а -> -ы, -я -> -и", rule: "Change -а to -ы, -я to -и.", example: "кни́га -> кни́ги" },
            { ending: "Neuter nouns: -о -> -а, -е -> -я", rule: "Change -о to -а, -е to -я.", example: "окно́ -> окна́" }
          ],
          examples: [
            { ru: "У меня́ нет кни́ги.", en: "I don't have a book.", explanation: "The Genitive case (кни́ги) is used here because of the negation 'нет' (do not have)." },
            { ru: "Это дом бра́та.", en: "This is the brother's house.", explanation: "The Genitive case (бра́та) shows possession (of the brother)." }
          ]
        };
        const cache = {};
        cache["genitive_case"] = explanationPayload;
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      });

      // 3. Click the Tutor tab (just in case)
      await page.locator('#grammar-tab-tutor').click();
      await page.waitForTimeout(200);

      // 4. Load the Genitive Case lesson programmatically
      await page.evaluate(async () => {
        await window.GrammarManager.loadTutorLesson("genitive_case");
      });
      await page.waitForTimeout(500);

      // 5. Scroll down to show more of the explanation (declension rules table / examples)
      await page.evaluate(() => {
        window.scrollTo(0, 350);
      });
      await page.waitForTimeout(500);
    }
  }
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

    // Log console messages & errors
    page.on('console', msg => console.log('  [browser]', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('  [browser-error]', err.message));

    // Handle dialogs (alerts)
    page.on('dialog', async dialog => {
      console.log('  [browser-dialog]', dialog.type(), dialog.message());
      await dialog.dismiss();
    });

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

      // Run custom setup if defined
      if (shot.setup) {
        await shot.setup(page, vp);
      }

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
