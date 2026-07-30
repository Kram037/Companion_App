import { expect, type Page, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY;
const dmEmail = process.env.E2E_DM_EMAIL;
const dmPassword = process.env.E2E_DM_PASSWORD;
const playerEmail = process.env.E2E_PLAYER_EMAIL;
const playerPassword = process.env.E2E_PLAYER_PASSWORD;
const externalEmail = process.env.E2E_EXTERNAL_EMAIL;
const externalPassword = process.env.E2E_EXTERNAL_PASSWORD;
const campaignId = process.env.E2E_CAMPAIGN_ID;
const sessionId = process.env.E2E_SESSION_ID;
const characterId = process.env.E2E_CHARACTER_ID;
const emptyCampaignId = process.env.E2E_EMPTY_CAMPAIGN_ID;
const runMutations = process.env.E2E_MUTATION_TESTS === '1';

test.beforeAll(() => {
  if (process.env.E2E_REQUIRE_AUTH !== '1') return;

  const hasCompleteFixture = [
    supabaseUrl, supabaseAnonKey, dmEmail, dmPassword, playerEmail, playerPassword,
    externalEmail, externalPassword, campaignId, sessionId, characterId, emptyCampaignId,
  ].every(Boolean);
  expect(hasCompleteFixture, 'La suite di rilascio richiede la fixture E2E Supabase completa.').toBe(true);
  expect(runMutations, 'La suite di rilascio richiede E2E_MUTATION_TESTS=1.').toBe(true);
});

async function login(page: Page, email: string, password: string) {
  if (supabaseUrl && supabaseAnonKey) {
    await page.addInitScript(
      ({ url, key }) => Object.assign(window, {
        CompanionConfigOverride: { supabaseUrl: url, supabaseAnonKey: key },
      }),
      { url: supabaseUrl, key: supabaseAnonKey },
    );
  }
  await page.goto('/campagne');
  await page.locator('#userBtn').click();
  await expect(page.locator('#loginModal')).toHaveClass(/active/);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#submitBtn').click();
  await page.locator('#password').fill('');
  await expect(page.locator('body')).toHaveClass(/user-logged-in/, { timeout: 15_000 });
}

test('staging RLS rejects anonymous and cross-user access', async () => {
  test.skip(
    !supabaseUrl || !supabaseAnonKey || !dmEmail || !dmPassword
      || !playerEmail || !playerPassword || !externalEmail || !externalPassword
      || !campaignId || !characterId,
    'Richiede i tre account e la fixture RLS nello staging Supabase.',
  );

  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const dm = createClient(supabaseUrl!, supabaseAnonKey!, options);
  const player = createClient(supabaseUrl!, supabaseAnonKey!, options);
  const external = createClient(supabaseUrl!, supabaseAnonKey!, options);
  const anonymous = createClient(supabaseUrl!, supabaseAnonKey!, options);

  const logins = await Promise.all([
    dm.auth.signInWithPassword({ email: dmEmail!, password: dmPassword! }),
    player.auth.signInWithPassword({ email: playerEmail!, password: playerPassword! }),
    external.auth.signInWithPassword({ email: externalEmail!, password: externalPassword! }),
  ]);
  expect(logins.map(result => result.error)).toEqual([null, null, null]);
  await new Promise(resolve => setTimeout(resolve, 1_000));

  const [dmIdResult, playerIdResult] = await Promise.all([
    dm.rpc('get_current_user_id'),
    player.rpc('get_current_user_id'),
  ]);
  expect(dmIdResult.error).toBeNull();
  expect(playerIdResult.error).toBeNull();

  const externalCampaign = await external.from('campagne').select('id').eq('id', campaignId!);
  const externalCharacter = await external.from('personaggi').select('id').eq('id', characterId!);
  expect(externalCampaign.error).toBeNull();
  expect(externalCampaign.data).toEqual([]);
  expect(externalCharacter.error).toBeNull();
  expect(externalCharacter.data).toEqual([]);

  const forbiddenTransfer = await player
    .from('campagne')
    .update({ id_dm: playerIdResult.data })
    .eq('id', campaignId!)
    .select('id_dm');
  expect(forbiddenTransfer.error).toBeNull();
  expect(forbiddenTransfer.data).toEqual([]);

  const forbiddenAssociation = await player.from('personaggi_campagna').insert({
    id: 'e2eprobe01',
    campagna_id: campaignId!,
    user_id: playerIdResult.data,
    personaggio_id: characterId!,
  });
  expect(forbiddenAssociation.error).not.toBeNull();

  const anonymousRpc = await anonymous.rpc('get_dm_campagna', { p_campagna_id: campaignId! });
  expect(anonymousRpc.error).not.toBeNull();

  const campaignOwner = await dm.from('campagne').select('id_dm').eq('id', campaignId!).single();
  expect(campaignOwner.error).toBeNull();
  expect(campaignOwner.data?.id_dm).toBe(dmIdResult.data);
});

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
    await expect(monster.getByRole('status', { name: 'Quantità Awakened Shrub' })).toHaveText('1');
    await monster.getByRole('button', { name: 'Aumenta quantità Awakened Shrub' }).click();
    await expect(monster.getByRole('status', { name: 'Quantità Awakened Shrub' })).toHaveText('2');
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

    const sessionPath = `/campagne/${campaignId}/sessione`;
    const combatPath = `/campagne/${campaignId}/sessione/${sessionId}/combattimento`;
    await dmPage.goto(combatPath);
    dmPage.once('dialog', dialog => dialog.accept());
    await dmPage.getByTitle('Termina combattimento').click();
    await expect(dmPage).toHaveURL(new RegExp(`${sessionPath}$`));

    await login(playerPage, playerEmail!, playerPassword!);
    await Promise.all([dmPage.goto(sessionPath), playerPage.goto(sessionPath)]);
    await expect(dmPage.locator('body')).toHaveAttribute('data-react-owner', 'sessione');
    await expect(playerPage.locator('body')).toHaveAttribute('data-react-owner', 'sessione');
    await expect(dmPage.locator('#react-root').getByRole('button', { name: 'Tirate iniziativa' })).toBeVisible();
    await expect.poll(() => playerPage.evaluate(() =>
      (window as typeof window & { rollRequestsChannels?: { iniziativa?: { state?: string } } })
        .rollRequestsChannels?.iniziativa?.state)).toBe('joined');
    await expect.poll(() => dmPage.evaluate(() =>
      (window as typeof window & { appEventsChannel?: { state?: string } })
        .appEventsChannel?.state)).toBe('joined');

    await dmPage.locator('#react-root').getByRole('button', { name: 'Tirate iniziativa' }).click();
    await expect(playerPage.locator('#rollRequestModal')).toHaveClass(/active/, { timeout: 15_000 });
    await expect(dmPage.locator('body')).toHaveAttribute('data-react-owner', 'combattimento');
    await playerPage.locator('#autoRollBtn').click();
    await expect(playerPage.locator('#rollRequestInput')).not.toHaveValue('');
    const submittedInitiative = await playerPage.locator('#rollRequestInput').inputValue();
    await playerPage.locator('#submitRollRequestBtn').click();
    await expect(playerPage.locator('#rollRequestModal')).not.toHaveClass(/active/);
    await expect.poll(() => dmPage.locator('.combat-card-init').allTextContents(), { timeout: 15_000 }).toContain(submittedInitiative);

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
