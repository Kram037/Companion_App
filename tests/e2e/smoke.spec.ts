import { expect, test, type Page } from '@playwright/test';

async function waitForStartup(page: Page) {
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });
}

test('loads the legacy app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Companion App - D&D Helper');
  await expect(page.locator('.desktop-sidebar-nav')).toBeVisible();
  await expect(page.locator('.logo-container')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'campagne');
});

test('shows and closes the startup screen', async ({ page }) => {
  await page.goto('/', { waitUntil: 'commit' });

  const startup = page.locator('#appStartup');
  await expect(startup).toBeVisible();
  await expect(startup).toBeHidden({ timeout: 8000 });
  await expect(page.locator('#compendioHub .comp-hub-card')).toHaveCount(8);
  await expect(page.locator('#labHub .lab-hub-card')).toHaveCount(8);
});

test('navigates through the main mobile toolbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await waitForStartup(page);

  await page.locator('.toolbar-btn[data-page="personaggi"]').click();
  await expect(page.locator('#personaggiPage')).toHaveClass(/active/);

  await page.locator('.toolbar-btn[data-page="laboratorio"]').click();
  await expect(page.locator('#laboratorioPage')).toHaveClass(/active/);
  await expect(page.locator('#labHub .page-header h1')).toHaveText('Laboratorio');

  await page.locator('.toolbar-btn[data-page="compendio"]').click();
  await expect(page.locator('#compendioPage')).toHaveClass(/active/);
  await expect(page.locator('#compendioHub .page-header h1')).toHaveText('Compendio');
});

test('opens the native PWA prompt from the install button', async ({ page }) => {
  await page.goto('/');
  await waitForStartup(page);
  await page.evaluate(() => {
    const app = window as typeof window & { __installPrompted?: boolean };
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' }>;
    };
    event.prompt = async () => { app.__installPrompted = true; };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });

  await page.locator('#settingsBtn').click();
  await page.locator('#installPwaBtn').click();
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { __installPrompted?: boolean }).__installPrompted))).toBe(true);
});

test('manifest does not lock tablet orientation', async ({ request }) => {
  const pageResponse = await request.get('/');
  const html = await pageResponse.text();
  const manifestHref = html.match(/<link rel="manifest" href="([^"]+)"/)?.[1] ?? '';
  expect(manifestHref).not.toBe('');

  const response = await request.get(manifestHref);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).not.toHaveProperty('orientation');
});

test('service worker installs and precaches the hashed Vite entrypoint', async ({ page, request }) => {
  const swResponse = await request.get('/sw.js');
  expect(swResponse.ok()).toBe(true);
  const swSource = await swResponse.text();
  const entrypoint = swSource.match(/\.\/assets\/index-[^"']+\.js/)?.[0];
  const spacedAsset = swSource.match(/\.\/assets\/[^"'\n]* [^"'\n]*/)?.[0];
  expect(entrypoint).toBeTruthy();
  expect(spacedAsset).toBeTruthy();
  expect(swSource).not.toContain('const BUILD_ASSET_URLS = [];');

  await page.goto('/');
  const serviceWorker = await page.evaluate(async (expectedUrl) => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    const cacheName = (await caches.keys()).find(name => name.startsWith('companion-app-'));
    if (!cacheName) return { active: false, cached: false };
    const cache = await caches.open(cacheName);
    const urls = (await cache.keys()).map(request => new URL(request.url).pathname);
    return {
      active: registration.active?.state === 'activated',
      cached: urls.some(url => url.endsWith(expectedUrl.replace(/^\.\//, ''))),
    };
  }, entrypoint!);

  expect(serviceWorker).toEqual({ active: true, cached: true });

  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.context().setOffline(true);
  try {
    const availableOffline = await page.evaluate(
      url => fetch(url).then(response => response.ok).catch(() => false),
      `/${spacedAsset!.replace(/^\.\//, '')}`,
    );
    expect(availableOffline).toBe(true);
  } finally {
    await page.context().setOffline(false);
  }
});

test('desktop split panes divide the workspace in half', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForStartup(page);

  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(page.locator('#desktopSplitPane')).toBeVisible();
  await expect(page.frameLocator('#desktopSplitPaneFrame').locator('#diceSidebarToggle')).toHaveCount(0);
  await expect(page.locator('.desktop-bookmark-tab').first()).toHaveAttribute('draggable', 'true');

  await expect.poll(() => page.evaluate(() => {
    const left = document.querySelector<HTMLElement>('#mainContent')?.getBoundingClientRect().width || 0;
    const right = document.querySelector<HTMLElement>('#desktopSplitPane')?.getBoundingClientRect().width || 0;
    return Math.abs(left - right);
  })).toBeLessThan(2);
});

test('closing the only right split tab closes the split pane', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForStartup(page);

  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(page.locator('#desktopSplitPane')).toBeVisible();
  await page.frameLocator('#desktopSplitPaneFrame').locator('.desktop-bookmark-tab-close').first().click();
  await expect(page.locator('#desktopSplitPane')).toHaveCount(0);
});

test('desktop compendium sidebar opens equipment sections directly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForStartup(page);

  await page.locator('.desktop-sidebar-group-toggle[data-page="compendio"]').click();
  const compendioSidebar = page.locator('.desktop-sidebar-group[data-page="compendio"]');
  await expect(compendioSidebar.locator('.desktop-sidebar-child-toggle[data-tab="oggetti"]')).toHaveCount(1);
  await expect(compendioSidebar.locator('.desktop-sidebar-child[data-tab="oggetti:armi"]')).toBeHidden();
  await compendioSidebar.locator('.desktop-sidebar-child-toggle[data-tab="oggetti"]').click();
  await expect(compendioSidebar.locator('.desktop-sidebar-child[data-tab="oggetti:armi"]')).toBeVisible();
  await page.evaluate(async () => {
    await window.navigateToPage?.('compendio');
    window.compendioOpenTab?.('oggetti');
  });
  await expect(page.locator('#compendioHub')).toBeHidden();
  await expect(page.locator('#compendioSubTitle')).toHaveText('Armi, Armature e Scudi');
});

test('desktop sidebar scroll is confined between chrome dividers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 520 });
  await page.goto('/');
  await waitForStartup(page);

  await page.locator('.desktop-sidebar-group-toggle[data-page="laboratorio"]').click();
  await page.locator('.desktop-sidebar-group-toggle[data-page="compendio"]').click();

  const metrics = await page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>('#desktopSidebarNav')!;
    const list = document.querySelector<HTMLElement>('.desktop-sidebar-list')!;
    const navRect = nav.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    return {
      navOverflowY: getComputedStyle(nav).overflowY,
      listOverflowY: getComputedStyle(list).overflowY,
      listScrollHeight: list.scrollHeight,
      listClientHeight: list.clientHeight,
      topGap: listRect.top - navRect.top,
      bottomGap: navRect.bottom - listRect.bottom,
    };
  });

  expect(metrics.navOverflowY).toBe('hidden');
  expect(metrics.listOverflowY).toBe('auto');
  expect(metrics.listScrollHeight).toBeGreaterThan(metrics.listClientHeight);
  expect(metrics.topGap).toBeGreaterThanOrEqual(80);
  expect(metrics.bottomGap).toBeGreaterThanOrEqual(60);
});

