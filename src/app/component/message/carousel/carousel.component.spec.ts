import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TYPE_BUTTON } from 'src/chat21-core/utils/constants';

import { CarouselComponent } from './carousel.component';

describe('CarouselComponent', () => {
  let component: CarouselComponent;
  let fixture: ComponentFixture<CarouselComponent>;

  const btnA = { type: TYPE_BUTTON.TEXT, value: 'Go', action: '', link: '', text: 'x', active: false };
  const gallery = [
    { preview: { src: 'https://a/img.png' }, title: 'A', description: 'da', buttons: [btnA] },
    { preview: { src: 'https://b/img.png' }, title: 'B', description: 'db', buttons: [{ type: TYPE_BUTTON.TEXT, value: 'B2', action: 'a', text: 't', active: false }] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
    component.message = { attributes: { attachment: { gallery } } } as any;
    component.gallery = gallery;
    component.stylesMap = new Map<string, string>([
      ['buttonFontSize', '14px'],
      ['buttonBackgroundColor', '#111'],
      ['buttonTextColor', '#222'],
      ['buttonHoverBackgroundColor', '#333'],
      ['buttonHoverTextColor', '#444'],
    ]);
    component.isConversationArchived = false;
    component.isLastMessage = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.gallery.length).toBe(2);
  });

  it('ngOnChanges should apply style map to wrapper', () => {
    component.ngOnChanges({
      stylesMap: {
        previousValue: undefined,
        currentValue: component.stylesMap,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    const wrap = fixture.nativeElement.querySelector('.wrapper') as HTMLElement;
    expect(wrap.style.getPropertyValue('--buttonFontSize').trim()).toBe('14px');
  });

  it('goTo should bump activeElement for next and previous', () => {
    const carouselEl = component.carousel;
    spyOnProperty(carouselEl, 'offsetWidth', 'get').and.returnValue(400);
    const cards = carouselEl.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const card1 = cards[1] as HTMLElement;
    spyOnProperty(card1, 'offsetWidth', 'get').and.returnValue(180);
    const startEl = component.activeElement;
    component.goTo('next');
    expect(component.activeElement).toBe(startEl + 1);
    component.goTo('previous');
    expect(component.activeElement).toBe(startEl);
  });

  it('actionButtonClick should emit onAttachmentButtonClicked', () => {
    spyOn(component.onAttachmentButtonClicked, 'emit');
    const ev = { target: { classList: { add: jasmine.createSpy('add') } } };
    component.gallery = gallery;
    component.actionButtonClick(ev as any, btnA, 0);
    expect(component.onAttachmentButtonClicked.emit).toHaveBeenCalled();
    expect(btnA.active).toBe(true);
  });

  it('actionButtonClick should ignore empty button', () => {
    spyOn(component.onAttachmentButtonClicked, 'emit');
    const empty = { type: TYPE_BUTTON.TEXT, value: '', action: '', link: '', text: '', active: false };
    component.actionButtonClick({ target: { classList: { add: () => {} } } } as any, empty, 0);
    expect(component.onAttachmentButtonClicked.emit).not.toHaveBeenCalled();
  });

  it('arrow clicks should invoke goTo', () => {
    spyOn(component, 'goTo');
    component.activeElement = 1;
    component.gallery = gallery;
    fixture.detectChanges();
    const right = fixture.debugElement.query(By.css('.arrow.right'));
    expect(right).toBeTruthy();
    right!.triggerEventHandler('click', {});
    expect(component.goTo).toHaveBeenCalledWith('next');
  });

  it('TYPE_BUTTON should be exposed for template', () => {
    expect(component.TYPE_BUTTON).toBe(TYPE_BUTTON);
  });
});
