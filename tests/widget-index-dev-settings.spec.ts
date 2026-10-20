import { test, expect } from '@playwright/test';

/**
 * Pagina dev: campi testo + pulsante "Test this setting" chiamano onClick* e scrivono su window.tiledeskSettings.
 * Verifica che i valori fake restino coerenti con quanto impostato nel codice inline della pagina.
 */
test.describe('index-dev.html tiledeskSettings da input', () => {
  test.beforeEach(({ page }) => {
    page.setDefaultNavigationTimeout(120_000);
  });

  test('marginX / marginY / welcomeTitle aggiornano window.tiledeskSettings', async ({ page }) => {
    await page.goto(
      'http://127.0.0.1:4203/assets/twp/index-dev.html?tiledesk_projectid=65c5f17ab4e95a0013a0181a&tiledesk_isLogEnabled=true',
    );
    const out = await page.evaluate(() => {
      const mx = document.querySelector('#marginX') as HTMLInputElement;
      const my = document.querySelector('#marginY') as HTMLInputElement;
      const wt = document.querySelector('#welcomeTitle') as HTMLInputElement;
      mx.value = '11px';
      my.value = '22px';
      wt.value = 'Titolo fake';
      (window as any).onClickMarginX();
      (window as any).onClickMarginY();
      (window as any).onClickWelcomeTitle();
      const s = (window as any).tiledeskSettings;
      return { marginX: s.marginX, marginY: s.marginY, welcomeTitle: s.welcomeTitle };
    });
    expect(out.marginX).toBe('11px');
    expect(out.marginY).toBe('22px');
    expect(out.welcomeTitle).toBe('Titolo fake');
  });

  test('calloutTitle / widgetTitle / departmentID aggiornano tiledeskSettings', async ({ page }) => {
    await page.goto(
      'http://127.0.0.1:4203/assets/twp/index-dev.html?tiledesk_projectid=65c5f17ab4e95a0013a0181a&tiledesk_isLogEnabled=true',
    );
    const out = await page.evaluate(() => {
      (document.querySelector('#calloutTitle') as HTMLInputElement).value = 'Callout FAKE';
      (document.querySelector('#widgetTitle') as HTMLInputElement).value = 'Widget FAKE';
      (document.querySelector('#departmentID') as HTMLInputElement).value = 'dep-xyz';
      (window as any).onClickCalloutTitle();
      (window as any).onClickWidgetTitle();
      (window as any).onClickDepartmentId();
      const s = (window as any).tiledeskSettings;
      return { calloutTitle: s.calloutTitle, widgetTitle: s.widgetTitle, departmentID: s.departmentID };
    });
    expect(out.calloutTitle).toBe('Callout FAKE');
    expect(out.widgetTitle).toBe('Widget FAKE');
    expect(out.departmentID).toBe('dep-xyz');
  });
});
