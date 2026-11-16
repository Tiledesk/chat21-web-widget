import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Globals } from '../utils/globals';

import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [],
    providers: [
        Globals,
        provideHttpClient(withXhr(), withInterceptorsFromDi())
    ]
}));

  it('should be created', () => {
    const service: AppConfigService = TestBed.inject(AppConfigService);
    expect(service).toBeTruthy();
  });
});
