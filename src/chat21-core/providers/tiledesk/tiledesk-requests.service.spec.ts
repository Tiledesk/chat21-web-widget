import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';
import { AppStorageService } from '../abstract/app-storage.service';

import { TiledeskRequestsService } from './tiledesk-requests.service';

describe('TiledeskRequestsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TiledeskRequestsService, 
        AppStorageService],
      imports: [HttpClientTestingModule]
    });
  });

  it('should be created', inject([TiledeskRequestsService], (service: TiledeskRequestsService) => {
    expect(service).toBeTruthy();
  }));
});
