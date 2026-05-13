import { SimpleChange } from '@angular/core';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SafeHtmlPipe } from './../../../pipe/safe-html.pipe';
import { HtmlComponent } from './html.component';

describe('HtmlComponent', () => {
  let component: HtmlComponent;
  let fixture: ComponentFixture<HtmlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HtmlComponent, SafeHtmlPipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges should set host CSS variables from inputs', () => {
    component.fontSize = '15px';
    component.themeColor = '#abc';
    component.foregroundColor = '#def';
    component.ngOnChanges({
      fontSize: new SimpleChange(null, '15px', true),
    });
    const host = fixture.nativeElement as HTMLElement;
    expect(host.style.getPropertyValue('--buttonFontSize').trim()).toBe('15px');
    expect(host.style.getPropertyValue('--themeColor').trim()).toBe('#abc');
    expect(host.style.getPropertyValue('--foregroundColor').trim()).toBe('#def');
  });

  it('should render htmlText as plain text in pre (XSS-safe)', () => {
    component.htmlText = '<script>bad()</script>';
    fixture.detectChanges();
    const pre = fixture.nativeElement.querySelector('pre');
    expect(pre?.textContent).toContain('<script>');
  });
});
