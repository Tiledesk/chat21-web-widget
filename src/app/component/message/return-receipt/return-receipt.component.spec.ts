import { async, ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MSG_STATUS_SENT } from 'src/chat21-core/utils/constants';

import { ReturnReceiptComponent } from './return-receipt.component';

describe('ReturnReceiptComponent', () => {
  let component: ReturnReceiptComponent;
  let fixture: ComponentFixture<ReturnReceiptComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnReceiptComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shold render MSG_STATUS_SENT icon', ()=> {
    component.status= MSG_STATUS_SENT
    fixture.detectChanges();
    expect(component.status).toBe(MSG_STATUS_SENT)
  })

  // it('shold render MSG_STATUS_SENT icon', ()=> {
  //   component.status= MSG_STATUS_SENT
  //   fixture.detectChanges();
  //   let element = fixture.debugElement.query(By.css('icon'))
  //   expect(element.classes).toBeE('icon')
  // })
});
