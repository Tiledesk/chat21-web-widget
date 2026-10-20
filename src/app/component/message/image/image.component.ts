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

  /**
   * Opens the image in an accessible lightbox.
   *
   * Accessibility features (WCAG 2.1.1, 2.1.2, 2.4.3, 4.1.2):
   * - Lightbox container is rendered as role="dialog" aria-modal="true" with aria-label.
   * - A real <button> with aria-label closes the dialog.
   * - The dialog can be dismissed via Escape, click on the backdrop, or the close button.
   * - The previously focused element is restored when the lightbox closes.
   * - Focus is moved to the close button on open to keep keyboard users inside the dialog.
   */
  onClickImage(){
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const altText = this.metadata?.name || 'Image preview';
    const closeLabel = this.tooltipMessage || 'Close';

    const ifrm = document.createElement('iframe');
    ifrm.setAttribute('frameborder', '0');
    ifrm.setAttribute('id', 'tiledesk-image-preview');
    ifrm.setAttribute('tiledesk_context', 'parent');
    ifrm.setAttribute('title', altText);
    ifrm.setAttribute('aria-label', altText);
    ifrm.setAttribute('style', 'width: 100%; height: 100%; position: absolute; z-index: 2147483003; border: 0;');

    let iframeContent = '<!doctype html><html lang="' + (document.documentElement.lang || 'en') + '"><head>';
    iframeContent += '<meta charset="utf-8"/>';
    iframeContent += '<title>' + altText.replace(/[<>]/g, '') + '</title>';
    iframeContent += '<style>';
    iframeContent += 'html,body{margin:0;padding:0;height:100%;}';
    iframeContent += '.tiledesk-popup-backdrop{position:fixed;inset:0;background-color:rgba(0,0,0,0.6);}';
    iframeContent += '.tiledesk-popup-content{position:fixed;inset:0;display:flex;justify-content:center;align-items:center;padding:32px;}';
    iframeContent += '.tiledesk-popup-image{max-height:85vh;max-width:90vw;border-radius:8px;}';
    iframeContent += '.tiledesk-popup-button{position:fixed;top:16px;right:16px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background-color:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.1);border-radius:50%;cursor:pointer;padding:0;}';
    iframeContent += '.tiledesk-popup-button:focus-visible{outline:3px solid #1a73e8;outline-offset:2px;}';
    iframeContent += '.tiledesk-popup-button svg{width:20px;height:20px;fill:#000;}';
    iframeContent += '@media (prefers-reduced-motion: reduce){.tiledesk-popup-backdrop{transition:none;}}';
    iframeContent += '</style></head><body>';
    iframeContent += '<div role="dialog" aria-modal="true" aria-label="' + altText.replace(/"/g, '&quot;') + '" id="frame-root">';
    iframeContent += '<div class="tiledesk-popup-backdrop" id="popup-backdrop"></div>';
    iframeContent += '<div class="tiledesk-popup-content">';
    iframeContent += '<img src="' + this.metadata.src + '" class="tiledesk-popup-image" id="image-popup" alt="' + altText.replace(/"/g, '&quot;') + '">';
    iframeContent += '</div>';
    iframeContent += '<button type="button" id="closeButton" class="tiledesk-popup-button" aria-label="' + closeLabel.replace(/"/g, '&quot;') + '">';
    iframeContent += '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    iframeContent += '</button>';
    iframeContent += '</div>';
    iframeContent += '</body></html>';

    ifrm.srcdoc = iframeContent;
    window.document.body.appendChild(ifrm);

    const closeLightbox = () => {
      const node = window.document.getElementById('tiledesk-image-preview');
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        try { previouslyFocused.focus(); } catch(e) { /* noop */ }
      }
    };

    ifrm.onload = function () {
      const doc = ifrm.contentWindow?.document;
      if (!doc) { return; }

      const closeBtn = doc.getElementById('closeButton') as HTMLButtonElement | null;
      const backdrop = doc.getElementById('popup-backdrop');
      const image = doc.getElementById('image-popup');

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeLightbox();
        });
        closeBtn.focus();
      }

      if (backdrop) {
        backdrop.addEventListener('click', () => closeLightbox());
      }

      if (image) {
        image.addEventListener('click', (e) => e.stopPropagation());
      }

      // Escape key handler from inside the lightbox iframe
      doc.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape' || event.keyCode === 27) {
          event.preventDefault();
          closeLightbox();
        }
      });
    };
  }


}
