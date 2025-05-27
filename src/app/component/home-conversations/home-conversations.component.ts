
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { Subscription } from 'rxjs';


import { Globals } from '../../utils/globals';
import { avatarPlaceholder, convertMessage, setColorFromString } from '../../utils/utils';


// models
import { HumanizeDuration, HumanizeDurationLanguage } from 'humanize-duration-ts';
import { TranslatorService } from 'src/app/providers/translator.service';
import { WaitingService } from 'src/app/providers/waiting.service';
import { ImageRepoService } from 'src/chat21-core/providers/abstract/image-repo.service';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { UserAgent } from 'src/models/userAgent';
import { ConversationModel } from '../../../chat21-core/models/conversation';


@Component({
  selector: 'chat-home-conversations',
  templateUrl: './home-conversations.component.html',
  styleUrls: ['./home-conversations.component.scss']
})


export class HomeConversationsComponent implements OnInit, OnDestroy {
  
  // ========= begin:: Input/Output values ============//
  @Input() listConversations: Array<ConversationModel>; // uid utente ex: JHFFkYk2RBUn87LCWP2WZ546M7d2
  @Input() archivedConversations: Array<ConversationModel>;
  @Input() hideNewConversationButton: boolean;
  @Input() stylesMap: Map<string, string>
  @Output() onNewConversation = new EventEmitter<string>();
  @Output() onConversationSelected = new EventEmitter<ConversationModel>();
  @Output() onOpenAllConvesations = new EventEmitter();
  @Output() onImageLoaded = new EventEmitter<ConversationModel>();
  @Output() onConversationLoaded = new EventEmitter<ConversationModel>();
  
  // ========= end:: Input/Output values ============//

  // ========= begin:: sottoscrizioni ======= //
  subscriptions: Subscription[] = []; /** */
  // subOpenConversations;
  subListConversations;
  subArchivedConversations;
  // ========= end:: sottoscrizioni ======= //
  // ========= begin:: dichiarazione funzioni ======= //
  convertMessage = convertMessage;
  setColorFromString = setColorFromString;
  avatarPlaceholder = avatarPlaceholder;
  // ========= end:: dichiarazione funzioni ========= //


  // ========= begin:: variabili del componente ======= //
  // conversations: ConversationModel[];
  //listConversations: Array<ConversationModel>;
  // archivedConversations: Array<ConversationModel>;
  tenant = '';
  themeColor = '';
  themeForegroundColor = '';
  LABEL_START_NW_CONV: string;
  availableAgents: Array<UserAgent> = [];
  // ========= end:: variabili del componente ======== //

  waitingTime: Number;
  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
  humanizer: HumanizeDuration;
  humanWaitingTime: string;
  WAITING_TIME_FOUND_WITH_REPLYTIME_PLACEHOLDER: string //new

  translationMapConversation: Map<string, string>;
  private logger: LoggerService = LoggerInstance.getInstance();
  
  constructor(
    public g: Globals,
    public imageRepoService: ImageRepoService,
    public chatManager: ChatManager,
    public waitingService: WaitingService,
    public translatorService: TranslatorService,
    private customTranslateService: CustomTranslateService,
  ) {
    // https://www.npmjs.com/package/humanize-duration-ts
    // https://github.com/Nightapes/HumanizeDuration.ts/blob/master/src/humanize-duration.ts
    this.humanizer = new HumanizeDuration(this.langService);
    this.humanizer.setOptions({round: true});
    this.initialize();
  }

  ngOnInit() {
    this.logger.debug('[HOMECONVERSATIONS]---ngOnInit--- ', this.listConversations);
    
  }

  private initTranslations() {
    const keysConversation = ['CLOSED'];
    this.translationMapConversation = this.customTranslateService.translateLanguage(keysConversation);
  }

  

  // ========= begin:: ACTIONS ============//
  onConversationSelectedFN(conversation: ConversationModel) {
    if(conversation){
      // rimuovo classe animazione
      //this.removeAnimation();
      this.onConversationSelected.emit(conversation);
    }
  }

  // ========= end:: ACTIONS ============//

