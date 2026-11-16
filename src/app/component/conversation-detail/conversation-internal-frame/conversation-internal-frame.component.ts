import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';

@Component({
    selector: 'chat-internal-frame',
    templateUrl: './conversation-internal-frame.component.html',
    styleUrls: ['./conversation-internal-frame.component.scss'],
    standalone: false
})
export class ConversationInternalFrameComponent implements OnInit {
  @ViewChild('iframe') iframe: ElementRef;

  @Input() button: any;
  @Input() openExternalLinkButton: boolean;
  @Input() stylesMap: Map<string, string>
  @Input() translationMap: Map< string, string>;
  @Output() onOpenExternal = new EventEmitter<any>();
  @Output() onClose = new EventEmitter();

  public isOpen = 'open'; //used for animation state
  public url: any;
  public hideSpinner: boolean = false;
  private logger: LoggerService = LoggerInstance.getInstance();
  
  convertColorToRGBA = convertColorToRGBA;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    if(this.button && this.button.link){
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.button.link);    
    }
  }
  
  ngAfterViewInit(){
    let doc = this.iframe.nativeElement.contentDocument || this.iframe.nativeElement.contentWindow;
    this.logger.debug('[INTERNALFRAME] ngAfterViewInit', doc, this.iframe.nativeElement.contentWindow, this.iframe.nativeElement.contentWindow.history)

  }

  ngOnDestroy(){
    this.url = null;
    this.hideSpinner = false;
  }

  returnClose(){
    this.isOpen = 'closed'  
    this.onClose.emit();  
  }

  returnOpenExternal(){
    this.onOpenExternal.emit(this.button)
  }

  onIframeLoaded(event){
    this.hideSpinner = true
  }

  onError(event){
    this.logger.error('[INTERNALFRAME] onError ', event)
  }

}
