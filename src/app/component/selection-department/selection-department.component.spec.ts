import { A11yModule } from '@angular/cdk/a11y';
import { Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';

import { AppStorageService } from '../../../chat21-core/providers/abstract/app-storage.service';
import { CustomLogger } from '../../../chat21-core/providers/logger/customLogger';
import { LoggerInstance } from '../../../chat21-core/providers/logger/loggerInstance';
import { Globals } from '../../utils/globals';

import { SelectionDepartmentComponent } from './selection-department.component';

@Injectable()
class AppStorageServiceStub extends AppStorageService {
  lastAttributesJson: string | null = null;
  setItem = jasmine.createSpy('setItem').and.callFake((key: string, value: any) => {
    if (key === 'attributes') {
      this.lastAttributesJson = value as string;
    }
  });
  getItem(): any {
    return null;
  }
  getItemWithoutProjectID(): any {
    return null;
  }
  setItemWithoutProjectID(): void {}
  removeItem(): void {}
  clear(): void {}
  initialize(): void {}
}

describe('SelectionDepartmentComponent', () => {
  let component: SelectionDepartmentComponent;
  let fixture: ComponentFixture<SelectionDepartmentComponent>;
  let globals: Globals;
  let storage: AppStorageServiceStub;

  beforeEach(waitForAsync(() => {
    const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
    LoggerInstance.setInstance(new CustomLogger(ngxlogger));
    TestBed.configureTestingModule({
      imports: [A11yModule],
      declarations: [SelectionDepartmentComponent],
      providers: [
        Globals,
        { provide: AppStorageService, useClass: AppStorageServiceStub },
        { provide: NGXLogger, useValue: ngxlogger },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectionDepartmentComponent);
    component = fixture.componentInstance;
    globals = TestBed.inject(Globals);
    storage = TestBed.inject(AppStorageService) as unknown as AppStorageServiceStub;
    globals.initDefafultParameters();
    globals.themeColor = '#112233';
    globals.themeForegroundColor = '#ddeeff';
    globals.colorGradient180 = 'linear-gradient(#000,#fff)';
    globals.LABEL_SELECT_TOPIC = 'Scegli un argomento';
    globals.BUTTON_CLOSE_TO_ICON = 'Chiudi';
    globals.departments = [
      { _id: 'dep-a', name: 'Vendite' } as any,
      { _id: 'dep-b', name: 'Supporto' } as any,
    ];
    globals.attributes = { userFullname: 'Ada', userEmail: 'ada@example.com' } as any;
    globals.windowContext = {} as any;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render dialog with topic label and one list row per department', () => {
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('#chat21-selection-department') as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Scegli un argomento');
    const heading = fixture.nativeElement.querySelector('h2.c21-message-field') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('Scegli un argomento');
    const buttons = fixture.nativeElement.querySelectorAll('.c21-button-department');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Vendite');
    expect(buttons[1].textContent).toContain('Supporto');
  });

  it('onSelectDepartment should set globals, attributes and persist JSON in storage', () => {
    fixture.detectChanges();
    spyOn(component.onDepartmentSelected, 'emit');
    const dept = { _id: 'dep-b', name: 'Supporto' };
    component.onSelectDepartment(dept);
    expect(globals.departmentSelected).toEqual(dept as any);
    expect(globals.attributes.departmentId).toBe('dep-b');
    expect(globals.attributes.departmentName).toBe('Supporto');
    expect(storage.setItem).toHaveBeenCalledWith('attributes', jasmine.any(String));
    const parsed = JSON.parse(storage.lastAttributesJson!);
    expect(parsed.departmentId).toBe('dep-b');
    expect(parsed.departmentName).toBe('Supporto');
    expect(parsed.userEmail).toBe('ada@example.com');
    expect(component.onDepartmentSelected.emit).toHaveBeenCalledWith(dept);
  });

  it('click on department button should trigger selection flow', () => {
    fixture.detectChanges();
    spyOn(component, 'onSelectDepartment').and.callThrough();
    const second = fixture.debugElement.queryAll(By.css('.c21-button-department'))[1];
    second.nativeElement.click();
    expect(component.onSelectDepartment).toHaveBeenCalledWith(jasmine.objectContaining({ _id: 'dep-b' }));
  });

  it('closePage should emit onClose', () => {
    fixture.detectChanges();
    spyOn(component.onClose, 'emit');
    component.closePage();
    expect(component.onClose.emit).toHaveBeenCalled();
  });

  it('openPage should emit onOpen', () => {
    fixture.detectChanges();
    spyOn(component.onOpen, 'emit');
    component.openPage();
    expect(component.onOpen.emit).toHaveBeenCalled();
  });

  it('cancelPage should reset newConversationStart and emit onClose', () => {
    fixture.detectChanges();
    globals.newConversationStart = true;
    spyOn(component.onClose, 'emit');
    component.cancelPage();
    expect(globals.newConversationStart).toBe(false);
    expect(component.onClose.emit).toHaveBeenCalled();
  });

  it('should invoke beforeDepartmentsFormRender hook when present on windowContext.tiledesk', () => {
    const hook = jasmine.createSpy('beforeDepartmentsFormRender').and.returnValue([{ _id: 'x', name: 'Filtered' }]);
    globals.windowContext = { tiledesk: { beforeDepartmentsFormRender: hook } } as any;
    const f2 = TestBed.createComponent(SelectionDepartmentComponent);
    const c2 = f2.componentInstance;
    f2.detectChanges();
    expect(hook).toHaveBeenCalledWith(globals.departments);
    expect(c2.departments.length).toBe(1);
    expect(c2.departments[0].name).toBe('Filtered');
    f2.destroy();
  });

  it('should emit onBeforeDepartmentsFormRender when hook is absent', () => {
    spyOn(component.onBeforeDepartmentsFormRender, 'emit');
    fixture.detectChanges();
    expect(component.onBeforeDepartmentsFormRender.emit).toHaveBeenCalledWith(
      jasmine.arrayContaining([jasmine.objectContaining({ name: 'Vendite' })]),
    );
  });

  it('Escape host listener should call closePage', () => {
    fixture.detectChanges();
    spyOn(component, 'closePage');
    const ev = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(ev, 'preventDefault');
    spyOn(ev, 'stopPropagation');
    component.onEscape(ev);
    expect(ev.preventDefault).toHaveBeenCalled();
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(component.closePage).toHaveBeenCalled();
  });

  it('should focus afSelectionDepartment after delay in ngAfterViewInit', fakeAsync(() => {
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('#chat21-selection-department') as HTMLElement;
    spyOn(dialog, 'focus');
    component.ngAfterViewInit();
    tick(1000);
    expect(dialog.focus).toHaveBeenCalled();
  }));
});
