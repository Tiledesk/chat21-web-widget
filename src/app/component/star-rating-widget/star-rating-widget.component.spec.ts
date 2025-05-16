import { AppConfigService } from './../../providers/app-config.service';
import { StarRatingWidgetService } from './../../providers/star-rating-widget.service';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StarRatingWidgetComponent } from './star-rating-widget.component';
import { Globals } from '../../utils/globals';
import { HttpClientModule } from '@angular/common/http';

describe('StarRatingWidgetComponent', () => {
  let component: StarRatingWidgetComponent;
  let fixture: ComponentFixture<StarRatingWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StarRatingWidgetComponent ],
      imports: [
        HttpClientModule
      ],
      providers: [
        Globals,
        AppConfigService,
        StarRatingWidgetService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StarRatingWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
