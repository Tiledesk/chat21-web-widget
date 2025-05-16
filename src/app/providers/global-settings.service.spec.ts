import { Globals } from './../utils/globals';
import { HttpClientModule } from '@angular/common/http';
import { TestBed, inject } from '@angular/core/testing';
import { AppStorageService } from '../../chat21-core/providers/abstract/app-storage.service';
import { AppConfigService } from './app-config.service';

import { GlobalSettingsService } from './global-settings.service';

describe('GlobalSettingsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
      ],
      providers: [
        GlobalSettingsService,
        AppStorageService,
        AppConfigService,
        Globals
      ]
    });
  });

  it('should be created', inject([GlobalSettingsService], (service: GlobalSettingsService) => {
    expect(service).toBeTruthy();
  }));
});
