import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Globals } from '../utils/globals';

import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientModule,
    ],
    providers: [
      Globals
    ]
  }));

  it('should be created', () => {
    const service: AppConfigService = TestBed.get(AppConfigService);
    expect(service).toBeTruthy();
  });
});