test('desktop sidebar treats character sheets as personaggi in split view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForStartup(page);

  await page.evaluate(() => {
    document.body.classList.add('desktop-split-active');
    document.querySelector('.desktop-sidebar-btn[data-page="campagne"] svg')?.setAttribute('data-render-probe', 'kept');
    window.postMessage({ type: 'companion-split-focus', page: 'scheda', tab: '' }, window.location.origin);
  });

  await expect(page.locator('.desktop-sidebar-btn[data-page="personaggi"]')).toHaveClass(/active/);
  await expect(page.locator('.desktop-sidebar-btn[data-page="campagne"] svg')).toHaveAttribute('data-render-probe', 'kept');

  await page.locator('.desktop-sidebar-group-toggle[data-page="compendio"]').click();
  const icon = page.locator('.desktop-sidebar-group[data-page="compendio"] .desktop-sidebar-child[data-tab="razze"] .desktop-sidebar-item-icon');
  await expect(icon).toHaveCount(1);
  expect(await icon.evaluate(el => el.tagName)).toBe('SPAN');
  expect(await icon.evaluate(el => getComputedStyle(el).filter)).toBe('none');
  await expect.poll(() => icon.evaluate(el => getComputedStyle(el).webkitMaskImage || getComputedStyle(el).maskImage)).toContain('Razze.svg');
});

