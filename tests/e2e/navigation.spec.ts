import { expect, test, type Page } from '@playwright/test';

async function waitForStartup(page: Page) {
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });
}

test('same-route legacy navigation still activates and loads the page', async ({ page }) => {
  await page.goto('/campagne');
  await waitForStartup(page);

  await page.locator('#campagnePage').evaluate(element => element.classList.remove('active'));
  await page.evaluate(async () => {
    await window.navigateToPage?.('campagne');
  });

  await expect(page.locator('#campagnePage')).toHaveClass(/active/);
});

test('legacy session navigation invokes the session renderer', async ({ page }) => {
  await page.goto('/campagne');
  await waitForStartup(page);

  const renderedCampaignId = await page.evaluate(async () => {
    let rendered = '';
    window.renderSessioneContent = async campaignId => {
      rendered = campaignId;
    };
    window.setAppNavigationState?.({ campagnaId: 'campaign-test' }, 'e2e');

    await window.navigateToPage?.('sessione', { pushHistory: false });
    return rendered;
  });

  expect(renderedCampaignId).toBe('campaign-test');
});

test('legacy campaign detail opener keeps detail navigation under the React route bridge', async ({ page }) => {
  await page.goto('/campagne');
  await waitForStartup(page);

  const state = await page.evaluate(async () => {
    let rendered = '';
    window.loadCampagnaDetails = async campaignId => {
      rendered = campaignId;
    };

    window.openCampagnaDetails?.('campaign-test');
    await new Promise(resolve => setTimeout(resolve, 0));

    return {
      rendered,
      page: window.AppState?.currentPage,
      campagnaId: window.AppState?.currentCampagnaId,
      detailsActive: document.getElementById('dettagliPage')?.classList.contains('active') ?? false,
      campaignsActive: document.getElementById('campagnePage')?.classList.contains('active') ?? false,
      pathname: window.location.pathname,
    };
  });

  expect(state).toEqual({
    rendered: 'campaign-test',
    page: 'dettagli',
    campagnaId: 'campaign-test',
    detailsActive: true,
    campaignsActive: false,
    pathname: '/campagne/campaign-test',
  });
});

test('session buttons render immediately even when React bridge handles the URL', async ({ page }) => {
  await page.goto('/campagne');
  await waitForStartup(page);

  const state = await page.evaluate(async () => {
    let combatRendered = '';
    let bridgedTo = '';
    Object.defineProperty(window, 'renderCombattimentoContent', {
      configurable: true,
      writable: true,
      value: async (campaignId, sessionId) => {
        combatRendered = `${campaignId}:${sessionId}`;
      },
    });
    window.ensureRuntimeScript = async () => {};
    window.CompanionRouterBridge = {
      ...window.CompanionRouterBridge,
      navigateToLegacy(snapshot) {
        bridgedTo = snapshot.page || '';
        if (snapshot.page === 'sessione') {
          window.history.pushState({}, '', `/campagne/${snapshot.campagnaId}/sessione`);
        } else if (snapshot.page === 'combattimento') {
          window.history.pushState({}, '', `/campagne/${snapshot.campagnaId}/sessione/${snapshot.sessioneId}/combattimento`);
        }
        return true;
      },
    };

    await window.openSessionePage?.('campaign-test');
    const sessionActive = document.getElementById('sessionePage')?.classList.contains('active') ?? false;
    await window.openCombattimentoPage?.('campaign-test', 'session-test');

    return {
      bridgedTo,
      sessionActive,
      combatRendered,
      page: window.AppState?.currentPage,
      campagnaId: window.AppState?.currentCampagnaId,
      sessioneId: window.AppState?.currentSessioneId,
    };
  });

  expect(state).toEqual({
    bridgedTo: 'combattimento',
    sessionActive: true,
    combatRendered: 'campaign-test:session-test',
    page: 'combattimento',
    campagnaId: 'campaign-test',
    sessioneId: 'session-test',
  });
});

test('URL drives deep links, refresh and browser history', async ({ page }) => {
  await page.goto('/compendio');
  await waitForStartup(page);
  await expect(page.locator('#compendioPage')).toHaveClass(/active/);

  await page.reload();
  await waitForStartup(page);
  await expect(page).toHaveURL(/\/compendio$/);
  await expect(page.locator('#compendioPage')).toHaveClass(/active/);

  await page.locator('.desktop-sidebar-btn[data-page="personaggi"]').click();
  await expect(page).toHaveURL(/\/personaggi$/);
  await expect(page.locator('#personaggiPage')).toHaveClass(/active/);

  await page.locator('.desktop-sidebar-btn[data-page="campagne"]').click();
  await expect(page).toHaveURL(/\/campagne$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/personaggi$/);
  await expect(page.locator('#personaggiPage')).toHaveClass(/active/);

  await page.goBack();
  await expect(page).toHaveURL(/\/compendio$/);
  await expect(page.locator('#compendioPage')).toHaveClass(/active/);

  await page.goForward();
  await expect(page).toHaveURL(/\/personaggi$/);
  await expect(page.locator('#personaggiPage')).toHaveClass(/active/);
});

test('legacy changes notify the React query bridge', async ({ page }) => {
  await page.goto('/campagne');
  await waitForStartup(page);

  const detail = await page.evaluate(() => new Promise(resolve => {
    window.addEventListener('companion:data-changed', event => {
      resolve((event as CustomEvent).detail);
    }, { once: true });
    void window.sendAppEventBroadcast?.({ table: 'campagne', action: 'update' });
  }));

  expect(detail).toMatchObject({ table: 'campagne', action: 'update' });
});
