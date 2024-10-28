import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChange, SimpleChanges, ViewChild, OnDestroy } from '@angular/core';


@Component({
  selector: 'chat-confirm-close',
  templateUrl: './confirm-close.component.html',
  styleUrls: ['./confirm-close.component.scss']
})
export class ConfirmCloseComponent implements OnInit{

  @Input() isLoadingActive: boolean;
  @Input() conversationId: string;

  @Input() translationMap: Map< string, string>;
  @Input() stylesMap: Map<string, string>;
  @Output() onDiaglogClosed = new EventEmitter<{type: string, data: any}>();

  constructor() { }

  ngOnInit(): void {
    console.log('[CONFIRM CLOSE MODAL] onInit', this.isLoadingActive);
    // this.dialog.showModal();
  }

  ngOnChanges(changes: SimpleChanges){
    console.log('changesssssss', changes, this.isLoadingActive)
    if(changes && 
      changes['conversationId'] && 
      changes['conversationId'].previousValue !== undefined && 
      (changes['conversationId'].previousValue !== changes['conversationId'].currentValue) &&
      changes['conversationId'].currentValue
    ){
    this.isLoadingActive = false;
  }
  }

  ngAfterViewInit(){
  }

  onBack(){
    this.onDiaglogClosed.emit({type: 'back', data: null});
  }

  onConfirm(){
    this.isLoadingActive = true;
    this.onDiaglogClosed.emit({type: 'confirm', data: null});
  }

  ngOnDestroy(){
    this.isLoadingActive = false;
    console.log('destroyyy', this.isLoadingActive)
  }

}
