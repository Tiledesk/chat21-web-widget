import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChange, SimpleChanges, ViewChildren } from '@angular/core';
import { MessageModel } from 'src/chat21-core/models/message';
import { TYPE_BUTTON } from 'src/chat21-core/utils/constants';
import { isCarousel } from 'src/chat21-core/utils/utils-message';

@Component({
  selector: 'chat-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnInit{

  // ========= begin:: Input/Output values ============//
  @Input() message: MessageModel;
  @Input() isConversationArchived: boolean;
  @Input() isLastMessage: boolean;
  @Input() stylesMap: Map<string, string>;
  @Output() onAttachmentButtonClicked = new EventEmitter<any>();
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>()
  // ========= end:: Input/Output values ============//
  gallery: any[]

  wrapper: HTMLElement;
  carousel: HTMLElement;
  firstCardWidth: number;
  activeElement: number = 1;

  fontSize: string;
  backgroundColor: string;
  textColor: string;
  hoverBackgroundColor: string;
  hoverTextColor: string;
  type: string;
  button: any;
  TYPE_BUTTON = TYPE_BUTTON;
  constructor(private elementRef: ElementRef) { }

  ngOnInit() {
    // console.log('[CAROUSEL-MESSAGE] hello', this.message, isCarousel(this.message))

    
    this.wrapper = this.elementRef.nativeElement.querySelector('.wrapper')
    this.carousel = this.elementRef.nativeElement.querySelector('.carousel') 

    
    // this.firstCardWidth = (this.elementRef.nativeElement.querySelector(".card") as HTMLElement).offsetWidth
    // // Get the number of cards that can fit in the carousel at once
    // let cardPerView = Math.round(this.carousel.offsetWidth / this.firstCardWidth);

    // Insert copies of the last few cards to beginning of carousel for infinite scrolling
    // const carouselChildrens = [...this.carousel.children];
    // carouselChildrens.slice(-cardPerView).reverse().forEach(card => {
    //   this.carousel.insertAdjacentHTML("afterbegin", card.outerHTML);
    // });
    // // Insert copies of the first few cards to end of carousel for infinite scrolling
    // carouselChildrens.slice(0, cardPerView).forEach(card => {
    //   this.carousel.insertAdjacentHTML("beforeend", card.outerHTML);
    // });

    // Scroll the carousel at appropriate postition to hide first few duplicate cards on Firefox
    this.carousel.classList.add("no-transition");
    this.carousel.scrollLeft = this.carousel.offsetWidth;
    this.carousel.classList.remove("no-transition");

    let currentItem = 0
    // Store items as an array of objects
    const items = this.carousel.querySelectorAll('.card')

    this.carousel.addEventListener("scroll", function(el){
      // Find item closest to the goal
      // currentItem = items.reduce((prev, curr) => {
      //   return (Math.abs(curr.offsetY - scrollY - goal) < Math.abs(prev.offsetY - scrollY - goal) ? curr : prev); // return the closest to the goal
      // });
    });

  }

  ngOnChanges(changes: SimpleChanges){
    if(this.message && this.message.attributes && this.message.attributes?.attachment && this.message.attributes?.attachment?.gallery){
      this.gallery = this.message.attributes.attachment.gallery
      // this.firstCardWidth = (this.elementRef.nativeElement.querySelector(".card") as HTMLElement).offsetWidth
    }

    if(this.stylesMap ){
      if(this.stylesMap.has('buttonFontSize')) this.elementRef.nativeElement.querySelector('.wrapper').style.setProperty('--buttonFontSize', this.stylesMap.get('buttonFontSize'));
      if(this.stylesMap.has('buttonBackgroundColor')) this.elementRef.nativeElement.querySelector('.wrapper').style.setProperty('--backgroundColor', this.stylesMap.get('buttonBackgroundColor'));
      if(this.stylesMap.has('buttonTextColor')) this.elementRef.nativeElement.querySelector('.wrapper').style.setProperty('--textColor', this.stylesMap.get('buttonTextColor'));
      if(this.stylesMap.has('buttonHoverBackgroundColor')) this.elementRef.nativeElement.querySelector('.wrapper').style.setProperty('--hoverBackgroundColor', this.stylesMap.get('buttonHoverBackgroundColor'));
      if(this.stylesMap.has('buttonHoverTextColor')) this.elementRef.nativeElement.querySelector('.wrapper').style.setProperty('--hoverTextColor', this.stylesMap.get('buttonHoverTextColor'));
    }
  
  }

  goTo(direction: 'next' | 'previous' ){
    let width = (this.carousel.querySelectorAll(".card")[1] as HTMLElement).offsetWidth
    let gap = 17
    let cardPerView = Math.round(this.carousel.offsetWidth / width);

    // console.log('go to -->', direction, width, this.firstCardWidth, cardPerView, this.carousel.offsetWidth)

    // this.carousel.scrollLeft += direction == "previous" ? -(width+gap) : width+gap;
    this.carousel.scrollLeft += direction == "previous" ? -width : width;
    this.activeElement += direction == "previous" ? -1 : 1;

    // this.carousel.classList.add("no-transition");
    // this.carousel.scrollLeft += width;
    // this.carousel.classList.remove("no-transition");

  }

  actionButtonClick(ev, button, index){
    this.button = button
    this.type = button.type
    if ( button && ((button.action && button.action !== '') || (button.link && button.link !== '') || button.text !== '' )) {
      
      //set clicked button as the active one
      this.gallery[index].buttons.find((element)=> { return element === button}).active = true
      const spanCheck = this.elementRef.nativeElement.querySelector('.action');
      if (spanCheck) {
        // const item = domRepresentation[0] as HTMLInputElement;
        // if (!spanCheck.classList.contains('active')) {
        //   spanCheck.classList.add('active');
        // }
        // setTimeout(function() {
        //   if (spanCheck.classList.contains('active')) {
        //     spanCheck.classList.remove('active');
        //   }
        // }, 400);
        ev.target.classList.add('active')
        // event.target.classList
      }
      const event = { target: this, currentTarget: this}
      if ( event && event.target ) {
        const ev = {target: event.target, message: this.message, currentTarget: this }
        this.onAttachmentButtonClicked.emit(ev);
      }
    }
  }
}
