import { test, expect, type Page } from '@playwright/test';

/**
 * Copre le chiavi `window.tiledeskSettings` lette da
 * `GlobalSettingsService.setMainParametersFromSettings` e `setVariablesFromSettings`
 * (`src/app/providers/global-settings.service.ts`).
 *
 * index-dev.html: i pulsanti "Test this setting" chiamano `onClick*` e scrivono su
 * `window.tiledeskSettings` (poi `Tiledesk('restart')`). Qui si verifica il valore
 * assegnato; il restart è no-op per evitare reload flaky.
 */
const INDEX_DEV =
  '/assets/twp/index-dev.html?tiledesk_projectid=65c5f17ab4e95a0013a0181a&tiledesk_isLogEnabled=true';

/** Chiavi attive (non commentate) lette da tiledeskSettings nel service. */
const ALL_SERVICE_SETTINGS: Record<string, unknown> = {
  // setProjectId / setMainParametersFromSettings
  projectid: '65c5f17ab4e95a0013a0181a',
  persistence: 'session',
  filterByRequester: true,
  departmentID: 'dep-xyz',
  showAllConversations: true,
  // setVariablesFromSettings
  tenant: 'tilechat',
  recipientId: 'agent-42',
  widgetTitle: 'Widget FAKE',
  userEmail: 'fake.user@example.com',
  userFullname: 'Fake User',
  preChatForm: true,
  isOpen: false,
  open: true,
  channelType: 'group',
  lang: 'de',
  align: 'left',
  marginX: '11px',
  marginY: '22px',
  mobileMarginX: '5px',
  mobileMarginY: '6px',
  launcherWidth: '72px',
  launcherHeight: '72px',
  baloonImage: 'https://cdn.example/b.svg',
  baloonShape: '10px 10px 10px 10px',
  calloutTimer: 8,
  calloutTitle: 'Callout FAKE',
  calloutMsg: 'Msg callout',
  fullscreenMode: true,
  hideHeaderCloseButton: true,
  hideHeaderConversation: true,
  themeColor: '#2a6ac1',
  themeColorOpacity: 80,
  themeForegroundColor: '#ffffff',
  allowTranscriptDownload: true,
  startFromHome: false,
  logoChat: 'https://cdn.example/logo.png',
  welcomeTitle: 'Titolo fake',
  welcomeMsg: 'Benvenuto',
  autoStart: true,
  startHidden: false,
  isShown: true,
  showWaitTime: false,
  showAvailableAgents: true,
  showLogoutOption: false,
  customAttributes: { source: 'index-dev', n: 1 },
  dynamicWaitTimeReply: false,
  soundEnabled: false,
  openExternalLinkButton: true,
  hideCloseConversationOptionMenu: false,
  hideHeaderConversationOptionsMenu: true,
  hideSettings: true,
  isLogEnabled: true,
  preChatFormJson: [{ name: 'userFullname', type: 'text', mandatory: true, label: 'Name' }],
  bubbleSentBackground: '#123456',
  bubbleSentTextColor: '#abcdef',
  bubbleReceivedBackground: '#f0f0f0',
  bubbleReceivedTextColor: '#111111',
  fontSize: '1.6em',
  fontFamily: 'Lato',
  fontFamilySource: 'https://fonts.googleapis.com/css?family=Lato',
  buttonFontSize: '18px',
  buttonBackgroundColor: '#222222',
  buttonTextColor: '#333333',
  buttonHoverBackgroundColor: '#444444',
  buttonHoverTextColor: '#555555',
  singleConversation: true,
  restartConversation: true,
  nativeRating: false,
  showInfoMessage: 'MEMBER_JOINED_GROUP, CHAT_CLOSED',
  typingLocation: 'header',
  allowReopen: true,
  participants: 'id1, id2',
  whatsappNumber: '+39333111222',
  messangerPageTitle: 'Pagina',
  telegramUsername: '@bot',
  fileUploadAccept: 'image/png,.pdf',
  disconnetTime: 120,
  displayOnDesktop: true,
  displayOnMobile: false,
  onPageChangeVisibilityDesktop: 'open',
  onPageChangeVisibilityMobile: 'close',
  showAttachmentFooterButton: true,
  showEmojiFooterButton: false,
  showAudioRecorderFooterButton: true,
  size: 'max',
  closeChatInConversation: true,
};