  initialize() {
    this.logger.debug('initialize: ListConversationsComponent');
    this.initTranslations();

    this.tenant = this.g.tenant;
    this.LABEL_START_NW_CONV = this.g.LABEL_START_NW_CONV; // IN THE TEMPLATE REPLACED LABEL_START_NW_CONV WITH g.LABEL_START_NW_CONV
    this.listConversations = [];
    this.archivedConversations = [];
    this.waitingTime = -1;
    this.availableAgents = this.g.availableAgents.slice(0, 5)
    this.availableAgents.forEach(agent => {
      agent.imageurl = this.imageRepoService.getImagePhotoUrl(agent.id)
    })

    //this.logger.debug('senderId: ', this.senderId]);
    this.logger.debug('[HOMECONVERSATIONS] tenant: ', this.tenant, this.availableAgents);
    // this.conversationsService.initialize(this.senderId, this.tenant);
    // this.conversationsService.checkListConversations();
    // this.conversationsService.checkListArchivedConversations();
    // this.listConversations = this.conversationsService.listConversations;

    // this.conversationsHandlerService.initialize(this.tenant,this.senderId, translationMap)
    // this.conversationsHandlerService.connect();
    // this.listConversations = this.conversationsHandlerService.conversations;
    // 6 - save conversationHandler in chatManager
    // this.chatManager.setConversationsHandler(this.conversationsHandlerService);
    
    this.logger.debug('[HOMECONVERSATIONS] this.listConversations.length', this.listConversations.length);
    this.logger.debug('[HOMECONVERSATIONS] this.listConversations', this.listConversations);
    // if (this.g.supportMode) {
    //   this.showWaitingTime();
    // }
    this.showWaitingTime();
    //this.showConversations();
  }

  showWaitingTime() {
    const that = this;
    const projectid = this.g.projectid;
    if(projectid){
      this.waitingService.getCurrent(projectid).subscribe(response => {
        that.logger.debug('[HOMECONVERSATIONS] response waiting', response);
        if (response && response.length > 0 && response[0].waiting_time_avg) {
          const wt = response[0].waiting_time_avg;

          that.waitingTime = wt;
          that.logger.debug('[HOMECONVERSATIONS] that.waitingTime',  that.waitingTime);

          const lang = that.translatorService.getLanguage();
          that.humanWaitingTime = this.humanizer.humanize(wt, {language: lang});

          // REPLACE
          if (this.g.WAITING_TIME_FOUND.includes("$reply_time")) {
            // REPLACE if exist
            this.WAITING_TIME_FOUND_WITH_REPLYTIME_PLACEHOLDER = this.g.WAITING_TIME_FOUND.replace("$reply_time", that.humanWaitingTime);
          }
        }

      });
    }
    
  }

  checkShowAllConversation() {
    if (this.archivedConversations && this.archivedConversations.length > 0) {
      return true;
    } else if (this.listConversations && this.listConversations.length > 0) {
      return true;
    }
    return false;
  }


  // ========= begin:: ACTIONS ============//
  openNewConversation() {
    this.onNewConversation.emit();
  }
  returnOpenAllConversation() {
    this.onOpenAllConvesations.emit();
  }

  onImageLoadedFN(conversation: ConversationModel){
    this.onImageLoaded.emit(conversation)
  }

  onConversationLoadedFN(conversation: ConversationModel){
    this.onConversationLoaded.emit(conversation)
  }

  private openConversationByID(conversation) {
    this.logger.debug('[HOMECONVERSATIONS] openConversationByID: ', conversation);
    if ( conversation ) {
      // this.conversationsService.updateIsNew(conversation);
      // this.conversationsService.updateConversationBadge();
      this.onConversationSelected.emit(conversation);
    }
  }
  // ========= end:: ACTIONS ============//


  // ========= begin:: DESTROY ALL SUBSCRIPTIONS ============//
    /** elimino tutte le sottoscrizioni */
  ngOnDestroy() {
    this.logger.debug('[HOMECONVERSATIONS] ngOnDestroy list conv subscriptions', this.subscriptions);
    this.unsubscribe();
  }

  /** */
  unsubscribe() {
    this.subscriptions.forEach(function (subscription) {
        subscription.unsubscribe();
    });
    this.subscriptions = [];
    // this.subOpenConversations = null;
    this.subListConversations = null;
    this.subArchivedConversations = null;
    this.logger.debug('[HOMECONVERSATIONS] this.subscriptions', this.subscriptions);
 }
 // ========= end:: DESTROY ALL SUBSCRIPTIONS ============//

}
