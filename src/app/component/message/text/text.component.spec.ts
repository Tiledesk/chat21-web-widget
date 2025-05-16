import { HtmlEntitiesEncodePipe } from './../../../pipe/html-entities-encode.pipe';
import { MarkedPipe } from './../../../pipe/marked.pipe';
import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TextComponent } from './text.component';

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        TextComponent,
        MarkedPipe,
        HtmlEntitiesEncodePipe
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    component.text = 'Msg text'
    component.color= 'black'
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
