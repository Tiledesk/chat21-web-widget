import { test, expect, type Page } from '@playwright/test';

const BASE_QUERY =
  'tiledesk_projectid=65c5f17ab4e95a0013a0181a&tiledesk_isLogEnabled=true&tiledesk_open=true';

function widgetFrame(page: Page) {
  return page.frameLocator('#tiledeskiframe');
}

test.describe('Widget TWP — form / testi / allegati / reparti', () => {
  test.beforeEach(({ page }) => {
    page.setDefaultNavigationTimeout(120_000);
  });

  test('dopo nuova conversazione compare conversazione, prechat o selezione reparto', async ({ page }) => {
    await page.goto(`/assets/twp/index.html?${BASE_QUERY}`);
    await expect(page.locator('#tiledeskiframe')).toBeAttached({ timeout: 120_000 });
    const w = widgetFrame(page);
    await w.locator('#c21-app-list-conversations .c21-button-primary').first().click({ timeout: 120_000 });
    await expect(
      w.locator('chat-conversation, chat-selection-department, chat-prechat-form').first(),
    ).toBeVisible({ timeout: 120_000 });
  });

  test('se compare la modale reparti, elenco pulsanti e click impostano flusso', async ({ page }) => {
    await page.goto(`/assets/twp/index.html?${BASE_QUERY}`);
    const w = widgetFrame(page);
    await w.locator('#c21-app-list-conversations .c21-button-primary').first().click({ timeout: 120_000 });
    const panel = w.locator('#chat21-selection-department');
    try {
      await panel.waitFor({ state: 'visible', timeout: 25_000 });
    } catch {
      test.skip();
    }
    await expect(panel).toHaveAttribute('role', 'dialog');
    const deptButtons = panel.locator('.c21-button-department');
    await expect(deptButtons.first()).toBeVisible();
    const count = await deptButtons.count();
    expect(count).toBeGreaterThan(0);
    await deptButtons.first().click();
    await expect(w.locator('chat-conversation').first()).toBeAttached({ timeout: 120_000 });
  });

  test('con prechat attivato da URL può comparire textarea o form (best-effort)', async ({ page }) => {
    await page.goto(`/assets/twp/index.html?${BASE_QUERY}&tiledesk_preChatForm=true`);
    const w = widgetFrame(page);
    await w.locator('#c21-app-list-conversations .c21-button-primary').first().click({ timeout: 120_000 });
    const prechat = w.locator('chat-prechat-form');
    const textarea = w.locator('textarea#c21-prechat-notes, textarea.form-control, chat-form-textarea textarea');
    await expect(prechat.or(textarea.first())).toBeVisible({ timeout: 120_000 });
  });

  test('messaggio in conversazione: area testo o bubble visibile nel frame', async ({ page }) => {
    await page.goto(`/assets/twp/index.html?${BASE_QUERY}`);
    const w = widgetFrame(page);
    await w.locator('#c21-app-list-conversations .c21-button-primary').first().click({ timeout: 120_000 });
    await expect(
      w.locator('chat-conversation, chat-prechat-form, chat-selection-department').first(),
    ).toBeVisible({ timeout: 120_000 });
    const conv = w.locator('chat-conversation');
    if (await conv.isVisible().catch(() => false)) {
      await expect(
        conv.locator('.message_innerhtml, chat-text, textarea, [contenteditable]').first(),
      ).toBeVisible({ timeout: 60_000 });
    }
  });
});
