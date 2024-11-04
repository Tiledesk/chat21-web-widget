import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChange, SimpleChanges, ViewChild, OnDestroy } from '@angular/core';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';


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

  private logger: LoggerService = LoggerInstance.getInstance();
  constructor() { }

  ngOnInit(): void {
    this.logger.log('[CONFIRM CLOSE MODAL] onInit', this.isLoadingActive, this.stylesMap);
    // this.dialog.showModal();
  }

  ngOnChanges(changes: SimpleChanges){
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

}
