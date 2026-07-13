import { expect, test } from '@playwright/test';

test('loads the app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Companion App - D&D Helper');
  await expect(page.locator('.header')).toBeVisible();
});

test('uses desktop chrome on tablet landscape', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 600 });
  await page.goto('/');

  await expect(page.locator('#desktopSidebarNav')).toBeVisible();
  await expect(page.locator('.bottom-toolbar')).toBeHidden();
});
