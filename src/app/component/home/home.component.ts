import { TiledeskAuthService } from './../../../chat21-core/providers/tiledesk/tiledesk-auth.service';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { ConversationModel } from '../../../chat21-core/models/conversation';
import { LoggerService } from '../../../chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from '../../../chat21-core/providers/logger/loggerInstance';
import { convertColorToRGBA } from '../../../chat21-core/utils/utils';
import { Globals } from '../../utils/globals';

@Component({
  selector: 'chat-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None, /* it allows to customize 'Powered By' */
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('homeComponent') private element: ElementRef;
  @ViewChild('aflistconv') private aflistconv: ElementRef;
  // ========= begin:: Input/Output values ===========/
  @Input() listConversations: Array<ConversationModel>;
  @Input() archivedConversations: Array<ConversationModel>;
  @Input() hideSettings: boolean;
  @Input() hideNewConversationButton: boolean;
  @Input() stylesMap: Map<string, string>
  @Output() onNewConversation = new EventEmitter<string>();
  @Output() onConversationSelected = new EventEmitter<ConversationModel>();
  @Output() onOpenAllConvesations = new EventEmitter();
  @Output() onCloseWidget = new EventEmitter();
  @Output() onSignOut = new EventEmitter();
  @Output() onImageLoaded = new EventEmitter<ConversationModel>();
  @Output() onConversationLoaded = new EventEmitter<ConversationModel>();
  // ========= end:: Input/Output values ===========/


  // ========= begin:: component variables ======= //
  widgetTitle;
  welcomeMsg;
  welcomeTitle;
  hover: boolean = false;
  translationMapHeader: Map<string, string>;
  translationMapFooter: Map<string, string>;
  // ========= end:: component variables ======= //

  convertColorToRGBA = convertColorToRGBA
  
  private logger: LoggerService = LoggerInstance.getInstance();
  
  constructor(
    public g: Globals,
    private tiledeskAuthService : TiledeskAuthService,
    private customTranslateService: CustomTranslateService,
  ) {

  }

  ngOnInit() {
    this.logger.debug('[HOME-COMP] ngOnInit');
    this.initiTranslations()
  }

  initiTranslations(){

    let keysHeader = [
      'BUTTON_CLOSE_TO_ICON'
    ]
    let keysFooter = [
      'SWITCH_TO'
    ]
    this.translationMapFooter = this.customTranslateService.translateLanguage(keysFooter)
    this.translationMapHeader = this.customTranslateService.translateLanguage(keysHeader)
  }

  ngAfterViewInit(){
    this.logger.debug('[HOME-COMP]---ngAfterViewInit--- ');

    if (this.g.firstOpen === true) {
      this.addAnimation();
      this.g.firstOpen = false;
    }

    setTimeout(() => {
      if (this.aflistconv) {
        this.aflistconv.nativeElement.focus();
      }
    }, 1000);
  }


  managePoweredBy(event: Event){
    event.stopPropagation();
    this.segmentLogoClick()
    let target = (event.target as Element) || (event.srcElement as Element) || (event.currentTarget as Element)
    if(target.parentElement.tagName === 'A' && target.parentElement.hasAttribute('href')){
     window.open(target.parentElement.getAttribute('href'), '_blank')
    }
  }


  private segmentLogoClick(){
    let that = this
    let user = this.tiledeskAuthService.getCurrentUser()
    if(window['analytics']){
      try {
        window['analytics'].page("Widget Home Page, LogoClick", {});
      } catch (err) {
        this.logger.error('Event:Signed In [page] error', err);
      }
  
      try {
        window['analytics'].identify(user.uid, {
          name: user.firstname + ' ' + user.lastname,
          email: user.email,
          logins: 5,
        });
      } catch (err) {
        this.logger.error('Event:LogoClick [identify] error', err);
      }
      // Segments
      try {
        window['analytics'].track('LogoClick', {
          "username": user.firstname + ' ' + user.lastname,
          "userId": user.uid,
          "attributes": that.g.attributes
        });
      } catch (err) {
        this.logger.error('Event:LogoClick [track] error', err);
      }
    }
  }


  


  


  // ========= begin:: ACTIONS ============//
  onNewConversationFN() {
    // rimuovo classe animazione
    this.removeAnimation();
    this.onNewConversation.emit();
  }

  onOpenAllConversation() {
    // rimuovo classe animazione
    this.removeAnimation();
    this.onOpenAllConvesations.emit();
  }

  openConversationOnPlatform(platform: "telegram" | "whatsapp" | "messanger" ){
    if(platform === 'telegram'){
      window.open('https://telegram.me/'+this.g.telegramUsername, '_blank')
    }else if(platform === 'whatsapp'){
      window.open('https://wa.me/'+this.g.whatsappNumber+'?text=/start', '_blank')
    }else if(platform=== 'messanger'){
      window.open('https://m.me/'+this.g.messangerPageTitle, '_blank')
    }
    
  }

  onConversationSelectedFN(conversation: ConversationModel) {
    if(conversation){
      // rimuovo classe animazione
      this.removeAnimation();
      this.onConversationSelected.emit(conversation);
    }
  }

  onImageLoadedFN(conversation: ConversationModel){
    this.onImageLoaded.emit(conversation)
  }

  onConversationLoadedFN(conversation: ConversationModel){
    this.onConversationLoaded.emit(conversation)
  }

  f21_close() {
    // aggiungo classe animazione
    this.addAnimation();
    this.onCloseWidget.emit();
  }

  hideMenuOptions() {
    this.logger.debug('[HOME-COMP] hideMenuOptions');
    // this.g.isOpenMenuOptions = false;
    this.g.setParameter('isOpenMenuOptions', false, true);
  }


  /**
   * MODAL MENU SETTINGS:
   * logout
   */
  onSignOutFN() {
    this.onSignOut.emit();
  }

  // ========= end:: ACTIONS ============//

  addAnimation() {
    try {
      const mainDiv = this.element.nativeElement;
      if (mainDiv) {
        mainDiv.classList.add('start-animation');
      }
    } catch (error) {
        this.logger.error('[HOME-COMP] addAnimation > Error :' + error);
    }
  }
  removeAnimation() {
    try {
      const mainDiv = this.element.nativeElement;
      if (mainDiv) {
        mainDiv.classList.remove('start-animation');
      }
    } catch (error) {
      this.logger.error('[HOME-COMP] removeAnimation > Error :' + error);
    }
  }

  

}

