import { SafeHtmlPipe } from './../../../pipe/safe-html.pipe';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlComponent } from './html.component';

describe('HtmlComponent', () => {
  let component: HtmlComponent;
  let fixture: ComponentFixture<HtmlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        HtmlComponent,
        SafeHtmlPipe
       ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
