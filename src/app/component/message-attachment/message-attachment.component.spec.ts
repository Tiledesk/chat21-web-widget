import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MessageModel } from 'src/chat21-core/models/message';
import { ActionButtonComponent } from '../message/buttons/action-button/action-button.component';
import { LinkButtonComponent } from '../message/buttons/link-button/link-button.component';
import { TextButtonComponent } from '../message/buttons/text-button/text-button.component';

import { MessageAttachmentComponent } from './message-attachment.component';

function makeMessageWithAttachment(buttons: any[]): MessageModel {
  return new MessageModel(
    'm1',
    'it',
    'r1',
    'Recipient',
    's1',
    'Sender',
    200,
    {},
    'testo',
    Date.now(),
    'text',
    {
      attachment: {
        type: 'template',
        buttons,
      },
    },
    'chat',
    true,
    false,
  );
}

describe('MessageAttachmentComponent', () => {
  let component: MessageAttachmentComponent;
  let fixture: ComponentFixture<MessageAttachmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [
        MessageAttachmentComponent,
        LinkButtonComponent,
        TextButtonComponent,
        ActionButtonComponent,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageAttachmentComponent);
    component = fixture.componentInstance;
    component.isConversationArchived = false;
    component.isLastMessage = true;
    component.fullscreenMode = false;
    component.limit = 5;
    component.stylesMap = new Map<string, string>([
      ['buttonFontSize', '14px'],
      ['buttonBackgroundColor', '#eee'],
      ['buttonTextColor', '#111'],
      ['buttonHoverBackgroundColor', '#ddd'],
      ['buttonHoverTextColor', '#000'],
    ]);
  });

  it('should create', () => {
    component.message = makeMessageWithAttachment([]);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('getAttachmentButton should read type and buttons from message.attributes.attachment', () => {
    component.message = makeMessageWithAttachment([
      { type: 'text', value: 'OK' },
      { type: 'url', value: 'Apri', link: 'https://example.com' },
    ]);
    component.ngOnInit();
    expect(component.type).toBe('template');
    expect((component.buttons as unknown as any[]).length).toBe(2);
  });

  it('should render text and url attachment buttons in DOM when isLastMessage is true for text', () => {
    component.message = makeMessageWithAttachment([
      { type: 'text', value: 'Conferma' },
      { type: 'url', value: 'Vai', link: 'https://example.com', target: '_blank' },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('#buttons-in-message') as HTMLElement;
    expect(root).toBeTruthy();
    expect(fixture.nativeElement.querySelector('chat-text-button-attachment')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('chat-link-button-attachment')).toBeTruthy();
    const textBtn = fixture.nativeElement.querySelector('chat-text-button-attachment .text') as HTMLElement;
    expect(textBtn.textContent?.trim()).toContain('Conferma');
  });

  it('should respect limit via slice (only first button when limit is 1)', () => {
    component.limit = 1;
    component.message = makeMessageWithAttachment([
      { type: 'text', value: 'A' },
      { type: 'text', value: 'B' },
    ]);
    fixture.detectChanges();
    const textButtons = fixture.nativeElement.querySelectorAll('chat-text-button-attachment');
    expect(textButtons.length).toBe(1);
  });

  it('should hide text and action buttons when isLastMessage is false', () => {
    component.isLastMessage = false;
    component.message = makeMessageWithAttachment([
      { type: 'text', value: 'Nascosto' },
      { type: 'url', value: 'Visibile', link: 'https://x.com' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('chat-text-button-attachment')).toBeNull();
    expect(fixture.nativeElement.querySelector('chat-link-button-attachment')).toBeTruthy();
  });

  it('returnOnAttachmentButtonClicked should emit structured event when target exists', () => {
    component.message = makeMessageWithAttachment([{ type: 'text', value: 'X' }]);
    fixture.detectChanges();
    spyOn(component.onAttachmentButtonClicked, 'emit');
    const inner = fixture.debugElement.query(By.css('chat-text-button-attachment .text'));
    inner.triggerEventHandler('click', {});
    expect(component.onAttachmentButtonClicked.emit).toHaveBeenCalled();
    const arg = (component.onAttachmentButtonClicked.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(arg.message).toBe(component.message);
    expect(arg.target).toBeTruthy();
  });

  it('returnOnAttachmentButtonClicked should not emit when event has no target', () => {
    component.message = makeMessageWithAttachment([{ type: 'text', value: 'X' }]);
    fixture.detectChanges();
    spyOn(component.onAttachmentButtonClicked, 'emit');
    component.returnOnAttachmentButtonClicked({} as any);
    expect(component.onAttachmentButtonClicked.emit).not.toHaveBeenCalled();
  });

  it('ngAfterViewInit should emit onElementRendered for attachment', () => {
    spyOn(component.onElementRendered, 'emit');
    component.message = makeMessageWithAttachment([{ type: 'url', value: 'L', link: 'https://a' }]);
    fixture.detectChanges();
    component.ngAfterViewInit();
    expect(component.onElementRendered.emit).toHaveBeenCalledWith({ element: 'attachment', status: true });
  });

  it('should render action button when type is action and isLastMessage', () => {
    component.message = makeMessageWithAttachment([{ type: 'action', value: 'Azione', action: 'reply' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('chat-action-button-attachment')).toBeTruthy();
  });
});
