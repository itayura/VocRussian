async function navigateTo(page, target) {
  const button = page.locator(`.nav-item[data-target="${target}"] button`);
  if (await button.isVisible()) {
    await button.click();
  } else {
    await page.locator('#mobile-more-btn').click();
    await page.locator(`[data-mobile-target="${target}"]`).click();
  }
}

module.exports = { navigateTo };
