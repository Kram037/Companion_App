import { expect, test } from '@playwright/test';

test('compendium and laboratory React hubs render their navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/compendio');
  const compendiumHub = page.locator('.react-compendium-hub');
  await expect(compendiumHub).toBeVisible();
  await expect(compendiumHub.locator('.page-header h1')).toHaveText('Compendio');
  await expect(compendiumHub.locator('.comp-hub-card')).toHaveCount(8);

  await compendiumHub.getByRole('button', { name: 'Razze' }).click();
  await expect(page.locator('.react-compendium-page .page-header h1')).toHaveText('Razze');
  await expect(page.locator('.react-compendium-content .comp-card').first()).toBeVisible();

  await page.goto('/laboratorio');
  const laboratoryHub = page.locator('.react-laboratory-hub');
  await expect(laboratoryHub).toBeVisible();
  await expect(laboratoryHub.locator('.page-header h1')).toHaveText('Laboratorio');
  await expect(laboratoryHub.locator('.lab-hub-card')).toHaveCount(8);

  await laboratoryHub.getByRole('button', { name: 'Razze' }).click();
  await expect(page.locator('.react-laboratory-page .page-header h1')).toHaveText('Razze');
  await expect(page.locator('.react-laboratory-content')).toBeVisible();
});

test('React campaign and character actions keep the card theme visible', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/campagne');

  const styles = await page.evaluate(() => {
    const campaignCard = document.createElement('article');
    campaignCard.className = 'campagna-card';
    const campaignAction = document.createElement('button');
    campaignAction.className = 'react-campaign-main';
    campaignCard.appendChild(campaignAction);

    const characterCard = document.createElement('article');
    characterCard.className = 'pg-card';
    const characterAction = document.createElement('button');
    characterAction.className = 'react-character-main';
    characterCard.appendChild(characterAction);

    document.body.append(campaignCard, characterCard);
    return {
      campaignBackground: getComputedStyle(campaignAction).backgroundColor,
      campaignDisplay: getComputedStyle(campaignAction).display,
      characterBackground: getComputedStyle(characterAction).backgroundColor,
      characterWidth: getComputedStyle(characterAction).width,
      cardBackground: getComputedStyle(campaignCard).backgroundImage,
    };
  });

  expect(styles.campaignBackground).toBe('rgba(0, 0, 0, 0)');
  expect(styles.campaignDisplay).toBe('grid');
  expect(styles.characterBackground).toBe('rgba(0, 0, 0, 0)');
  expect(styles.characterWidth).not.toBe('auto');
  expect(styles.cardBackground).not.toBe('none');
});
