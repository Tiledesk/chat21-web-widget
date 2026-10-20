import { test, expect, type Page } from '@playwright/test';

/**
 * Pagina host: `src/assets/twp/index.html` carica `launch.js` e crea `#tiledeskiframe`
 * (vedi `src/launch.js`). L’app Angular gira nel frame; `tiledesk_open=true` viene letto
 * dal parent via `GlobalSettingsService` (`tiledesk_open` → `globals.isOpen`).
 */
const TWP_QUERY =
  'tiledesk_projectid=65c5f17ab4e95a0013a0181a&tiledesk_isLogEnabled=true&tiledesk_open=true';

function widgetFrame(page: Page) {
  return page.frameLocator('#tiledeskiframe');
}

test.describe('Widget TWP (host + iframe)', () => {
  test.beforeEach(({ page }) => {
    page.setDefaultNavigationTimeout(120_000);
  });

  test('mostra home e lista conversazioni nel frame con widget già aperto', async ({ page }) => {
    await page.goto(`/assets/twp/index.html?${TWP_QUERY}`);
    await expect(page.locator('#tiledeskiframe')).toBeAttached({ timeout: 120_000 });
    const w = widgetFrame(page);
    await expect(w.locator('#chat21-home-component')).toBeVisible({ timeout: 120_000 });
    await expect(w.locator('#c21-app-list-conversations')).toBeVisible();
  });

  test('click su CTA primaria apre conversazione, reparto o prechat', async ({ page }) => {
    await page.goto(`/assets/twp/index.html?${TWP_QUERY}`);
    await expect(page.locator('#tiledeskiframe')).toBeAttached({ timeout: 120_000 });
    const w = widgetFrame(page);
    const primary = w.locator('#c21-app-list-conversations .c21-button-primary').first();
    await expect(primary).toBeVisible({ timeout: 120_000 });
    await primary.click();
    await expect(
      w.locator('chat-conversation, chat-selection-department, chat-prechat-form').first(),
    ).toBeVisible({ timeout: 120_000 });
  });
});
