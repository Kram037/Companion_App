import { expect, test } from '@playwright/test';

test('React routing leaves the legacy compendium and laboratory views intact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/index.html');
  await expect(page).toHaveURL(/\/campagne$/);
  await page.locator('.toolbar-btn[data-page="compendio"]').click();
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

test('React leaves unmigrated legacy page DOM intact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/personaggi');

  await expect(page.locator('#personaggiPage')).toBeVisible();
  await expect(page.locator('#react-root')).toBeEmpty();
  await expect(page.locator('.react-page-shell')).toHaveCount(0);

  await page.locator('.toolbar-btn[data-page="laboratorio"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'laboratorio');
  await expect(page.locator('#laboratorioPage')).toHaveClass(/active/);
  await expect(page.locator('#react-root')).toBeEmpty();
});

test('React owns migrated campaign and friends routes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/campagne');

  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'campagne');
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'campagne');
  await expect(page.locator('#campagnePage')).toBeHidden();
  await expect(page.locator('.react-page-shell')).toBeVisible();
  await expect(page.locator('.react-page-shell .page-header h1')).toHaveText('Campagne');

  await page.locator('.toolbar-btn[data-page="personaggi"]').click();
  await expect(page.locator('body')).not.toHaveAttribute('data-react-owner', /.+/);
  await expect(page.locator('#personaggiPage')).toHaveClass(/active/);
  await expect(page.locator('#personaggiPage')).toBeVisible();
  await expect(page.locator('#react-root')).toBeEmpty();
});

test('React can switch between migrated friends and campaign routes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/amici');

  await expect(page.locator('body')).toHaveAttribute('data-react-page', 'amici');
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'amici');
  await expect(page.locator('#amiciPage')).toBeHidden();
  await expect(page.locator('.react-page-shell')).toBeVisible();
  await expect(page.locator('.react-page-shell .page-header h1')).toHaveText('Amici');
  await expect(page.locator('.react-page-shell .content-placeholder')).toContainText('Accedi per vedere i tuoi amici');

  await page.locator('.toolbar-btn[data-page="campagne"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-react-owner', 'campagne');
  await expect(page.locator('#campagnePage')).toBeHidden();
  await expect(page.locator('.react-page-shell .page-header h1')).toHaveText('Campagne');
});
