import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { LinkButtonComponent } from './link-button.component';

describe('LinkButtonComponent', () => {
  let component: LinkButtonComponent;
  let fixture: ComponentFixture<LinkButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LinkButtonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkButtonComponent);
    component = fixture.componentInstance;
    component.button = { value: 'Open', link: 'https://x.test', target: 'blank' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges should set CSS variables on .url', () => {
    component.fontSize = '12px';
    component.backgroundColor = '#aaa';
    component.textColor = '#bbb';
    component.hoverBackgroundColor = '#ccc';
    component.hoverTextColor = '#ddd';
    component.ngOnChanges({
      fontSize: new SimpleChange(null, '12px', true),
    });
    const el = fixture.nativeElement.querySelector('.url') as HTMLElement;
    expect(el.style.getPropertyValue('--buttonFontSize').trim()).toBe('12px');
  });

  it('actionButtonUrl should emit when link set', () => {
    spyOn(component.onButtonClicked, 'emit');
    component.actionButtonUrl();
    expect(component.onButtonClicked.emit).toHaveBeenCalled();
  });

  it('actionButtonUrl should not emit when link empty', () => {
    component.button = { value: 'x', link: '' };
    spyOn(component.onButtonClicked, 'emit');
    component.actionButtonUrl();
    expect(component.onButtonClicked.emit).not.toHaveBeenCalled();
  });

  it('should render external icon when target is not self', () => {
    component.button = { value: 'L', link: 'u', target: 'blank' };
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.icon-button-action'))).toBeTruthy();
  });

  it('should render self icon when target is self', () => {
    component.button = { value: 'L', link: 'u', target: 'self' };
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.icon-button-action-self'))).toBeTruthy();
  });

  it('mouseover and mouseout should not throw', () => {
    expect(() => component.onMouseOver({} as any)).not.toThrow();
    expect(() => component.onMouseOut({} as any)).not.toThrow();
  });
});
