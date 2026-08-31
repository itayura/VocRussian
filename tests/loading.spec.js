const { test, expect } = require("@playwright/test");

test("the local app initializes while the optional cloud SDK is stalled", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", () => new Promise(() => {}));

  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#view-landing")).toBeVisible();
  await expect(page.locator("#sidebar-xp-val")).toHaveText("0");
  await expect.poll(() => page.evaluate(() => window.SupabaseSync?.connectionState)).toBe("disconnected");
});
