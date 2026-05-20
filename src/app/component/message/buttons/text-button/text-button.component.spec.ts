import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TextButtonComponent } from './text-button.component';

describe('TextButtonComponent', () => {
  let component: TextButtonComponent;
  let fixture: ComponentFixture<TextButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TextButtonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextButtonComponent);
    component = fixture.componentInstance;
    component.button = { value: 'Reply' };
    component.isConversationArchived = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges should set CSS variables on .text', () => {
    component.fontSize = '13px';
    component.backgroundColor = '#111';
    component.textColor = '#222';
    component.hoverBackgroundColor = '#333';
    component.hoverTextColor = '#444';
    component.ngOnChanges({
      fontSize: new SimpleChange(null, '13px', true),
    });
    const el = fixture.nativeElement.querySelector('.text') as HTMLElement;
    expect(el.style.getPropertyValue('--buttonFontSize').trim()).toBe('13px');
  });

  it('actionButtonText should emit click payload', () => {
    spyOn(component.onButtonClicked, 'emit');
    component.actionButtonText();
    expect(component.onButtonClicked.emit).toHaveBeenCalled();
  });

  it('click on template should invoke actionButtonText', () => {
    spyOn(component, 'actionButtonText');
    fixture.debugElement.query(By.css('.text')).triggerEventHandler('click', {});
    expect(component.actionButtonText).toHaveBeenCalled();
  });

  it('should add disabled class when conversation archived', () => {
    component.isConversationArchived = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.text').classList.contains('disabled')).toBe(true);
  });

  it('mouseover and mouseout should not throw', () => {
    expect(() => component.onMouseOver({} as any)).not.toThrow();
    expect(() => component.onMouseOut({} as any)).not.toThrow();
  });
});
