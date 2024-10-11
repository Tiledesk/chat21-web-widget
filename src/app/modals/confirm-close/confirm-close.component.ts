import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';


@Component({
  selector: 'chat-confirm-close',
  templateUrl: './confirm-close.component.html',
  styleUrls: ['./confirm-close.component.scss']
})
export class ConfirmCloseComponent implements OnInit{
  
  @Input() translationMap: Map< string, string>;
  @Input() stylesMap: Map<string, string>;
  @Output() onDiaglogClosed = new EventEmitter<{type: string, data: any}>();

  constructor() { }

  ngOnInit(): void {
    console.log('[CONFIRM CLOSE MODAL] onInit');
    // this.dialog.showModal();
  }

  ngAfterViewInit(){
  }

  onBack(){
    this.onDiaglogClosed.emit({type: 'back', data: null});
  }

  onConfirm(){
    this.onDiaglogClosed.emit({type: 'confirm', data: null});
  }

}
