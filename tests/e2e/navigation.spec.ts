import { expect, test, type Page } from '@playwright/test';

async function waitForStartup(page: Page) {
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });
}

test('campaign routes stay React-owned across legacy navigation, deep links and history', async ({ page }) => {
  await page.goto('/campagne');
  await waitForStartup(page);

  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'campagne');
  await expect(page.locator('#campagnePage')).toHaveCount(0);
  await expect(page.locator('#dettagliPage, #sessionePage, #combattimentoPage')).toHaveCount(0);

  await page.evaluate(() => window.navigateToPage?.('campagne'));

  await expect(page).toHaveURL(/\/campagne$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'campagne');

  await page.evaluate(() => {
    window.setAppNavigationState?.({ campagnaId: 'campaign-test' }, 'e2e');
    return window.navigateToPage?.('dettagli');
  });
  await expect(page).toHaveURL(/\/campagne\/campaign-test$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'dettagli');

  await page.evaluate(() => window.openSessionePage?.('campaign-test'));
  await expect(page).toHaveURL(/\/campagne\/campaign-test\/sessione$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'sessione');

  await page.evaluate(() => window.openCombattimentoPage?.('campaign-test', 'session-test'));
  await expect(page).toHaveURL(/\/campagne\/campaign-test\/sessione\/session-test\/combattimento$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'combattimento');
  await expect(page.locator('#react-root > .react-page-shell')).toBeVisible();

  await page.reload();
  await waitForStartup(page);
  await expect(page).toHaveURL(/\/campagne\/campaign-test\/sessione\/session-test\/combattimento$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'combattimento');

  await page.goBack();
  await expect(page).toHaveURL(/\/campagne\/campaign-test\/sessione$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'sessione');

  await page.goBack();
  await expect(page).toHaveURL(/\/campagne\/campaign-test$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'dettagli');

  await page.goBack();
  await expect(page).toHaveURL(/\/campagne$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'campagne');
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
