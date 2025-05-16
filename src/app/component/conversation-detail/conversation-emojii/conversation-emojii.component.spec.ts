import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationEmojiiComponent } from './conversation-emojii.component';

describe('ConversationEmojiiComponent', () => {
  let component: ConversationEmojiiComponent;
  let fixture: ComponentFixture<ConversationEmojiiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConversationEmojiiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationEmojiiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
