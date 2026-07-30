import { expect, test, type Page } from '@playwright/test';

const routes = ['campagne', 'personaggi', 'compendio', 'laboratorio', 'amici'] as const;
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

test.use({
  colorScheme: 'light',
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
});

async function openStablePage(page: Page, route = 'campagne') {
  await page.goto(`/${route}`);
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });
  await page.evaluate(() => document.fonts.ready);

  const imageSelector = route === 'compendio'
    ? '#compendioHub img'
    : route === 'laboratorio'
      ? '#labHub img'
      : '';
  if (imageSelector) {
    await expect.poll(() => page.locator(imageSelector).evaluateAll(images =>
      images.length === 8 && images.every(image => (image as HTMLImageElement).naturalWidth > 0)
    )).toBe(true);
  }
}

test.describe('@visual baseline', () => {
  for (const viewport of viewports) {
    for (const route of routes) {
      test(`${route} ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await openStablePage(page, route);
        await expect(page).toHaveScreenshot(`${route}-${viewport.name}.png`, {
          animations: 'disabled',
          caret: 'hide',
          fullPage: true,
        });
      });
    }
  }

  for (const viewport of [viewports[0], viewports[2]]) {
    test(`login modal ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openStablePage(page);
      await page.locator('#userBtn').click();
      await expect(page.locator('#loginModal')).toHaveClass(/active/);
      await expect(page).toHaveScreenshot(`login-modal-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
      });
    });

    test(`dice roller ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openStablePage(page);
      await page.locator('#d20Logo').dispatchEvent('click');
      await expect(page.locator('#diceRollerPanel')).toHaveAttribute('aria-hidden', 'false');
      await expect(page).toHaveScreenshot(`dice-roller-${viewport.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }

  test('desktop split view', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await openStablePage(page);
    await page.locator('.desktop-bookmark-split-tab').click();
    await expect(page.locator('#desktopSplitPane')).toBeVisible();
    await expect(page.frameLocator('#desktopSplitPaneFrame').locator('#appStartup')).toBeHidden({ timeout: 8000 });
    await expect(page).toHaveScreenshot('split-view-desktop-wide.png', {
      animations: 'disabled',
      caret: 'hide',
    });
  });
});
