const { test, expect } = require('@playwright/test');
const { navigateTo } = require('./helpers/navigation');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('voc_onboarding_completed_v1', 'true');
    localStorage.setItem('voc_russian_stats', JSON.stringify({ settings: { animationsEnabled: false } }));
  });
  await page.goto('/');
});

test('an empty review queue offers study modes instead of a dead-end review', async ({ page }) => {
  await page.locator('#dashboard-filter-db').selectOption('custom');
  await expect(page.locator('#daily-review-title')).toHaveText("You're all caught up.");
  await expect(page.locator('#dash-due-btn-badge')).toBeHidden();
  await page.locator('#dash-quick-study-btn').click();
  await expect(page.locator('#view-study-select')).toBeVisible();
});

test('study cards support keyboard activation', async ({ page }) => {
  await navigateTo(page, 'study-select');
  await page.locator('#mode-select-flashcard').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#study-sub-flashcard')).toBeVisible();
});

test('dictionary filters disclose, count active filters, and recover from empty results', async ({ page }) => {
  await navigateTo(page, 'dictionary');
  const toggle = page.locator('#dict-toggle-filters-btn');
  if (await toggle.isVisible()) {
    await expect(page.locator('#dict-filter-category')).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
  await page.locator('#dict-filter-level').selectOption('A1');
  await expect(page.locator('#dict-filter-count')).toHaveText('(1 active)');
  await page.locator('#dict-search').fill('no-such-russian-word-12345');
  await expect(page.locator('#dict-empty-state')).toBeVisible();
  await page.locator('#dict-clear-filters-btn').click();
  await expect(page.locator('#dict-search')).toHaveValue('');
  await expect(page.locator('#dict-filter-level')).toHaveValue('all');
  await expect(page.locator('#dict-words-grid .vocab-card').first()).toBeVisible();
  await expect(page.locator('#dict-search')).toBeFocused();
});

test('the review action, metrics, and navigation fit a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const selector of ['#dash-quick-study-btn', '#view-dashboard .dashboard-grid', 'aside nav']) {
    const box = await page.locator(selector).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
  const metrics = await page.locator('#view-dashboard .dashboard-grid').boundingBox();
  const nav = await page.locator('aside').boundingBox();
  expect(metrics.y + metrics.height).toBeLessThanOrEqual(nav.y);
  expect(await page.locator('aside nav').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
