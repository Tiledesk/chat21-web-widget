import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Globals } from '../../utils/globals';


import { trigger } from '@angular/animations';
import { LoggerService } from '../../../chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from '../../../chat21-core/providers/logger/loggerInstance';

@Component({
  selector: 'chat-eyeeye-catcher-card',
  templateUrl: './eyeeye-catcher-card.component.html',
  styleUrls: ['./eyeeye-catcher-card.component.scss'],
  animations: [
    trigger('rotatedState', [
        // state('default', style({ transform: 'scale(0)' })),
        // state('rotated', style({ transform: 'scale(1)' })),
        // transition('rotated => default', animate('1000ms ease-out')),
        // transition('default => rotated', animate('1000ms ease-in'))
    ])
  ]
})
export class EyeeyeCatcherCardComponent implements OnInit {

   // ========= begin:: Input/Output values ============//
   @Output() onOpenChat  = new EventEmitter<boolean>();
   @Output() onCloseEyeCatcherCard = new EventEmitter<boolean>();
   // ========= end:: Input/Output values ============//

  // EYE-CATCHER CARD & EYE-CATCHER CARD CLOSE BTN
  state: string;
//   this.g.displayEyeCatcherCard = 'none';
  displayEyeCatcherCardCloseBtnWrapper: string;
  displayEyeCatcherCardCloseBtnIsMobileWrapper: string;
  displayEyeCatcherCardCloseBtn: string;
  emoticon: string;
  title: string;
  /* EYE-CATCHER CLOSE BUTTON SWITCH */

  private logger: LoggerService = LoggerInstance.getInstance();
  constructor(
    public g: Globals
  ) {
    // this.g.calloutTimer = 2;
  }

  ngOnInit() {
    // EYE-CATCHER CARD & EYE-CATCHER CARD CLOSE BTN
    this.state = 'default';
    this.g.setParameter('displayEyeCatcherCard', 'none');
    this.displayEyeCatcherCardCloseBtnWrapper = 'none';
    this.displayEyeCatcherCardCloseBtnIsMobileWrapper = 'none';
    this.displayEyeCatcherCardCloseBtn = 'none';
    /* EYE-CATCHER CLOSE BUTTON SWITCH */
    this.openIfCallOutTimer();
  }


  /**
   * OPEN THE EYE-CATCHER CARD
   * if calloutTimer >= 0
   */
  private openIfCallOutTimer() {
    const that = this;
    const calloutTimer = this.g.calloutTimer;
    if (calloutTimer >= 0) {
        const waitingTime = calloutTimer * 1000;
        setTimeout(function () {
            that.openEyeCatcher();
        }, waitingTime);
    }
  }

  /**
   * OPEN THE EYE-CATCHER CARD (aka CALLOUT) ONLY IF THE CHAT IS CLOSED */
  openEyeCatcher() {
      this.checkIsEmoji();
      const isOpen = this.g.isOpen;
      this.logger.debug('[EYEEYE-CATCHER-CARD] openEyeCatcher: calloutStaus ---------> ', this.g.calloutStaus);
      
      if (isOpen === false && this.g.calloutStaus) { // && this.g.isMobile === false
          this.onCloseEyeCatcherCard.emit(true);
          // this.g.displayEyeCatcherCard = 'block';
          this.g.setParameter('displayEyeCatcherCard', 'block');
          // this.g.setParameter('calloutStaus', false, true);
          this.displayEyeCatcherCardCloseBtnWrapper = 'block';
          this.displayEyeCatcherCardCloseBtnIsMobileWrapper = 'block';
          // this.rotateCalloutEmoticon();
      } else {
        this.logger.debug('[EYEEYE-CATCHER-CARD] openEyeCatcher: »»»»»»» CALLING OPEN-EYE-CATCHER BUT NOT DISPLAY THE CARD BECAUSE THE CHAT IS ALREADY OPEN ');
      }
  }

