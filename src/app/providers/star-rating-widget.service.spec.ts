import { AppConfigService } from './app-config.service';
import { Globals } from '../utils/globals';
import { TestBed, inject } from '@angular/core/testing';

import { StarRatingWidgetService } from './star-rating-widget.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('StarRatingWidgetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        StarRatingWidgetService,
        Globals,
        AppConfigService,
        provideHttpClient(withInterceptorsFromDi())
    ]
});
  });

  it('should be created', inject([StarRatingWidgetService], (service: StarRatingWidgetService) => {
    expect(service).toBeTruthy();
  }));
});
