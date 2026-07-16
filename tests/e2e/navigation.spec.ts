import { expect, test } from '@playwright/test';

test('same-route legacy navigation still activates and loads the page', async ({ page }) => {
  await page.goto('/campagne');

  await page.locator('#campagnePage').evaluate(element => element.classList.remove('active'));
  await page.evaluate(async () => {
    await window.navigateToPage?.('campagne');
  });

  await expect(page.locator('#campagnePage')).toHaveClass(/active/);
});

test('legacy changes notify the React query bridge', async ({ page }) => {
  await page.goto('/campagne');

  const detail = await page.evaluate(() => new Promise(resolve => {
    window.addEventListener('companion:data-changed', event => {
      resolve((event as CustomEvent).detail);
    }, { once: true });
    void window.sendAppEventBroadcast?.({ table: 'campagne', action: 'update' });
  }));

  expect(detail).toEqual({ table: 'campagne', action: 'update' });
});
