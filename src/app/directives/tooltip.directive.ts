import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { isOnMobileDevice } from 'src/chat21-core/utils/utils';

@Directive({
  selector: '[tooltip]'
})
export class TooltipDirective {

  @Input('tooltip') tooltipTitle: string;
  @Input() placement: string;
  @Input() delay: string;
  tooltip: HTMLElement;
  
  offset = 10;
  isMobile = isOnMobileDevice()

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltip && !this.isMobile) { this.show(); }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) { this.hide(); }
  }

  show() {
    this.create();
    this.setPosition();
    this.renderer.addClass(this.tooltip, 'ng-tooltip-show');
  }

  hide() {
    this.renderer.removeClass(this.tooltip, 'ng-tooltip-show');
    window.setTimeout(() => {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }, +this.delay);
  }

  create() {
    this.tooltip = this.renderer.createElement('span');

    this.renderer.appendChild(
      this.tooltip,
      this.renderer.createText(this.tooltipTitle) // textNode
    );

    this.renderer.appendChild(document.body, this.tooltip);
    // this.renderer.appendChild(this.el.nativeElement, this.tooltip);

    this.renderer.addClass(this.tooltip, 'ng-tooltip');
    this.renderer.addClass(this.tooltip, `ng-tooltip-${this.placement}`);

    // delay 설정
    this.renderer.setStyle(this.tooltip, '-webkit-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, '-moz-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, '-o-transition', `opacity ${this.delay}ms`);
    this.renderer.setStyle(this.tooltip, 'transition', `opacity ${this.delay}ms`);
  }

  setPosition() {
    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltip.getBoundingClientRect();

    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    let top, left;

    if (this.placement === 'top') {
      top = hostPos.top - tooltipPos.height - this.offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (this.placement === 'bottom') {
      top = hostPos.bottom + this.offset;
      left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
    }

    if (this.placement === 'left') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.left - tooltipPos.width - this.offset;
    }

    if (this.placement === 'right') {
      top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
      left = hostPos.right + this.offset;
    }

    this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }



  // @Input() tooltip2: any; // The text for the tooltip to display
  // @Input() delay? = 190; // Optional delay input, in ms

  // private myPopup;
  // private timer;


  // ngOnDestroy(): void {
  //   if (this.myPopup) { this.myPopup.remove() }
  // }

  // @HostListener('mouseenter') onMouseEnter() {
  //   this.timer = setTimeout(() => {
  //     let x = this.el.nativeElement.getBoundingClientRect().left + this.el.nativeElement.offsetWidth / 2; // Get the middle of the element
  //     let y = this.el.nativeElement.getBoundingClientRect().top + this.el.nativeElement.offsetHeight + 6; // Get the bottom of the element, plus a little extra
  //     this.createTooltipPopup(x, y);
  //   }, this.delay)
  // }

  // @HostListener('mouseleave') onMouseLeave() {
  //   if (this.timer) clearTimeout(this.timer);
  //   if (this.myPopup) { this.myPopup.remove() }
  // }

  // private createTooltipPopup(x: number, y: number) {
  //   let popup = document.createElement('div');
  //   popup.innerHTML = this.tooltip2;
  //   popup.setAttribute("class", "tooltip-container");
  //   popup.style.top = y.toString() + "px";
  //   popup.style.left = x.toString() + "px";
  //   document.body.appendChild(popup);
  //   this.myPopup = popup;
  //   setTimeout(() => {
  //     if (this.myPopup) this.myPopup.remove();
  //   }, 5000); // Remove tooltip after 5 seconds
  // }


}
