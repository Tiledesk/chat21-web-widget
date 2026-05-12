import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ScriptService } from './script.service';

describe('ScriptService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScriptService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
  });

  it('should be created', () => {
    const service = TestBed.inject(ScriptService);
    expect(service).toBeTruthy();
  });
});