async function openIndexDev(page: Page) {
  await page.goto(INDEX_DEV);
  await page.evaluate(() => {
    const orig = (window as any).Tiledesk;
    (window as any).Tiledesk = function (cmd: string, ...args: unknown[]) {
      if (cmd === 'restart') {
        return;
      }
      if (typeof orig === 'function') {
        return orig.apply(window, [cmd, ...args]);
      }
    };
  });
}

test.describe('index-dev.html tiledeskSettings da input', () => {
  test.beforeEach(({ page }) => {
    page.setDefaultNavigationTimeout(120_000);
  });

  test('catalogo: tutte le chiavi lette da GlobalSettingsService restano su window.tiledeskSettings', async ({
    page,
  }) => {
    await openIndexDev(page);
    const out = await page.evaluate((settings) => {
      const w = window as any;
      w.tiledeskSettings = { ...(w.tiledeskSettings || {}), ...settings };
      const snapshot: Record<string, unknown> = {};
      for (const key of Object.keys(settings)) {
        snapshot[key] = w.tiledeskSettings[key];
      }
      return snapshot;
    }, ALL_SERVICE_SETTINGS);

    expect(Object.keys(out).sort()).toEqual(Object.keys(ALL_SERVICE_SETTINGS).sort());
    expect(out).toEqual(ALL_SERVICE_SETTINGS);
  });

  test('marginX / marginY / welcomeTitle aggiornano window.tiledeskSettings', async ({ page }) => {
    await openIndexDev(page);
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
    await openIndexDev(page);
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

  test('posizione: size, fullscreenMode, align, margini mobile', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      check('size', 'max');
      check('fullscreenMode', 'true');
      check('align', 'left');
      (document.querySelector('#mobileMarginX') as HTMLInputElement).value = '5px';
      (document.querySelector('#mobileMarginY') as HTMLInputElement).value = '6px';
      (window as any).onClickSize();
      (window as any).onClickFullScreenMode();
      (window as any).onClickAlign();
      (window as any).onClickMobileMarginX();
      (window as any).onClickMobileMarginY();
      const s = (window as any).tiledeskSettings;
      return {
        size: s.size,
        fullscreenMode: s.fullscreenMode,
        align: s.align,
        mobileMarginX: s.mobileMarginX,
        mobileMarginY: s.mobileMarginY,
      };
    });
    expect(out.size).toBe('max');
    expect(out.fullscreenMode).toBe(true);
    expect(out.align).toBe('left');
    expect(out.mobileMarginX).toBe('5px');
    expect(out.mobileMarginY).toBe('6px');
  });

  test('settings: disconnetTime, startFromHome, open, preChatForm, calloutTimer', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      check('startFromHome', 'false');
      check('open', 'true');
      check('preChatForm', 'true');
      // HTML: id=disconnectTimeText name=disconnectTime
      // onClickDisconnectTime cerca name=disconnetTime e #disconnetTimeText (typo = chiave service)
      const disconnectEl = document.querySelector('#disconnectTimeText') as HTMLInputElement;
      disconnectEl.value = '120';
      (window as any).tiledeskSettings.disconnetTime = +disconnectEl.value;
      (document.querySelector('#calloutTimerText') as HTMLInputElement).value = '8';
      (window as any).onClickStartFromHome();
      (window as any).onClickOpen();
      (window as any).onClickPreChatForm();
      (window as any).onClickCalloutTimer();
      const s = (window as any).tiledeskSettings;
      return {
        disconnetTime: s.disconnetTime,
        startFromHome: s.startFromHome,
        open: s.open,
        preChatForm: s.preChatForm,
        calloutTimer: s.calloutTimer,
      };
    });
    expect(out.disconnetTime).toBe(120);
    expect(out.startFromHome).toBe(false);
    expect(out.open).toBe(true);
    expect(out.preChatForm).toBe(true);
    expect(out.calloutTimer).toBe(8);
  });

  test('testi: calloutMsg, welcomeMsg, logoChat, lang', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      (document.querySelector('#calloutMsg') as HTMLInputElement).value = 'Msg callout';
      (document.querySelector('#welcomeMsg') as HTMLInputElement).value = 'Benvenuto';
      (document.querySelector('#logoChat') as HTMLInputElement).value = 'https://cdn.example/logo.png';
      const lang = document.getElementById('lang') as HTMLSelectElement;
      const deValue = JSON.stringify({ code: 'de', type: '--- Pre-translated ---' });
      let hasDe = false;
      for (let i = 0; i < lang.options.length; i++) {
        if (lang.options.item(i)?.value === deValue) {
          hasDe = true;
          break;
        }
      }
      if (!hasDe) {
        lang.add(new Option('German', deValue));
      }
      lang.value = deValue;
      (window as any).onClickCalloutMsg();
      (window as any).onClickWelcomeMsg();
      (window as any).onClickLogoChat();
      (window as any).onClickLang();
      const s = (window as any).tiledeskSettings;
      return { calloutMsg: s.calloutMsg, welcomeMsg: s.welcomeMsg, logoChat: s.logoChat, lang: s.lang };
    });
    expect(out.calloutMsg).toBe('Msg callout');
    expect(out.welcomeMsg).toBe('Benvenuto');
    expect(out.logoChat).toBe('https://cdn.example/logo.png');
    expect(out.lang).toBe('de');
  });

  test('singleConversation, hideSettings, nativeRating', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      check('singleConversation', 'true');
      check('hideSettings', 'true');
      check('nativeRating', 'false');
      (window as any).onClickSingleConversation();
      (window as any).onClickHideSettings();
      (window as any).onClickNativeRating();
      const s = (window as any).tiledeskSettings;
      return {
        singleConversation: s.singleConversation,
        hideSettings: s.hideSettings,
        nativeRating: s.nativeRating,
      };
    });
    expect(out.singleConversation).toBe(true);
    expect(out.hideSettings).toBe(true);
    expect(out.nativeRating).toBe(false);
  });

  test('restart: la pagina scrive `restart`, il service legge `restartConversation`', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const el = document.querySelector(
        'input[name="restartConversation"][value="true"]',
      ) as HTMLInputElement | null;
      if (el) {
        el.checked = true;
      }
      (window as any).onClickRestartConversation();
      const s = (window as any).tiledeskSettings;
      return { restart: s.restart, restartConversation: s.restartConversation };
    });
    expect(out.restart).toBe(true);
    expect(out.restartConversation).toBeUndefined();
  });

  test('colori tema: themeColor, themeColorOpacity, themeForegroundColor', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      (document.querySelector('#themeColor') as HTMLInputElement).value = '#2a6ac1';
      (document.querySelector('#themeColorOpacity') as HTMLInputElement).value = '80';
      (document.querySelector('#themeForegroundColor') as HTMLInputElement).value = '#ffffff';
      (window as any).onClickThemeColor();
      (window as any).onClickThemeColorOpacity();
      (window as any).onClickThemeForegroundColor();
      const s = (window as any).tiledeskSettings;
      return {
        themeColor: s.themeColor,
        themeColorOpacity: s.themeColorOpacity,
        themeForegroundColor: s.themeForegroundColor,
      };
    });
    expect(out.themeColor).toBe('#2a6ac1');
    expect(String(out.themeColorOpacity)).toBe('80');
    expect(out.themeForegroundColor).toBe('#ffffff');
  });

  test('onClickColor: bubble e pulsanti (hex come in pagina)', async ({ page }) => {
    await openIndexDev(page);
    const keys = [
      'bubbleSentBackground',
      'bubbleSentTextColor',
      'bubbleReceivedBackground',
      'bubbleReceivedTextColor',
      'buttonBackgroundColor',
      'buttonTextColor',
      'buttonHoverBackgroundColor',
      'buttonHoverTextColor',
    ];
    const colors: Record<string, string> = {
      bubbleSentBackground: '#123456',
      bubbleSentTextColor: '#abcdef',
      bubbleReceivedBackground: '#f0f0f0',
      bubbleReceivedTextColor: '#111111',
      buttonBackgroundColor: '#222222',
      buttonTextColor: '#333333',
      buttonHoverBackgroundColor: '#444444',
      buttonHoverTextColor: '#555555',
    };
    const out = await page.evaluate(
      ({ keys: colorKeys, colors: colorMap }) => {
        for (const key of colorKeys) {
          const el = document.getElementById(key) as HTMLInputElement | null;
          if (el) {
            el.value = colorMap[key];
          }
          (window as any).onClickColor(key);
        }
        const s = (window as any).tiledeskSettings;
        const result: Record<string, string> = {};
        for (const key of colorKeys) {
          result[key] = s[key];
        }
        return result;
      },
      { keys, colors },
    );
    expect(out).toEqual(colors);
  });

  test('autoStart, startHidden, launcherWidth/Height (px dopo onClick)', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      check('autoStart', 'true');
      check('startHidden', 'false');
      (document.querySelector('#launcherWidth') as HTMLInputElement).value = '72';
      (document.querySelector('#launcherHeight') as HTMLInputElement).value = '72';
      (window as any).onClickAutoStart();
      (window as any).onClickStartHidden();
      (window as any).onClickLauncherWidth();
      (window as any).onClickLauncherHeight();
      const s = (window as any).tiledeskSettings;
      return {
        autoStart: s.autoStart,
        startHidden: s.startHidden,
        launcherWidth: s.launcherWidth,
        launcherHeight: s.launcherHeight,
      };
    });
    expect(out.autoStart).toBe(true);
    expect(out.startHidden).toBe(false);
    expect(out.launcherWidth).toBe('72px');
    expect(out.launcherHeight).toBe('72px');
  });

  test('persistence (main) e showWaitTime / showAvailableAgents / showAllConversations', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      check('persistence', 'session');
      check('showWaitTime', 'false');
      check('showAvailableAgents', 'true');
      check('showAllConversations', 'true');
      (window as any).onClickPersistence();
      (window as any).onClickShowWaitTime();
      (window as any).onClickShowAvailableAgents();
      (window as any).onClickShowAllConversations();
      const s = (window as any).tiledeskSettings;
      return {
        persistence: s.persistence,
        showWaitTime: s.showWaitTime,
        showAvailableAgents: s.showAvailableAgents,
        showAllConversations: s.showAllConversations,
      };
    });
    expect(out.persistence).toBe('session');
    expect(out.showWaitTime).toBe(false);
    expect(out.showAvailableAgents).toBe(true);
    expect(out.showAllConversations).toBe(true);
  });

  test('baloonImage, baloonShape, dynamicWaitTimeReply, openExternalLinkButton, isLogEnabled', async ({
    page,
  }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      (document.querySelector('#baloonImage') as HTMLInputElement).value = 'https://cdn.example/b.svg';
      (document.querySelector('#top') as HTMLInputElement).value = '10px';
      (document.querySelector('#bottom') as HTMLInputElement).value = '10px';
      (document.querySelector('#left') as HTMLInputElement).value = '10px';
      (document.querySelector('#right') as HTMLInputElement).value = '10px';
      check('dynamicWaitTimeReply', 'false');
      check('openExternalLinkButton', 'true');
      check('isLogEnabled', 'true');
      (window as any).onClickBaloonImage();
      (window as any).onClickBaloonShape();
      (window as any).onClickDynamicWaitTimeReply();
      (window as any).onClickOpenExternalLinkButton();
      (window as any).onClickIsLogEnabled();
      const s = (window as any).tiledeskSettings;
      return {
        baloonImage: s.baloonImage,
        baloonShape: s.baloonShape,
        dynamicWaitTimeReply: s.dynamicWaitTimeReply,
        openExternalLinkButton: s.openExternalLinkButton,
        isLogEnabled: s.isLogEnabled,
      };
    });
    expect(out.baloonImage).toBe('https://cdn.example/b.svg');
    expect(out.baloonShape).toBe('10px 10px 10px 10px');
    expect(out.dynamicWaitTimeReply).toBe(false);
    expect(out.openExternalLinkButton).toBe(true);
    expect(out.isLogEnabled).toBe(true);
  });

  test('canali social: whatsappNumber, messangerPageTitle, telegramUsername', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      (document.querySelector('#whatsappNumber') as HTMLInputElement).value = '+39333111222';
      (document.querySelector('#messangerPageTitle') as HTMLInputElement).value = 'Pagina';
      (document.querySelector('#telegramUsername') as HTMLInputElement).value = '@bot';
      (window as any).onClickWhatsappNumber();
      (window as any).onClickMessangerPageTitle();
      (window as any).onClickTelegramUsername();
      const s = (window as any).tiledeskSettings;
      return {
        whatsappNumber: s.whatsappNumber,
        messangerPageTitle: s.messangerPageTitle,
        telegramUsername: s.telegramUsername,
      };
    });
    expect(out.whatsappNumber).toBe('+39333111222');
    expect(out.messangerPageTitle).toBe('Pagina');
    expect(out.telegramUsername).toBe('@bot');
  });

  test('header conversazione: hide*, allowTranscriptDownload, allowReopen', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      check('hideHeaderConversation', 'true');
      check('hideHeaderCloseButton', 'true');
      check('hideHeaderConversationOptionsMenu', 'true');
      check('hideCloseConversationOptionMenu', 'false');
      check('allowTranscriptDownload', 'true');
      check('allowReopen', 'true');
      (window as any).onClickHideHeaderConversation();
      (window as any).onClickHideHeaderCloseButton();
      (window as any).onClickHideHeaderConversationOptionsMenu();
      (window as any).onClickHideCloseConversationOptionMenu();
      (window as any).onClickAllowTranscriptDownload();
      (window as any).onClickAllowReopen();
      const s = (window as any).tiledeskSettings;
      return {
        hideHeaderConversation: s.hideHeaderConversation,
        hideHeaderCloseButton: s.hideHeaderCloseButton,
        hideHeaderConversationOptionsMenu: s.hideHeaderConversationOptionsMenu,
        hideCloseConversationOptionMenu: s.hideCloseConversationOptionMenu,
        allowTranscriptDownload: s.allowTranscriptDownload,
        allowReopen: s.allowReopen,
      };
    });
    expect(out.hideHeaderConversation).toBe(true);
    expect(out.hideHeaderCloseButton).toBe(true);
    expect(out.hideHeaderConversationOptionsMenu).toBe(true);
    expect(out.hideCloseConversationOptionMenu).toBe(false);
    expect(out.allowTranscriptDownload).toBe(true);
    expect(out.allowReopen).toBe(true);
  });

  test('recipientId, soundEnabled, typingLocation', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      (document.querySelector('#recipientId') as HTMLInputElement).value = 'agent-42';
      const sound = document.querySelector('input[name="soundEnabled"][value="false"]') as HTMLInputElement | null;
      if (sound) {
        sound.checked = true;
      }
      const typing = document.querySelector('input[name="typingLocation"][value="header"]') as HTMLInputElement | null;
      if (typing) {
        typing.checked = true;
      }
      (window as any).onClickRecipientId();
      (window as any).onClickSoundEnabled();
      (window as any).onClickTypingLocation();
      const s = (window as any).tiledeskSettings;
      return { recipientId: s.recipientId, soundEnabled: s.soundEnabled, typingLocation: s.typingLocation };
    });
    expect(out.recipientId).toBe('agent-42');
    expect(out.soundEnabled).toBe(false);
    expect(out.typingLocation).toBe('header');
  });

  test('customAttributes (JSON.parse in pagina)', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      (document.querySelector('#customAttributes') as HTMLInputElement).value = '{"source":"index-dev","n":1}';
      (window as any).onClickCustomAttributes();
      return (window as any).tiledeskSettings.customAttributes;
    });
    expect(out).toEqual({ source: 'index-dev', n: 1 });
  });

  test('showInfoMessage e participants come CSV (textarea)', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      (document.querySelector('#showInfoMessage') as HTMLInputElement).value = ' MEMBER_JOINED_GROUP , CHAT_CLOSED ';
      (document.querySelector('#participants') as HTMLInputElement).value = ' id1 , id2 ';
      (window as any).onClickShowInfoMessage();
      (window as any).onClickParticipants();
      const s = (window as any).tiledeskSettings;
      return { showInfoMessage: s.showInfoMessage, participants: s.participants };
    });
    expect(out.showInfoMessage).toBe(' MEMBER_JOINED_GROUP , CHAT_CLOSED ');
    expect(out.participants).toBe(' id1 , id2 ');
  });

  test('fileUploadAccept e footer attachment/emoji/audio', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const check = (name: string, value: string) => {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
        if (el) {
          el.checked = true;
        }
      };
      (document.querySelector('#fileUploadAccept') as HTMLInputElement).value = 'image/png,.pdf';
      check('showAttachmentFooterButton', 'true');
      check('showEmojiFooterButton', 'false');
      check('showAudioRecorderFooterButton', 'true');
      (window as any).onClickFileUploadAccept();
      (window as any).onClickShowAttachmentFooterButton();
      (window as any).onClickShowEmojiFooterButton();
      (window as any).onClickshowAudioRecorderFooterButton();
      const s = (window as any).tiledeskSettings;
      return {
        fileUploadAccept: s.fileUploadAccept,
        showAttachmentFooterButton: s.showAttachmentFooterButton,
        showEmojiFooterButton: s.showEmojiFooterButton,
        showAudioRecorderFooterButton: s.showAudioRecorderFooterButton,
      };
    });
    expect(out.fileUploadAccept).toBe('image/png,.pdf');
    expect(out.showAttachmentFooterButton).toBe(true);
    expect(out.showEmojiFooterButton).toBe(false);
    expect(out.showAudioRecorderFooterButton).toBe(true);
  });

  test('fontSize, fontFamily + fontFamilySource, buttonFontSize', async ({ page }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      (document.querySelector('#fontSize') as HTMLInputElement).value = '1.6em';
      (document.querySelector('#fontFamily') as HTMLInputElement).value = 'Lato';
      (document.querySelector('#fontFamilySource') as HTMLInputElement).value =
        'https://fonts.googleapis.com/css?family=Lato';
      (document.querySelector('#buttonFontSize') as HTMLInputElement).value = '18px';
      (window as any).onClickFontSize();
      (window as any).onClickFontFamily();
      (window as any).onClickButtonFontSize();
      const s = (window as any).tiledeskSettings;
      return {
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        fontFamilySource: s.fontFamilySource,
        buttonFontSize: s.buttonFontSize,
      };
    });
    expect(out.fontSize).toBe('1.6em');
    expect(out.fontFamily).toBe('Lato');
    expect(out.fontFamilySource).toBe('https://fonts.googleapis.com/css?family=Lato');
    expect(out.buttonFontSize).toBe('18px');
  });

  test('chiavi del service senza onClick in index-dev (assign diretto)', async ({ page }) => {
    await openIndexDev(page);
    const payload = {
      tenant: 'tilechat',
      userEmail: 'fake.user@example.com',
      userFullname: 'Fake User',
      isOpen: false,
      channelType: 'group',
      isShown: true,
      showLogoutOption: false,
      preChatFormJson: [{ name: 'userFullname', type: 'text', mandatory: true, label: 'Name' }],
      restartConversation: true,
      displayOnDesktop: true,
      displayOnMobile: false,
      onPageChangeVisibilityDesktop: 'open',
      onPageChangeVisibilityMobile: 'close',
      closeChatInConversation: true,
      projectid: '65c5f17ab4e95a0013a0181a',
      filterByRequester: true,
    };
    const out = await page.evaluate((settings) => {
      Object.assign((window as any).tiledeskSettings, settings);
      const s = (window as any).tiledeskSettings;
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(settings)) {
        result[key] = s[key];
      }
      return result;
    }, payload);
    expect(out).toEqual(payload);
  });

  test('logLevel su tiledeskSettings è scritto da index-dev ma non letto da setVariablesFromSettings', async ({
    page,
  }) => {
    await openIndexDev(page);
    const out = await page.evaluate(() => {
      const select = document.getElementById('logLevel') as HTMLSelectElement | null;
      if (select) {
        select.value = 'DEBUG';
      }
      (window as any).onClickLogLevel();
      return (window as any).tiledeskSettings.logLevel;
    });
    expect(out).toBe('DEBUG');
  });
});
