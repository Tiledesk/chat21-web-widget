import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { saveAs } from 'file-saver';

@Component({
  selector: 'chat-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss']
})
export class ImageComponent implements OnInit {

  @Input() metadata: any;
  @Input() width: any;
  @Input() height: any;
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>();

  loading: boolean = true
  tooltipMessage: string;

  
  constructor() { }

  ngOnInit() {
  }

  onLoaded(event){
    this.loading = false
    this.onElementRendered.emit({element: "image", status:true})
  }

  downloadImage(url: string, fileName: string) {
    // console.log('Image COMP - IMAGE URL ', url); 
    // console.log('Image COMP - IMAGE FILENAME ', fileName); 
    fileName? null: fileName = decodeURIComponent(decodeURIComponent(url).split('/').pop())
    // const a: any = document.createElement('a');
    // a.href = this.sanitizer.bypassSecurityTrustUrl(url);
    // a.download = fileName;
    // document.body.appendChild(a);
    // a.style = 'display: none';
    // a.click();
    // a.remove();
    saveAs(url, fileName);
    // this.onClickImage()
  }

  onClickImage(){
    const that = this;
    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("frameborder", "0");
    // ifrm.setAttribute("border", "0");
    ifrm.setAttribute('id','tiledesk-image-preview');
    ifrm.setAttribute('tiledesk_context','parent');
    ifrm.setAttribute('style', 'width: 100%; height: 100%; position: absolute; z-index: 2147483003;')
    
    var iframeContent = '<head>'
    iframeContent += '<style> .tiledesk-popup {position: absolute; inset: 1px; outline-offset: -5px; background-color: rgba(0, 0, 0, 0.35); border-radius:16px; will-change: opacity;}'
    iframeContent +=    '.tiledesk-popup-content { position: fixed; inset: 0px; width: 100%;  height: 100%; display: flex;  justify-content: center; align-items: center; outline: 0px;}'
    iframeContent +=    '.tiledesk-popup-button { display: flex; align-items: center; justify-content: center; width: 35px; height: 35px; position: absolute; top: 0px; right: 0px; background-color: transparent; border: none; cursor: pointer; margin: 9px; padding: 0px; }'
    iframeContent +=    '.tiledesk-popup-image { max-height: 80vh; max-width: 80vw; }'
    iframeContent += '</style>'
    iframeContent += '</head>';
    iframeContent += '<body>'
    iframeContent +=  '<div class="frame-root" id="frame-root">'
    iframeContent +=    '<div class="frame-content">'
    iframeContent +=      '<div class="tiledesk-popup" style="opacity: 1;"></div>'
    iframeContent +=      '<div role="button" tabindex="-1" class="tiledesk-popup-content">'
    // iframeContent +=         '<button id="button" type="button" data-testid="closeButton" class="tiledesk-popup-button">'
    // iframeContent +=           '<svg id="ic_close" fill="#000000" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>'
    // iframeContent +=         '</button>'
    iframeContent +=         '<a href="'+this.metadata.src+'" data-testid="popupImage-wrapper" class="tidio-popup-vgwcqv" style="opacity: 1; transform: translate3d(0px, 0px, 0px);">'
    iframeContent +=           '<img src="'+this.metadata.src+'" class="tiledesk-popup-image" id="image-popup">'
    iframeContent +=         '</a>'
    iframeContent +=      '</div>'
    iframeContent +=   '</div>'
    iframeContent +='</body>'

    // ifrm.src = 'data:text/html;charset=utf-8,' + encodeURI(iframeContent);
    ifrm.srcdoc = iframeContent
    window.document.body.appendChild(ifrm)


    ifrm.onload = function(ev) {
      var iframe = window.document.getElementById('tiledesk-image-preview')
      // var button = ifrm.contentWindow.document.getElementById("button");
      // button.addEventListener("click", function(event){
      //   window.document.body.removeChild(iframe)
      // });
      var div = ifrm.contentWindow.document.getElementById('frame-root')
      div.addEventListener("click", function(event){
        window.document.body.removeChild(iframe)
      });
      // var image = ifrm.contentWindow.document.getElementById('image-popup')
      // image.addEventListener("click", function(event){
      //   event.preventDefault();
      //   event.stopPropagation();
      //   that.downloadImage(that.metadata.src, that.metadata.name)
      // });
    };
    
  }


}
