import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ActionButtonComponent } from './action-button.component';

describe('ActionButtonComponent', () => {
  let component: ActionButtonComponent;
  let fixture: ComponentFixture<ActionButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ActionButtonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionButtonComponent);
    component = fixture.componentInstance;
    component.button = { value: 'OK', action: 'go' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges should map theme CSS variables onto .action', () => {
    component.fontSize = '16px';
    component.backgroundColor = '#111';
    component.textColor = '#222';
    component.hoverBackgroundColor = '#333';
    component.hoverTextColor = '#444';
    component.ngOnChanges({
      fontSize: new SimpleChange(null, '16px', true),
    });
    const el = fixture.nativeElement.querySelector('.action') as HTMLElement;
    expect(el.style.getPropertyValue('--buttonFontSize').trim()).toBe('16px');
    expect(el.style.getPropertyValue('--buttonBackgroundColor').trim()).toBeTruthy();
  });

  it('actionButtonAction should emit when action present', fakeAsync(() => {
    spyOn(component.onButtonClicked, 'emit');
    const de = fixture.debugElement.query(By.css('.action'));
    de.triggerEventHandler('click', {});
    tick(500);
    expect(component.onButtonClicked.emit).toHaveBeenCalled();
  }));

  it('actionButtonAction should no-op when button has no action', () => {
    component.button = { value: 'X', action: '' };
    fixture.detectChanges();
    spyOn(component.onButtonClicked, 'emit');
    component.actionButtonAction();
    expect(component.onButtonClicked.emit).not.toHaveBeenCalled();
  });

  it('mouseover and mouseout should not throw', () => {
    expect(() => component.onMouseOver({} as any)).not.toThrow();
    expect(() => component.onMouseOut({} as any)).not.toThrow();
  });

  it('template should mark archived conversations as disabled', () => {
    component.isConversationArchived = true;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.action');
    expect(el.classList.contains('disabled')).toBe(true);
  });
});
