import { TestBed } from '@angular/core/testing';

import { CustomLogger } from './logger/customLogger';
import { LoggerInstance } from './logger/loggerInstance';
import { ChatManager } from './chat-manager';
import { ArchivedConversationsHandlerService } from './abstract/archivedconversations-handler.service';
import { ConversationsHandlerService } from './abstract/conversations-handler.service';
import { ConversationHandlerService } from './abstract/conversation-handler.service';

describe('ChatManager', () => {
  let convHandler: jasmine.SpyObj<ConversationsHandlerService>;
  let archivedHandler: jasmine.SpyObj<ArchivedConversationsHandlerService>;

  beforeEach(() => {
    const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
    LoggerInstance.setInstance(new CustomLogger(ngxlogger));
    convHandler = jasmine.createSpyObj('ConversationsHandlerService', ['dispose']);
    archivedHandler = jasmine.createSpyObj('ArchivedConversationsHandlerService', ['dispose']);

    TestBed.configureTestingModule({
      providers: [
        ChatManager,
        { provide: ConversationsHandlerService, useValue: convHandler },
        { provide: ArchivedConversationsHandlerService, useValue: archivedHandler },
      ],
    });
  });

  it('should initialize and track token and user', () => {
    const mgr = TestBed.inject(ChatManager);

    mgr.initialize();
    expect(mgr.getOpenInfoConversation()).toBeTrue();

    mgr.setTiledeskToken('tok');
    expect(mgr.getTiledeskToken()).toBe('tok');

    const user = { uid: 'u1' } as any;
    mgr.setCurrentUser(user);
    expect(mgr.getCurrentUser()).toBe(user);
  });

  it('startApp should emit on BSStart', () => {
    const mgr = TestBed.inject(ChatManager);
    const user = { uid: 'u1' } as any;
    mgr.setCurrentUser(user);
    mgr.startApp();
    expect(mgr.BSStart.getValue()).toBe(user);
  });

  it('should add and find conversation handler', () => {
    const mgr = TestBed.inject(ChatManager);
    mgr.initialize();

    const h = { conversationWith: 'cid-1' } as ConversationHandlerService;
    mgr.addConversationHandler(h);

    expect(mgr.getConversationHandlerByConversationId('cid-1')).toBe(h);
  });

  it('goOffLine should clear user and dispose handlers', () => {
    const mgr = TestBed.inject(ChatManager);
    mgr.initialize();
    mgr.setArchivedConversationsHandler(archivedHandler);
    mgr.setConversationsHandler(convHandler);
    mgr.goOffLine();

    expect(mgr.getCurrentUser()).toBeNull();
    expect(convHandler.dispose).toHaveBeenCalled();
    expect(archivedHandler.dispose).toHaveBeenCalled();
  });
});
