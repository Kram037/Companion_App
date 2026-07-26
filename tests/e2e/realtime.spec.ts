import { expect, test } from '@playwright/test';

test('React-owned campaign refresh never invokes the legacy renderer', async ({ page }) => {
  await page.goto('/campagne');
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'campagne');
  await expect(page.locator('#campagnePage')).toHaveCount(0);
  await page.locator('#userBtn').click();
  const modal = page.locator('#loginModal');
  const email = page.locator('#email');
  await expect(modal).toHaveClass(/active/);
  await email.fill('input-in-corso@example.test');

  await page.evaluate(() => {
    const app = window as typeof window & {
      AppState: { isLoggedIn: boolean; currentPage: string; currentUser: { uid: string } };
      requestLegacyRealtimeRefresh?: () => void;
    };
    app.AppState.isLoggedIn = true;
    app.AppState.currentPage = 'campagne';
    app.AppState.currentUser = { uid: 'e2e-user' };
    app.requestLegacyRealtimeRefresh?.();
  });

  await page.waitForTimeout(1_200);
  expect(await page.evaluate(() => typeof (window as typeof window & { loadCampagne?: unknown }).loadCampagne)).toBe('undefined');
  await expect(modal).toHaveClass(/active/);
  await expect(email).toHaveValue('input-in-corso@example.test');
  await expect(email).toBeFocused();

  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    document.getElementById('loginModal')?.classList.remove('active');
    window.requestLegacyRealtimeRefresh?.();
  });
  await page.waitForTimeout(1_200);
  expect(await page.evaluate(() => typeof (window as typeof window & { loadCampagne?: unknown }).loadCampagne)).toBe('undefined');
});

test('a newer roll request replaces only a stale request of the same kind', async ({ page }) => {
  await page.goto('/campagne');
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });

  const result = await page.evaluate(() => {
    const app = window as typeof window & {
      currentRollRequest?: { id: string; tipo: string } | null;
      shouldShowRollRequest?: (request: { id: string; tipo: string }) => boolean;
    };
    app.currentRollRequest = { id: 'old', tipo: 'iniziativa' };
    return [
      app.shouldShowRollRequest?.({ id: 'new', tipo: 'iniziativa' }),
      app.shouldShowRollRequest?.({ id: 'old', tipo: 'iniziativa' }),
      app.shouldShowRollRequest?.({ id: 'generic', tipo: 'generico' }),
    ];
  });

  expect(result).toEqual([true, false, false]);
});

test('a session insert is verified once before notifying the player', async ({ page }) => {
  await page.goto('/campagne');
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });

  const result = await page.evaluate(async () => {
    const app = window as typeof window & Record<string, any>;
    let table = '';
    const rows = {
      sessioni: { id: 's1', created_at: new Date().toISOString() },
      campagne: { nome_campagna: 'Test', id_dm: 'dm1', giocatori: ['p1'] },
    };
    const query = {
      select() { return this; },
      eq() { return this; },
      is() { return this; },
      async maybeSingle() { return { data: rows.sessioni, error: null }; },
      async single() { return { data: rows.campagne, error: null }; },
    };
    const shown: string[] = [];

    app.AppState.isLoggedIn = true;
    app.AppState.currentUser = { uid: 'player-uid' };
    app.getSupabaseClient = () => ({ from(name: string) { table = name; return query; } });
    app.findUserByUid = async () => ({ id: 'p1' });
    app.showInAppNotification = ({ sessioneId }: { sessioneId: string }) => shown.push(sessioneId);
    app.sendBrowserNotification = () => {};

    await app.handleSessionStarted('c1', 's1');
    await app.handleSessionStarted('c1', 's1');
    const beforeStop = shown.length;
    await app.stopAppEventsRealtime();
    await app.handleSessionStarted('c1', 's1');
    return { shown, table, beforeStop };
  });

  expect(result).toEqual({ shown: ['s1', 's1'], table: 'campagne', beforeStop: 1 });
});

