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

test.beforeAll(() => {
  if (process.env.E2E_REQUIRE_AUTH !== '1') return;

  const fixture = {
    E2E_DM_EMAIL: dmEmail,
    E2E_DM_PASSWORD: dmPassword,
    E2E_PLAYER_EMAIL: playerEmail,
    E2E_PLAYER_PASSWORD: playerPassword,
    E2E_CAMPAIGN_ID: campaignId,
    E2E_SESSION_ID: sessionId,
    E2E_CHARACTER_ID: characterId,
    E2E_EMPTY_CAMPAIGN_ID: emptyCampaignId,
  };
  const missing = Object.entries(fixture)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  expect(missing, 'La suite di rilascio richiede la fixture E2E Supabase completa.').toEqual([]);
  expect(runMutations, 'La suite di rilascio richiede E2E_MUTATION_TESTS=1.').toBe(true);
});

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
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'dettagli');
  await expect(page.locator('#campagnePage')).toHaveCount(0);
  await expect(page.locator('#dettagliPage, #sessionePage, #combattimentoPage')).toHaveCount(0);
  await expect(page.locator('#react-root .dettagli-content')).toBeVisible();
  await expect(page.locator('#react-root .dettagli-content .page-header h1')).not.toBeEmpty();
  await page.getByRole('button', { name: 'Torna alle campagne' }).click();
  await expect(page).toHaveURL(/\/campagne$/);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'campagne');

  await page.goto(`/campagne/${campaignId}/sessione`);
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'sessione');
  await expect(page.locator('#react-root .sessione-content')).toBeVisible();
  await page.getByRole('button', { name: 'Torna ai dettagli' }).click();
  await expect(page).toHaveURL(new RegExp(`/campagne/${campaignId}$`));
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'dettagli');

  if (sessionId) {
    await page.goto(`/campagne/${campaignId}/sessione/${sessionId}/combattimento`);
    await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'combattimento');
    await expect(page.locator('#react-root .react-combat-page')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTitle('Gestisci mostri').click();
    const picker = page.getByRole('dialog', { name: 'Aggiungi mostri' });
    await expect(picker).toBeVisible();
    await expect(picker).toBeInViewport();
    await expect(picker.getByRole('tab', { name: 'Laboratorio' })).toBeVisible();
    await expect(picker.getByRole('button', { name: 'Placeholder' })).toBeVisible();
    await expect.poll(() => picker.locator('.combat-picker-source-tab img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await picker.getByRole('button', { name: 'Placeholder' }).click();
    const placeholder = page.getByRole('dialog', { name: 'Nuovo placeholder' });
    await expect(placeholder.locator('#combat-placeholder-name')).toBeVisible();
    await placeholder.getByRole('button', { name: 'Annulla' }).click();
    await picker.getByRole('tab', { name: 'Laboratorio' }).click();
    await expect(picker.getByRole('tab', { name: 'Mostri' })).toBeVisible();
    await picker.getByRole('tab', { name: 'Combattimenti' }).click();
    await expect(picker.getByRole('searchbox', { name: 'Cerca combattimento' })).toBeVisible();
    await picker.getByRole('tab', { name: 'Compendio' }).click();
    await picker.getByRole('searchbox', { name: 'Cerca mostro' }).fill('Awakened Shrub');
    const monster = picker.locator('[data-source-id="awakened-shrub-mm-41"]');
    await monster.getByRole('checkbox', { name: 'Seleziona Awakened Shrub' }).check();
    await expect(monster.getByLabel('Quantità Awakened Shrub')).toHaveText('1');
    await monster.getByRole('button', { name: 'Aumenta quantità Awakened Shrub' }).click();
    await expect(monster.getByLabel('Quantità Awakened Shrub')).toHaveText('2');
    await monster.getByRole('button', { name: 'Riduci quantità Awakened Shrub' }).click();
    const confirmSelection = picker.getByRole('button', { name: 'Conferma selezione' });
    await expect(confirmSelection).toBeInViewport();
    await confirmSelection.click();
    const initiative = page.getByRole('dialog', { name: 'Iniziativa mostri' });
    await expect(initiative.getByRole('tab', { name: 'Tiri singoli' })).toBeVisible();
    await initiative.getByRole('tab', { name: 'Tiro di gruppo' }).click();
    await expect(initiative.getByLabel('Iniziativa Awakened Shrub')).toBeVisible();
    await initiative.getByRole('button', { name: 'Chiudi' }).click();
    await page.getByRole('button', { name: 'Torna alla sessione' }).click();
    await expect(page).toHaveURL(new RegExp(`/campagne/${campaignId}/sessione$`));
    await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'sessione');
  }
});