  // checkIsEmoji() {
  //   let title = this.g.CALLOUT_TITLE_PLACEHOLDER.trim();
  //   if (this.g.calloutTitle && this.g.calloutTitle !== '') {
  //     title = this.g.calloutTitle.trim();
  //   }
  //   this.title = title;
  //   const regex = emojiRegex();
  //   let match: any;
  //   // this.logger.debug('[EYEEYE-CATCHER-CARD]-->regex, emojiRegex', regex, emojiRegex)
  //   while (match = regex.exec(title)) {
  //     const emoji = match[0];
  //     this.logger.debug('[EYEEYE-CATCHER-CARD]--> match', match)
  //     if (title.indexOf(emoji) === 0) {
  //       this.title = title.replace(emoji, '');
  //       this.emoticon = emoji;
  //     }
  //     break;
  //   }
  // }


  checkIsEmoji() {
    let title = this.g.CALLOUT_TITLE_PLACEHOLDER.trim();
    if (this.g.calloutTitle && this.g.calloutTitle !== '') {
      title = this.g.calloutTitle.trim();
    }
    
    // Reset emoticon
    this.emoticon = null;
    this.title = title;
    
    // Regex per emoji Unicode (compatibile)
    const regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;
    const match = title.match(regex);
    
    if (match) {
      const emoji = match[0];
      this.logger.debug('[EYEEYE-CATCHER-CARD]--> emoji trovata:', emoji);
      
      // Estrai la prima emoji trovata e rimuovila dal testo
      this.title = title.replace(emoji, '').trim();
      this.emoticon = emoji;
    }
  }

  // rotateCalloutEmoticon() {
  //     // this.state = (this.state === 'default' ? 'rotated' : 'default');
  //     if (this.state === 'default') {
  //         setTimeout(() => this.state = 'rotated');
  //     }
  // }

  /**
   * *** EYE-CATCHER CARD ***
   * THE CLICK OVER THE EYE-CATCHER CARD OPENS THE CHAT AND CLOSE THE EYE-CATCHER CARD */
  openChatFromEyeCatcherCard() {
      // this.g.displayEyeCatcherCard = 'none';
      this.g.setParameter('displayEyeCatcherCard', 'none');
      this.onOpenChat.emit();
  }

  /**
   * *** DISPLAY THE EYE-CATCHER CARD CLOSE BTN ***
   * DISPLAY EYE-CATCHER CARD CLOSE BTN THE WHEN THE MOUSE IS OVER EYE-CATCHER CARD OR
   * OVER THE EYE-CATCHER CARD CLOSE BTN WRAPPER */
  mouseEnter() {
      //  wdLog(['MOUSE ENTER THE CARD OR THE CLOSE BTN CONTAINER');
     // this.displayEyeCatcherCardCloseBtn = 'block';
  }

  /**
   * *** HIDE THE EYE-CATCHER CARD CLOSE BTN ***
   * HIDE THE EYE-CATCHER CARD CLOSE BTN THE WHEN THE MOUSE LEAVE THE EYE-CATCHER CARD OR
   * LEAVE THE EYE-CATCHER CARD CLOSE BTN WRAPPER */
  mouseLeave() {
      //  wdLog(['MOUSE LEAVE THE CARD OR THE CLOSE BTN CONTAINER');
      // this.displayEyeCatcherCardCloseBtn = 'none';
  }

  /**
   * EYE-CATCHER CARD CLOSE BTN */
  closeEyeCatcherCard() {
      this.onCloseEyeCatcherCard.emit(false);
      // this.g.displayEyeCatcherCard = 'none';
      this.g.setParameter('displayEyeCatcherCard', 'none');
      this.g.setParameter('calloutStaus', false, true);
      this.displayEyeCatcherCardCloseBtnWrapper = 'none';
  }

  // /**
  //  * EYE-CATCHER CARD CLOSE BTN ON MOBILE DEVICE */
  // closeEyeCatcherCardWhenMobile() {
  //      wdLog(['HAS CLICKED CLOSE EYE CATCHER CARD WHEN MOBILE ');
  //     this.displayEyeCatcherCard = 'none';
  //     this.displayEyeCatcherCardCloseBtnIsMobileWrapper = 'none';
  // }
}


