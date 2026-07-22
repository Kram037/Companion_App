import { expect, test } from '@playwright/test';

test('exposes the bundled Supabase singleton through the legacy getter', async ({ page }) => {
  await page.goto('/');

  await expect.poll(() => page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      initializeSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
    };
    return typeof app.getSupabaseClient === 'function'
      && typeof app.initializeSupabaseClient === 'function'
      && Boolean(app.supabaseClient);
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

test('legacy getter can recover the bundled Supabase singleton', async ({ page }) => {
  await page.goto('/');

  await expect.poll(() => page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      initializeSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
    };
    return typeof app.getSupabaseClient === 'function'
      && typeof app.initializeSupabaseClient === 'function';
  })).toBe(true);

  const recovered = await page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
    };
    delete app.supabaseClient;
    return Boolean(app.getSupabaseClient?.()) && Boolean(app.supabaseClient);
  });

  expect(recovered).toBe(true);
});

test('legacy Supabase wait resolves when the bundled client becomes ready later', async ({ page }) => {
  await page.goto('/');

  const resolved = await page.evaluate(async () => {
    const app = window as typeof window & {
      initializeSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
      waitForSupabase?: () => Promise<unknown>;
    };
    const realInit = app.initializeSupabaseClient;
    const realClient = app.supabaseClient;
    delete app.supabaseClient;
    delete app.initializeSupabaseClient;

    const wait = app.waitForSupabase?.();
    window.setTimeout(() => {
      app.initializeSupabaseClient = () => {
        app.supabaseClient = { auth: {} };
        return app.supabaseClient;
      };
      window.dispatchEvent(new Event('companion:supabase-ready'));
    }, 50);

    const result = Boolean(await wait);
    app.initializeSupabaseClient = realInit;
    app.supabaseClient = realClient;
    return result;
  });

  expect(resolved).toBe(true);
});

test('legacy Supabase still boots if React chunks fail', async ({ page }) => {
  await page.route(/\/assets\/(?!index-[^/]+\.js$)[^/]+\.js$/, route => route.abort());
  await page.goto('/');

  await expect.poll(() => page.evaluate(() => {
    const app = window as typeof window & {
      getSupabaseClient?: () => unknown;
      initializeSupabaseClient?: () => unknown;
      supabaseClient?: unknown;
    };
    return typeof app.getSupabaseClient === 'function'
      && typeof app.initializeSupabaseClient === 'function'
      && Boolean(app.supabaseClient);
  })).toBe(true);
});

test('missing Supabase configuration does not block startup or login feedback', async ({ page }) => {
  await page.route(/\/js\/Core\/config\.js/, route => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.CompanionConfig = Object.freeze({});',
  }));
  await page.goto('/');

  await expect(page.locator('#appStartup')).toBeHidden({ timeout: 3_000 });
  await page.locator('#userBtn').click();
  await page.locator('#email').fill('test@example.com');
  await page.locator('#password').fill('not-a-real-password');
  await page.locator('#submitBtn').click();

  await expect(page.locator('#errorMessage')).toHaveText(
    'Autenticazione non disponibile. Ricarica la pagina.',
    { timeout: 3_000 },
  );
});
