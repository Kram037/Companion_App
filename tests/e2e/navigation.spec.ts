import { expect, test } from '@playwright/test';

test('same-route legacy navigation still activates and loads the page', async ({ page }) => {
  await page.goto('/campagne');

  await page.locator('#campagnePage').evaluate(element => element.classList.remove('active'));
  await page.evaluate(async () => {
    await window.navigateToPage?.('campagne');
  });

  await expect(page.locator('#campagnePage')).toHaveClass(/active/);
});

test('legacy session navigation invokes the session renderer', async ({ page }) => {
  await page.goto('/campagne');

  const renderedCampaignId = await page.evaluate(async () => {
    let rendered = '';
    window.renderSessioneContent = async campaignId => {
      rendered = campaignId;
    };
    window.AppState.currentCampagnaId = 'campaign-test';

    await window.navigateToPage?.('sessione', { pushHistory: false });
    return rendered;
  });

  expect(renderedCampaignId).toBe('campaign-test');
});

test('legacy changes notify the React query bridge', async ({ page }) => {
  await page.goto('/campagne');

  const detail = await page.evaluate(() => new Promise(resolve => {
    window.addEventListener('companion:data-changed', event => {
      resolve((event as CustomEvent).detail);
    }, { once: true });
    void window.sendAppEventBroadcast?.({ table: 'campagne', action: 'update' });
  }));

  expect(detail).toEqual({ table: 'campagne', action: 'update' });
});
