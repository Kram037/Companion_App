import { expect, test } from '@playwright/test';

test('loads the app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Companion App - D&D Helper');
  await expect(page.locator('.header')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'campagne');
  await expect(page.locator('#react-root .react-page-shell')).toBeVisible();
});

test('uses the URL as navigation source after refresh', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('currentPage', 'scheda');
    sessionStorage.setItem('currentCampagnaId', 'stale-campaign');
    sessionStorage.setItem('currentSessioneId', 'stale-session');
    sessionStorage.setItem('currentPersonaggioId', 'stale-character');
  });
  await page.goto('/compendio', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'compendio');
  await expect.poll(() => page.evaluate(() => ({
    page: window.AppState?.currentPage,
    campagnaId: window.AppState?.currentCampagnaId,
    sessioneId: window.AppState?.currentSessioneId,
    personaggioId: window.AppState?.currentPersonaggioId,
  }))).toEqual({ page: 'compendio', campagnaId: null, sessioneId: null, personaggioId: null });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/compendio(?:\?.*)?$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'compendio');
});

test('renders the friends route through React', async ({ page }) => {
  await page.goto('/amici');

  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'amici');
  await expect(page.locator('#react-root .page-header h1')).toHaveText('Amici');
  await expect(page.locator('#react-root .content-placeholder')).toContainText('Accedi');
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

  await expect(page.locator('.react-compendium-page .page-header h1')).toHaveText('Gemme');
  await expect(compendium.locator('.desktop-sidebar-grandchild[data-section="gemme"]')).toHaveClass(/active/);
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active .desktop-bookmark-tab-title')).toHaveText('Equipaggiamento');
  await expect(page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active .desktop-bookmark-tab-section')).toHaveText('Gemme');
  const activeTab = page.locator('#desktopBookmarkTabs .desktop-bookmark-tab.active');
  await expect(activeTab).toHaveAttribute('draggable', 'true');
  const tabIcon = activeTab.locator('.desktop-bookmark-tab-icon');
  await expect(tabIcon).toBeVisible();
  await expect.poll(() => tabIcon.evaluate((icon) => getComputedStyle(icon).maskImage !== 'none')).toBe(true);
  const originalTabId = await activeTab.getAttribute('data-bookmark-id');

  await page.evaluate(() => (window as typeof window & { navigateToPage: (page: string) => Promise<void> }).navigateToPage('compendio'));
  await expect(page.locator('.react-compendium-page .page-header h1')).toHaveText('Gemme');

  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(page.locator('.react-compendium-page .page-header h1')).toHaveText('Gemme');
  await expect(page.locator(`#desktopBookmarkTabs [data-bookmark-id="${originalTabId}"] .desktop-bookmark-tab-title`)).toHaveText('Equipaggiamento');
  await expect(page.frameLocator('#desktopSplitPaneFrame').locator('body')).toHaveAttribute('data-react-page', 'campagne');
  await expect(page.frameLocator('#desktopSplitPaneFrame').locator('.desktop-bookmark-tab.active .desktop-bookmark-tab-title')).toHaveText('Campagne');
});

test('opens laboratory categories directly from the desktop sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const laboratory = page.locator('.desktop-sidebar-group[data-page="laboratorio"]');
  await laboratory.locator('.desktop-sidebar-group-toggle').click();
  await laboratory.locator('.desktop-sidebar-child[data-tab="incantesimi"]').click();

  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'laboratorio');
  await expect(page.locator('.react-laboratory-page .page-header h1')).toHaveText('Incantesimi');
  await expect(laboratory.locator('.desktop-sidebar-child[data-tab="incantesimi"]')).toHaveClass(/active/);

  await page.evaluate(() => (window as typeof window & { navigateToPage: (page: string) => Promise<void> }).navigateToPage('laboratorio'));
  await expect(page.locator('.react-laboratory-page .page-header h1')).toHaveText('Incantesimi');
});

test('moves tabs between panes and closes an empty source pane', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(page.locator('#desktopSplitPane')).toBeVisible();

  await page.evaluate(() => (window as typeof window & { createBookmarkTab: () => void }).createBookmarkTab());
  const leftTabs = page.locator('#desktopBookmarkTabs .desktop-bookmark-tab');
  await expect(leftTabs).toHaveCount(2);

  const secondId = await leftTabs.nth(1).getAttribute('data-bookmark-id');
  await leftTabs.nth(1).dragTo(leftTabs.nth(0), { targetPosition: { x: 2, y: 20 } });
  await expect(leftTabs.first()).toHaveAttribute('data-bookmark-id', secondId!);

  const firstId = await leftTabs.first().getAttribute('data-bookmark-id');
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

test('precache keeps the production shell available offline', async ({ page, context }) => {
  await page.goto('/');
  const cache = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const key = (await caches.keys()).find(name => name.startsWith('companion-app-')) ?? '';
    const urls = key ? (await (await caches.open(key)).keys()).map(request => request.url) : [];
    return { key, urls };
  });

  expect(cache.key).toMatch(/^companion-app-[a-f0-9]{12}$/);
  expect(cache.urls.some(url => /\/assets\/index-.*\.js$/.test(url))).toBe(true);
  expect(cache.urls.some(url => /\/assets\/index-.*\.css$/.test(url))).toBe(true);

  await page.reload();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'campagne');
  await context.setOffline(false);
});
