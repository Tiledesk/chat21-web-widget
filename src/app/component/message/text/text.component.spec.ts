import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MarkedPipe } from '../../../pipe/marked.pipe';
import { TextComponent } from './text.component';

/**
 * Il template usa solo `| marked` su ciò che ritorna `printMessage(...)`:
 * `[innerHTML]="printMessage(text, messageEl, this) | marked"`
 * I test qui riproducono gli stessi use case (XSS / HTML grezzo / markdown) sulla pipeline reale del componente.
 */
describe('TextComponent (render via MarkedPipe)', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;
  let markedPipe: MarkedPipe;

  function shadowInnerHtml(): string {
    const host = fixture.nativeElement as HTMLElement;
    const root = host.shadowRoot;
    if (!root) {
      throw new Error('Expected ShadowDom root');
    }
    return (root.querySelector('.message_innerhtml') as HTMLElement).innerHTML;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TextComponent, MarkedPipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    markedPipe = new MarkedPipe();
    component.text = 'Msg text';
    component.color = 'black';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('printMessage should emit before and after and return text (input grezzo per la pipe)', () => {
    spyOn(component.onBeforeMessageRender, 'emit');
    spyOn(component.onAfterMessageRender, 'emit');
    const out = component.printMessage('Hello', {} as any, component);
    expect(out).toBe('Hello');
    expect(component.onBeforeMessageRender.emit).toHaveBeenCalled();
    expect(component.onAfterMessageRender.emit).toHaveBeenCalled();
  });

  it('should render message container with color style', () => {
    const host = fixture.nativeElement as HTMLElement;
    const el = host.shadowRoot!.querySelector('div.message_innerhtml') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.style.color).toBe('black');
  });

  describe('markdown (use case contenuto legittimo)', () => {
    it('should render heading and bold from markdown', () => {
      component.text = '# Title\n\n**Bold**';
      fixture.detectChanges();
      const html = shadowInnerHtml();
      expect(html).toMatch(/<h1|<h2/i);
      expect(html).toMatch(/<strong>|<b>/i);
    });

    it('should render unordered list from markdown', () => {
      component.text = '- uno\n- due';
      fixture.detectChanges();
      const html = shadowInnerHtml();
      expect(html).toMatch(/<ul/i);
      expect(html).toMatch(/<li/i);
    });

    it('should render safe https link with rel=noopener (MarkedPipe renderer)', () => {
      component.text = '[label](https://example.com/path)';
      fixture.detectChanges();
      const html = shadowInnerHtml();
      expect(html).toContain('https://example.com/path');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('target="_blank"');
    });
  });

  describe('sicurezza / anti code-injection (stesso use case, solo marked)', () => {
    it('should not leave raw script tags in DOM innerHTML', () => {
      component.text = '<script>alert(1)</script>testo';
      fixture.detectChanges();
      const html = shadowInnerHtml();
      expect(html.toLowerCase()).not.toContain('<script');
      expect(html).toContain('&lt;');
    });

    it('should escape inline HTML img/onerror so it is not a live <img> node', () => {
      component.text = 'Hi <img src=x onerror="alert(1)">';
      fixture.detectChanges();
      const html = shadowInnerHtml();
      expect(html.toLowerCase()).not.toContain('<img');
      expect(html).toContain('&lt;');
    });

    it('should not emit javascript: href for markdown link', () => {
      component.text = '[bad](javascript:void(0))';
      fixture.detectChanges();
      const html = shadowInnerHtml();
      expect(html).not.toMatch(/href=["']javascript:/i);
    });

    it('should not emit data: href for markdown link', () => {
      component.text = '[bad](data:text/html,<script>alert(1)</script>)';
      fixture.detectChanges();
      const html = shadowInnerHtml();
      expect(html).not.toMatch(/href=["']data:/i);
    });

    it('DOM innerHTML should match MarkedPipe applied to printMessage output (stessa pipeline del template)', () => {
      component.text = 'Line1\n\n**x**';
      fixture.detectChanges();
      const raw = component.printMessage(component.text, {} as any, component);
      const viaPipe = markedPipe.transform(raw) as string;
      expect(shadowInnerHtml()).toBe(viaPipe);
    });
  });
});
