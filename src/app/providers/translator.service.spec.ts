import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { Globals } from './../utils/globals';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TestBed, inject } from '@angular/core/testing';

import { TranslatorService } from './translator.service';

describe('TranslatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [TranslateModule.forRoot()],
    providers: [
        TranslatorService,
        Globals,
        AppConfigService,
        provideHttpClient(withInterceptorsFromDi())
    ]
});
  });

  it('should be created', inject([TranslatorService], (service: TranslatorService) => {
    expect(service).toBeTruthy();
  }));
});
