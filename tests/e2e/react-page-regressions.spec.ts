import { expect, test } from '@playwright/test';

test('React routing leaves the legacy compendium and laboratory views intact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/compendio');
  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'compendio');
  await expect(page.locator('#compendioPage')).toHaveClass(/active/);
  await expect(page.locator('#compendioHub')).toBeVisible();
  await expect(page.locator('#compendioHub .page-header h1')).toHaveText('Compendio');
  await expect(page.locator('#compendioHub img')).toHaveCount(8);
  await expect.poll(() => page.locator('#compendioHub img').evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).naturalWidth > 0)
  )).toBe(true);
  await page.locator('#compendioHub .comp-hub-card').first().click();
  await expect(page.locator('#compendioSubPage')).toBeVisible();
  await expect(page.locator('#compendioContent')).not.toBeEmpty();

  await page.goto('/laboratorio');
  await page.evaluate(async () => {
    await window.ensureRuntimeScript?.('laboratorio');
    window.labBackToHub?.();
  });
  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'laboratorio');
  await expect(page.locator('#laboratorioPage')).toHaveClass(/active/);
  await expect(page.locator('#labHub')).toBeVisible();
  await expect(page.locator('#labHub .page-header h1')).toHaveText('Laboratorio');
  await expect(page.locator('#labHub img')).toHaveCount(8);
  await expect.poll(() => page.locator('#labHub img').evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).naturalWidth > 0)
  )).toBe(true);
});

test('React never hides or replaces the legacy page DOM', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/campagne');

  await expect(page.locator('#campagnePage')).toBeVisible();
  await expect(page.locator('#react-root')).toBeEmpty();
  await expect(page.locator('.react-page-shell')).toHaveCount(0);

  await page.locator('.toolbar-btn[data-page="personaggi"]').click();
  await expect(page.locator('#personaggiPage')).toHaveClass(/active/);
  await expect(page.locator('#personaggiPage')).toBeVisible();
  await expect(page.locator('#react-root')).toBeEmpty();
});
