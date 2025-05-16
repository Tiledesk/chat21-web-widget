import { AppConfigService } from './app-config.service';
import { Globals } from '../utils/globals';
import { TestBed, inject } from '@angular/core/testing';

import { StarRatingWidgetService } from './star-rating-widget.service';
import { HttpClientModule } from '@angular/common/http';

describe('StarRatingWidgetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule
      ],
      providers: [
        StarRatingWidgetService,
        Globals,
        AppConfigService
      ]
    });
  });

  it('should be created', inject([StarRatingWidgetService], (service: StarRatingWidgetService) => {
    expect(service).toBeTruthy();
  }));
});
