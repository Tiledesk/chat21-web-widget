import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';
import { AppStorageService } from '../abstract/app-storage.service';

import { TiledeskRequestsService } from './tiledesk-requests.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TiledeskRequestsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        TiledeskRequestsService,
        AppStorageService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
  });

  it('should be created', inject([TiledeskRequestsService], (service: TiledeskRequestsService) => {
    expect(service).toBeTruthy();
  }));
});
