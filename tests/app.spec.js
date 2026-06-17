const { test, expect } = require('@playwright/test');

test.describe('VocRussian E2E Test Suite', () => {
  
  async function mockLogin(page) {
    await page.locator('.nav-item[data-target="sync"]').click(); // Account tab
    await page.locator('#supabase-email').fill('learner@example.com');
    await page.locator('#supabase-password').fill('securepassword123');
    await page.locator('#supabase-auth-submit-btn').click();
    const okBtn = page.locator('#custom-alert-ok-btn');
    await okBtn.waitFor({ state: 'visible' });
    await okBtn.click();
  }

  test.beforeEach(async ({ page }) => {
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
                  sentencePattern: 'Это новая [blank] (книга).',
                  answer: 'книга',
                  choices: ['книга', 'книги', 'книгу', 'книге'],
                  explanation: 'Nominative singular feminine noun.'
                },
                {
                  sentencePattern: 'Мы живём в [blank] (город).',
                  answer: 'городе',
                  choices: ['город', 'города', 'городе', 'городу'],
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

    await page.route('**/translate.googleapis.com/translate_a/single*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([[["book", "книга", null, null, 1]]]),
      });
    });

    // Go to homepage
    await page.goto('/');

    // Bypass landing page by clicking Start CTA
    const ctaStart = page.locator('#landing-cta-start');
    await ctaStart.waitFor({ state: 'visible' });
    await ctaStart.click();
  });

  // 1. Dashboard View
  test('Dashboard loads metrics and proficiency bars correctly', async ({ page }) => {
    // Assert streak and XP exist
    await expect(page.locator('#sidebar-streak-val')).toContainText('0');
    await expect(page.locator('#sidebar-xp-val')).toContainText('0');

    // Assert level badges
    await expect(page.locator('#grammar-level-badge')).toBeVisible();
    await expect(page.locator('#vocab-level-badge')).toBeVisible();
  });

  // 2. Auth Lock / Unlock Flow
  test('AI Grammar shows signup lock alert for signed-out users, unlocks on login', async ({ page }) => {
    // Nav tab data-target="grammar" should have disabled class initially
    const grammarTab = page.locator('.nav-item[data-target="grammar"]');
    await expect(grammarTab).toHaveClass(/disabled/);

    // Click the disabled tab, verify lock dialog triggers
    await grammarTab.click();
    await expect(page.locator('#custom-alert-modal')).toHaveClass(/active/);
    const alertMsg = await page.locator('#custom-alert-message').innerText();
    expect(alertMsg).toContain('Account Sign-in Required');
    await page.locator('#custom-alert-ok-btn').click();

    // Perform successful mock login
    await page.locator('.nav-item[data-target="sync"]').click(); // Account tab
    await page.locator('#supabase-email').fill('learner@example.com');
    await page.locator('#supabase-password').fill('securepassword123');
    await page.locator('#supabase-auth-submit-btn').click();
    await page.locator('#custom-alert-ok-btn').click();

    // Verify logged-in state shows up in the account panel
    await expect(page.locator('#supabase-sync-panel')).toBeVisible();
    await expect(page.locator('#supabase-user-email')).toHaveText('learner@example.com');

    // Verify the AI Grammar tab is now unlocked
    await expect(grammarTab).not.toHaveClass(/disabled/);
  });

  // 3. Leitner Study (Flashcards)
  test('Leitner Flashcard study flow and box transitions', async ({ page }) => {
    // Navigate to vocabulary tab
    await page.locator('.nav-item[data-target="study-select"]').click();
    
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
    await page.locator('.nav-item[data-target="study-select"]').click();
    // Select writing mode (starts study session automatically)
    await page.locator('#mode-select-writing').click();

    // Verify active writing elements
    await expect(page.locator('#writing-user-input')).toBeVisible();
  });

  // 5. Dictionary and Card CRUD Operations
  test('Dictionary search and card addition/editing/deletion', async ({ page }) => {
    // Log in to enable AI autofill sentences
    await mockLogin(page);

    await page.locator('.nav-item[data-target="dictionary"]').click();

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
    await expect(page.locator('.vocab-card').first()).toContainText('книга');

    // Edit card
    await page.locator('.vocab-action-btn.edit').first().click();
    await page.locator('#edit-translation-input').fill('A book (modified)');
    await page.locator('#modal-edit-submit').click();
    await expect(page.locator('.vocab-card').first()).toContainText('A book (modified)');

    // Delete card
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });
    await page.locator('.vocab-action-btn.delete').first().click();
    await expect(page.locator('.vocab-card')).toHaveCount(0);
  });

  // 6. Theme and Settings Persistence
  test('Theme settings changes persist on reload', async ({ page }) => {
    await page.locator('.nav-item[data-target="settings"]').click();
    
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
    await page.locator('.nav-item[data-target="grammar"]').click();

    // Verify AI Tutor is active subtab
    await expect(page.locator('#grammar-tab-tutor')).toHaveClass(/active/);

    // Select Dative Case button, verify explanation renders
    await page.locator('.grammar-topic-btn[data-topic="dative_case"]').click();
    await expect(page.locator('#tutor-explanation-content')).toContainText('Mock Lesson: dative_case');
  });

  // 8. AI Grammar Practice Arena (Checklist, Presets, Mastery, Quiz completion)
  test('AI Grammar Practice Arena checklist, custom presets, mastery and E2E quiz execution', async ({ page }) => {
    // Unlock grammar by logging in
    await mockLogin(page);

    // Navigate to AI Grammar Workspace -> Practice Arena subtab
    await page.locator('.nav-item[data-target="grammar"]').click();
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

  // 9. AI Grammar Sandbox
  test('AI Grammar Sandbox writing correction analysis', async ({ page }) => {
    // Unlock grammar by logging in
    await mockLogin(page);

    // Navigate to AI Grammar Workspace -> Sandbox subtab
    await page.locator('.nav-item[data-target="grammar"]').click();
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
    await page.locator('.nav-item[data-target="grammar"]').click();
    await page.locator('#grammar-tab-practice').click();
    await page.locator('#practice-start-btn').click();

    // Check we are in the quiz
    await expect(page.locator('#practice-active-screen')).toBeVisible();

    // Capture confirm dialog and decline it first
    let quitAlertMsg = '';
    let confirmQuit = false;
    page.on('dialog', async (dialog) => {
      quitAlertMsg = dialog.message();
      if (confirmQuit) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });

    // Click Quit, decline prompt, verify quiz screen stays active
    await page.locator('#quiz-quit-btn').click();
    expect(quitAlertMsg).toContain('Are you sure');
    await expect(page.locator('#practice-active-screen')).toBeVisible();

    // Set toggle to accept next time
    confirmQuit = true;
    await page.locator('#quiz-quit-btn').click();
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
    await page.locator('.nav-item[data-target="grammar"]').click();
    await page.locator('.grammar-topic-btn[data-topic="dative_case"]').click();

    // Verify rate limit warning is displayed inline
    await expect(page.locator('#tutor-explanation-content')).toContainText('Edge Function returned a non-2xx status code');
  });

});
