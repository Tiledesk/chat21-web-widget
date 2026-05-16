import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

import { UploadService } from 'src/chat21-core/providers/abstract/upload.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { NGXLogger } from 'ngx-logger';
import { MAX_WIDTH_IMAGES } from 'src/app/utils/constants';
import { ConversationContentComponent } from './conversation-content.component';

describe('ConversationContentComponent', () => {
  let component: ConversationContentComponent;
  let fixture: ComponentFixture<ConversationContentComponent>;
  let uploadState$: BehaviorSubject<any>;

  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  const uploadServiceStub = {
    BSStateUpload: new BehaviorSubject<any>(null),
    initialize: jasmine.createSpy('initialize'),
    upload: jasmine.createSpy('upload').and.resolveTo({ downloadURL: '', src: '' }),
    uploadFile: jasmine.createSpy('uploadFile').and.resolveTo({ downloadURL: '', src: '' }),
    uploadAsset: jasmine.createSpy('uploadAsset').and.resolveTo({ downloadURL: '', src: '' }),
    uploadProfile: jasmine.createSpy('uploadProfile').and.resolveTo({}),
    delete: jasmine.createSpy('delete').and.resolveTo({}),
    deleteFile: jasmine.createSpy('deleteFile').and.resolveTo({}),
    deleteAsset: jasmine.createSpy('deleteAsset').and.resolveTo({}),
    deleteProfile: jasmine.createSpy('deleteProfile').and.resolveTo({}),
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    getBaseUrl: jasmine.createSpy('getBaseUrl').and.returnValue(''),
  };

  beforeEach(async () => {
    LoggerInstance.setInstance(customLogger);

    await TestBed.configureTestingModule({
      declarations: [ConversationContentComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceStub },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(ConversationContentComponent, {
        set: {
          template: `
            <div class="c21-body">
              <div #scrollMe>
                <div id="c21-contentScroll" style="height:20px;">inner</div>
              </div>
            </div>
          `,
        },
      })
      .compileComponents();

    uploadState$ = uploadServiceStub.BSStateUpload as BehaviorSubject<any>;
    fixture = TestBed.createComponent(ConversationContentComponent);
    component = fixture.componentInstance;
    component.messages = [];
    component.stylesMap = new Map([
      ['bubbleSentTextColor', '#111'],
      ['bubbleReceivedTextColor', '#222'],
    ]);
    component.translationMap = new Map([['LABEL_LOADING', 'Loading']]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to upload progress', () => {
      spyOn(component, 'scrollToBottom');
      uploadState$.next({ upload: 50, type: 'image/png' });
      expect(component.showUploadProgress).toBe(true);
      expect(component.uploadProgress).toBe(50);
      expect(component.scrollToBottom).toHaveBeenCalled();
    });

    it('should hide progress when upload is complete (100 or NaN)', () => {
      uploadState$.next({ upload: 100, type: 'image/png' });
      expect(component.showUploadProgress).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should set CSS variables on .c21-body from stylesMap', () => {
      const body = (fixture.debugElement.nativeElement as HTMLElement).querySelector('.c21-body') as HTMLElement;
      spyOn(body.style, 'setProperty');
      component.ngOnChanges({
        stylesMap: new SimpleChange(null, component.stylesMap, true),
      });
      expect(body.style.setProperty).toHaveBeenCalledWith('--textColorSent', '#111');
      expect(body.style.setProperty).toHaveBeenCalledWith('--textColorReceive', '#222');
    });
  });

  describe('getMetadataSize', () => {
    it('should default width/height and scale wide images', () => {
      const meta: any = { width: MAX_WIDTH_IMAGES * 2, height: 100 };
      const s = component.getMetadataSize(meta);
      expect(s.width).toBe(MAX_WIDTH_IMAGES);
      const ratio = meta.width / meta.height;
      expect(s.height).toBeCloseTo(MAX_WIDTH_IMAGES / ratio, 5);
    });

    it('should fill missing dimensions', () => {
      const s = component.getMetadataSize({});
      expect(s.width).toBe('100%');
      expect(s.height).toBe(MAX_WIDTH_IMAGES);
    });
  });

  describe('scroll and badge', () => {
    beforeEach(() => {
      const scrollHost = document.createElement('div');
      scrollHost.style.height = '100px';
      scrollHost.style.overflow = 'auto';
      const inner = document.createElement('div');
      inner.style.height = '300px';
      scrollHost.appendChild(inner);
      component.scrollMe = { nativeElement: scrollHost } as any;
    });

    it('onScroll should emit true at bottom', () => {
      spyOn(component.onScrollContent, 'emit');
      const el = component.scrollMe.nativeElement;
      el.scrollTop = el.scrollHeight - el.clientHeight;
      component.onScroll({ target: el });
      expect(component.onScrollContent.emit).toHaveBeenCalledWith(true);
    });

    it('checkContentScrollPosition should return false when not at bottom', () => {
      spyOn(component, 'checkContentScrollPosition').and.callThrough();
      const el = component.scrollMe.nativeElement;
      Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 500 });
      Object.defineProperty(el, 'clientHeight', { configurable: true, value: 100 });
      el.scrollTop = 0;
      expect(component.checkContentScrollPosition(el)).toBe(false);
    });

    it('scrollToBottom should emit onScrollContent true', fakeAsync(() => {
      const wrap = document.createElement('div');
      wrap.style.height = '40px';
      wrap.style.overflow = 'auto';
      const inner = document.createElement('div');
      inner.id = 'c21-contentScroll';
      inner.style.height = '200px';
      wrap.appendChild(inner);
      document.body.appendChild(wrap);
      spyOn(component.onScrollContent, 'emit');
      component.scrollToBottom(true);
      tick(0);
      expect(component.onScrollContent.emit).toHaveBeenCalledWith(true);
      document.body.removeChild(wrap);
    }));
  });

  describe('emitters', () => {
    it('hideOutsideElements should close menus', () => {
      spyOn(component.onMenuOptionShow, 'emit');
      spyOn(component.onEmojiiPickerShow, 'emit');
      component.hideOutsideElements();
      expect(component.onMenuOptionShow.emit).toHaveBeenCalledWith(false);
      expect(component.onEmojiiPickerShow.emit).toHaveBeenCalledWith(false);
    });

    it('onAttachmentButtonClickedFN should forward event', () => {
      spyOn(component.onAttachmentButtonClicked, 'emit');
      const ev = { a: 1 };
      component.onAttachmentButtonClickedFN(ev);
      expect(component.onAttachmentButtonClicked.emit).toHaveBeenCalledWith(ev);
    });

    it('onBeforeMessageRenderFN / onAfterMessageRenderFN should emit', () => {
      spyOn(component.onBeforeMessageRender, 'emit');
      spyOn(component.onAfterMessageRender, 'emit');
      const ev = { x: 'y' };
      component.onBeforeMessageRenderFN(ev);
      component.onAfterMessageRenderFN(ev);
      expect(component.onBeforeMessageRender.emit).toHaveBeenCalledWith(ev);
      expect(component.onAfterMessageRender.emit).toHaveBeenCalledWith(ev);
    });

    it('onElementRenderedFN with status should call scrollToBottom', () => {
      spyOn(component, 'scrollToBottom');
      component.scrollMe = { nativeElement: document.createElement('div') } as any;
      component.onElementRenderedFN({ status: true });
      expect(component.scrollToBottom).toHaveBeenCalled();
    });

    it('onElementRenderedFN with status false should not scroll', () => {
      spyOn(component, 'scrollToBottom');
      component.scrollMe = { nativeElement: document.createElement('div') } as any;
      component.onElementRenderedFN({ status: false });
      expect(component.scrollToBottom).not.toHaveBeenCalled();
    });
  });

  describe('upload observable edge cases', () => {
    it('should ignore null BSStateUpload payloads', () => {
      component.showUploadProgress = true;
      uploadState$.next(null);
      expect(component.showUploadProgress).toBe(true);
    });

    it('should treat NaN upload as complete for progress UI', () => {
      uploadState$.next({ upload: NaN, type: 'image/png' });
      expect(component.showUploadProgress).toBe(false);
    });
  });

  describe('onScroll without ViewChild', () => {
    it('should not emit when scrollMe is missing', () => {
      spyOn(component.onScrollContent, 'emit');
      component.scrollMe = undefined as any;
      component.onScroll({ target: document.createElement('div') });
      expect(component.onScrollContent.emit).not.toHaveBeenCalled();
    });
  });

  describe('scrollToBottom error path (sync)', () => {
    it('should log when getElementById throws synchronously', () => {
      spyOn(document, 'getElementById').and.throwError('no-dom');
      spyOn((component as any).logger, 'error');
      component.scrollToBottom();
      expect((component as any).logger.error).toHaveBeenCalled();
    });
  });

  describe('message helper delegates', () => {
    it('isLastMessage / isSameSender / isFirstMessage use messages array', () => {
      component.messages = [
        { uid: 'm1', sender: 'alice' },
        { uid: 'm2', sender: 'alice' },
      ] as any;
      expect(component.isLastMessage('m2')).toBe(true);
      expect(component.isSameSender('alice', 1)).toBe(true);
      expect(component.isFirstMessage('alice', 0)).toBe(true);
    });
  });

  describe('getMetadataSize string width', () => {
    it('should not scale when width is non-numeric string', () => {
      const s = component.getMetadataSize({ width: '100%', height: 200 });
      expect(s.width).toBe('100%');
    });
  });

  describe('ngOnChanges styles edge', () => {
    it('should not touch DOM when bubble color keys are absent', () => {
      const spy = spyOn((component as any).elementRef.nativeElement, 'querySelector');
      component.stylesMap = new Map();
      component.ngOnChanges({
        stylesMap: new SimpleChange(null, component.stylesMap, false),
      });
      expect(spy).not.toHaveBeenCalled();
    });
  });

});
