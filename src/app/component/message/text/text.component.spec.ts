import { HtmlEntitiesEncodePipe } from './../../../pipe/html-entities-encode.pipe';
import { MarkedPipe } from './../../../pipe/marked.pipe';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

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

  it('should render streaming words with the same marked paragraph class as static text', () => {
    component.streamingWords = [
      { word: 'Hello', index: 0 },
      { word: 'world', index: 1 },
    ];
    fixture.detectChanges();
    const root: ShadowRoot = fixture.nativeElement.shadowRoot;
    const p = root.querySelector('p.message_innerhtml.marked');
    expect(p).toBeTruthy();
    expect(p.textContent).toContain('Hello');
    expect(p.querySelectorAll('.stream-word').length).toBe(2);
  });
});
