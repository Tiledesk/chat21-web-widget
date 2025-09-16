import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { Globals } from './../utils/globals';
import { TestBed, inject } from '@angular/core/testing';

import { WaitingService } from './waiting.service';

describe('WaitingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        WaitingService,
        Globals,
        AppConfigService,
        provideHttpClient(withInterceptorsFromDi())
    ]
});
  });

  it('should be created', inject([WaitingService], (service: WaitingService) => {
    expect(service).toBeTruthy();
  }));
});
