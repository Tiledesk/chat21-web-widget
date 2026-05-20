import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  MSG_STATUS_RETURN_RECEIPT,
  MSG_STATUS_SENT,
  MSG_STATUS_SENT_SERVER,
} from 'src/app/utils/constants';

import { ReturnReceiptComponent } from './return-receipt.component';

describe('ReturnReceiptComponent', () => {
  let component: ReturnReceiptComponent;
  let fixture: ComponentFixture<ReturnReceiptComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReturnReceiptComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnReceiptComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render schedule icon when status is falsy', () => {
    component.status = 0 as any;
    fixture.detectChanges();
    const icons = fixture.debugElement.queryAll(By.css('.icon'));
    expect(icons.length).toBe(1);
  });

  it('should render sent icon for MSG_STATUS_SENT', () => {
    component.status = MSG_STATUS_SENT;
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.icon')).length).toBe(1);
  });

  it('should render server-sent icon for MSG_STATUS_SENT_SERVER', () => {
    component.status = MSG_STATUS_SENT_SERVER;
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.icon')).length).toBe(1);
  });

  it('should render return receipt icon for MSG_STATUS_RETURN_RECEIPT', () => {
    component.status = MSG_STATUS_RETURN_RECEIPT;
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.icon')).length).toBe(1);
  });

  it('should expose status constants on component', () => {
    expect(component.MSG_STATUS_SENT).toBe(MSG_STATUS_SENT);
    expect(component.MSG_STATUS_SENT_SERVER).toBe(MSG_STATUS_SENT_SERVER);
    expect(component.MSG_STATUS_RETURN_RECEIPT).toBe(MSG_STATUS_RETURN_RECEIPT);
  });
});