test('authenticated friends route uses the React page', async ({ page }) => {
  test.skip(!dmEmail || !dmPassword, 'Richiede la fixture E2E Supabase documentata.');

  await login(page, dmEmail!, dmPassword!);
  await page.goto('/amici');

  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'amici');
  await expect(page.locator('.react-page-shell .page-header h1')).toHaveText('Amici');
  await expect(page.locator('.react-page-shell .btn-fab')).toBeVisible();
  await expect(page.locator('#amiciPage')).toBeHidden();
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
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'sessione');
  await expect(page.locator('#react-root .sessione-content .timer-display')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Fine Sessione' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'dettagli');
  await expect(page.locator('#react-root .dettagli-content')).toBeVisible({ timeout: 15_000 });
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
    await expect(dmPage.locator('body')).toHaveAttribute('data-react-owner', 'sessione');
    await expect(playerPage.locator('body')).toHaveAttribute('data-react-owner', 'sessione');
    await expect(dmPage.locator('#react-root').getByRole('button', { name: 'Tirate iniziativa' })).toBeVisible();

    await dmPage.locator('#react-root').getByRole('button', { name: 'Tirate iniziativa' }).click();
    await expect(playerPage.locator('#rollRequestModal')).toHaveClass(/active/, { timeout: 15_000 });
    await playerPage.locator('#autoRollBtn').click();
    await expect(playerPage.locator('#rollRequestInput')).not.toHaveValue('');
    const submittedInitiative = await playerPage.locator('#rollRequestInput').inputValue();
    await playerPage.locator('#submitRollRequestBtn').click();
    await expect(playerPage.locator('#rollRequestModal')).not.toHaveClass(/active/);
    await expect.poll(() => dmPage.locator('.combat-card-init').allTextContents()).toContain(submittedInitiative);

    const combatPath = `/campagne/${campaignId}/sessione/${sessionId}/combattimento`;
    await Promise.all([dmPage.goto(combatPath), playerPage.goto(combatPath)]);
    await expect(dmPage.locator('body')).toHaveAttribute('data-react-owner', 'combattimento');
    await expect(playerPage.locator('body')).toHaveAttribute('data-react-owner', 'combattimento');
    await expect(dmPage.locator('#combattimentoPage')).toHaveCount(0);
    await expect(playerPage.locator('#combattimentoPage')).toHaveCount(0);
    const dmCombat = dmPage.locator('#react-root');
    const playerCombat = playerPage.locator('#react-root');
    await expect(dmCombat.locator('.combat-next-btn')).toBeVisible();
    await expect(playerCombat.locator('.combat-round-center')).toBeVisible();

    await playerCombat.getByTitle('Calcolatrice').click();
    await expect(playerPage.locator('#hpCalcOverlay')).toBeVisible();
    const previousTurn = await playerCombat.locator('.combat-round-center').innerText();

    await dmCombat.locator('.combat-next-btn').click();
    await expect(playerCombat.locator('.combat-round-center')).not.toHaveText(previousTurn, { timeout: 15_000 });
    await expect(playerPage.locator('#hpCalcOverlay')).toBeVisible();
    await expect(playerCombat.locator('.combat-round-center')).toHaveText(await dmCombat.locator('.combat-round-center').innerText());
  } finally {
    await dmContext.close();
    await playerContext.close();
  }
});
