import { expect, test } from '@playwright/test';

test('loads the legacy app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Companion App - D&D Helper');
  await expect(page.locator('.header')).toBeVisible();
  await expect(page.locator('#campagnePage')).toHaveClass(/active/);
  await expect(page.locator('#campagnePage .page-header h1')).toHaveText('Campagne');
});

test('navigates through the main mobile toolbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.locator('.toolbar-btn[data-page="personaggi"]').click();
  await expect(page.locator('#personaggiPage')).toHaveClass(/active/);

  await page.locator('.toolbar-btn[data-page="laboratorio"]').click();
  await expect(page.locator('#laboratorioPage')).toHaveClass(/active/);
  await expect(page.locator('#labHub .page-header h1')).toHaveText('Laboratorio');

  await page.locator('.toolbar-btn[data-page="compendio"]').click();
  await expect(page.locator('#compendioPage')).toHaveClass(/active/);
  await expect(page.locator('#compendioHub .page-header h1')).toHaveText('Compendio');
});

test('opens the native PWA prompt from the install button', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const app = window as typeof window & { __installPrompted?: boolean };
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' }>;
    };
    event.prompt = async () => { app.__installPrompted = true; };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });

  await page.locator('#settingsBtn').click();
  await page.locator('#installPwaBtn').click();
  await expect.poll(() => page.evaluate(() => Boolean((window as typeof window & { __installPrompted?: boolean }).__installPrompted))).toBe(true);
});

test('manifest does not lock tablet orientation', async ({ request }) => {
  const pageResponse = await request.get('/');
  const html = await pageResponse.text();
  const manifestHref = html.match(/<link rel="manifest" href="([^"]+)"/)?.[1] ?? '';
  expect(manifestHref).toContain('manifest.json');

  const response = await request.get(manifestHref);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).not.toHaveProperty('orientation');
});
