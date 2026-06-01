import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { ConversationEmojiiComponent } from './conversation-emojii.component';

/** Template references `stylesMap`, which is not declared on the component; use a shallow template for unit tests. */
describe('ConversationEmojiiComponent', () => {
  let component: ConversationEmojiiComponent;
  let fixture: ComponentFixture<ConversationEmojiiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConversationEmojiiComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(ConversationEmojiiComponent, {
        set: { template: '<span></span>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ConversationEmojiiComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialise default emoji-mart options', () => {
      component.ngOnInit();
      expect(component.emojiiOptions.emojiPerLine).toBe(9);
      expect(component.emojiiOptions.include).toContain('people');
    });
  });

  describe('addEmojiFN', () => {
    it('should emit addEmoji when picker selects an emoji', () => {
      let emitted: unknown;
      component.addEmoji.subscribe((e) => (emitted = e));
      const payload = { emoji: { native: '🙂' } };
      component.addEmojiFN(payload);
      expect(emitted).toEqual(payload);
    });

    it('should emit multiple selections to all subscribers', () => {
      const out: unknown[] = [];
      component.addEmoji.subscribe((e) => out.push(e));
      component.addEmoji.subscribe((e) => out.push(e));
      const p = { emoji: { native: '🎯' } };
      component.addEmojiFN(p);
      expect(out).toEqual([p, p]);
    });

    it('should forward undefined-like payloads without throwing', () => {
      spyOn(component.addEmoji, 'emit');
      component.addEmojiFN(undefined);
      expect(component.addEmoji.emit).toHaveBeenCalledWith(undefined);
    });
  });

  describe('@Input var', () => {
    it('should accept custom picker label', () => {
      component.var = 'picker-a';
      expect(component.var).toBe('picker-a');
    });
  });
});