test('the first broadcast configures the shared realtime channel before sending', async ({ page }) => {
  await page.goto('/campagne');
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });

  const result = await page.evaluate(async () => {
    const app = window as typeof window & Record<string, any>;
    let joins = 0;
    let removals = 0;
    let channelLookups = 0;
    let httpSends = 0;
    let subscribed = false;
    let updateStatus: (status: string, error?: Error) => void;
    let receiveBroadcast: ((payload: Record<string, any>) => void) | undefined;
    const postgresCallbacks: Record<string, (payload: Record<string, any>) => void> = {};
    const operations: string[] = [];
    const receivedChanges: string[] = [];
    const channel = {
      on(type: string, filter: Record<string, string>, callback: (payload: Record<string, any>) => void) {
        if (subscribed && type === 'postgres_changes') {
          throw new Error('cannot add postgres_changes callbacks after subscribe()');
        }
        operations.push(type === 'broadcast'
          ? `on:broadcast:${filter.event}`
          : `on:${type}:${filter.table}:${filter.event}`);
        if (type === 'broadcast') receiveBroadcast = callback;
        if (type === 'postgres_changes') postgresCallbacks[`${filter.table}:${filter.event}`] = callback;
        return this;
      },
      subscribe(callback: (status: string, error?: Error) => void) {
        joins += 1;
        subscribed = true;
        updateStatus = callback;
        operations.push('subscribe');
        return this;
      },
      async httpSend(event: string) {
        httpSends += 1;
        operations.push(`http:${event}`);
        return { success: true };
      },
    };

    app.AppState.isLoggedIn = true;
    app.AppState.currentCampagnaId = null;
    app.AppState.currentSessioneId = null;
    app.getSupabaseClient = () => ({
      channel: () => {
        channelLookups += 1;
        return channel;
      },
      async removeChannel() {
        removals += 1;
        subscribed = false;
        operations.push('remove');
        updateStatus('CLOSED');
      },
    });
    window.addEventListener('companion:data-changed', (event) => {
      const change = (event as CustomEvent<Record<string, any>>).detail;
      receivedChanges.push(`${change.table}:${change.action}:${change.sessioneId ?? ''}:${change.requestId ?? ''}`);
    });

    await app.sendAppEventBroadcast({ table: 'utenti', action: 'update', userId: 'u1' });
    app.startAppEventsRealtime();
    updateStatus!('CHANNEL_ERROR');
    app.startAppEventsRealtime();
    updateStatus!('SUBSCRIBED');
    receiveBroadcast!({ payload: {
      table: 'combattimento',
      action: 'update',
      eventId: 'remote-combat-1',
      sourceClientId: 'other-client',
      sessioneId: 's1',
    } });
    postgresCallbacks['richieste_tiro_iniziativa:UPDATE']({ new: { id: 'r1', sessione_id: 's1' } });
    postgresCallbacks['richieste_tiro_generico:UPDATE']({ new: { id: 'r2', richiesta_id: 'g1', sessione_id: 's1' } });
    await app.stopAppEventsRealtime();
    return { joins, removals, channelLookups, httpSends, operations, receivedChanges };
  });

  expect(result).toEqual({
    joins: 1,
    removals: 1,
    channelLookups: 1,
    httpSends: 1,
    operations: [
      'on:broadcast:app_change',
      'on:postgres_changes:sessioni:INSERT',
      'on:postgres_changes:richieste_tiro_iniziativa:UPDATE',
      'on:postgres_changes:richieste_tiro_generico:UPDATE',
      'subscribe',
      'http:app_change',
      'remove',
    ],
    receivedChanges: [
      'utenti:update::',
      'sessioni:sync::',
      'combattimento:update:s1:',
      'richieste_tiro_iniziativa:update:s1:r1',
      'richieste_tiro_generico:update:s1:g1',
    ],
  });
});
