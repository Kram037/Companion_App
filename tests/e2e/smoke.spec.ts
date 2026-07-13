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

test('keeps desktop split panes stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const sidebarIcon = page.locator('.desktop-sidebar-item-icon').first();
  await expect(sidebarIcon).toBeVisible();
  await expect.poll(() => sidebarIcon.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active')).toHaveCSS('min-width', '178px');

  await page.locator('.desktop-bookmark-split-tab').click();
  const splitPane = page.locator('#desktopSplitPane');
  await expect(splitPane).toBeVisible();

  const widths = await page.evaluate(() => ({
    left: document.querySelector<HTMLElement>('#desktopBookmarkTabs')?.getBoundingClientRect().width || 0,
    right: document.querySelector<HTMLElement>('#desktopSplitPane')?.getBoundingClientRect().width || 0,
  }));
  expect(Math.abs(widths.left - widths.right)).toBeLessThan(2);

  await page.frameLocator('#desktopSplitPaneFrame').locator('.desktop-bookmark-tab-close').first().click();
  await expect(splitPane).toBeHidden();

  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(splitPane).toBeVisible();
  await page.locator('#desktopBookmarkTabs .desktop-bookmark-tab-close').first().click();
  await expect(splitPane).toBeHidden();
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active')).toBeVisible();
});

test('opens equipment sections directly from the desktop sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const compendium = page.locator('.desktop-sidebar-group[data-page="compendio"]');
  await compendium.locator('.desktop-sidebar-group-toggle').click();
  await compendium.locator('.desktop-sidebar-subgroup-toggle[data-tab="oggetti"]').click();
  await compendium.locator('.desktop-sidebar-grandchild[data-section="gemme"]').click();

  await expect(page.locator('#compendioSubTitle')).toHaveText('Gemme');
  await expect(compendium.locator('.desktop-sidebar-grandchild[data-section="gemme"]')).toHaveClass(/active/);
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active .desktop-bookmark-tab-title')).toHaveText('Equipaggiamento');
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active .desktop-bookmark-tab-section')).toHaveText('Gemme');
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active .desktop-bookmark-tab-icon')).toBeVisible();

  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(page.frameLocator('#desktopSplitPaneFrame').locator('#compendioSubTitle')).toHaveText('Gemme');
  await expect(page.frameLocator('#desktopSplitPaneFrame').locator('#compendioHub')).toBeHidden();
});

test('moves tabs between panes and closes an empty source pane', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(page.locator('#desktopSplitPane')).toBeVisible();

  await page.evaluate(() => (window as typeof window & { createBookmarkTab: () => void }).createBookmarkTab());
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab')).toHaveCount(2);

  const firstId = await page.locator('#desktopBookmarkTabs .desktop-bookmark-tab').first().getAttribute('data-bookmark-id');
  await page.evaluate((id) => (window as typeof window & { _bookmarkMoveTab: (bookmarkId: string, pane: string) => Promise<void> })._bookmarkMoveTab(id!, 'right'), firstId);
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab')).toHaveCount(1);
  await expect(page.frameLocator('#desktopSplitPaneFrame').locator('.desktop-bookmark-tab')).toHaveCount(2);

  const lastLeftId = await page.locator('#desktopBookmarkTabs .desktop-bookmark-tab').getAttribute('data-bookmark-id');
  await page.evaluate((id) => (window as typeof window & { _bookmarkMoveTab: (bookmarkId: string, pane: string) => Promise<void> })._bookmarkMoveTab(id!, 'right'), lastLeftId);
  await expect(page.locator('#desktopSplitPane')).toBeHidden();
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab')).toHaveCount(3);
});

test('manifest does not lock tablet orientation', async ({ request }) => {
  const response = await request.get('/manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).not.toHaveProperty('orientation');
});
