import { Injectable, NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';
import { ConversationModel } from 'src/chat21-core/models/conversation';
import { ImageRepoService } from 'src/chat21-core/providers/abstract/image-repo.service';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { EventsService } from '../../providers/events.service';
import { HtmlEntitiesEncodePipe } from '../../pipe/html-entities-encode.pipe';
import { MarkedPipe } from '../../pipe/marked.pipe';
import { Globals } from '../../utils/globals';
import { MIN_WIDTH_IMAGES } from '../../utils/constants';
import { LastMessageComponent } from './last-message.component';

@Injectable()
class ImageRepoStub extends ImageRepoService {
  getImagePhotoUrl(): string {
    return '';
  }
  checkImageExists(_uid: string, callback: (exist: boolean) => void): void {
    callback(false);
  }
}

describe('LastMessageComponent', () => {
  let fixture: ComponentFixture<LastMessageComponent>;
  let component: LastMessageComponent;
  let globals: Globals;
  let events: EventsService;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);

  function makeConversation(overrides: Partial<ConversationModel> = {}): ConversationModel {
    return {
      uid: 'conv-1',
      attributes: {},
      channel_type: 'direct',
      conversation_with_fullname: 'Agent',
      conversation_with: 'agent-1',
      recipient: 'user-1',
      recipient_fullname: 'User',
      image: '',
      is_new: true,
      last_message_text: 'Messaggio mock in anteprima',
      text: '',
      sender: 'agent-1',
      senderAuthInfo: null,
      sender_fullname: 'Agent Name',
      status: '200',
      timestamp: '1',
      selected: false,
      color: '',
      avatar: '',
      archived: false,
      type: 'text',
      sound: true,
      ...overrides,
    } as ConversationModel;
  }

  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(new CustomLogger(ngxlogger));
    TestBed.configureTestingModule({
      declarations: [LastMessageComponent, MarkedPipe, HtmlEntitiesEncodePipe],
      providers: [Globals, EventsService, { provide: ImageRepoService, useClass: ImageRepoStub }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LastMessageComponent);
    component = fixture.componentInstance;
    globals = TestBed.inject(Globals);
    events = TestBed.inject(EventsService);
    globals.initDefafultParameters();
    globals.senderId = 'user-1';
    globals.isOpen = false;
    globals.isOpenNewMessage = true;
    spyOn(globals, 'setWidgetPreviewContainerSize').and.stub();
    component.baseLocation = 'https://widget.test/';
    component.stylesMap = new Map([['bubbleReceivedTextColor', '#111']]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('con widget chiuso (isOpen=false) e anteprima attiva: mostra il bubble con il testo del messaggio mockato', fakeAsync(() => {
    const conv = makeConversation();
    component.conversation = conv;
    component.ngOnChanges({
      conversation: new SimpleChange(undefined, conv, true),
    });
    fixture.detectChanges();

    const preview = fixture.debugElement.query(By.css('#messagePreview'));
    expect(preview).toBeTruthy();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].text).toContain('Messaggio mock in anteprima');
    expect(globals.isOpen).toBe(false);
    flush();
  }));

  it('closeMessagePreview azzera conversazione, isOpenNewMessage e emette onCloseMessagePreview', () => {
    const conv = makeConversation();
    component.conversation = conv;
    component.ngOnChanges({ conversation: new SimpleChange(undefined, conv, true) });
    fixture.detectChanges();

    spyOn(component.onCloseMessagePreview, 'emit');
    component.closeMessagePreview();
    expect(component.conversation).toBeNull();
    expect(globals.isOpenNewMessage).toBe(false);
    expect(component.onCloseMessagePreview.emit).toHaveBeenCalled();
  });

  it('openConversationByID emette onSelectedConversation e azzera isOpenNewMessage', () => {
    const conv = makeConversation();
    spyOn(component.onSelectedConversation, 'emit');
    component.openConversationByID(conv);
    expect(component.onSelectedConversation.emit).toHaveBeenCalledWith(conv as any);
    expect(globals.isOpenNewMessage).toBe(false);
    expect(component.conversation).toBeNull();
  });

  it('onAttachmentButtonClicked apre la conversazione e pubblica lastMessage:attachmentButtonClicked', fakeAsync(() => {
    spyOn(events, 'publish');
    const conv = makeConversation({
      attributes: { attachment: { a: 1 } },
      last_message_text: 'file',
    });
    component.conversation = conv;
    component.ngOnChanges({ conversation: new SimpleChange(undefined, conv, true) });
    fixture.detectChanges();

    const payload = { kind: 'test' };
    component.onAttachmentButtonClicked(payload);
    tick(600);
    expect(events.publish).toHaveBeenCalledWith('lastMessage:attachmentButtonClicked', payload);
  }));

  it('conversation con attributes.commands usa addCommandMessage', fakeAsync(() => {
    const conv = makeConversation({
      attributes: {
        commands: [
          {
            type: 'message',
            message: { text: ' cmd-a ', type: 'text', metadata: {} },
          },
          { type: 'wait', time: 5 },
          {
            type: 'message',
            message: { text: ' cmd-b ', type: 'text', metadata: {} },
          },
        ],
      },
      last_message_text: 'ignored',
    });
    component.conversation = conv;
    component.ngOnChanges({ conversation: new SimpleChange(undefined, conv, true) });
    tick(0);
    expect(component.messages.length).toBe(1);
    tick(5);
    expect(component.messages.length).toBe(2);
    expect(component.messages[0].text).toContain('cmd-a');
    expect(component.messages[1].text).toContain('cmd-b');
  }));

  it('getMetadataSize scala larghezza oltre il massimo', () => {
    const meta = { width: 400, height: 100 };
    const out = component.getMetadataSize(meta);
    expect(out.width).toBe(230);
    expect(out.height).toBeLessThan(100);
  });

  it('getMetadataSize alza immagini molto strette al minimo', () => {
    const meta = { width: 40, height: 80 };
    const out = component.getMetadataSize(meta);
    expect(out.width).toBe(MIN_WIDTH_IMAGES);
  });

  it('getMetadataSize scala altezza oltre il massimo verticale', () => {
    const meta = { width: 100, height: 400 };
    const out = component.getMetadataSize(meta);
    expect(out.height).toBe(150);
  });

  it('isSameSender delega a utils-message', () => {
    component.messages = [{ sender: 'a' } as any, { sender: 'a' } as any];
    expect(component.isSameSender('a', 1)).toBe(true);
  });

  it('onElementRenderedFN con messaggi renderizzati agenda setWidgetPreviewContainerSize', fakeAsync(() => {
    const conv = makeConversation();
    component.conversation = conv;
    component.ngOnChanges({ conversation: new SimpleChange(undefined, conv, true) });
    fixture.detectChanges();
    component.onElementRenderedFN({});
    tick(100);
    flush();
    expect(globals.setWidgetPreviewContainerSize).toHaveBeenCalled();
  }));

  it('ngOnDestroy pulisce stato', () => {
    const conv = makeConversation();
    component.conversation = conv;
    component.messages = [{} as any];
    globals.isOpenNewMessage = true;
    component.ngOnDestroy();
    expect(component.conversation).toBeNull();
    expect(globals.isOpenNewMessage).toBe(false);
    expect(component.messages.length).toBe(0);
  });

  it('unsubscribe svuota subscriptions', () => {
    const sub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    component.subscriptions = [sub];
    component.unsubscribe();
    expect(sub.unsubscribe).toHaveBeenCalled();
    expect(component.subscriptions.length).toBe(0);
  });
});
