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

test('starting app realtime twice reuses the active channel', async ({ page }) => {
  await page.goto('/campagne');
  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 8000 });

  const result = await page.evaluate(async () => {
    const app = window as typeof window & Record<string, any>;
    let joins = 0;
    let removals = 0;
    let updateStatus: (status: string) => Promise<void>;
    const channel = {
      on() { return this; },
      subscribe(callback: (status: string) => Promise<void>) {
        joins += 1;
        updateStatus = callback;
        return this;
      },
    };

    app.AppState.isLoggedIn = true;
    app.getSupabaseClient = () => ({
      channel: () => channel,
      async removeChannel() { removals += 1; },
    });

    app.startAppEventsRealtime();
    app.startAppEventsRealtime();
    await updateStatus!('CHANNEL_ERROR');
    app.startAppEventsRealtime();
    await app.stopAppEventsRealtime();
    return { joins, removals };
  });

  expect(result).toEqual({ joins: 2, removals: 2 });
});
