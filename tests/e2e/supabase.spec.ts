import { expect, test } from '@playwright/test';

test('exposes the bundled Supabase singleton through the legacy getter', async ({ page }) => {
  await page.goto('/');

  await expect.poll(() => page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
    };
    return typeof app.getSupabaseClient === 'function' && Boolean(app.supabaseClient);
  })).toBe(true);

  const state = await page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
      supabaseCreateClient?: unknown;
    };
    return {
      sameInstance: app.getSupabaseClient?.() === app.supabaseClient,
      hasLegacyFactory: typeof app.supabaseCreateClient === 'function',
    };
  });

  expect(state).toEqual({ sameInstance: true, hasLegacyFactory: false });
});
