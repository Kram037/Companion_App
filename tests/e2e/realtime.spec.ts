import { expect, test } from '@playwright/test';

test('legacy realtime refresh waits while a modal input is active', async ({ page }) => {
  await page.goto('/campagne');
  await page.locator('#userBtn').click();
  const modal = page.locator('#loginModal');
  const email = page.locator('#email');
  await expect(modal).toHaveClass(/active/);
  await email.fill('input-in-corso@example.test');

  await page.evaluate(() => {
    const app = window as typeof window & {
      AppState: { isLoggedIn: boolean; currentPage: string; currentUser: { uid: string } };
      loadCampagne: () => Promise<void>;
      requestLegacyRealtimeRefresh?: () => void;
      __legacyRefreshCalls?: number;
    };
    app.AppState.isLoggedIn = true;
    app.AppState.currentPage = 'campagne';
    app.AppState.currentUser = { uid: 'e2e-user' };
    app.__legacyRefreshCalls = 0;
    app.loadCampagne = async () => { app.__legacyRefreshCalls = (app.__legacyRefreshCalls || 0) + 1; };
    app.requestLegacyRealtimeRefresh?.();
  });

  await page.waitForTimeout(1_200);
  expect(await page.evaluate(() => (window as typeof window & { __legacyRefreshCalls?: number }).__legacyRefreshCalls)).toBe(0);
  await expect(modal).toHaveClass(/active/);
  await expect(email).toHaveValue('input-in-corso@example.test');
  await expect(email).toBeFocused();

  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    document.getElementById('loginModal')?.classList.remove('active');
  });
  await expect.poll(() => page.evaluate(
    () => (window as typeof window & { __legacyRefreshCalls?: number }).__legacyRefreshCalls,
  )).toBe(1);
});
