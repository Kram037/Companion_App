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

test('manifest does not lock tablet orientation', async ({ request }) => {
  const response = await request.get('/manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.orientation).not.toBe('portrait');
});
