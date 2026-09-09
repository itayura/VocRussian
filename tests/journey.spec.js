const { test, expect } = require('@playwright/test');
const { navigateTo } = require('./helpers/navigation');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('voc_onboarding_completed_v1')) {
      localStorage.setItem('voc_onboarding_completed_v1', 'true');
      localStorage.setItem('voc_russian_stats', JSON.stringify({ settings: { theme: 'midnight', animationsEnabled: false } }));
    }
  });
  await page.goto('/');
});

async function rateCard(page, correct = true) {
  const previous = await page.locator('#study-index-val').textContent();
  await page.locator('#flashcard-click-wrapper').click();
  await page.locator(correct ? '#srs-score-3' : '#srs-score-1').click();
  await expect.poll(async () => (await page.locator('#study-sub-complete').isVisible()) || (await page.locator('#study-index-val').textContent()) !== previous).toBe(true);
}

test('mission, daily goal, targeted retry, and weekly recovery form a complete learning loop', async ({ page }) => {
  await expect(page.locator('#daily-mission-summary')).toContainText('8 new');
  await page.locator('#daily-mission-start').click();
  await rateCard(page, false);
  for (let i = 1; i < 8; i++) await rateCard(page);
  await expect(page.locator('#complete-learning-summary')).toContainText('You recalled 7 of 8 words');
  await expect(page.locator('#complete-retry-btn')).toHaveText('Practice this word →');
  await expect(page.locator('#complete-daily-goal')).toContainText('Daily goal complete');
  const before = await page.evaluate(() => SRS.getStatsSummary().xp);
  await page.locator('#complete-retry-btn').click();
  await expect(page.locator('#study-total-val')).toHaveText('1');
  await rateCard(page);
  expect(await page.evaluate(() => SRS.getStatsSummary().xp)).toBe(before);
  await page.locator('#complete-home-btn').click();
  await expect(page.locator('#daily-mission-start')).toHaveText('✓ Mission complete');
  await expect(page.locator('#weekly-learning-metrics .learning-metric').nth(1)).toContainText('1');
  expect(await page.evaluate(() => localStorage.getItem('voc_russian_session_v1'))).toBeNull();
});

test('reload after an answer resumes at the next word without duplicate XP', async ({ page }) => {
  await page.locator('#daily-mission-start').click();
  await rateCard(page);
  const state = await page.evaluate(() => ({ xp: SRS.getStatsSummary().xp, saved: JSON.parse(localStorage.getItem('voc_russian_session_v1')) }));
  await page.reload();
  await expect(page.locator('#resume-session-description')).toContainText('7 words left');
  await page.locator('#resume-session-btn').click();
  await expect(page.locator('#study-index-val')).toHaveText('2');
  const result = await page.evaluate(() => ({ xp: SRS.getStatsSummary().xp, saved: JSON.parse(localStorage.getItem('voc_russian_session_v1')) }));
  expect(result.xp).toBe(state.xp);
  expect(result.saved.ids).toEqual(state.saved.ids);
  expect(result.saved.history).toEqual(state.saved.history);
});

test('resume reconciles an SRS answer saved just before its session checkpoint', async ({ page }) => {
  await page.locator('#daily-mission-start').click();
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('voc_russian_session_v1'));
    SRS.scoreCard(saved.ids[0], true, 'good', { reviewId: `${saved.id}:0`, mode: saved.mode });
  });
  await page.reload();
  await page.locator('#resume-session-btn').click();
  await expect(page.locator('#study-index-val')).toHaveText('2');
  expect(await page.evaluate(() => SRS.getStatsSummary().xp)).toBe(15);
});

for (const mode of ['choice', 'writing', 'visual', 'pronunciation']) {
  test(`an interrupted ${mode} session restores its deck and mode`, async ({ page }) => {
    await navigateTo(page, 'study-select');
    await page.locator('#study-deck-size').fill('3');
    await page.locator(`#mode-select-${mode}`).click();
    await expect(page.locator(`#study-sub-${mode}`)).toBeVisible();
    const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('voc_russian_session_v1')).ids);
    await page.reload();
    await page.locator('#resume-session-btn').click();
    await expect(page.locator(`#study-sub-${mode}`)).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('voc_russian_session_v1')).ids)).toEqual(ids);
  });
}

async function finishChallenge(page, id) {
  const content = await page.evaluate(id => RussianChallenges.find(c => c.id === id), id);
  for (let i = 0; i < 3; i++) await page.locator('#challenge-next-btn').click();
  await expect(page.locator('#challenge-next-btn')).toBeDisabled();
  await page.locator('#challenge-body button').filter({ hasText: content.questions[0].choices.find(c => c !== content.questions[0].answer) }).click();
  await expect(page.locator('#challenge-feedback')).toContainText('Not quite');
  await expect(page.locator('#challenge-next-btn')).toBeDisabled();
  for (const q of content.questions) {
    if (q.choices) await page.locator('#challenge-body').getByRole('button', { name: q.answer, exact: true }).click();
    else {
      await page.locator('#challenge-answer').fill(q.answer);
      await page.locator('#challenge-body').getByRole('button', { name: 'Check answer' }).click();
    }
    await expect(page.locator('#challenge-feedback')).toContainText('✓');
    await page.locator('#challenge-next-btn').click();
  }
  await expect(page.locator('#challenge-step-label')).toHaveText('Challenge complete');
}

for (const [id, title] of [['introductions', 'Introduce yourself'], ['cafe', 'Order at a café'], ['train', 'Find your train']]) {
  test(`${title} works offline and rewards only its first completion`, async ({ page, context }) => {
    await context.setOffline(true);
    await page.locator('.challenge-card').filter({ hasText: title }).click();
    await finishChallenge(page, id);
    expect(await page.evaluate(() => SRS.getStatsSummary().xp)).toBe(20);
    await page.locator('#challenge-next-btn').click();
    // The original reward may be from a previous week; today's repeat still
    // belongs in the learning story without granting XP again.
    await page.evaluate(() => {
      for (const event of SRS.getGlobalStats().activityLog || []) {
        if (event.source === 'challenge') event.occurredAt -= 10 * 86400000;
      }
    });
    await page.locator('.challenge-card').filter({ hasText: title }).click();
    await finishChallenge(page, id);
    expect(await page.evaluate(() => SRS.getStatsSummary().xp)).toBe(20);
    await expect(page.locator('#weekly-learning-story')).toContainText('real-life phrases');
  });
}

test('a challenge can be paused and resumed after a reload', async ({ page }) => {
  await page.locator('.challenge-card').first().click();
  await page.locator('#challenge-next-btn').click();
  await page.locator('#challenge-close-btn').click();
  await page.reload();
  await expect(page.locator('.challenge-card').first()).toContainText('Continue challenge');
  await page.locator('.challenge-card').first().click();
  await expect(page.locator('#challenge-step-label')).toContainText('2 of 6');
});
