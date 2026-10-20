import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'chat-frame',
  templateUrl: './frame.component.html',
  styleUrls: ['./frame.component.scss']
})
export class FrameComponent implements OnInit {

  @Input() metadata: any;
  @Input() width: number;
  @Input() height: number;
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>();
  
  url: SafeResourceUrl = null
  loading: boolean = true
  frameTitle: string = 'Embedded content'
  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    if(this.metadata && this.metadata.src){
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.metadata.src);
      try {
        const host = new URL(this.metadata.src).hostname;
        this.frameTitle = `Embedded content from ${host}`;
      } catch (_) {
        this.frameTitle = 'Embedded content';
      }
    }
  }

  ngOnDestroy(){
    this.url = null;
  }

  onLoaded(event){
    this.loading = false
    this.onElementRendered.emit({element: "frame", status:true})
  }


}
