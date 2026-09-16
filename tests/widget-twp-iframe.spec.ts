import { test, expect, type Page } from '@playwright/test';

/**
 * Pagina host: `src/assets/twp/index.html` carica `launch.js` e crea `#tiledeskiframe`
 * (vedi `src/launch.js`). L’app Angular gira nel frame; `tiledesk_open=true` viene letto
 * dal parent via `GlobalSettingsService` (`tiledesk_open` → `globals.isOpen`).
 */
const PROJECT_ID = '65c5f17ab4e95a0013a0181a';
const TWP_QUERY =
  `tiledesk_projectid=${PROJECT_ID}&tiledesk_isLogEnabled=true&tiledesk_open=true`;
const CLOSED_WIDGET_QUERY =
  `tiledesk_projectid=${PROJECT_ID}&tiledesk_isLogEnabled=true&tiledesk_preChatForm=false`;

function widgetFrame(page: Page) {
  return page.frameLocator('#tiledeskiframe');
}

function department(id: string, name: string, isDefault = false) {
  return { _id: id, id, name, default: isDefault };
}

/**
 * Il widget legge i reparti da GET /api/{projectId}/widgets, poi rimuove quello `default`.
 * - 1 solo dipartimento (il default) → lista vuota dopo il filtro → conversazione
 * - default + 2+ visibili → `departments.length > 1` → selezione reparto
 */
async function stubWidgetDepartments(
  page: Page,
  departments: Array<{ _id: string; id: string; name: string; default: boolean }>,
) {
  await page.route('**/api/**/widgets', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const json = await response.json();
    json.departments = departments;
    if (json.project?.widget) {
      json.project.widget.preChatForm = false;
    }
    await route.fulfill({ response, json });
  });
}

async function clickLauncherThenNewConversation(page: Page) {
  await page.goto(`/assets/twp/index.html?${CLOSED_WIDGET_QUERY}`);
  await expect(page.locator('#tiledeskiframe')).toBeAttached({ timeout: 120_000 });
  const w = widgetFrame(page);
  const launcher = w.locator('#c21-launcher-button');
  await expect(launcher).toBeVisible({ timeout: 120_000 });
  await launcher.click();
  await expect(w.locator('#chat21-home-component')).toBeVisible({ timeout: 30_000 });
  const newConversation = w.locator('#c21-app-list-conversations button.c21-button-primary').first();
  await expect(newConversation).toBeVisible({ timeout: 30_000 });
  await newConversation.click();
  return w;
}

test.describe('Widget TWP (host + iframe)', () => {
  test.beforeEach(({ page }) => {
    page.setDefaultNavigationTimeout(120_000);
  });

  test('click sul launcher apre il pannello del widget', async ({ page }) => {
    // Senza tiledesk_open=true il balloon resta chiuso: si testa il click reale sul launcher.
    await page.goto(
      `/assets/twp/index.html?tiledesk_projectid=65c5f17ab4e95a0013a0181a&tiledesk_isLogEnabled=true`,
    );
    await expect(page.locator('#tiledeskiframe')).toBeAttached({ timeout: 120_000 });

    const host = page.locator('#tiledesk-container');
    await expect(host).toHaveClass(/closed/, { timeout: 120_000 });

    const w = widgetFrame(page);
    const launcher = w.locator('#c21-launcher-button');
    await expect(launcher).toBeVisible({ timeout: 120_000 });
    await launcher.click();

    await expect(host).toHaveClass(/open/, { timeout: 30_000 });
    await expect(host).not.toHaveClass(/closed/);
    await expect(
      w.locator('#chat21-conversations, #chat21-home-component').first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('1 dipartimento: New conversation apre chat-conversation', async ({ page }) => {
    await stubWidgetDepartments(page, [department('dep-only', 'Support', true)]);
    const w = await clickLauncherThenNewConversation(page);

    // L'host Angular `chat-conversation` può risultare hidden (custom element inline);
    // il root visibile è #chat21-conversation-component (conversation.component.html).
    await expect(w.locator('#chat21-conversation-component')).toBeVisible({ timeout: 30_000 });
    await expect(w.locator('#chat21-selection-department')).toHaveCount(0);
  });

  test('più dipartimenti: New conversation apre chat-selection-department', async ({ page }) => {
    await stubWidgetDepartments(page, [
      department('dep-default', 'Default', true),
      department('dep-sales', 'Sales'),
      department('dep-billing', 'Billing'),
    ]);
    const w = await clickLauncherThenNewConversation(page);

    await expect(w.locator('#chat21-selection-department')).toBeVisible({ timeout: 30_000 });
    await expect(w.locator('#chat21-selection-department')).toHaveAttribute('role', 'dialog');
    await expect(w.locator('#chat21-selection-department .c21-button-department')).toHaveCount(2);
    await expect(w.locator('#chat21-conversation-component')).toHaveCount(0);
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
