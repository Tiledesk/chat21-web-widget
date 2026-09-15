import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { MIN_WIDTH_IMAGES } from 'src/app/utils/constants';
import { ConversationPreviewComponent } from './conversation-preview.component';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { NGXLogger } from 'ngx-logger';

describe('ConversationPreviewComponent', () => {
  let component: ConversationPreviewComponent;
  let fixture: ComponentFixture<ConversationPreviewComponent>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  const imageAttachment = (name = 'a.png') => ({
    file: new File(['x'], name, { type: 'image/png' }),
    metadata: { width: 400, height: 200, type: 'image/png', uid: 'u1', src: 'blob:mock' },
  });

  beforeEach(waitForAsync(() => {
    LoggerInstance.setInstance(customLogger);
    TestBed.configureTestingModule({
      declarations: [ConversationPreviewComponent],
      imports: [FormsModule],
    })
      .overrideComponent(ConversationPreviewComponent, {
        set: {
          template: `
            <div #scrollMe id="c21-contentScroll-preview" style="height:39%">preview</div>
            <textarea id="chat21-main-message-context-preview" [(ngModel)]="textInputTextArea"></textarea>
          `,
        },
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationPreviewComponent);
    component = fixture.componentInstance;
    component.attachments = [imageAttachment()] as any;
    component.baseLocation = '';
    component.translationMap = new Map([['LABEL_PLACEHOLDER', 'Placeholder']]);
    component.stylesMap = new Map([['themeColor', '#000']]);
    component.textInputTextArea = '';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getMetadataSize', () => {
    it('should scale wide images to preview max width', () => {
      const s = component.getMetadataSize({ width: 500, height: 100 });
      expect(s.width).toBe(230);
      expect(s.height).toBeCloseTo(46, 5);
    });

    it('should bump very narrow images to MIN_WIDTH_IMAGES', () => {
      const s = component.getMetadataSize({ width: 40, height: 80 });
      expect(s.width).toBe(MIN_WIDTH_IMAGES);
    });

    it('should cap tall images by max preview height', () => {
      const s = component.getMetadataSize({ width: 100, height: 400 });
      expect(s.height).toBe(150);
    });

    it('should default undefined metadata then cap tall square to preview max height', () => {
      const s = component.getMetadataSize({});
      // Both sides start at 230; height branch caps at 150 and scales width to match aspect ratio.
      expect(s.height).toBe(150);
      expect(s.width).toBe(150);
    });
  });

  describe('readAsDataURL', () => {
    it('should set fileSelected for raster images', () => {
      component.fileSelected = undefined as any;
      component.readAsDataURL(imageAttachment());
      expect(component.fileSelected).toBeDefined();
      expect(component.sizeImage).toBeDefined();
    });

    it('should sanitize SVG src', () => {
      const svg = {
        file: new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }),
        metadata: { width: 10, height: 10, type: 'image/svg+xml', uid: 's1', src: 'data:image/svg+xml;base64,PHN2Zy8+' },
      };
      component.fileSelected = undefined as any;
      component.readAsDataURL(svg);
      expect(component.fileSelected).toBeDefined();
    });

    it('should route non-image files to createFile', () => {
      spyOn(component, 'createFile').and.returnValue(Promise.resolve());
      const pdf = {
        file: new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }),
        metadata: { uid: 'p1', type: 'application/pdf' },
      };
      component.readAsDataURL(pdf);
      expect(component.createFile).toHaveBeenCalledWith(pdf);
    });
  });

  describe('createFile', () => {
    it('should request placeholder asset from baseLocation', async () => {
      const blob = new Blob(['x'], { type: 'image/png' });
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ blob: () => Promise.resolve(blob) } as Response));
      component.baseLocation = 'https://app.test';
      const att = {
        file: new File(['z'], 'note.txt', { type: 'text/plain' }),
        metadata: { uid: 'f1', type: 'text/plain' },
      };
      await component.createFile(att);
      expect(window.fetch).toHaveBeenCalledWith('https://app.test/assets/images/file-alt-solid.png');
    });
  });

  describe('keyboard and actions', () => {
    it('onkeydown Escape should close modal', () => {
      spyOn(component.onCloseModalPreview, 'emit');
      component.onkeydown({ which: 27, keyCode: 27 } as KeyboardEvent);
      expect(component.onCloseModalPreview.emit).toHaveBeenCalled();
    });

    it('onkeydown Enter with text should emit send and restore', () => {
      spyOn(component.onSendAttachment, 'emit');
      spyOn(component as any, 'restoreTextArea');
      const ta = fixture.debugElement.query(By.css('#chat21-main-message-context-preview')).nativeElement as HTMLTextAreaElement;
      ta.value = ' caption ';
      const ev = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13 });
      spyOn(ev, 'preventDefault');
      component.onkeydown(ev);
      expect(ev.preventDefault).toHaveBeenCalled();
      expect(component.onSendAttachment.emit).toHaveBeenCalledWith(' caption ');
      expect((component as any).restoreTextArea).toHaveBeenCalled();
    });

    it('onkeydown Enter with only whitespace should not emit', () => {
      spyOn(component.onSendAttachment, 'emit');
      const ta = fixture.debugElement.query(By.css('#chat21-main-message-context-preview')).nativeElement as HTMLTextAreaElement;
      ta.value = '   ';
      component.onkeydown({ which: 13, keyCode: 13, preventDefault: () => {} } as any);
      expect(component.onSendAttachment.emit).not.toHaveBeenCalled();
    });

    it('onClickClose should emit', () => {
      spyOn(component.onCloseModalPreview, 'emit');
      component.onClickClose();
      expect(component.onCloseModalPreview.emit).toHaveBeenCalled();
    });

    it('onSendPressed should emit current model text', () => {
      spyOn(component.onSendAttachment, 'emit');
      component.textInputTextArea = 'hi';
      component.onSendPressed(new Event('click'));
      expect(component.onSendAttachment.emit).toHaveBeenCalledWith('hi');
    });
  });

  describe('textarea sizing', () => {
    it('onTextAreaChange should call resize helpers', () => {
      spyOn(component, 'resizeInputField');
      spyOn(component, 'resizeModalHeight');
      component.onTextAreaChange();
      expect(component.resizeInputField).toHaveBeenCalled();
      expect(component.resizeModalHeight).toHaveBeenCalled();
    });

    it('resizeInputField should grow with multiline content', () => {
      const ta = fixture.debugElement.query(By.css('#chat21-main-message-context-preview')).nativeElement as HTMLTextAreaElement;
      ta.value = 'a\nb\nc';
      ta.style.height = '20px';
      Object.defineProperty(ta, 'scrollHeight', { configurable: true, value: 80 });
      Object.defineProperty(ta, 'offsetHeight', { configurable: true, value: 20 });
      component.resizeInputField();
      expect(parseInt(ta.style.height, 10)).toBeGreaterThan(20);
    });

    it('resizeModalHeight should adjust host when textarea grows', () => {
      const ta = fixture.debugElement.query(By.css('#chat21-main-message-context-preview')).nativeElement as HTMLTextAreaElement;
      ta.style.height = '40px';
      component.scrollMe = { nativeElement: { style: { height: '' } } } as any;
      component.resizeModalHeight();
      expect((component.scrollMe.nativeElement.style.height as string).length).toBeGreaterThan(0);
    });
  });

  describe('onImageRenderedFN', () => {
    it('should clear pending load flag', () => {
      component.isFilePendingToLoad = true;
      component.onImageRenderedFN({});
      expect(component.isFilePendingToLoad).toBe(false);
    });
  });

  describe('onPaste', () => {
    it('should call resizeInputField', () => {
      spyOn(component, 'resizeInputField');
      component.onPaste(new ClipboardEvent('paste'));
      expect(component.resizeInputField).toHaveBeenCalled();
    });
  });
});
