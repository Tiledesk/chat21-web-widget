import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import * as FileSaver from 'file-saver';

import { ImageComponent } from './image.component';

describe('ImageComponent', () => {
  let component: ImageComponent;
  let fixture: ComponentFixture<ImageComponent>;

  const metadata = {
    height: 100,
    name: 'logo_fb.png',
    src: 'https://cdn.example.com/logo.png',
    type: 'image/png',
    uid: 'u1',
    width: 100,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ImageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageComponent);
    component = fixture.componentInstance;
    component.metadata = { ...metadata };
    component.width = 80;
    component.height = 80;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should run', () => {
    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('onLoaded should clear loading and emit', () => {
    spyOn(component.onElementRendered, 'emit');
    component.loading = true;
    component.onLoaded({} as any);
    expect(component.loading).toBe(false);
    expect(component.onElementRendered.emit).toHaveBeenCalledWith({ element: 'image', status: true });
  });

  it('downloadImage should call saveAs with explicit fileName', () => {
    spyOn(FileSaver, 'saveAs');
    component.downloadImage('https://cdn/x/a.png', 'out.png');
    expect(FileSaver.saveAs).toHaveBeenCalledWith('https://cdn/x/a.png', 'out.png');
  });

  it('downloadImage should derive fileName from URL when omitted', () => {
    spyOn(FileSaver, 'saveAs');
    const url = 'https://cdn/x/my%20file.png';
    component.downloadImage(url, null as any);
    expect(FileSaver.saveAs).toHaveBeenCalled();
    const name = (FileSaver.saveAs as jasmine.Spy).calls.mostRecent().args[1] as string;
    expect(name).toContain('my');
  });

  it('onClickImage onload should register keydown on iframe document and close on Escape', () => {
    const origCreate = document.createElement.bind(document);
    const origGetById = document.getElementById.bind(document);
    const fakeIframe: any = {
      setAttribute: jasmine.createSpy('setAttribute'),
      style: {},
      srcdoc: '',
      onload: null as null | ((ev: Event) => void),
    };
    spyOn(document, 'createElement').and.callFake((tag: string) => (tag === 'iframe' ? fakeIframe : origCreate(tag)));
    spyOn(document, 'getElementById').and.callFake((id: string) =>
      id === 'tiledesk-image-preview' ? fakeIframe : origGetById(id),
    );
    spyOn(document.body, 'appendChild').and.callFake((node: any) => {
      node.parentNode = document.body;
      return node;
    });
    spyOn(document.body, 'removeChild').and.stub();
    component.onClickImage();
    const docMock: any = {
      getElementById: jasmine.createSpy('getElementById').and.returnValue(null),
      addEventListener: jasmine.createSpy('addEventListener'),
    };
    fakeIframe.contentWindow = { document: docMock };
    expect(fakeIframe.onload).toBeTruthy();
    fakeIframe.onload({} as any);
    expect(docMock.addEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
    const keydownHandler = docMock.addEventListener.calls.mostRecent().args[1] as (e: KeyboardEvent) => void;
    keydownHandler({ key: 'Escape', keyCode: 27, preventDefault: jasmine.createSpy() } as any);
    expect(document.body.removeChild).toHaveBeenCalledWith(fakeIframe);
  });

  it('onClickImage should append iframe with preview markup', () => {
    const iframes: HTMLIFrameElement[] = [];
    const origCreate = document.createElement.bind(document);
    spyOn(document, 'createElement').and.callFake((tag: string) => {
      const el = origCreate(tag) as HTMLElement;
      if (tag === 'iframe') {
        iframes.push(el as HTMLIFrameElement);
      }
      return el;
    });
    spyOn(document.body, 'appendChild').and.callThrough();
    component.onClickImage();
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(iframes.length).toBe(1);
    expect(iframes[0].id).toBe('tiledesk-image-preview');
    expect(iframes[0].srcdoc).toContain('tiledesk-popup');
    expect(iframes[0].srcdoc).toContain(metadata.src);
    document.body.removeChild(iframes[0]);
  });

  it('img should expose alt from metadata name', () => {
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.getAttribute('alt')).toBe('logo_fb.png');
  });
});