test('desktop dice roller opens from the d20 logo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForStartup(page);

  await expect(page.locator('#diceSidebarToggle')).toHaveCount(0);
  await expect(page.locator('#diceRollerPanel')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#diceRollerPanel')).toBeHidden();
  await page.locator('#d20Logo').dispatchEvent('click');
  await expect(page.locator('body')).toHaveClass(/dice-desktop-open/);
  await expect(page.locator('#diceRollerPanel')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#diceRollerPanel .dice-roller-head')).toHaveCount(0);
  await expect(page.locator('#userBtn')).toBeVisible();
  await expect(page.locator('#settingsBtn')).toBeVisible();
  await expect.poll(() => page.locator('.desktop-sidebar-nav').evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await expect.poll(() => page.locator('.desktop-sidebar-list').evaluate(el => getComputedStyle(el).opacity)).toBe('0');

  await expect(page.locator('[data-dice-clear]')).toHaveCount(0);
  await page.locator('#diceRollerPanel .dice-face').first().click();
  await expect(page.locator('#diceRollerPanel .dice-face')).toHaveCount(0);
  await expect(page.locator('.dice-total strong')).toHaveText('0');
  await expect.poll(() => page.locator('.dice-type-row').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(3);
  await expect.poll(() => page.locator('.dice-type').first().evaluate(el => {
    const rect = el.getBoundingClientRect();
    return Math.abs(rect.width - rect.height);
  })).toBeLessThan(1);
  await page.locator('[data-dice-add="6"]').click();
  await page.locator('[data-dice-add="8"]').click();
  await page.locator('[data-dice-add="10"]').click();
  await expect(page.locator('#diceRollerPanel .dice-face')).toHaveCount(3);
  await expect.poll(() => page.locator('#diceRollerPanel .dice-face').evaluateAll(dice => {
    const tops = dice.map(die => Math.round(die.getBoundingClientRect().top));
    return new Set(tops).size;
  })).toBe(1);
  await page.locator('[data-dice-roll]').click();
  await expect.poll(() => page.locator('.dice-total strong').innerText().then(Number)).toBeGreaterThan(0);
  await expect.poll(() => page.locator('[data-dice-roll]').evaluate(el => {
    const button = el.getBoundingClientRect();
    const parent = el.parentElement!.getBoundingClientRect();
    return Math.abs(button.width - parent.width);
  })).toBeLessThan(2);
  await page.locator('#d20Logo').dispatchEvent('click');
  await expect(page.locator('body')).not.toHaveClass(/dice-desktop-open/);
  await expect(page.locator('#diceRollerPanel')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#diceRollerPanel')).toBeHidden();
  await expect.poll(() => page.locator('.desktop-sidebar-list').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});

test('mobile d20 logo opens a fullscreen dice roller', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await waitForStartup(page);

  await expect(page.locator('#diceSidebarToggle')).toHaveCount(0);
  await page.locator('#d20Logo').dispatchEvent('click');

  await expect(page.locator('body')).toHaveClass(/dice-mobile-open/);
  await expect(page.locator('#diceRollerPanel')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('#diceRollerPanel .dice-roller-head')).toHaveCount(0);
  await expect(page.locator('.bottom-toolbar')).toBeHidden();
  await expect(page.locator('#campagnePage .btn-fab')).toBeHidden();
  await expect(page.locator('.bookmarks-fab')).toBeHidden();
  await expect.poll(() => page.locator('.dice-type-row').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(6);
  await expect.poll(() => page.locator('.dice-type').first().evaluate(el => {
    const rect = el.getBoundingClientRect();
    return Math.abs(rect.width - rect.height);
  })).toBeLessThan(1);
  await expect.poll(() => page.locator('#diceRollerPanel').evaluate(panel => {
    const panelRect = panel.getBoundingClientRect();
    const rollRect = document.querySelector('[data-dice-roll]')!.getBoundingClientRect();
    return Math.max(panelRect.bottom, rollRect.bottom) - window.innerHeight;
  })).toBeLessThanOrEqual(0);
});

test('desktop character sheet toolbar is centered in the content area', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => {
    const bar = document.createElement('div');
    bar.id = 'testSchedaTabBar';
    bar.className = 'scheda-tab-bar';
    document.body.appendChild(bar);
    const button = document.createElement('div');
    button.id = 'testCombatButton';
    button.className = 'btn-scroll-stats';
    button.style.display = 'inline-flex';
    document.body.appendChild(button);
  });

  await expect.poll(() => page.locator('#testSchedaTabBar').evaluate(el => getComputedStyle(el).bottom)).toBe('18px');
  await expect.poll(() => page.evaluate(() => {
    const sidebarWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--desktop-sidebar-width')) || 0;
    const bar = document.querySelector<HTMLElement>('#testSchedaTabBar')?.getBoundingClientRect();
    if (!bar) return 999;
    const expectedCenter = sidebarWidth + ((window.innerWidth - sidebarWidth) / 2);
    return Math.abs((bar.left + bar.width / 2) - expectedCenter);
  })).toBeLessThan(2);
  await expect.poll(() => page.evaluate(() => {
    const bar = document.querySelector<HTMLElement>('#testSchedaTabBar')?.getBoundingClientRect();
    const button = document.querySelector<HTMLElement>('#testCombatButton')?.getBoundingClientRect();
    if (!bar || !button) return 999;
    return Math.abs(button.left - bar.right - 10);
  })).toBeLessThan(2);
});

test('desktop split panes can use two columns on wide screens', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto('/');
  await waitForStartup(page);

  await page.locator('.desktop-bookmark-split-tab').click();
  await expect(page.locator('#desktopSplitPane')).toBeVisible();

  await expect.poll(() => page.locator('#campagnePage.active .campagne-list').evaluate((el) => {
    return getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
  })).toBeGreaterThanOrEqual(2);
});

test('character sheet split layout uses columns only when there is room', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => {
    document.body.classList.add('desktop-split-active');
    const grid = document.createElement('div');
    grid.className = 'scheda-page-grid';
    grid.innerHTML = '<div></div><div class="scheda-divider"></div><div></div>';
    document.body.appendChild(grid);
  });
  await expect.poll(() => page.locator('.scheda-page-grid').evaluate(el => getComputedStyle(el).display)).toBe('block');

  await page.setViewportSize({ width: 1920, height: 1000 });
  await expect.poll(() => page.locator('.scheda-page-grid').evaluate(el => getComputedStyle(el).display)).toBe('grid');
});
