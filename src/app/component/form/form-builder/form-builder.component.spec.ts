import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomTranslateService } from './../../../../chat21-core/providers/custom-translate.service';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { FormBuilderComponent } from './form-builder.component';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';

describe('FormBuilderComponent', () => {
  let component: FormBuilderComponent;
  let fixture: ComponentFixture<FormBuilderComponent>;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)
  
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FormBuilderComponent ],
      imports: [
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        CustomTranslateService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormBuilderComponent);
    component = fixture.componentInstance;
    LoggerInstance.setInstance(customLogger)
    let logger = LoggerInstance.getInstance()
    component['logger']= logger
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
