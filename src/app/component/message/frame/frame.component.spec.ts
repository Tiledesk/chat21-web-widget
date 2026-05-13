import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { FrameComponent } from './frame.component';

describe('FrameComponent', () => {
  let component: FrameComponent;
  let fixture: ComponentFixture<FrameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FrameComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FrameComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.metadata = { src: 'https://www.example.com/embed' };
    component.width = 400;
    component.height = 300;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnInit should trust resource URL when metadata.src present', () => {
    component.metadata = { src: 'https://player.example/v/1' };
    component.ngOnInit();
    expect(component.url).toBeTruthy();
    expect((component.url as any).changingThisBreaksApplicationSecurity).toBe('https://player.example/v/1');
  });

  it('ngOnInit should leave url null when metadata missing src', () => {
    component.metadata = {};
    component.ngOnInit();
    expect(component.url).toBeNull();
  });

  it('onLoaded should clear loading and emit', () => {
    spyOn(component.onElementRendered, 'emit');
    component.loading = true;
    component.onLoaded({} as any);
    expect(component.loading).toBe(false);
    expect(component.onElementRendered.emit).toHaveBeenCalledWith({ element: 'frame', status: true });
  });

  it('ngOnDestroy should clear trusted url', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    component.url = sanitizer.bypassSecurityTrustResourceUrl('https://x');
    component.ngOnDestroy();
    expect(component.url).toBeNull();
  });
});
