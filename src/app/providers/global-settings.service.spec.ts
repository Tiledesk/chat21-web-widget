import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppStorageService } from '../../chat21-core/providers/abstract/app-storage.service';
import { LoggerInstance } from '../../chat21-core/providers/logger/loggerInstance';
import { LoggerService } from '../../chat21-core/providers/abstract/logger.service';
import { convertColorToRGBA } from '../utils/utils';
import { Globals } from '../utils/globals';
import { AppConfigService } from './app-config.service';
import { GlobalSettingsService } from './global-settings.service';

const noopLogger: LoggerService = {
  setLoggerConfig: () => {},
  getLoggerConfig: () => ({ isLogEnabled: false, logLevel: 0 }),
  debug: () => {},
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
} as LoggerService;

@Injectable()
class AppStorageStub extends AppStorageService {
  initialize(): void {}
  getItem(): any {
    return null;
  }
  setItem(): void {}
  getItemWithoutProjectID(): any {
    return null;
  }
  setItemWithoutProjectID(): void {}
  removeItem(): void {}
  clear(): void {}
}

function fakeWindowWithSettings(
  tiledeskSettings: Record<string, unknown>,
  href = 'https://host.example/page',
): Record<string, unknown> {
  return {
    tiledesk: { getBaseLocation: () => 'https://cdn.example/w/' },
    tiledeskSettings,
    location: { href },
  };
}

function fakeWindowUrlOnly(href: string): Record<string, unknown> {
  return { location: { href } };
}

function newGlobalsWithContext(windowContext: Record<string, unknown>): Globals {
  const g = new Globals();
  g.initDefafultParameters();
  g.windowContext = windowContext as any;
  return g;
}

