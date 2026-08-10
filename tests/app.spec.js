const { test, expect } = require('@playwright/test');

test.describe('Privyetik E2E Test Suite', () => {
  
  async function mockLogin(page) {
    await page.locator('.nav-item[data-target="sync"]').click({ force: true }); // Account tab
    await page.locator('#supabase-email').fill('learner@example.com');
    await page.locator('#supabase-password').fill('securepassword123');
    await page.locator('#supabase-auth-submit-btn').click();
    const okBtn = page.locator('#custom-alert-ok-btn');
    await okBtn.waitFor({ state: 'visible' });
    await okBtn.click();
  }

  async function selectGrammarTopic(page, topic) {
    const mobileSelect = page.locator('#tutor-topic-select-mobile');
    if (await mobileSelect.isVisible()) {
      await mobileSelect.selectOption(topic);
    } else {
      await page.locator(`.grammar-topic-btn[data-topic="${topic}"]`).click();
    }
  }

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`[Browser PageError]: ${err.message}`);
    });
    page.on('request', request => {
      if (request.url().endsWith('.js')) {
        console.log(`[Browser JS Request] ${request.url()}`);
      }
    });

    // Intercept Supabase Auth Calls
    await page.route('**/auth/v1/token*', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJleHAiOjE5OTk5OTk5OTl9.signature',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: 'mock-user-id',
              email: body.email || 'test@example.com',
              app_metadata: { provider: 'email' },
              user_metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }),
        });
      }
    });

    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-id',
          email: 'test@example.com',
          app_metadata: { provider: 'email' },
          user_metadata: {},
        }),
      });
    });

    // Intercept Supabase DB/REST Calls
    await page.route('**/rest/v1/voc_words*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route('**/rest/v1/voc_progress*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route('**/rest/v1/voc_stats*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route('**/rest/v1/voc_grammar_progress*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Intercept Supabase Edge Functions
    await page.route('**/functions/v1/ai-grammar', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.action === 'explain') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              title: `Mock Lesson: ${body.topic || 'Subject'}`,
              explanation: `This is a mock AI explanation for ${body.topic || 'the topic'}.`,
              rules: [
                { ending: '+ы', rule: 'Masculine Consonant', example: 'студе́нт &rarr; студе́нты' }
              ],
              examples: [
                { ru: 'Это мок-пример.', en: 'This is a mock example.', explanation: 'Prepositional case singular.' }
              ]
            }
          }),
        });
      } else if (body.action === 'quiz') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              questions: [
                {
                  topicId: body.topicIds?.[0] || 'nominative_case',
                  sentencePattern: 'Это новая [blank] (книга).',
                  answer: 'книга',
                  choices: ['книга', 'книги', 'книгу', 'книге'],
                  translation: 'This is a new book.',
                  transliteration: 'Eto novaya kniga.',
                  explanation: 'Nominative singular feminine noun.'
                },
                {
                  topicId: body.topicIds?.[0] || 'prepositional_case',
                  sentencePattern: 'Мы живём в [blank] (город).',
                  answer: 'городе',
                  choices: ['город', 'города', 'городе', 'городу'],
                  translation: 'We live in a city.',
                  transliteration: 'My zhivyom v gorode.',
                  explanation: 'Prepositional case singular masculine noun.'
                }
              ]
            }
          }),
        });
      } else if (body.action === 'analyze') {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              originalText: body.sentence || '',
              hasErrors: true,
              corrections: [
                {
                  type: 'grammar',
                  original: 'Москва',
                  fixed: 'Москве',
                  reason: 'Prepositional case is required after "в" to denote location.'
                }
              ],
              suggestions: []
            }
          }),
        });
      } else {
        await route.fulfill({ status: 400 });
      }
    });

    await page.route('**/functions/v1/generate-sentence', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sentenceRu: 'Я говорю по-русски.',
          sentenceEn: 'I speak Russian.'
        }),
      });
    });

    await page.route('**/functions/v1/add-word', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          word: {
            id: 'custom_mock_id',
            word: 'книга',
            accented: 'кни́га',
            translation: 'book',
            transliteration: 'kniga',
            pos: 'noun',
            category: 'Custom',
            level: 'A1',
            exampleRu: 'Я говорю по-русски.',
            exampleEn: 'I speak Russian.'
          }
        }),
      });
    });

    await page.route('**/translate.googleapis.com/translate_a/single*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([[["book", "книга", null, null, 1]]]),
      });
    });

    // Disable animations in localStorage to prevent timeouts/instability
    await page.addInitScript(() => {
      const statsStr = localStorage.getItem("voc_russian_stats");
      let stats = {};
      if (statsStr) {
        try {
          stats = JSON.parse(statsStr);
        } catch(e) {}
      }
      if (!stats.settings) {
        stats.settings = {};
      }
      stats.settings.animationsEnabled = false;
      localStorage.setItem("voc_russian_stats", JSON.stringify(stats));
      if (sessionStorage.getItem("test_fresh_onboarding") !== "true") {
        localStorage.setItem("voc_onboarding_completed_v1", "true");
      }
    });

    // Go to homepage
    await page.goto('/');

  });

  test('Dashboard loads metrics correctly', async ({ page }) => {
    // Assert streak and XP exist
    await expect(page.locator('#sidebar-streak-val')).toContainText('0');
    await expect(page.locator('#sidebar-xp-val')).toContainText('0');
  });

  test('Account deletion requires the exact signed-in email', async ({ page }) => {
    await mockLogin(page);
    await expect(page.locator('#delete-account-row')).toBeVisible();
    await page.locator('#delete-account-btn').click();

    const modal = page.locator('#modal-delete-account');
    const confirmation = page.locator('#delete-account-email-confirm');
    const deleteForever = page.locator('#delete-account-confirm-btn');
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toContainText('account-linked vocabulary');
    await confirmation.fill('someone-else@example.com');
    await expect(deleteForever).toBeDisabled();
    await confirmation.fill('learner@example.com');
    await expect(deleteForever).toBeEnabled();
    await page.locator('#modal-delete-account-cancel').click();
    await expect(modal).not.toHaveClass(/active/);
  });

  test('Public deletion resource is available outside the app', async ({ page }) => {
    await page.goto('/delete-account.html');
    await expect(page).toHaveTitle(/Delete Your Privyetik Account/);
    await expect(page.locator('h1')).toHaveText('Delete your account');
    await expect(page.locator('#signin-panel')).toBeVisible();
    await expect(page.locator('body')).toContainText('What will be deleted');
  });

  test('Back closes onboarding from the first page without completing it', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('test_fresh_onboarding', 'true');
      localStorage.removeItem('voc_onboarding_completed_v1');
    });
    await page.reload();
    await page.locator('.nav-item[data-target="dashboard"]').click({ force: true });

    const onboarding = page.locator('#onboarding-modal');
    const backButton = page.locator('#onboarding-back-btn');
    await expect(onboarding).toHaveClass(/active/);
    await expect(backButton).toBeVisible();

    await page.locator('#onboarding-next-btn').click();
    await backButton.click();
    await expect(onboarding).toHaveClass(/active/);
    await expect(onboarding).toContainText('built only for Russian');

    await backButton.click();
    await expect(onboarding).not.toHaveClass(/active/);
    await expect(onboarding).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#view-landing')).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('voc_onboarding_completed_v1'))).toBeNull();
  });

  test('New users create an account before completing their chosen learning path', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('test_fresh_onboarding', 'true');
      localStorage.removeItem('voc_onboarding_completed_v1');
    });
    await page.reload();
    await expect(page.locator('#view-landing')).toHaveClass(/active/);
    await page.locator('.nav-item[data-target="dashboard"]').click({ force: true });

    const onboarding = page.locator('#onboarding-modal');
    await expect(onboarding).toHaveClass(/active/);
    await expect(onboarding).toContainText('built only for Russian');

    await page.locator('#onboarding-next-btn').click();
    await expect(onboarding).toContainText('Where are you with Russian?');
    await page.locator('[data-start-target="study-select"]').click();
    await expect(page.locator('[data-start-target="study-select"]')).toHaveAttribute('aria-checked', 'true');

    await page.locator('#onboarding-next-btn').click();
    await expect(page.locator('#onboarding-destination')).toContainText('vocabulary practice');
    await page.locator('#onboarding-next-btn').click();

    await expect(onboarding).toContainText('Create your free account');
    await page.locator('#onboarding-next-btn').click();
    await expect(page.locator('#onboarding-auth-error')).toContainText('valid email address');
    await expect(onboarding).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('voc_onboarding_completed_v1'))).toBeNull();

    await page.evaluate(() => {
      window.SupabaseSync.signUp = async (email) => ({
        user: { id: 'new-user', email },
        session: { user: { id: 'new-user', email } }
      });
    });
    await page.locator('#onboarding-email').fill('newlearner@example.com');
    await page.locator('#onboarding-password').fill('securepassword123');
    await page.locator('#onboarding-next-btn').click();
    await expect(onboarding).not.toHaveClass(/active/);
    await expect(page.locator('#view-study-select')).toHaveClass(/active/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('voc_onboarding_completed_v1'))).toBe('true');
  });

  // 2. Auth Lock / Unlock Flow
  test('AI Grammar shows signup lock alert for signed-out users, unlocks on login', async ({ page }) => {
    // Nav tab data-target="grammar" is NOT disabled initially
    const grammarTab = page.locator('.nav-item[data-target="grammar"]');
    await expect(grammarTab).not.toHaveClass(/disabled/);

    // Click the grammar tab, it should successfully load the view
    await grammarTab.click({ force: true });
    await expect(page.locator('#view-grammar')).toHaveClass(/active/);

    // Nominative Case should be available as a preview lesson for signed out users (does not show sign-up modal)
    await selectGrammarTopic(page, 'nominative_case');
    await page.waitForTimeout(400);
    await expect(page.locator('#modal-grammar-cta')).not.toHaveClass(/active/);
    await expect(page.locator('#tutor-explanation-content')).toContainText('Nominative Case (Именительный падеж)');

    // Attempting any other grammar operation (like Dative Case) while signed out should show the guest CTA modal
    await selectGrammarTopic(page, 'dative_case');
    await expect(page.locator('#modal-grammar-cta')).toHaveClass(/active/);
    await page.locator('#grammar-cta-close-btn').click();
    await expect(page.locator('#modal-grammar-cta')).not.toHaveClass(/active/);

    // Perform successful mock login
    await page.locator('.nav-item[data-target="sync"]').click({ force: true }); // Account tab
    await page.locator('#supabase-email').fill('learner@example.com');
    await page.locator('#supabase-password').fill('securepassword123');
    await page.locator('#supabase-auth-submit-btn').click();
    await page.locator('#custom-alert-ok-btn').click();

    // Verify logged-in state shows up in the account panel
    await expect(page.locator('#supabase-sync-panel')).toBeVisible();
    await expect(page.locator('#supabase-user-email')).toHaveText('learner@example.com');

    // Navigating back to grammar and clicking a topic should successfully load the lesson explanation without showing the guest CTA
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await selectGrammarTopic(page, 'dative_case');
    await expect(page.locator('#modal-grammar-cta')).not.toHaveClass(/active/);
    await expect(page.locator('#tutor-explanation-content')).toContainText('Mock Lesson: dative_case');
  });

  // 3. Leitner Study (Flashcards)
  test('Leitner Flashcard study flow and box transitions', async ({ page }) => {
    // Navigate to vocabulary tab
    await page.locator('.nav-item[data-target="study-select"]').click({ force: true });
    
    // Select flashcard mode (starts study session automatically)
    await page.locator('#mode-select-flashcard').click();

    // Verify card prompt is visible
    await expect(page.locator('#fc-word-front')).toBeVisible();
    
    // Translation example should be hidden under reveal button initially (flip to see it first)
    await page.locator('#flashcard-click-wrapper').click();
    
    const revealBtn = page.locator('#fc-word-example-en-back .reveal-translation-btn');
    await expect(revealBtn).toBeVisible();
    const translationText = page.locator('#fc-word-example-en-back .translation-text');
    await expect(translationText).not.toBeVisible();

    // Reveal translation
    await revealBtn.click();
    await expect(translationText).toBeVisible();

    // Click "Easy" (score 5) to verify progress to next card
    const firstWord = await page.locator('#fc-word-front').innerText();
    await page.locator('#srs-score-5').click();
    
    // Assert next card loads (word text changes)
    await expect(page.locator('#fc-word-front')).not.toHaveText(firstWord);
  });

  // 4. Active Writing Practice
  test('Active Writing review session Cyrillic inputs', async ({ page }) => {
    await page.locator('.nav-item[data-target="study-select"]').click({ force: true });
    // Select writing mode (starts study session automatically)
    await page.locator('#mode-select-writing').click();

    // Verify active writing elements
    await expect(page.locator('#writing-user-input')).toBeVisible();
  });

  // 5. Dictionary and Card CRUD Operations
  test('Dictionary search and card addition/editing/deletion', async ({ page }) => {
    // Log in to enable AI autofill sentences
    await mockLogin(page);

    await page.locator('.nav-item[data-target="dictionary"]').click({ force: true });

    // Search query
    await page.locator('#dict-search').fill('книга');
    
    // Click Add custom card
    await page.locator('#dict-add-word-btn').click();
    await expect(page.locator('#modal-add-word')).toBeVisible();

    // Verify browser required attribute validation exists
    await expect(page.locator('#add-word-input')).toHaveAttribute('required');
    await expect(page.locator('#add-translation-input')).toHaveAttribute('required');

    // Fill details
    await page.locator('#add-word-input').fill('книга');
    
    // Trigger AI sentence autofill (mocks Supabase Edge Function generate-sentence)
    await page.locator('#modal-add-autofill-btn').click();
    await expect(page.locator('#add-exampleru-input')).toHaveValue('Я говорю по-русски.');

    // Save Card
    await page.locator('#modal-add-submit').click();
    
    // Verify card is added
    await expect(page.locator('.vocab-card').first()).toBeVisible();
    await expect(page.locator('.vocab-card').first()).toContainText('кни́га');

    // Edit card
    await page.locator('.vocab-action-btn.edit').first().click();
    await page.locator('#edit-translation-input').fill('A book (modified)');
    await page.locator('#modal-edit-submit').click();
    await expect(page.locator('.vocab-card').first()).toContainText('A book (modified)');

    // Delete card - app uses custom confirm modal (not native browser dialog)
    await page.locator('.vocab-action-btn.delete').first().click();
    // Wait for the custom confirm modal to appear, then click OK
    await expect(page.locator('#custom-confirm-modal')).toHaveClass(/active/);
    await page.locator('#custom-confirm-ok-btn').click();
    await expect(page.locator('.vocab-card')).toHaveCount(0);
  });

  // 6. Theme and Settings Persistence
  test('Theme settings changes persist on reload', async ({ page }) => {
    await page.locator('.nav-item[data-target="settings"]').click({ force: true });
    
    // Check initial theme
    await expect(page.locator('body')).not.toHaveClass(/theme-emerald/);

    // Switch theme to emerald
    await page.locator('#settings-theme').selectOption('emerald');
    await expect(page.locator('body')).toHaveClass(/theme-emerald/);

    // Reload page and check that class persists
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/theme-emerald/);
  });

  // 7. AI Grammar Tutor
  test('AI Grammar Tutor case selection, explanation rendering and custom chat question', async ({ page }) => {
    // Unlock grammar by logging in
    await mockLogin(page);

    // Navigate to AI Grammar Workspace
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });

    // Verify AI Tutor is active subtab
    await expect(page.locator('#grammar-tab-tutor')).toHaveClass(/active/);

    // Select Dative Case button, verify explanation renders
    await selectGrammarTopic(page, 'dative_case');
    await expect(page.locator('#tutor-explanation-content')).toContainText('Mock Lesson: dative_case');
  });

  // 8. AI Grammar Practice Arena (Checklist, Presets, Mastery, Quiz completion)
  test('AI Grammar Practice Arena checklist, custom presets, mastery and E2E quiz execution', async ({ page }) => {
    // Unlock grammar by logging in
    await mockLogin(page);

    // Navigate to AI Grammar Workspace -> Practice Arena subtab
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await page.locator('#grammar-tab-practice').click();

    // Verify custom checkboxes panel is display: flex
    await expect(page.locator('#custom-topics-panel')).toBeVisible();

    // Nominative Case case checkbox should be checked by default
    const firstCb = page.locator('#custom-topics-checkboxes .topic-checkbox').first();
    await expect(firstCb).toBeChecked();

    // Uncheck and check to verify mastery updates
    await firstCb.uncheck();
    await expect(page.locator('#practice-target-mastery-val')).toHaveText('0%');

    // Click "Select All"
    await page.locator('#topics-select-all').click();
    
    // Save current check state as preset
    await page.locator('#subset-name-input').fill('Test Preset');
    await page.locator('#save-subset-btn').click();

    // Preset tag pill should appear
    const presetPill = page.locator('#saved-subsets-list .subset-pill').first();
    await expect(presetPill).toBeVisible();
    await expect(presetPill).toContainText('Test Preset');

    // Click Clear All
    await page.locator('#topics-clear-all').click();
    
    // Verify preset pill loses active styling, click preset pill to restore selection
    await presetPill.click();
    await expect(firstCb).toBeChecked();

    // Start Quiz
    await page.locator('#practice-start-btn').click();

    // Intercepted edge function returning 2 quiz questions
    await expect(page.locator('#quiz-index-val')).toHaveText('1');
    await expect(page.locator('#quiz-total-val')).toHaveText('2');
    await expect(page.locator('#quiz-topic-badge')).toHaveText('Preset: Test Preset');

    // Answer first question (correct choice is 'книга')
    await page.locator('.choice-btn', { hasText: 'книга' }).click();
    await expect(page.locator('#quiz-explanation-box')).toBeVisible();
    await expect(page.locator('#quiz-result-title')).toContainText('Correct!');

    // Click Next
    await page.locator('#quiz-next-btn').click();

    // Answer second question (correct choice is 'городе')
    await expect(page.locator('#quiz-index-val')).toHaveText('2');
    await page.locator('.choice-btn', { hasText: 'городе' }).click();

    // Click Next to complete quiz
    await page.locator('#quiz-next-btn').click();

    // Complete Screen verification
    await expect(page.locator('#quiz-complete-score')).toHaveText('2 / 2');
    await expect(page.locator('#quiz-complete-xp')).toHaveText('+30 XP');

    // Return to setup
    await page.locator('#quiz-complete-finish-btn').click();
    await expect(page.locator('#practice-setup-screen')).toBeVisible();
  });

  test('AI Grammar Practice Arena refreshes mastery when returning to the page', async ({ page }) => {
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await page.locator('#grammar-tab-practice').click();
    await expect(page.locator('#practice-target-mastery-val')).toHaveText('0%');

    await page.locator('.nav-item[data-target="dashboard"]').click({ force: true });
    await page.evaluate(() => {
      window.GrammarManager.setGrammarProgressMap({
        nominative_case_A1: {
          topicId: 'nominative_case_A1',
          attempts: [{ id: 'return-refresh', correct: 40, total: 40, at: Date.now() }],
          quizzesTaken: 1,
          totalCorrect: 40,
          totalQuestions: 40,
          avgScore: 100,
          lastPracticed: Date.now(),
          updatedAt: Date.now()
        }
      });
    });

    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await expect(page.locator('#practice-target-mastery-val')).not.toHaveText('0%');
  });

  // 9. AI Grammar Sandbox
  test('AI Grammar Sandbox writing correction analysis', async ({ page }) => {
    // Unlock grammar by logging in
    await mockLogin(page);

    // Navigate to AI Grammar Workspace -> Sandbox subtab
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await page.locator('#grammar-tab-sandbox').click();

    // Enter text and analyze
    await page.locator('#sandbox-user-input').fill('Я живу в Москва.');
    await page.locator('#sandbox-analyze-btn').click();

    // Verify spelling corrections list
    await expect(page.locator('#sandbox-results-panel')).toBeVisible();
    await expect(page.locator('.correction-card').first()).toBeVisible();
    await expect(page.locator('.correction-card').first()).toContainText('Москва');
    await expect(page.locator('.correction-card').first()).toContainText('Москве');
  });

  // 10. Advanced Cases: Quit Quiz guard
  test('Quiz quit button shows confirm prompt, declines or approves correctly', async ({ page }) => {
    // Unlock grammar by logging in
    await mockLogin(page);

    // Navigate to Practice Arena
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await page.locator('#grammar-tab-practice').click();
    await page.locator('#practice-start-btn').click();

    // Check we are in the quiz
    await expect(page.locator('#practice-active-screen')).toBeVisible();

    // Click Quit, verify custom confirm modal is visible
    await page.locator('#quiz-quit-btn').click();
    const confirmModal = page.locator('#custom-confirm-modal');
    await expect(confirmModal).toHaveClass(/active/);

    const confirmMsg = await page.locator('#custom-confirm-message').innerText();
    expect(confirmMsg).toContain('Are you sure you want to quit this grammar quiz session?');

    // Click Cancel, verify quiz screen stays active
    await page.locator('#custom-confirm-cancel-btn').click();
    await expect(confirmModal).not.toHaveClass(/active/);
    await expect(page.locator('#practice-active-screen')).toBeVisible();

    // Click Quit, approve confirmation, verify return to setup screen
    await page.locator('#quiz-quit-btn').click();
    await expect(confirmModal).toHaveClass(/active/);
    await page.locator('#custom-confirm-ok-btn').click();
    await expect(confirmModal).not.toHaveClass(/active/);
    await expect(page.locator('#practice-setup-screen')).toBeVisible();
  });

  // 11. Advanced Cases: Rate Limit / Edge Function errors
  test('Edge Function 429 Rate Limit error displays graceful modal alert', async ({ page }) => {
    // Unlock grammar
    await mockLogin(page);

    // Mock 429 error response for Edge Function
    await page.route('**/functions/v1/ai-grammar', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded. Please wait 1 minute.' }),
      });
    });

    // Navigate to AI Grammar -> AI Tutor, trigger explain action
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await selectGrammarTopic(page, 'dative_case');

    // Verify rate limit warning is displayed inline
    await expect(page.locator('#tutor-explanation-content')).toContainText('Edge Function returned a non-2xx status code');
  });

  test('Dictionary details button opens Word Inflections modal, fetches and renders tables', async ({ page }) => {
    // Mock the inflections action response in Edge Function
    await page.route('**/functions/v1/ai-grammar', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.action === 'inflections') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              type: 'declension',
              forms: {
                declensions: [
                  { case: 'Nominative (Именительный)', singular: 'кни́га', plural: 'кни́ги' },
                  { case: 'Genitive (Родительный)', singular: 'кни́ги', plural: 'кни́г' }
                ]
              }
            }
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // 1. Mock login
    await mockLogin(page);

    // 2. Navigate to Dictionary tab
    await page.locator('.nav-item[data-target="dictionary"]').click({ force: true });
    await expect(page.locator('#view-dictionary')).toHaveClass(/active/);

    // 3. Search for "книга" in Dictionary search input
    await page.locator('#dict-search').fill('книга');

    // 4. Click the details (ℹ️) button on the first card
    const detailsBtn = page.locator('.vocab-card .details').first();
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    // 5. Verify details modal overlay is active
    const detailsModal = page.locator('#modal-word-details');
    await expect(detailsModal).toHaveClass(/active/);

    // 6. Verify table headers and values render correctly
    await expect(page.locator('.inflection-table')).toBeVisible();
    await expect(page.locator('.inflection-table tbody tr').first()).toContainText('Nominative');

    // 7. Click Close button
    await page.locator('#modal-details-close-btn').click();
    await expect(detailsModal).not.toHaveClass(/active/);
  });

  test('Dynamic Form Autofill on blur event triggers translation and fields populating', async ({ page }) => {
    // 1. Mock login to enable AI features
    await mockLogin(page);

    // 2. Navigate to Dictionary tab
    await page.locator('.nav-item[data-target="dictionary"]').click({ force: true });

    // 3. Open Custom Word modal
    await page.locator('#dict-add-word-btn').click();
    await expect(page.locator('#modal-add-word')).toBeVisible();

    // 4. Fill a Russian word and trigger blur
    await page.locator('#add-word-input').fill('книга');
    await page.locator('#add-word-input').blur();

    // 5. Verify translation, transliteration, POS, and examples are filled automatically
    await expect(page.locator('#add-translation-input')).toHaveValue('book');
    await expect(page.locator('#add-translit-input')).toHaveValue('kniga');
    await expect(page.locator('#add-exampleru-input')).toHaveValue('Я говорю по-русски.');
    await expect(page.locator('#add-exampleen-input')).toHaveValue('I speak Russian.');
    
    // 6. Test reverse autofill: clear inputs first
    await page.locator('#add-word-input').fill('');
    await page.locator('#add-translation-input').fill('');
    
    // Type English translation and trigger blur
    await page.locator('#add-translation-input').fill('book');
    await page.locator('#add-translation-input').blur();
    
    // Verify Russian word is filled automatically
    await expect(page.locator('#add-word-input')).toHaveValue('книга');
  });

  test('Assessment Test workflow seeds stats, XP, and updates levels correctly', async ({ page }) => {
    test.setTimeout(180000); // Two adaptive runs of at most 30 questions each
    const qaMap = {
      // A1
      "Привет": "Hello (informal)",
      "pronouns means 'We'": "Мы",
      "Спасибо": "Thank you",
      "Russian word 'Книга'": "Book",
      "word means 'Yes'": "Да",
      "How do you say 'How are you?'": "Как дела?",
      "What is your name?' (informal)": "Как тебя зовут?",
      "I speak Russian.": "Я говорю по-русски",
      "Мама": "Mother",
      "Goodbye' in Russian": "До свидания",

      // A2
      "Это _____ книга": "новая",
      "Where is the station?": "Где вокзал?",
      "Он _____ говорит по-русски": "хорошо",
      "Я живу _____ Москве": "в",
      "_____ нравится эта music": "Мне",
      "_____ нравится эта музыка": "Мне",
      "Мы _____ в кино": "идём",
      "Мой брат — _____": "студент",
      "Она пьёт _____": "чай",
      "Это _____ город": "красивый",
      "I have a cat": "У меня есть кошка",

      // B1
      "grammatical case is used after the preposition 'без'": "Genitive",
      "Он _____ книгу весь вечер": "читал",
      "Мы встретимся _____ субботу": "в",
      "Я позвоню _____ завтра": "тебе",
      "Она интересуется _____": "музыкой",
      "Они уже _____ статью": "прочитали",
      "_____ мне этот карандаш, пожалуйста": "Дай",
      "Он _____ своего брата": "старше",
      "Если завтра _____ хорошая погода": "будет",
      "Я часто _____ на метро": "езжу",

      // B2
      "Каждое утро я _____ в школу пешком": "хожу",
      "Девочка, _____ книгу у окна": "читающая",
      "Если бы я знал, я бы _____": "пришёл",
      "Он _____ домой очень поздно вчера": "пришёл",
      "Она пишет письмо _____": "ручкой",
      "Мы очень рады _____ успеху": "вашему",
      "Он _____ помочь нам": "согласился",
      "Этот фильм _____ посмотреть": "стоит",
      "Я _____ вставать рано утром": "привык",
      "_____ дождь, мы пошли гулять": "Несмотря на",

      // C1
      "я встретил друга": "Идя по улице",
      "У неё _____ детей": "трое",
      "Он работает _____ фабрике": "на",
      "Решение, _____ на собрании, устроило всех": "принятое",
      "_____ часа мы обсуждали новый план": "В течение",
      "_____ помощи друга, я сдал сложный экзамен": "Благодаря",
      "Он говорит так, _____ знает абсолютно всё": "будто",
      "Мне не _____": "спится",
      "Она сделала это _____ своей семьи": "ради",
      "Чем больше я учусь, _____ лучше понимаю": "тем",

      // C2
      "в свои дальнейшие планы": "посвятила",
      "в свои планы": "посвятила",
      "Как он _____ старался, ничего не выходило": "ни",
      "Он сказал мне правду в _____": "глаза",
      "мне правду": "глаза",
      "Он _____ приедет сегодня": "вряд ли",
      "_____ глупо отказываться от такого предложения": "Было бы",
      "Давай сделаем это во что бы то _____": "ни стало",
      "В этой статье речь _____ о глобальном потеплении": "идёт",
      "Она сделала _____, что не заметила нас": "вид",
      "Что бы _____ случилось, сохраняй спокойствие": "ни",
      "Ему _____": "нездоровится"
    };

    async function answerActiveQuestionCorrectly() {
      const questionText = await page.locator('#placement-question-text').innerText();
      let foundAnswer = null;
      for (const [key, val] of Object.entries(qaMap)) {
        if (questionText.includes(key)) {
          foundAnswer = val;
          break;
        }
      }
      const buttons = page.locator('#placement-choices-container button');
      const count = await buttons.count();
      // Try to find the exact correct answer first
      for (let i = 0; i < count; i++) {
        const text = await buttons.nth(i).innerText();
        if (text.trim() === foundAnswer) {
          await buttons.nth(i).click();
          return;
        }
      }
      // Fallback: click the first available button to keep test moving
      if (count > 0) {
        console.warn(`[Test] No mapped answer for: "${questionText}" -- clicking first button`);
        await buttons.first().click();
      }
    }

    async function answerAndWaitForNext(currentStep, totalSteps) {
      await answerActiveQuestionCorrectly();
      if (currentStep < totalSteps) {
        // Wait for the DOM to actually show the next question number.
        // The app has a 1200ms setTimeout before advancing — poll until it changes.
        const nextText = `Question ${currentStep + 1} of ${totalSteps}`;
        await page.waitForFunction(
          (expected) => document.getElementById('placement-question-step')?.textContent?.trim() === expected,
          nextText,
          { timeout: 3000 }
        );
      }
    }

    // 1. Verify that the placement test banner is visible on the dashboard for a new user (0 XP)
    const banner = page.locator('#dashboard-placement-banner');
    await expect(banner).toBeVisible();

    // 2. Click "Take Placement Test" to open intro modal
    await page.locator('#placement-banner-start-btn').click();
    await expect(page.locator('#modal-placement-test')).toBeVisible();
    await expect(page.locator('#placement-intro-view')).toBeVisible();

    // 3. Start the test
    await page.locator('#placement-start-test-btn').click();
    await expect(page.locator('#placement-question-view')).toBeVisible();

    // 4. Answer all 30 questions correctly to get C2 placement
    for (let step = 1; step <= 30; step++) {
      await expect(page.locator('#placement-question-step')).toHaveText(`Question ${step} of 30`, { timeout: 12000 });
      await answerAndWaitForNext(step, 30);
    }

    // 5. Verify results screen shows C2 level and C2 avatar
    await expect(page.locator('#placement-result-view')).toBeVisible();
    await expect(page.locator('#placement-result-title')).toHaveText('Level Assessed: C2!');
    await expect(page.locator('#placement-result-text')).toContainText('You placed at level C2');

    // 6. Test permission gate: click "Finish without Seeding"
    await page.locator('#placement-skip-btn').click();
    await expect(page.locator('#modal-placement-test')).not.toBeVisible();

    // Verify XP is still 0
    await expect(page.locator('#sidebar-xp-val')).toHaveText('0');
    // Assessment banner remains visible (it's persistent)
    await expect(banner).toBeVisible();

    // 7. Retake test to apply seeding
    await page.locator('.nav-item[data-target="settings"]').click({ force: true });
    await page.locator('#settings-placement-test-btn').click();
    await expect(page.locator('#modal-placement-test')).toBeVisible();
    await page.locator('#placement-start-test-btn').click();

    // Answer all 30 questions correctly again
    for (let step = 1; step <= 30; step++) {
      await expect(page.locator('#placement-question-step')).toHaveText(`Question ${step} of 30`, { timeout: 12000 });
      await answerAndWaitForNext(step, 30);
    }

    // Click "Apply Seeding & Finish"
    await page.locator('#placement-apply-btn').click();
    
    // Expect custom confirm modal
    const confirmModal = page.locator('#custom-confirm-modal');
    await expect(confirmModal).toHaveClass(/active/);
    
    // Cancel confirmation first
    await page.locator('#custom-confirm-cancel-btn').click();
    await expect(confirmModal).not.toHaveClass(/active/);
    await expect(page.locator('#modal-placement-test')).toBeVisible();

    // Apply and OK confirmation
    await page.locator('#placement-apply-btn').click();
    await page.locator('#custom-confirm-ok-btn').click();
    await expect(page.locator('#modal-placement-test')).not.toBeVisible();

    // Verify XP has been seeded (2000 XP for C2)
    await expect(page.locator('#sidebar-xp-val')).toHaveText('2000');

    // 8. Go to Settings and verify restore backup is visible
    await page.locator('.nav-item[data-target="settings"]').click({ force: true });
    
    const restoreRow = page.locator('#settings-restore-placement-backup-row');
    await expect(restoreRow).toBeVisible();

    // Click restore and cancel
    await page.locator('#settings-restore-placement-backup-btn').click();
    await expect(confirmModal).toHaveClass(/active/);
    await page.locator('#custom-confirm-cancel-btn').click();
    await expect(confirmModal).not.toHaveClass(/active/);

    // Click restore and approve
    await page.locator('#settings-restore-placement-backup-btn').click();
    await page.locator('#custom-confirm-ok-btn').click();

    // Expect page alert modal "Progress backup successfully restored!" and click ok
    const alertModal = page.locator('#custom-alert-modal');
    await expect(alertModal).toHaveClass(/active/);
    await page.locator('#custom-alert-ok-btn').click();

    // Verify XP has reverted back to 0
    await expect(page.locator('#sidebar-xp-val')).toHaveText('0');
    await expect(restoreRow).not.toBeVisible();

    // 9. Verify Reset Leitner Boxes button works
    await page.locator('#settings-reset-boxes-btn').click();
    await expect(confirmModal).toHaveClass(/active/);
    await page.locator('#custom-confirm-ok-btn').click();
    
    // Dismiss success alert
    await expect(alertModal).toHaveClass(/active/);
    await page.locator('#custom-alert-ok-btn').click();
  });

});
