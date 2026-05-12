import { A11yModule } from '@angular/cdk/a11y';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { Globals } from 'src/app/utils/globals';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

import { PrechatFormComponent } from './prechat-form.component';

@Component({
  selector: 'chat-form-builder',
  template: '',
})
class ChatFormBuilderStubComponent {
  @Input() formArray: unknown;
  @Input() isOpenPrechatForm: boolean;
  @Input() stylesMap: Map<string, string> | undefined;
  @Output() onSubmitForm = new EventEmitter<Record<string, string>>();
  @Output() onErrorRenderForm = new EventEmitter<void>();
}

describe('PrechatFormComponent', () => {
  let component: PrechatFormComponent;
  let fixture: ComponentFixture<PrechatFormComponent>;
  let g: Globals;
  let appStorage: jasmine.SpyObj<AppStorageService>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error']);
  const customLogger = new CustomLogger(ngxlogger);

  beforeEach(waitForAsync(() => {
    appStorage = jasmine.createSpyObj('AppStorageService', [
      'initialize',
      'getItem',
      'setItem',
      'getItemWithoutProjectID',
      'setItemWithoutProjectID',
      'removeItem',
      'clear',
    ]);

    TestBed.configureTestingModule({
      declarations: [PrechatFormComponent, ChatFormBuilderStubComponent],
      imports: [A11yModule, ReactiveFormsModule],
      providers: [
        Globals,
        FormBuilder,
        { provide: AppStorageService, useValue: appStorage },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    LoggerInstance.setInstance(customLogger);
    fixture = TestBed.createComponent(PrechatFormComponent);
    component = fixture.componentInstance;
    g = TestBed.inject(Globals);
    g.LABEL_COMPLETE_FORM = 'Complete form';
    g.attributes = { foo: 'bar' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onSubmitForm should persist attributes, merge preChatForm, and emit onCloseForm', () => {
    spyOn(component.onCloseForm, 'emit');
    const form = { userFullname: 'Jane Doe', userEmail: 'jane@example.com' };
    component.onSubmitForm(form);
    expect(g.attributes.userFullname).toBe('Jane Doe');
    expect(g.attributes.userEmail).toBe('jane@example.com');
    expect(g.attributes.preChatForm).toEqual(form);
    expect(appStorage.setItem).toHaveBeenCalledWith('attributes', jasmine.any(String));
    expect(component.onCloseForm.emit).toHaveBeenCalled();
  });

  it('onSubmitForm should not emit when g.attributes is missing', () => {
    g.attributes = undefined as any;
    spyOn(component.onCloseForm, 'emit');
    component.onSubmitForm({ userFullname: 'X' });
    expect(component.onCloseForm.emit).not.toHaveBeenCalled();
    expect(appStorage.setItem).not.toHaveBeenCalled();
  });

  it('returnClosePage should emit onClosePage', () => {
    spyOn(component.onClosePage, 'emit');
    component.returnClosePage();
    expect(component.onClosePage.emit).toHaveBeenCalled();
  });

  it('onEscape should stop propagation, prevent default, and close page', () => {
    spyOn(component.onClosePage, 'emit');
    const ev = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(ev, 'preventDefault');
    spyOn(ev, 'stopPropagation');
    component.onEscape(ev);
    expect(ev.preventDefault).toHaveBeenCalled();
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(component.onClosePage.emit).toHaveBeenCalled();
  });

  it('onErrorRenderForm should restore default preChatFormJson via Globals', () => {
    spyOn(g, 'setParameter');
    component.onErrorRenderForm();
    expect(g.setParameter).toHaveBeenCalledWith('preChatFormJson', jasmine.any(Array));
    const arg = (g.setParameter as jasmine.Spy).calls.mostRecent().args[1] as any[];
    expect(arg[0].name).toBe('userFullname');
    expect(arg[1].name).toBe('userEmail');
  });

  it('should request focus on dialog root after view init (async)', fakeAsync(() => {
    const fixtureInner = TestBed.createComponent(PrechatFormComponent);
    const el = fixtureInner.nativeElement.querySelector('#chat21-prechat-form') as HTMLElement;
    spyOn(el, 'focus');
    fixtureInner.detectChanges();
    tick(1000);
    expect(el.focus).toHaveBeenCalled();
  }));
});