describe('GlobalSettingsService', () => {
  beforeEach(() => {
    LoggerInstance.setInstance(noopLogger);
    TestBed.configureTestingModule({
      providers: [
        GlobalSettingsService,
        { provide: AppStorageService, useClass: AppStorageStub },
        {
          provide: AppConfigService,
          useValue: {
            getConfig: () => ({
              firebaseConfig: { tenant: 'cfg-tenant' },
              logLevel: 'Error',
              authPersistence: 'LOCAL',
              apiUrl: 'https://api.example/',
            }),
          },
        },
        provideHttpClient(withInterceptorsFromDi()),
      ],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(GlobalSettingsService)).toBeTruthy();
  });

  describe('setVariablesFromSettings (tiledeskSettings → Globals)', () => {
    const service = () => TestBed.inject(GlobalSettingsService);

    it('tenant, recipientId, widgetTitle, userEmail, userFullname', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          tenant: 't-1',
          recipientId: 'r-1',
          widgetTitle: 'WT',
          userEmail: 'a@b.c',
          userFullname: 'Full Name',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.tenant).toBe('t-1');
      expect(g.recipientId).toBe('r-1');
      expect(g.widgetTitle).toBe('WT');
      expect(g.userEmail).toBe('a@b.c');
      expect(g.userFullname).toBe('Full Name');
    });

    it('preChatForm, channelType, lang, align', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          preChatForm: true,
          channelType: 'whatsapp',
          lang: 'it',
          align: 'left',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.preChatForm).toBe(true);
      expect(g.channelType).toBe('whatsapp');
      expect(g.lang).toBe('it');
      expect(g.align).toBe('left');
    });

    it('isOpen e open aggiornano isOpen', () => {
      const g1 = newGlobalsWithContext(fakeWindowWithSettings({ isOpen: true }));
      service().setVariablesFromSettings(g1);
      expect(g1.isOpen).toBe(true);
      const g2 = newGlobalsWithContext(fakeWindowWithSettings({ open: true }));
      service().setVariablesFromSettings(g2);
      expect(g2.isOpen).toBe(true);
    });

    it('margin e launcher', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          marginX: '1px',
          marginY: '2px',
          mobileMarginX: '3px',
          mobileMarginY: '4px',
          launcherWidth: '50px',
          launcherHeight: '51px',
          baloonImage: 'https://x/svg',
          baloonShape: '12%',
          calloutTimer: 9,
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.marginX).toBe('1px');
      expect(g.marginY).toBe('2px');
      expect(g.mobileMarginX).toBe('3px');
      expect(g.mobileMarginY).toBe('4px');
      expect(g.launcherWidth).toBe('50px');
      expect(g.launcherHeight).toBe('51px');
      expect(g.baloonImage).toBe('https://x/svg');
      expect(g.baloonShape).toBe('12%');
      expect(g.calloutTimer).toBe(9 as any);
    });

    it('calloutTitle, calloutMsg, fullscreenMode, header flags', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          calloutTitle: 'CT',
          calloutMsg: 'CM',
          fullscreenMode: true,
          hideHeaderCloseButton: true,
          hideHeaderConversation: true,
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.calloutTitle).toBe('CT');
      expect(g.calloutMsg).toBe('CM');
      expect(g.fullscreenMode).toBe(true);
      expect(g.hideHeaderCloseButton).toBe(true);
      expect(g.hideHeaderConversation).toBe(true);
    });

    it('themeColor, themeColorOpacity, themeForegroundColor', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          themeColor: '#ff0000',
          themeColorOpacity: 77,
          themeForegroundColor: '#00ff00',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.themeColor).toBe(convertColorToRGBA('#ff0000', 100));
      expect(g.bubbleSentBackground).toBe(convertColorToRGBA('#ff0000', 100));
      expect(g.themeColorOpacity).toBe(77);
      expect(g.themeForegroundColor).toBe(convertColorToRGBA('#00ff00', 100));
    });

    it('allowTranscriptDownload, startFromHome, logoChat, welcome', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          allowTranscriptDownload: true,
          startFromHome: false,
          logoChat: 'https://logo',
          welcomeTitle: 'WTi',
          welcomeMsg: 'WMi',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.allowTranscriptDownload).toBe(true);
      expect(g.startFromHome).toBe(false);
      expect(g.logoChat).toBe('https://logo');
      expect(g.welcomeTitle).toBe('WTi');
      expect(g.welcomeMsg).toBe('WMi');
    });

    it('autoStart, startHidden, isShown, filter e show agenti', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          autoStart: true,
          startHidden: true,
          isShown: false,
          filterByRequester: true,
          showWaitTime: true,
          showAvailableAgents: false,
          showLogoutOption: true,
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.autoStart).toBe(true);
      expect(g.startHidden).toBe(true);
      expect(g.isShown).toBe(false);
      expect(g.filterByRequester).toBe(true);
      expect(g.showWaitTime).toBe(true);
      expect(g.showAvailableAgents).toBe(false);
      expect(g.showLogoutOption).toBe(true);
    });

    it('customAttributes, showAllConversations, dynamicWaitTimeReply', () => {
      const attrs = { k: 1 };
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          customAttributes: attrs,
          showAllConversations: true,
          dynamicWaitTimeReply: false,
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.customAttributes).toEqual(attrs);
      expect(g.showAllConversations).toBe(true);
      expect(g.dynamicWaitTimeReply).toBe(false);
    });

    it('soundEnabled, openExternalLinkButton, menu flags, isLogEnabled', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          soundEnabled: false,
          openExternalLinkButton: false,
          hideCloseConversationOptionMenu: true,
          hideHeaderConversationOptionsMenu: true,
          hideSettings: true,
          isLogEnabled: true,
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.soundEnabled).toBe(false);
      expect(g.openExternalLinkButton).toBe(false);
      expect(g.hideCloseConversationOptionMenu).toBe(true);
      expect(g.hideHeaderConversationOptionsMenu).toBe(true);
      expect(g.hideSettings).toBe(true);
      expect(g.isLogEnabled).toBe(true);
    });

    it('preChatFormJson (array JSON)', () => {
      const form = [{ name: 'userFullname', type: 'text' }];
      const g = newGlobalsWithContext(fakeWindowWithSettings({ preChatFormJson: form }));
      service().setVariablesFromSettings(g);
      expect(g.preChatFormJson).toEqual(form as any);
    });

    it('bubble colors (sent background / text / received)', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          bubbleSentBackground: '#111111',
          bubbleSentTextColor: '#222222',
          bubbleReceivedBackground: '#333333',
          bubbleReceivedTextColor: '#444444',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.bubbleSentBackground).toBe(convertColorToRGBA('#111111', 100));
      expect(g.bubbleSentTextColor).toBe(convertColorToRGBA('#222222', 100));
      expect(g.bubbleReceivedBackground).toBe(convertColorToRGBA('#333333', 100));
      expect(g.bubbleReceivedTextColor).toBe(convertColorToRGBA('#444444', 100));
    });

    it('fontSize, fontFamily (append), fontFamilySource', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          fontSize: '2em',
          fontFamily: 'Arial',
          fontFamilySource: 'https://fonts.googleapis.com/css?family=Arial',
        }),
      );
      const baseFf = g.fontFamily;
      service().setVariablesFromSettings(g);
      expect(g.fontSize).toBe('2em');
      expect(g.fontFamily).toBe('Arial,' + baseFf);
      expect(g.fontFamilySource).toBe('https://fonts.googleapis.com/css?family=Arial');
    });

    it('button colors e dimensioni', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          buttonFontSize: '20px',
          buttonBackgroundColor: '#abcdef',
          buttonTextColor: '#111111',
          buttonHoverBackgroundColor: '#222222',
          buttonHoverTextColor: '#333333',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.buttonFontSize).toBe('20px');
      expect(g.buttonBackgroundColor).toBe(convertColorToRGBA('#abcdef', 100));
      expect(g.buttonTextColor).toBe(convertColorToRGBA('#111111', 100));
      expect(g.buttonHoverBackgroundColor).toBe(convertColorToRGBA('#222222', 100));
      expect(g.buttonHoverTextColor).toBe(convertColorToRGBA('#333333', 100));
    });

    it('singleConversation, restartConversation, nativeRating, typingLocation', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          singleConversation: true,
          restartConversation: true,
          nativeRating: false,
          typingLocation: 'header',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.singleConversation).toBe(true);
      expect(g.restartConversation).toBe(true);
      expect(g.nativeRating).toBe(false);
      expect(g.typingLocation).toBe('header');
    });

    it('showInfoMessage (stringa CSV) e allowReopen aggiunge CHAT_CLOSED', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          showInfoMessage: ' A , B ',
          allowReopen: true,
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.allowReopen).toBe(true);
      expect(g.showInfoMessage).toEqual(['A', 'B', 'CHAT_CLOSED']);
    });

    it('participants, whatsapp, telegram, messangerPageTitle, fileUploadAccept, disconnetTime', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          participants: ' a , b ',
          whatsappNumber: '+39000',
          telegramUsername: '@u',
          messangerPageTitle: 'T',
          fileUploadAccept: '.pdf',
          disconnetTime: 120,
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.participants).toEqual(['a', 'b']);
      expect(g.whatsappNumber).toBe('+39000');
      expect(g.telegramUsername).toBe('@u');
      expect(g.messangerPageTitle).toBe('T');
      expect(g.fileUploadAccept).toBe('.pdf');
      expect(g.disconnetTime).toBe(120);
    });

    it('displayOnDesktop/Mobile e onPageChangeVisibility', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          displayOnDesktop: true,
          displayOnMobile: false,
          onPageChangeVisibilityDesktop: 'last',
          onPageChangeVisibilityMobile: 'close',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.displayOnDesktop).toBe(true);
      expect(g.displayOnMobile).toBe(false);
      expect(g.onPageChangeVisibilityDesktop).toBe('last');
      expect(g.onPageChangeVisibilityMobile).toBe('close');
    });

    it('footer attachment/emoji/audio e size', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          showAttachmentFooterButton: true,
          showEmojiFooterButton: false,
          showAudioRecorderFooterButton: true,
          size: 'max',
        }),
      );
      service().setVariablesFromSettings(g);
      expect(g.showAttachmentFooterButton).toBe(true);
      expect(g.showEmojiFooterButton).toBe(false);
      expect(g.showAudioRecorderFooterButton).toBe(true);
      expect(g.size).toBe('max');
    });
  });

  describe('setVariablesFromUrlParameters (query tiledesk_* → Globals)', () => {
    const service = () => TestBed.inject(GlobalSettingsService);
    const q = (pairs: Record<string, string>) => {
      const qs = Object.entries(pairs)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      return `https://host.example/app?${qs}`;
    };

    it('tenant, recipientId, widgetTitle, userEmail, userFullname, channelType, lang', () => {
      const href = q({
        tiledesk_tenant: 't-url',
        tiledesk_recipientId: 'rec-url',
        tiledesk_widgetTitle: 'W-url',
        tiledesk_userEmail: 'e@mail.it',
        tiledesk_userFullname: 'Nome',
        tiledesk_channelType: 'group',
        tiledesk_lang: 'de',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.tenant).toBe('t-url');
      expect(g.recipientId).toBe('rec-url');
      expect(g.widgetTitle).toBe('W-url');
      expect(g.userEmail).toBe('e@mail.it');
      expect(g.userFullname).toBe('Nome');
      expect(g.channelType).toBe('group');
      expect(g.lang).toBe('de');
    });

    it('calloutTimer, align, margini, launcher, baloon', () => {
      const href = q({
        tiledesk_calloutTimer: '15',
        tiledesk_align: 'right',
        tiledesk_marginX: '10px',
        tiledesk_marginY: '11px',
        tiledesk_mobileMarginX: '12px',
        tiledesk_mobileMarginY: '13px',
        tiledesk_launcherWidth: '60px',
        tiledesk_launcherHeight: '61px',
        tiledesk_baloonImage: 'https://i.svg',
        tiledesk_baloonShape: '40%',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.calloutTimer).toBe(15);
      expect(g.align).toBe('right');
      expect(g.marginX).toBe('10px');
      expect(g.marginY).toBe('11px');
      expect(g.mobileMarginX).toBe('12px');
      expect(g.mobileMarginY).toBe('13px');
      expect(g.launcherWidth).toBe('60px');
      expect(g.launcherHeight).toBe('61px');
      expect(g.baloonImage).toBe('https://i.svg');
      expect(g.baloonShape).toBe('40%');
    });

    it('welcomeMsg, calloutTitle, calloutMsg, hide header flags', () => {
      const href = q({
        tiledesk_welcomeMsg: 'WM-url',
        tiledesk_calloutTitle: 'CT-url',
        tiledesk_calloutMsg: 'CM-url',
        tiledesk_hideHeaderCloseButton: 'true',
        tiledesk_hideHeaderConversation: 'false',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.welcomeMsg).toBe('WM-url');
      expect(g.calloutTitle).toBe('CT-url');
      expect(g.calloutMsg).toBe('CM-url');
      expect(g.hideHeaderCloseButton).toBe(true);
      expect(g.hideHeaderConversation).toBe(false);
    });

    it('themeColor, themeColorOpacity, themeForegroundColor (effetti colore)', () => {
      const href = q({
        tiledesk_themeColor: '#aa0000',
        tiledesk_themeColorOpacity: '88',
        tiledesk_themeForegroundColor: '#00aa00',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.themeColor).toBe(convertColorToRGBA('#aa0000', 100));
      expect(g.themeColorOpacity).toBe(88);
      expect(g.themeForegroundColor).toBe(convertColorToRGBA('#00aa00', 100));
      expect(g.bubbleSentTextColor).toBe(convertColorToRGBA('#00aa00', 100));
    });

    it('logoChat, welcomeTitle, autoStart, startHidden, isShown, isLogEnabled', () => {
      const href = q({
        tiledesk_logoChat: 'https://l.png',
        tiledesk_welcomeTitle: 'WT-u',
        tiledesk_autoStart: 'true',
        tiledesk_startHidden: 'true',
        tiledesk_isShown: 'false',
        tiledesk_isLogEnabled: 'true',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.logoChat).toBe('https://l.png');
      expect(g.welcomeTitle).toBe('WT-u');
      expect(g.autoStart).toBe(true);
      expect(g.startHidden).toBe(true);
      expect(g.isShown).toBe(false);
      expect(g.isLogEnabled).toBe(true);
    });

    it('filterByRequester, showWaitTime, showAvailableAgents, showLogoutOption, preChatForm', () => {
      const href = q({
        tiledesk_filterByRequester: 'true',
        tiledesk_showWaitTime: 'false',
        tiledesk_showAvailableAgents: 'true',
        tiledesk_showLogoutOption: 'false',
        tiledesk_preChatForm: 'true',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.filterByRequester).toBe(true);
      expect(g.showWaitTime).toBe(false);
      expect(g.showAvailableAgents).toBe(true);
      expect(g.showLogoutOption).toBe(false);
      expect(g.preChatForm).toBe(true);
    });

    it('isOpen e open (URL)', () => {
      const g1 = newGlobalsWithContext(fakeWindowUrlOnly(q({ tiledesk_isOpen: 'true' })));
      service().setVariablesFromUrlParameters(g1);
      expect(g1.isOpen).toBe(true);
      const g2 = newGlobalsWithContext(fakeWindowUrlOnly(q({ tiledesk_open: 'true' })));
      service().setVariablesFromUrlParameters(g2);
      expect(g2.isOpen).toBe(true);
    });

    it('allowTranscriptDownload, startFromHome, fullscreenMode, customAttributes', () => {
      const href = q({
        tiledesk_allowTranscriptDownload: 'true',
        tiledesk_startFromHome: 'false',
        tiledesk_fullscreenMode: 'true',
        tiledesk_customAttributes: JSON.stringify({ z: 2 }),
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.allowTranscriptDownload).toBe(true);
      expect(g.startFromHome).toBe(false);
      expect(g.fullscreenMode).toBe(true);
      expect(g.customAttributes).toEqual({ z: 2 });
    });

    it('departmentID, persistence, showAllConversations, jwt', () => {
      const href = q({
        tiledesk_departmentID: 'dep-99',
        tiledesk_persistence: 'session',
        tiledesk_showAllConversations: 'true',
        tiledesk_jwt: 'abc.jwt.token',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.departmentID).toBe('dep-99');
      expect(g.persistence).toBe('session');
      expect(g.showAllConversations).toBe(true);
      expect(g.jwt).toBe('abc.jwt.token');
    });

    it('dynamicWaitTimeReply, soundEnabled, link e menu hide flags', () => {
      const href = q({
        tiledesk_dynamicWaitTimeReply: 'false',
        tiledesk_soundEnabled: 'true',
        tiledesk_openExternalLinkButton: 'false',
        tiledesk_hideHeaderConversationOptionsMenu: 'true',
        tiledesk_hideCloseConversationOptionMenu: 'true',
        tiledesk_hideSettings: 'false',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.dynamicWaitTimeReply).toBe(false);
      expect(g.soundEnabled).toBe(true);
      expect(g.openExternalLinkButton).toBe(false);
      expect(g.hideHeaderConversationOptionsMenu).toBe(true);
      expect(g.hideCloseConversationOptionMenu).toBe(true);
      expect(g.hideSettings).toBe(false);
    });

    it('logLevel e preChatFormJson (JSON)', () => {
      const href = q({
        tiledesk_logLevel: 'Debug',
        tiledesk_preChatFormJson: JSON.stringify([{ name: 'x', type: 'text' }]),
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.logLevel).toBe('Debug');
      expect(g.preChatFormJson).toEqual([{ name: 'x', type: 'text' }] as any);
    });

    it('bubble URL (sent/received) e font', () => {
      const href = q({
        tiledesk_bubbleSentBackground: '#123456',
        tiledesk_bubbleSentTextColor: '#654321',
        tiledesk_bubbleReceivedBackground: '#abcdef',
        tiledesk_bubbleReceivedTextColor: '#fedcba',
        tiledesk_fontSize: '1.1em',
        tiledesk_fontFamily: 'Georgia',
        tiledesk_buttonFontSize: '13px',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.bubbleSentBackground).toBe(convertColorToRGBA('#123456', 100));
      expect(g.bubbleSentTextColor).toBe(convertColorToRGBA('#654321', 100));
      expect(g.bubbleReceivedBackground).toBe(convertColorToRGBA('#abcdef', 100));
      expect(g.bubbleReceivedTextColor).toBe(convertColorToRGBA('#fedcba', 100));
      expect(g.fontSize).toBe('1.1em');
      expect(g.fontFamily).toBe('Georgia');
      expect(g.buttonFontSize).toBe('13px');
    });

    it('button colors da URL', () => {
      const href = q({
        tiledesk_buttonBackgroundColor: '#112233',
        tiledesk_buttonTextColor: '#445566',
        tiledesk_buttonHoverBackgroundColor: '#778899',
        tiledesk_buttonHoverTextColor: '#aabbcc',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.buttonBackgroundColor).toBe(convertColorToRGBA('#112233', 100));
      expect(g.buttonTextColor).toBe(convertColorToRGBA('#445566', 100));
      expect(g.buttonHoverBackgroundColor).toBe(convertColorToRGBA('#778899', 100));
      expect(g.buttonHoverTextColor).toBe(convertColorToRGBA('#aabbcc', 100));
    });

    it('singleConversation, restartConversation, nativeRating, typingLocation', () => {
      const href = q({
        tiledesk_singleConversation: 'true',
        tiledesk_restartConversation: 'false',
        tiledesk_nativeRating: 'true',
        tiledesk_typingLocation: 'content',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.singleConversation).toBe(true);
      expect(g.restartConversation).toBe(false);
      expect(g.nativeRating).toBe(true);
      expect(g.typingLocation).toBe('content');
    });

    it('showInfoMessage, allowReopen, participants, fileUploadAccept, disconnetTime', () => {
      const href = q({
        tiledesk_showInfoMessage: 'X, Y',
        tiledesk_allowReopen: 'true',
        tiledesk_participants: 'p1, p2',
        tiledesk_fileUploadAccept: 'image/*',
        tiledesk_disconnetTime: '45',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.allowReopen).toBe(true);
      expect(g.showInfoMessage).toEqual(['X', 'Y', 'CHAT_CLOSED']);
      expect(g.participants).toEqual(['p1', 'p2']);
      expect(g.fileUploadAccept).toBe('image/*');
      expect(g.disconnetTime).toBe(45);
    });

    it('hiddenMessage, td_draft (dev), footer buttons, size', () => {
      const href = q({
        tiledesk_hiddenMessage: 'hidden-text',
        td_draft: 'true',
        tiledesk_showAttachmentFooterButton: 'true',
        tiledesk_showEmojiFooterButton: 'false',
        tiledesk_size: 'min',
      });
      const g = newGlobalsWithContext(fakeWindowUrlOnly(href));
      service().setVariablesFromUrlParameters(g);
      expect(g.hiddenMessage).toBe('hidden-text');
      expect(g.isDevMode).toBe(true);
      expect(g.showAttachmentFooterButton).toBe(true);
      expect(g.showEmojiFooterButton).toBe(false);
      expect(g.size).toBe('min');
    });
  });

  describe('setMainParametersFromSettings (departmentID, persistence, …)', () => {
    it('legge departmentID, persistence, filterByRequester, showAllConversations da tiledeskSettings', () => {
      const svc = TestBed.inject(GlobalSettingsService);
      const g = new Globals();
      g.initDefafultParameters();
      g.windowContext = {
        tiledesk: { getBaseLocation: () => 'https://x/' },
        tiledeskSettings: {
          departmentID: 'd-ext',
          persistence: 'none',
          filterByRequester: true,
          showAllConversations: false,
        },
      } as any;
      svc.globals = g;
      svc.setMainParametersFromSettings(g);
      expect(g.departmentID).toBe('d-ext');
      expect(g.persistence).toBe('none');
      expect(g.filterByRequester).toBe(true);
      expect(g.showAllConversations).toBe(false);
    });
  });

  /**
   * Allineato a `tests/widget-index-dev-settings.spec.ts` e agli `onClick*` di
   * `src/assets/twp/index-dev.html` (stessi nomi chiave su `window.tiledeskSettings`).
   */
  describe('index-dev.html: tiledeskSettings → Globals', () => {
    const settingsSvc = () => TestBed.inject(GlobalSettingsService);

    it('Playwright — marginX, marginY, welcomeTitle, calloutTitle, widgetTitle', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          marginX: '11px',
          marginY: '22px',
          welcomeTitle: 'Titolo fake',
          calloutTitle: 'Callout FAKE',
          widgetTitle: 'Widget FAKE',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.marginX).toBe('11px');
      expect(g.marginY).toBe('22px');
      expect(g.welcomeTitle).toBe('Titolo fake');
      expect(g.calloutTitle).toBe('Callout FAKE');
      expect(g.widgetTitle).toBe('Widget FAKE');
    });

    it('Playwright — departmentID (setMainParametersFromSettings, come bottone index-dev)', () => {
      const svc = TestBed.inject(GlobalSettingsService);
      const g = new Globals();
      g.initDefafultParameters();
      g.windowContext = {
        tiledesk: { getBaseLocation: () => 'https://cdn/' },
        tiledeskSettings: { departmentID: 'dep-xyz' },
      } as any;
      svc.globals = g;
      svc.setMainParametersFromSettings(g);
      expect(g.departmentID).toBe('dep-xyz');
    });

    it('index-dev — posizione: size, fullscreenMode, align, margini mobile', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          size: 'max',
          fullscreenMode: true,
          align: 'left',
          mobileMarginX: '5px',
          mobileMarginY: '6px',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.size).toBe('max');
      expect(g.fullscreenMode).toBe(true);
      expect(g.align).toBe('left');
      expect(g.mobileMarginX).toBe('5px');
      expect(g.mobileMarginY).toBe('6px');
    });

    it('index-dev — disconnetTime, startFromHome, open, preChatForm, calloutTimer', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          disconnetTime: 120,
          startFromHome: false,
          open: true,
          preChatForm: true,
          calloutTimer: 8,
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.disconnetTime).toBe(120);
      expect(g.startFromHome).toBe(false);
      expect(g.isOpen).toBe(true);
      expect(g.preChatForm).toBe(true);
      expect(g.calloutTimer).toBe(8 as any);
    });

    it('index-dev — calloutMsg, welcomeMsg, logoChat, lang', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          calloutMsg: 'Msg callout',
          welcomeMsg: 'Benvenuto',
          logoChat: 'https://cdn.example/logo.png',
          lang: 'de',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.calloutMsg).toBe('Msg callout');
      expect(g.welcomeMsg).toBe('Benvenuto');
      expect(g.logoChat).toBe('https://cdn.example/logo.png');
      expect(g.lang).toBe('de');
    });

    it('index-dev — singleConversation, hideSettings, nativeRating', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          singleConversation: true,
          hideSettings: true,
          nativeRating: false,
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.singleConversation).toBe(true);
      expect(g.hideSettings).toBe(true);
      expect(g.nativeRating).toBe(false);
    });

    it('index-dev — restart: la pagina usa chiave `restart`, il widget legge `restartConversation`', () => {
      const gWrong = newGlobalsWithContext(fakeWindowWithSettings({ restart: true }));
      settingsSvc().setVariablesFromSettings(gWrong);
      expect(gWrong.restartConversation).toBe(false);

      const gOk = newGlobalsWithContext(fakeWindowWithSettings({ restartConversation: true }));
      settingsSvc().setVariablesFromSettings(gOk);
      expect(gOk.restartConversation).toBe(true);
    });

    it('index-dev — colori tema e opacità (themeColor, themeColorOpacity, themeForegroundColor)', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          themeColor: '#2a6ac1',
          themeColorOpacity: 80,
          themeForegroundColor: '#ffffff',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.themeColor).toBe(convertColorToRGBA('#2a6ac1', 100));
      expect(g.themeColorOpacity).toBe(80);
      expect(g.themeForegroundColor).toBe(convertColorToRGBA('#ffffff', 100));
    });

    it('index-dev — onClickColor: bubble e pulsanti (stringhe hex come in pagina)', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          bubbleSentBackground: '#123456',
          bubbleSentTextColor: '#abcdef',
          bubbleReceivedBackground: '#f0f0f0',
          bubbleReceivedTextColor: '#111111',
          buttonBackgroundColor: '#222222',
          buttonTextColor: '#333333',
          buttonHoverBackgroundColor: '#444444',
          buttonHoverTextColor: '#555555',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.bubbleSentBackground).toBe(convertColorToRGBA('#123456', 100));
      expect(g.bubbleSentTextColor).toBe(convertColorToRGBA('#abcdef', 100));
      expect(g.bubbleReceivedBackground).toBe(convertColorToRGBA('#f0f0f0', 100));
      expect(g.bubbleReceivedTextColor).toBe(convertColorToRGBA('#111111', 100));
      expect(g.buttonBackgroundColor).toBe(convertColorToRGBA('#222222', 100));
      expect(g.buttonTextColor).toBe(convertColorToRGBA('#333333', 100));
      expect(g.buttonHoverBackgroundColor).toBe(convertColorToRGBA('#444444', 100));
      expect(g.buttonHoverTextColor).toBe(convertColorToRGBA('#555555', 100));
    });

    it('index-dev — autoStart, startHidden, launcher (valore già con px come dopo onClick)', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          autoStart: true,
          startHidden: false,
          launcherWidth: '72px',
          launcherHeight: '72px',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.autoStart).toBe(true);
      expect(g.startHidden).toBe(false);
      expect(g.launcherWidth).toBe('72px');
      expect(g.launcherHeight).toBe('72px');
    });

    it('index-dev — persistence (main) e showWaitTime / showAvailableAgents / showAllConversations (settings)', () => {
      const svc = TestBed.inject(GlobalSettingsService);
      const g = new Globals();
      g.initDefafultParameters();
      g.windowContext = {
        tiledesk: { getBaseLocation: () => 'https://cdn/' },
        tiledeskSettings: {
          persistence: 'session',
          showWaitTime: false,
          showAvailableAgents: true,
          showAllConversations: true,
        },
      } as any;
      svc.globals = g;
      svc.setMainParametersFromSettings(g);
      svc.setVariablesFromSettings(g);
      expect(g.persistence).toBe('session');
      expect(g.showWaitTime).toBe(false);
      expect(g.showAvailableAgents).toBe(true);
      expect(g.showAllConversations).toBe(true);
    });

    it('index-dev — baloonImage, baloonShape, dynamicWaitTimeReply, openExternalLinkButton, isLogEnabled', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          baloonImage: 'https://cdn/b.svg',
          baloonShape: '10px 10px 10px 10px',
          dynamicWaitTimeReply: false,
          openExternalLinkButton: true,
          isLogEnabled: true,
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.baloonImage).toBe('https://cdn/b.svg');
      expect(g.baloonShape).toBe('10px 10px 10px 10px');
      expect(g.dynamicWaitTimeReply).toBe(false);
      expect(g.openExternalLinkButton).toBe(true);
      expect(g.isLogEnabled).toBe(true);
    });

    it('index-dev — canali social: whatsappNumber, messangerPageTitle, telegramUsername', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          whatsappNumber: '+39333111222',
          messangerPageTitle: 'Pagina',
          telegramUsername: '@bot',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.whatsappNumber).toBe('+39333111222');
      expect(g.messangerPageTitle).toBe('Pagina');
      expect(g.telegramUsername).toBe('@bot');
    });

    it('index-dev — header conversazione: hide*, allowTranscriptDownload, allowReopen', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          hideHeaderConversation: true,
          hideHeaderCloseButton: true,
          hideHeaderConversationOptionsMenu: true,
          hideCloseConversationOptionMenu: false,
          allowTranscriptDownload: true,
          allowReopen: true,
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.hideHeaderConversation).toBe(true);
      expect(g.hideHeaderCloseButton).toBe(true);
      expect(g.hideHeaderConversationOptionsMenu).toBe(true);
      expect(g.hideCloseConversationOptionMenu).toBe(false);
      expect(g.allowTranscriptDownload).toBe(true);
      expect(g.allowReopen).toBe(true);
      expect(g.showInfoMessage).toContain('CHAT_CLOSED');
    });

    it('index-dev — recipientId, soundEnabled, typingLocation', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          recipientId: 'agent-42',
          soundEnabled: false,
          typingLocation: 'header',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.recipientId).toBe('agent-42');
      expect(g.soundEnabled).toBe(false);
      expect(g.typingLocation).toBe('header');
    });

    it('index-dev — customAttributes (oggetto dopo JSON.parse in pagina)', () => {
      const attrs = { source: 'index-dev', n: 1 };
      const g = newGlobalsWithContext(fakeWindowWithSettings({ customAttributes: attrs }));
      settingsSvc().setVariablesFromSettings(g);
      expect(g.customAttributes).toEqual(attrs);
    });

    it('index-dev — showInfoMessage e participants come stringhe CSV (textarea)', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          showInfoMessage: ' MEMBER_JOINED_GROUP , CHAT_CLOSED ',
          participants: ' id1 , id2 ',
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.showInfoMessage).toEqual(['MEMBER_JOINED_GROUP', 'CHAT_CLOSED']);
      expect(g.participants).toEqual(['id1', 'id2']);
    });

    it('index-dev — fileUploadAccept e footer attachment/emoji/audio', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          fileUploadAccept: 'image/png,.pdf',
          showAttachmentFooterButton: true,
          showEmojiFooterButton: false,
          showAudioRecorderFooterButton: true,
        }),
      );
      settingsSvc().setVariablesFromSettings(g);
      expect(g.fileUploadAccept).toBe('image/png,.pdf');
      expect(g.showAttachmentFooterButton).toBe(true);
      expect(g.showEmojiFooterButton).toBe(false);
      expect(g.showAudioRecorderFooterButton).toBe(true);
    });

    it('index-dev — fontSize, fontFamily + fontFamilySource, buttonFontSize', () => {
      const g = newGlobalsWithContext(
        fakeWindowWithSettings({
          fontSize: '1.6em',
          fontFamily: 'Lato',
          fontFamilySource: 'https://fonts.googleapis.com/css?family=Lato',
          buttonFontSize: '18px',
        }),
      );
      const baseFf = g.fontFamily;
      settingsSvc().setVariablesFromSettings(g);
      expect(g.fontSize).toBe('1.6em');
      expect(g.fontFamily).toBe('Lato,' + baseFf);
      expect(g.fontFamilySource).toBe('https://fonts.googleapis.com/css?family=Lato');
      expect(g.buttonFontSize).toBe('18px');
    });

    it('index-dev — logLevel su tiledeskSettings non è letto da setVariablesFromSettings (solo URL / init)', () => {
      const g = newGlobalsWithContext(fakeWindowWithSettings({ logLevel: 'Debug' }));
      const before = g.logLevel;
      settingsSvc().setVariablesFromSettings(g);
      expect(g.logLevel).toBe(before);
    });
  });
});
