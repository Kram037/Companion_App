import { expect, test } from '@playwright/test';

test('recreates the Supabase client from the shared legacy getter', async ({ page }) => {
  await page.goto('/');

  await expect.poll(() => page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      supabaseCreateClient?: unknown;
    };
    return typeof app.getSupabaseClient === 'function' && typeof app.supabaseCreateClient === 'function';
  })).toBe(true);

  const restored = await page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
    };
    delete app.supabaseClient;
    return Boolean(app.getSupabaseClient?.());
  });

  expect(restored).toBe(true);
});
