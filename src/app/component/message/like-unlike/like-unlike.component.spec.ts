import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';
import { NGXLogger } from 'ngx-logger';

import { LikeUnlikeComponent } from './like-unlike.component';

describe('LikeUnlikeComponent', () => {
  let component: LikeUnlikeComponent;
  let fixture: ComponentFixture<LikeUnlikeComponent>;
  const ngxlogger = jasmine.createSpyObj('NGXLogger', ['log', 'trace', 'debug', 'warn', 'error', 'info']);
  const customLogger = new CustomLogger(ngxlogger);

  beforeEach(async () => {
    LoggerInstance.setInstance(customLogger);
    await TestBed.configureTestingModule({
      declarations: [LikeUnlikeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LikeUnlikeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onClick should log icon id', () => {
    spyOn((component as any).logger, 'debug');
    component.onClick('like');
    expect((component as any).logger.debug).toHaveBeenCalledWith('[LIKE-UNLIKE] onClick-->', 'like');
  });

  it('like button should have accessible name', () => {
    const btn = fixture.debugElement.queryAll(By.css('button'))[0];
    expect(btn.nativeElement.getAttribute('aria-label')).toBe('Like message');
  });

  it('unlike button should have accessible name', () => {
    const btn = fixture.debugElement.queryAll(By.css('button'))[1];
    expect(btn.nativeElement.getAttribute('aria-label')).toBe('Unlike message');
  });

  it('clicking like should invoke logger', () => {
    spyOn((component as any).logger, 'debug');
    fixture.debugElement.queryAll(By.css('button'))[0].triggerEventHandler('click', {});
    expect((component as any).logger.debug).toHaveBeenCalledWith('[LIKE-UNLIKE] onClick-->', 'like');
  });
});
