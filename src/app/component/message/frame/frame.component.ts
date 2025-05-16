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
  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    if(this.metadata && this.metadata.src){
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.metadata.src);
    }
    // this.width = this.getSizeImg(this.metadata).width;
    // this.height = this.getSizeImg(this.metadata).height;
  }

  ngOnDestroy(){
    this.url = null;
  }

  onLoaded(event){
    this.loading = false
    this.onElementRendered.emit({element: "frame", status:true})
  }


}
