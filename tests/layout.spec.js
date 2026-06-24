const { test, expect } = require('@playwright/test');

test.describe('VocRussian Layout & Responsive Test Suite', () => {

  async function mockLogin(page) {
    await page.locator('.nav-item[data-target="sync"]').click({ force: true }); // Account tab
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
              hasErrors: false,
              corrections: [],
              suggestions: []
            }
          }),
        });
      }
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
    });

    // Go to homepage
    await page.goto('/');

    // Bypass landing page by clicking Start CTA
    const ctaStart = page.locator('#landing-cta-start');
    await ctaStart.waitFor({ state: 'visible' });
    await ctaStart.click();
  });

  // 1. Global Navigation Layout (Desktop vs Mobile Viewports)
  test('Global layout and navigation elements adapt responsively', async ({ page }) => {
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;

    const aside = page.locator('aside');
    const main = page.locator('main');
    const firstNavLabel = page.locator('.nav-item button span').first();

    if (isMobile) {
      // Bottom Navigation Bar Layout
      const asideBox = await aside.boundingBox();
      expect(asideBox).not.toBeNull();
      // Should span full width and be aligned near bottom
      expect(asideBox.width).toBeCloseTo(viewport.width, 1);
      expect(asideBox.y).toBeGreaterThanOrEqual(viewport.height - 100);
      expect(asideBox.height).toBeCloseTo(70, 0);

      // Text labels should be hidden
      await expect(firstNavLabel).toHaveCSS('display', 'none');

      // Main container margin-left should be 0 on mobile
      await expect(main).toHaveCSS('margin-left', '0px');
    } else {
      // Sidebar Layout
      const asideBox = await aside.boundingBox();
      expect(asideBox).not.toBeNull();
      // Should be fixed on left side
      expect(asideBox.x).toBe(0);
      expect(asideBox.y).toBe(0);
      expect(asideBox.width).toBeCloseTo(260, 0);

      // Text labels should be visible
      await expect(firstNavLabel).not.toHaveCSS('display', 'none');

      // Main container should make room for sidebar
      await expect(main).toHaveCSS('margin-left', '260px');
    }
  });

  // 2. Dashboard Grid & Stat Cards
  test('Dashboard metrics layout structures correctly', async ({ page }) => {
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;
    const isTabletOrMobile = viewport && viewport.width <= 968;

    // Check stats grid display
    const dashboardGrid = page.locator('#view-dashboard .dashboard-grid');
    await expect(dashboardGrid).toHaveCSS('display', 'grid');

    const row2 = page.locator('#view-dashboard .dashboard-row-2');
    await expect(row2).toHaveCSS('display', 'grid');

    // Row 2 children (Leitner distribution & progress graph cards)
    const card1 = row2.locator('> div').nth(0);
    const card2 = row2.locator('> div').nth(1);

    const box1 = await card1.boundingBox();
    const box2 = await card2.boundingBox();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();

    if (isTabletOrMobile) {
      // Elements stack vertically under 968px width
      expect(box2.y).toBeGreaterThanOrEqual(box1.y + box1.height - 5); // Stacked
    } else {
      // Elements are side-by-side on desktop
      expect(Math.abs(box1.y - box2.y)).toBeLessThan(15); // Aligned vertically
      expect(box2.x).toBeGreaterThanOrEqual(box1.x + box1.width - 5); // Positioned to the right
    }
  });

  // 3. Study Mode Selection & SRS Card Layout
  test('Study selectors and Flashcard layout adapt responsively', async ({ page }) => {
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;

    // Navigate to Study Mode selection page
    await page.locator('.nav-item[data-target="study-select"]').click({ force: true });
    await expect(page.locator('#view-study-select')).toHaveClass(/active/);

    // Verify study mode selector options display
    const flashcardSelect = page.locator('#mode-select-flashcard');
    const writingSelect = page.locator('#mode-select-writing');
    await expect(flashcardSelect).toBeVisible();
    await expect(writingSelect).toBeVisible();

    // Start Flashcard Mode
    await flashcardSelect.click();
    await expect(page.locator('#view-study-active')).toHaveClass(/active/);
    await expect(page.locator('#study-sub-flashcard')).toBeVisible();

    const flashcardWrapper = page.locator('.flashcard-wrapper');
    if (isMobile) {
      // Check mobile explicit flashcard height constraint
      await expect(flashcardWrapper).toHaveCSS('height', '340px');
    } else {
      // Desktop flashcard wrapper size is unconstrained or default
      const wrapperBox = await flashcardWrapper.boundingBox();
      expect(wrapperBox.height).toBeGreaterThan(100);
    }
  });

  // 4. Dictionary Filter Bar Layout
  test('Dictionary filter bar layout structure aligns responsively', async ({ page }) => {
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;

    // Navigate to Dictionary view
    await page.locator('.nav-item[data-target="dictionary"]').click({ force: true });
    await expect(page.locator('#view-dictionary')).toHaveClass(/active/);

    const filterBar = page.locator('#view-dictionary > .dictionary-filter-bar');
    await expect(filterBar).toHaveCSS('display', 'grid');

    // Retrieve input selectors inside filter bar
    const searchInput = page.locator('#dict-search');
    const filterDbSelect = page.locator('#dict-filter-db');
    const filterCategorySelect = page.locator('#dict-filter-category');

    const searchBox = await searchInput.boundingBox();
    const dbBox = await filterDbSelect.boundingBox();
    const categoryBox = await filterCategorySelect.boundingBox();

    expect(searchBox).not.toBeNull();
    expect(dbBox).not.toBeNull();
    expect(categoryBox).not.toBeNull();

    if (isMobile) {
      // Elements stack vertically (y coordinates increase sequentially)
      expect(dbBox.y).toBeGreaterThanOrEqual(searchBox.y + searchBox.height - 5);
      expect(categoryBox.y).toBeGreaterThanOrEqual(dbBox.y + dbBox.height - 5);
    } else {
      // Elements sit side-by-side (y coordinates are aligned, x coordinates sequential)
      expect(Math.abs(searchBox.y - dbBox.y)).toBeLessThan(10);
      expect(Math.abs(dbBox.y - categoryBox.y)).toBeLessThan(10);
      expect(dbBox.x).toBeGreaterThanOrEqual(searchBox.x + searchBox.width - 5);
      expect(categoryBox.x).toBeGreaterThanOrEqual(dbBox.x + dbBox.width - 5);
    }
  });

  // 5. AI Grammar Tutor Split Workspace Layout
  test('AI Grammar Tutor workspace side-by-side / vertical layout adapts responsively', async ({ page }) => {
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width <= 768;

    // Log in to unlock grammar
    await mockLogin(page);

    // Navigate to Grammar Workspace
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await expect(page.locator('#view-grammar')).toHaveClass(/active/);

    const tutorGrid = page.locator('.tutor-grid-container');
    await expect(tutorGrid).toHaveCSS('display', 'grid');

    const sidebar = page.locator('.tutor-topics-sidebar');
    const explanationPane = page.locator('#tutor-explanation-content');

    const sidebarBox = await sidebar.boundingBox();
    const paneBox = await explanationPane.boundingBox();

    expect(sidebarBox).not.toBeNull();
    expect(paneBox).not.toBeNull();

    if (isMobile) {
      // Stacks vertically
      expect(paneBox.y).toBeGreaterThanOrEqual(sidebarBox.y + sidebarBox.height - 5);
      
      // Sidebar borders: right-border is none, bottom-border is solid
      await expect(sidebar).toHaveCSS('border-right-style', 'none');
      await expect(sidebar).toHaveCSS('border-bottom-style', 'solid');
    } else {
      // Side-by-side
      expect(Math.abs(sidebarBox.y - paneBox.y)).toBeLessThan(15);
      expect(paneBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width - 5);

      // Sidebar borders: right-border is solid, bottom-border is none
      await expect(sidebar).toHaveCSS('border-right-style', 'solid');
      await expect(sidebar).toHaveCSS('border-bottom-style', 'none');
    }
  });

  // 6. AI Grammar Practice Arena & Sandbox Layout
  test('Practice Arena and Sandbox subviews layout display rules', async ({ page }) => {
    // Log in to unlock grammar
    await mockLogin(page);

    // Navigate to Grammar Workspace -> Practice Arena
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await page.locator('#grammar-tab-practice').click();

    // Verify custom topics panel and checkboxes layouts
    const customPanel = page.locator('#custom-topics-panel');
    await expect(customPanel).toHaveCSS('display', 'flex');

    const checkboxesGrid = page.locator('#custom-topics-checkboxes');
    await expect(checkboxesGrid).toHaveCSS('display', 'grid');

    // Switch to Sandbox tab
    await page.locator('#grammar-tab-sandbox').click();
    const sandboxInput = page.locator('#sandbox-user-input');
    await expect(sandboxInput).toBeVisible();
    await expect(sandboxInput).toHaveCSS('display', 'block');
  });

  // 7. Settings view layout
  test('Settings workspace display panels', async ({ page }) => {
    // Navigate to Settings
    await page.locator('.nav-item[data-target="settings"]').click({ force: true });
    await expect(page.locator('#view-settings')).toHaveClass(/active/);

    const themeSelect = page.locator('#settings-theme');
    await expect(themeSelect).toBeVisible();
  });

  // 8. Modal Dialog Layouts (Add Custom Word Modal)
  test('Add Custom Word modal overlay and dialog layout matches constraints', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) return;

    // Navigate to Dictionary view
    await page.locator('.nav-item[data-target="dictionary"]').click({ force: true });

    // Trigger modal
    await page.locator('#dict-add-word-btn').click();
    const modal = page.locator('#modal-add-word');
    await expect(modal).toHaveClass(/active/);
    await expect(modal).toHaveCSS('display', 'flex');

    // Verify modal-content centering
    const modalContent = modal.locator('.modal-content');
    const box = await modalContent.boundingBox();
    expect(box).not.toBeNull();
    // Center alignment checks (approximate within 10px/15px tolerance on desktop, relaxed for mobile viewports)
    const isMobile = viewport.width <= 768;
    const xTolerance = isMobile ? 45 : 10;
    expect(Math.abs(box.x - (viewport.width - box.width) / 2)).toBeLessThan(xTolerance);
    
    if (isMobile) {
      expect(box.y).toBeGreaterThanOrEqual(-30);
      expect(box.height).toBeGreaterThan(0);
    } else {
      expect(Math.abs(box.y - (viewport.height - box.height) / 2)).toBeLessThan(15);
    }

    // Dismiss modal
    await page.locator('#modal-add-close').click({ force: true });
    await expect(modal).not.toHaveClass(/active/);
    await expect(modal).toHaveCSS('display', 'none');
  });

  // 9. Custom Alert Modal layout and center positioning
  test('Custom Alert Modal dynamically overlays and centers on screen', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) return;

    // Trigger custom alert by navigating to Sync tab and clicking submit with empty fields
    await page.locator('.nav-item[data-target="sync"]').click({ force: true });
    await page.locator('#supabase-auth-submit-btn').click();

    const alertModal = page.locator('#custom-alert-modal');
    await expect(alertModal).toHaveClass(/active/);
    await expect(alertModal).toHaveCSS('display', 'flex');

    const alertContent = alertModal.locator('.modal-content');
    const box = await alertContent.boundingBox();
    expect(box).not.toBeNull();

    // Verify alert modal is centered on the viewport
    const isMobile = viewport.width <= 768;
    const xTolerance = isMobile ? 25 : 10;
    expect(Math.abs(box.x - (viewport.width - box.width) / 2)).toBeLessThan(xTolerance);

    if (isMobile) {
      expect(box.y).toBeGreaterThanOrEqual(-30);
      expect(box.height).toBeGreaterThan(0);
    } else {
      expect(Math.abs(box.y - (viewport.height - box.height) / 2)).toBeLessThan(15);
    }

    // Dismiss the custom alert
    await page.locator('#custom-alert-ok-btn').click();
    await expect(alertModal).not.toHaveClass(/active/);
  });

  // 10. Dashboard Leitner Box Distribution list vertical progression
  test('Leitner Box distribution items stack vertically', async ({ page }) => {
    const distributionList = page.locator('.box-distribution-list');
    await expect(distributionList).toBeVisible();
    await expect(distributionList).toHaveCSS('display', 'flex');
    await expect(distributionList).toHaveCSS('flex-direction', 'column');

    const boxItems = page.locator('.box-distribution-list .box-item');
    const count = await boxItems.count();
    expect(count).toBeGreaterThan(1);

    // Verify each sequential box-item is positioned below the previous one
    let lastY = -1;
    for (let i = 0; i < count; i++) {
      const box = await boxItems.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (lastY !== -1) {
        expect(box.y).toBeGreaterThan(lastY);
      }
      lastY = box.y;
    }
  });

  // 11. Practice Quiz Arena choice buttons display layout grid
  test('Practice Arena active quiz layout uses correct grid displays', async ({ page }) => {
    // Log in to unlock Practice Arena
    await mockLogin(page);

    // Navigate to AI Grammar -> Practice Arena
    await page.locator('.nav-item[data-target="grammar"]').click({ force: true });
    await page.locator('#grammar-tab-practice').click();

    // Start quiz
    await page.locator('#practice-start-btn').click();
    await expect(page.locator('#practice-active-screen')).toBeVisible();

    // Choices grid should be a vertical grid layout
    const choicesGrid = page.locator('#quiz-choices-container');
    await expect(choicesGrid).toHaveCSS('display', 'grid');

    const choiceButtons = choicesGrid.locator('.choice-btn');
    const count = await choiceButtons.count();
    expect(count).toBeGreaterThan(0);

    // Verify choice button widths stretch fully
    const gridBox = await choicesGrid.boundingBox();
    const firstBtnBox = await choiceButtons.first().boundingBox();
    expect(gridBox).not.toBeNull();
    expect(firstBtnBox).not.toBeNull();
    expect(Math.abs(firstBtnBox.width - gridBox.width)).toBeLessThan(15);
  });

  // 12. Theme switch modifies CSS custom variables
  test('Theme switcher dynamically alters body CSS variables', async ({ page }) => {
    // Navigate to Settings
    await page.locator('.nav-item[data-target="settings"]').click({ force: true });

    // Get default color-primary custom variable
    const defaultColor = await page.evaluate(() => {
      return getComputedStyle(document.body).getPropertyValue('--color-primary').trim();
    });
    expect(defaultColor).toContain('252'); // Default: hsl(252, 90%, 68%)

    // Select emerald theme
    await page.locator('#settings-theme').selectOption('emerald');

    // Get updated color-primary variable
    const emeraldColor = await page.evaluate(() => {
      return getComputedStyle(document.body).getPropertyValue('--color-primary').trim();
    });
    expect(emeraldColor).toContain('150'); // Emerald: hsl(150, 80%, 48%)
  });

});

