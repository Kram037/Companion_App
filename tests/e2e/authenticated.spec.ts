import { expect, type Page, test } from '@playwright/test';

const dmEmail = process.env.E2E_DM_EMAIL;
const dmPassword = process.env.E2E_DM_PASSWORD;
const playerEmail = process.env.E2E_PLAYER_EMAIL;
const playerPassword = process.env.E2E_PLAYER_PASSWORD;
const campaignId = process.env.E2E_CAMPAIGN_ID;
const sessionId = process.env.E2E_SESSION_ID;
const characterId = process.env.E2E_CHARACTER_ID;
const emptyCampaignId = process.env.E2E_EMPTY_CAMPAIGN_ID;
const runMutations = process.env.E2E_MUTATION_TESTS === '1';

async function login(page: Page, email: string, password: string) {
  await page.goto('/campagne');
  await page.locator('#userBtn').click();
  await expect(page.locator('#loginModal')).toHaveClass(/active/);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#submitBtn').click();
  await expect(page.locator('body')).toHaveClass(/user-logged-in/, { timeout: 15_000 });
}

test('authenticated campaign navigation', async ({ page }) => {
  test.skip(!dmEmail || !dmPassword || !campaignId, 'Richiede la fixture E2E Supabase documentata.');

  await login(page, dmEmail!, dmPassword!);
  await expect(page.locator('.campagna-card').first()).toBeVisible();

  await page.goto(`/campagne/${campaignId}`);
  await expect(page.locator('.dettagli-content')).toBeVisible();
  await expect(page.locator('.dettagli-content .page-header h1')).not.toBeEmpty();

  await page.goto(`/campagne/${campaignId}/sessione`);
  await expect(page.locator('.sessione-content')).toBeVisible();

  if (sessionId) {
    await page.goto(`/campagne/${campaignId}/sessione/${sessionId}/combattimento`);
    await expect(page.locator('#combattimentoPage')).toHaveClass(/active/);
  }
});

test('a character accordion stays open during a realtime refetch', async ({ page }) => {
  test.skip(!dmEmail || !dmPassword || !characterId, 'Richiede un personaggio nella fixture E2E Supabase.');

  await login(page, dmEmail!, dmPassword!);
  await page.goto(`/personaggi/${characterId}`);
  await expect(page.locator('#schedaPage')).toHaveClass(/active/);
  await page.getByRole('button', { name: 'Pagina 2' }).click();

  const feature = page.locator('details.priv-feat-row').first();
  await expect(feature).toBeVisible();
  await feature.locator('summary').click();
  await expect(feature).toHaveAttribute('open', '');

  const refetch = page.waitForResponse(response => response.request().method() === 'GET' && response.url().includes('/rest/v1/personaggi'));
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('companion:data-changed', {
    detail: { table: 'personaggi', action: 'update' },
  })));
  await refetch;
  await expect(feature).toHaveAttribute('open', '');
});

test('starts and ends a session without leaving fixture state behind', async ({ page }) => {
  test.skip(
    !runMutations || !dmEmail || !dmPassword || !emptyCampaignId,
    'Richiede E2E_MUTATION_TESTS=1 e una campagna DM dedicata senza sessioni attive.',
  );

  await login(page, dmEmail!, dmPassword!);
  await page.goto(`/campagne/${emptyCampaignId}`);
  await page.getByRole('button', { name: 'Inizia Sessione' }).click();
  await expect(page.locator('.sessione-content .timer-display')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Fine Sessione' }).click();
  await expect(page.locator('.dettagli-content')).toBeVisible({ timeout: 15_000 });
});

test('initiative and combat updates stay synchronized without resetting a modal', async ({ browser }) => {
  test.skip(
    !runMutations || !dmEmail || !dmPassword || !playerEmail || !playerPassword || !campaignId || !sessionId,
    'Richiede E2E_MUTATION_TESTS=1 e la fixture realtime DM/player documentata.',
  );

  const dmContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const dmPage = await dmContext.newPage();
  const playerPage = await playerContext.newPage();

  try {
    await login(dmPage, dmEmail!, dmPassword!);
    await login(playerPage, playerEmail!, playerPassword!);

    const sessionPath = `/campagne/${campaignId}/sessione`;
    await Promise.all([dmPage.goto(sessionPath), playerPage.goto(sessionPath)]);
    await expect(dmPage.getByRole('button', { name: 'Tirate iniziativa' })).toBeVisible();

    await dmPage.getByRole('button', { name: 'Tirate iniziativa' }).click();
    await expect(playerPage.locator('#rollRequestModal')).toHaveClass(/active/, { timeout: 15_000 });
    await playerPage.locator('#autoRollBtn').click();
    await expect(playerPage.locator('#rollRequestInput')).not.toHaveValue('');
    await playerPage.locator('#submitRollRequestBtn').click();

    const combatPath = `/campagne/${campaignId}/sessione/${sessionId}/combattimento`;
    await Promise.all([dmPage.goto(combatPath), playerPage.goto(combatPath)]);
    await expect(dmPage.locator('.combat-next-btn')).toBeVisible();
    await expect(playerPage.locator('.combat-round-center')).toBeVisible();

    await playerPage.getByTitle('Calcolatrice').click();
    await expect(playerPage.locator('#hpCalcOverlay')).toBeVisible();
    const previousTurn = await playerPage.locator('.combat-round-center').innerText();

    await dmPage.locator('.combat-next-btn').click();
    await expect(playerPage.locator('.combat-round-center')).not.toHaveText(previousTurn, { timeout: 15_000 });
    await expect(playerPage.locator('#hpCalcOverlay')).toBeVisible();
    await expect(playerPage.locator('.combat-round-center')).toHaveText(await dmPage.locator('.combat-round-center').innerText());
  } finally {
    await dmContext.close();
    await playerContext.close();
  }
});
