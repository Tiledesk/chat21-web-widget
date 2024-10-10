import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'chat-confirm-close',
  templateUrl: './confirm-close.component.html',
  styleUrls: ['./confirm-close.component.scss']
})
export class ConfirmCloseComponent implements OnInit{
  
  @ViewChild('mydialog') mydialog: ElementRef;

  constructor() { }

  ngOnInit(): void {
    // console.log('[CONFIRM CLOSE MODAL] onInit-->', this.dialog);
    // this.dialog.showModal();
  }

  ngAfterViewInit(){
    // console.log('[CONFIRM CLOSE MODAL] ngAfterViewInit-->', this.mydialog);
    // this.mydialog.nativeElement.showModal()
  }

}
