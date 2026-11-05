import { ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AppStorageService } from '../../chat21-core/providers/abstract/app-storage.service';
import { LoggerService } from '../../chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from '../../chat21-core/providers/logger/loggerInstance';
import { Globals } from '../utils/globals';
import { AppConfigService } from './app-config.service';
import { GlobalSettingsService } from './global-settings.service';

describe('GlobalSettingsService initialization', () => {
  let service: GlobalSettingsService;
  let globals: Globals;
  let element: ElementRef;
  let http: jasmine.SpyObj<HttpClient>;
  let logger: jasmine.SpyObj<LoggerService>;
  let originalSettings: any;
  let originalSdk: any;
  let originalUrl: string;
  let originalLogger: LoggerService;

  beforeEach(() => {
    originalSettings = window['tiledeskSettings'];
    originalSdk = window['tiledesk'];
    originalUrl = window.location.href;
    originalLogger = LoggerInstance.getInstance();
    delete window['tiledeskSettings'];
    window['tiledesk'] = { getBaseLocation: () => window.location.origin + '/widget' };
    window.history.replaceState(null, '', '/');
    logger = jasmine.createSpyObj('LoggerService', ['debug', 'info', 'log', 'warn', 'error']);
    LoggerInstance.setInstance(logger);
    http = jasmine.createSpyObj('HttpClient', ['get']);
    http.get.and.returnValue(of({ departments: null, project: { widget: {} }, ip: '127.0.0.1' }));
    const storage = jasmine.createSpyObj('AppStorageService', ['getItem', 'getItemWithoutProjectID', 'setItem']);
    storage.getItem.and.returnValue(null);
    storage.getItemWithoutProjectID.and.returnValue(null);
    const config = {
      getConfig: () => ({
        apiUrl: 'https://api.example/',
        firebaseConfig: { tenant: 'tilechat' },
        logLevel: 'ERROR',
        authPersistence: 'LOCAL',
      }),
    };
    service = new GlobalSettingsService(http, storage as AppStorageService, config as AppConfigService);
    globals = new Globals();
    element = new ElementRef(document.createElement('chat-root'));
  });

  afterEach(() => {
    window['tiledeskSettings'] = originalSettings;
    window['tiledesk'] = originalSdk;
    window.history.replaceState(null, '', originalUrl);
    LoggerInstance.setInstance(originalLogger);
  });

  it('initializes from the URL without embedding settings', () => {
    window.history.replaceState(null, '', '/?tiledesk_projectid=url-project&tiledesk_open=true');

    expect(() => service.initWidgetParamiters(globals, element)).not.toThrow();

    expect(http.get).toHaveBeenCalledWith('https://api.example/url-project/widgets', jasmine.any(Object));
    expect(globals.projectid).toBe('url-project');
    expect(globals.isOpen).toBe(true);
    expect(service.obsSettingsService.getValue()).toBe(true);
    expect(logger.error.calls.allArgs()).toEqual([]);
  });

  it('initializes from the projectid attribute without embedding settings', () => {
    element.nativeElement.setAttribute('projectid', 'attribute-project');

    expect(() => service.initWidgetParamiters(globals, element)).not.toThrow();

    expect(http.get).toHaveBeenCalledWith('https://api.example/attribute-project/widgets', jasmine.any(Object));
    expect(service.obsSettingsService.getValue()).toBe(true);
    expect(logger.error.calls.allArgs()).toEqual([]);
  });

  it('treats null embedding settings as absent', () => {
    window['tiledeskSettings'] = null;
    window.history.replaceState(null, '', '/?tiledesk_projectid=url-project');

    expect(() => service.initWidgetParamiters(globals, element)).not.toThrow();

    expect(service.obsSettingsService.getValue()).toBe(true);
    expect(logger.error.calls.allArgs()).toEqual([]);
  });

  it('preserves explicit embedding settings', () => {
    http.get.and.returnValue(of({
      departments: [{ _id: 'support', name: 'Support', default: true }],
      project: { widget: {} },
      ip: '127.0.0.1',
    }));
    window['tiledeskSettings'] = {
      projectid: 'embedded-project',
      departmentID: 'support',
      filterByRequester: false,
      showAllConversations: false,
      widgetTitle: 'Support chat',
    };

    service.initWidgetParamiters(globals, element);

    expect(globals.projectid).toBe('embedded-project');
    expect(globals.departmentID).toBe('support');
    expect(globals.filterByRequester).toBe(false);
    expect(globals.showAllConversations).toBe(false);
    expect(globals.widgetTitle).toBe('Support chat');
    expect(service.obsSettingsService.getValue()).toBe(true);
  });

  it('keeps the existing URL override for an embedded project ID', () => {
    window['tiledeskSettings'] = { projectid: 'embedded-project' };
    element.nativeElement.setAttribute('projectid', 'attribute-project');
    window.history.replaceState(null, '', '/?tiledesk_projectid=url-project');

    service.initWidgetParamiters(globals, element);

    expect(globals.projectid).toBe('url-project');
    expect(http.get).toHaveBeenCalledWith('https://api.example/url-project/widgets', jasmine.any(Object));
  });

  it('stops before requesting project settings when no project ID is provided', () => {
    window['tiledeskSettings'] = {};

    expect(() => service.initWidgetParamiters(globals, element)).not.toThrow();

    expect(http.get).not.toHaveBeenCalled();
    expect(service.obsSettingsService.getValue()).not.toBe(true);
    expect(logger.error).toHaveBeenCalledWith(jasmine.stringMatching('project ID'));
  });

  it('keeps default main settings when the launcher is absent', () => {
    delete window['tiledesk'];
    globals.initDefafultParameters();
    service.globals = globals;
    const persistence = globals.persistence;
    const filterByRequester = globals.filterByRequester;

    expect(() => service.setMainParametersFromSettings(globals)).not.toThrow();

    expect(globals.persistence).toBe(persistence);
    expect(globals.filterByRequester).toBe(filterByRequester);
    expect(logger.error.calls.allArgs()).toEqual([]);
  });
});
