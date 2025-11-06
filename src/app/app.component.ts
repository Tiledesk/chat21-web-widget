import { ScriptService } from './../chat21-core/providers/scripts/script.service';
/** ANGULAR MODULES */
import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs/internal/Subscription';
import { v4 as uuidv4 } from 'uuid';
import { HEADER_MENU_OPTION } from './utils/constants';
//COMPONENTS
import { EyeeyeCatcherCardComponent } from './component/eyeeye-catcher-card/eyeeye-catcher-card.component';
//MODELS
import { UserModel } from 'src/chat21-core/models/user';
import { ConversationModel } from 'src/chat21-core/models/conversation';
// SERVICES
/** LOGGER SERVICES */
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
/** TILEDESK SERVICES */
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';
import { TiledeskRequestsService } from 'src/chat21-core/providers/tiledesk/tiledesk-requests.service';
/** CONVERSATIONS - MESSAGE SERVICES */
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { ArchivedConversationsHandlerService } from 'src/chat21-core/providers/abstract/archivedconversations-handler.service';
import { ConversationHandlerBuilderService } from 'src/chat21-core/providers/abstract/conversation-handler-builder.service';
import { ConversationHandlerService } from 'src/chat21-core/providers/abstract/conversation-handler.service';
import { ConversationsHandlerService } from 'src/chat21-core/providers/abstract/conversations-handler.service';
import { ImageRepoService } from 'src/chat21-core/providers/abstract/image-repo.service';
import { MessagingAuthService } from 'src/chat21-core/providers/abstract/messagingAuth.service';
import { PresenceService } from 'src/chat21-core/providers/abstract/presence.service';
import { TypingService } from 'src/chat21-core/providers/abstract/typing.service';
import { UploadService } from 'src/chat21-core/providers/abstract/upload.service';
import { ChatManager } from 'src/chat21-core/providers/chat-manager';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import { Triggerhandler } from 'src/chat21-core/utils/triggerHandler';
/** OTHERS */
import { AppConfigService } from './providers/app-config.service';
import { GlobalSettingsService } from './providers/global-settings.service';
import { TranslatorService } from './providers/translator.service';
// UTILS
import * as dayjs from 'dayjs';
import { MessageModel } from 'src/chat21-core/models/message';
import { AUTH_STATE_CLOSE, AUTH_STATE_OFFLINE, AUTH_STATE_ONLINE, CHANNEL_TYPE, TYPE_MSG_FILE, TYPE_MSG_IMAGE, URL_SOUND_LIST_CONVERSATION } from 'src/chat21-core/utils/constants';
import { supports_html5_storage } from 'src/chat21-core/utils/utils';
import { UID_SUPPORT_GROUP_MESSAGES } from './utils/constants';
import { Globals } from './utils/globals';
import { Rules } from './utils/rules';
import { isInfo, isUserBanned } from 'src/chat21-core/utils/utils-message';

interface MessageObj {
  tenant?: string;
  senderId?: string;
  senderFullname?: string;
  message: string;
  type: string;
  metadata: any;
  recipientId: string;
  recipientFullname: string;
  attributes: {};
  projectid?: string;
  channelType?: string;
}

@Component({
  selector: 'chat-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None /* it allows to customize 'Powered By' */
  // providers: [AgentAvailabilityService, TranslatorService]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {

  // ========= begin:: sottoscrizioni ======= //
  subscriptions: Subscription[] = []; /** */
  // ========= end:: sottoscrizioni ======= //

  // ========= begin:: tabTitle and sounds ======= //
  private tabTitle: string; 
  private audio: any;
  private setTimeoutSound: any;
  private setIntervalTime: any;
  private isTabVisible: boolean = true;
  public stateLoggedUser;
  // ========= end:: tabTitle and sounds ======= //

  // ========= begin:: widget state parameter ======= //
  isOpenHome = true;                  /** check open/close component home ( sempre visibile xchè il primo dello stack ) */
  isOpenConversation = false;         /** check open/close component conversation if is true  */
  isOpenAllConversation = false;
  isOpenSelectionDepartment = false;  /** check open/close modal select department */
  // isOpenPrechatForm = false;          /** check open/close modal prechatform if g.preChatForm is true  */
  isOpenStartRating = false;          /** check open/close modal start rating chat if g.isStartRating is true  */
  // isWidgetActive: boolean;            /** var bindata sullo stato conv aperta/chiusa !!!! da rivedere*/
  isConversationArchived: boolean = false;
  isInitialized = false;              /** if true show button */
  isSentMessage = false;
  // ========= end:: widget state parameter ======= //

  listConversations: Array<ConversationModel>;
  archivedConversations: Array<ConversationModel>;
  lastConversation: ConversationModel;
  
  @ViewChild(EyeeyeCatcherCardComponent, { static: false }) eyeeyeCatcherCardComponent: EyeeyeCatcherCardComponent
  styleMapConversation: Map<string, string> = new Map();
  translationMap: Map<string, string> = new Map();
  isButtonsDisabled: boolean = true;
  marginBottom: number;
  
  forceDisconnect: boolean = false;

  //network status
  isOnline: boolean = true;
  loading: boolean = false;
  
  // alert error message 
  isShowErrorMessage: boolean = false;
  errorMessage: string = '';
  errorKeyMessage: string = null;
  errorParams: Record<string, any> = {};

  private logger: LoggerService = LoggerInstance.getInstance();
  constructor(
    private el: ElementRef,
    private ngZone: NgZone,
    public g: Globals,
    public triggerHandler: Triggerhandler,
    public globalSettingsService: GlobalSettingsService,
    public appConfigService: AppConfigService,
    private appStorageService: AppStorageService,
    private translatorService: TranslatorService,
    private translateService: CustomTranslateService,
    private scriptService: ScriptService,
    public chatManager: ChatManager,
    private tiledeskRequestsService: TiledeskRequestsService,
    public tiledeskAuthService: TiledeskAuthService,
    public messagingAuthService: MessagingAuthService,
    public conversationsHandlerService: ConversationsHandlerService,
    public archivedConversationsService: ArchivedConversationsHandlerService,
    public conversationHandlerBuilderService: ConversationHandlerBuilderService,
    public imageRepoService: ImageRepoService,
    public typingService: TypingService,
    public presenceService: PresenceService,
    public uploadService: UploadService
  ){}




    ngOnInit(): void {
        this.logger.info('[APP-CONF]---------------- ngOnInit: APP.COMPONENT ---------------- ')
        this.initWidgetParamiters();
    }

    ngAfterViewInit(): void {
        this.logger.info('[APP-CONF]---------------- ngAfterViewInit: APP.COMPONENT ---------------- ')
        
        // Initialize translation map and enable buttons
        const keys = ['MAXIMIZE', 'MINIMIZE', 'CENTER', 'BUTTON_CLOSE_TO_ICON', 'LABEL_LOADING'];
        this.translationMap = this.translateService.translateLanguage(keys);
        this.isButtonsDisabled = false;
        
        this.ngZone.run(() => {
            const that = this;
            const subAddedConversation = this.conversationsHandlerService.conversationAdded.subscribe((conversation) => {
                // that.ngZone.run(() => {
                if (that.g.isOpen === true && conversation) {
                    that.g.setParameter('displayEyeCatcherCard', 'none');
                    that.triggerOnConversationUpdated(conversation);
                    that.logger.debug('[APP-COMP] obsAddedConversation ::: ', conversation, this.isInitialized);
                    if (conversation.attributes && conversation.attributes['subtype'] === 'info') {
                        return;
                    }
                    if (conversation.is_new && this.isInitialized) {
                        that.manageTabNotification(false, 'conv-added')
                        // this.soundMessage(); 
                    }
                    if(this.g.isOpen === false){
                        that.lastConversation = conversation;
                        that.g.isOpenNewMessage = true;
                    }
                } else {
                    //widget closed
                    let badgeNewConverstionNumber = that.conversationsHandlerService.countIsNew() 
                    that.g.setParameter('conversationsBadge', badgeNewConverstionNumber);
                    // that.setBadgeNewConverstionNumber();
                }
                // that.manageTabNotification()
                // });
                if(conversation){
                    this.onImageLoaded(conversation)
                    this.onConversationLoaded(conversation)
                }
                
            });
            this.subscriptions.push(subAddedConversation);

            const subChangedConversation = this.conversationsHandlerService.conversationChanged.subscribe((conversation) => {
                // that.ngZone.run(() => {
                if (conversation) {
                    this.onImageLoaded(conversation)
                    this.onConversationLoaded(conversation)

                    if(conversation.recipient === this.g.senderId && isUserBanned(conversation)){
                        that.disposeWidget();
                        return;
                    }

                    if(conversation.is_new && conversation.sender !== this.g.senderId && !isInfo(conversation)){
                        that.manageTabNotification(conversation.sound, 'conv-changed');
                    }

                    if (that.g.isOpen === true) {
                        that.g.setParameter('displayEyeCatcherCard', 'none');

                        this.logger.debug('[APP-COMP] obsChangeConversation ::: ', conversation);
                        if (conversation.attributes && conversation.attributes['subtype'] === 'info') {
                            return;
                        }

                    } else {
                        // if(conversation.is_new && isJustRecived(this.g.startedAt.getTime(), conversation.timestamp)){
                        //widget closed
                        if(conversation.is_new && conversation.sender !== this.g.senderId && !isInfo(conversation)){
                            that.lastConversation = conversation;
                            that.g.isOpenNewMessage = true;
                            that.logger.debug('[APP-COMP] lastconversationnn', that.lastConversation)
                        }
                        let badgeNewConverstionNumber = that.conversationsHandlerService.countIsNew()
                        that.g.setParameter('conversationsBadge', badgeNewConverstionNumber);
                        // that.setBadgeNewConverstionNumber();
                        // }
                    }
                    that.triggerOnConversationUpdated(conversation);

                } else {
                    this.logger.debug('[APP-COMP] oBSconversationChanged null: errorrr')
                    return;
                }
                
                // });
            });
            this.subscriptions.push(subChangedConversation);

            const subAddedArchivedConversations = this.archivedConversationsService.archivedConversationAdded.subscribe((conversation) => {
                // that.ngZone.run(() => {
                if (conversation) {
                    that.triggerOnConversationUpdated(conversation);
                    this.onImageLoaded(conversation)
                    this.onConversationLoaded(conversation)
                }
                // });
            });
            this.subscriptions.push(subAddedArchivedConversations);

            const subRemovedArchivedConversations = this.archivedConversationsService.archivedConversationRemoved.subscribe((conversation) => {
                // that.ngZone.run(() => {
                if (conversation) {
                    this.isConversationArchived = false;
                    that.triggerOnConversationUpdated(conversation);
                }
                // });
            });
            this.subscriptions.push(subRemovedArchivedConversations);

        });
        this.appStorageService.initialize(environment.storage_prefix, this.g.persistence, this.g.projectid)
        this.tiledeskAuthService.initialize(this.appConfigService.getConfig().apiUrl)
        this.tiledeskRequestsService.initialize(this.appConfigService.getConfig().apiUrl, this.g.projectid)
        this.messagingAuthService.initialize();
        this.chatManager.initialize();
        this.uploadService.initialize();
    }


    saveBadgeNewConverstionNumber(){
        let badgeNewConverstionNumber = this.conversationsHandlerService.countIsNew() 
        this.appStorageService.setItem('hiddenConversationsBadge', badgeNewConverstionNumber)
    }

    setBadgeNewConverstionNumber(){
        let badgeNewConverstionNumber = this.conversationsHandlerService.countIsNew();
        let hiddenConversationsBadge = this.appStorageService.getItem('hiddenConversationsBadge')
        let newNumberBadge = badgeNewConverstionNumber - hiddenConversationsBadge;
        this.logger.debug('[APP-COMP] setBadgeNewConverstionNumber: ', newNumberBadge, badgeNewConverstionNumber, hiddenConversationsBadge)
        this.g.conversationsBadge = newNumberBadge;
        this.g.setParameter('conversationsBadge', newNumberBadge);
    }


    private initWidgetParamiters(){
        const that = this;
        const obsSettingsService = this.globalSettingsService.obsSettingsService.subscribe((resp) => {
            if(resp){

                // /** INIT  */
                this.logger.setLoggerConfig(this.g.isLogEnabled, this.g.logLevel)
                this.tabTitle = this.g.windowContext.window.document.title
                this.appStorageService.initialize(environment.storage_prefix, this.g.persistence, this.g.projectid)
                
                //check if allowed to load
                let canLoad = this.globalSettingsService.manageLoadingDomains();
                if(!canLoad){
                    console.error('[Check canLoad] Widget is not able to load on this domain!!!')
                    this.hideWidget()
                    this.disposeWidget();
                }

                //set visibility
                if((this.g.isMobile && !this.g.displayOnMobile) || (!this.g.isMobile && !this.g.displayOnDesktop)){
                    this.disposeWidget()
                    return;
                }

                //set status (open /close)
                if(this.g.isMobile && this.g.onPageChangeVisibilityMobile !== 'last'){
                    let isOpen = this.g.onPageChangeVisibilityMobile === 'open'? true: false
                    this.g.setIsOpen(isOpen)
                    this.appStorageService.setItem('isOpen', isOpen)
                }
                if(!this.g.isMobile && this.g.onPageChangeVisibilityDesktop !== 'last'){
                    let isOpen = this.g.onPageChangeVisibilityDesktop === 'open'? true: false
                    this.g.setIsOpen(isOpen)
                    this.appStorageService.setItem('isOpen', isOpen)
                }

                if(this.g.onPageChangeVisibilityDesktop === 'last'){
                    this.logger.debug('[APP-COMP2] ------this.g.isOpen: ', this.g.isOpen)
                    if(this.g.isOpen){
                        this.g.autoStart = true;
                    }
                }


                /**CHECK IF JWT IS IN URL PARAMETERS */
                this.logger.debug('[APP-COMP] check if token is passed throw url: ', this.g.jwt);
                if (this.g.jwt) {
                    // logging in with custom token from url
                    // add JWY token to localstorage and authenticate with it           this.logger.debug('[APP-COMP] token from url. isShown:', this.g.isShown, 'autostart:', this.g.autoStart)
                    this.logger.debug('[APP-COMP]  ----------------  logging in with custom token from url ---------------- ');
                    //   this.g.autoStart = false;
                    const storedTiledeskToken = this.appStorageService.getItem('tiledeskToken')
                    storedTiledeskToken === this.g.jwt? null: this.appStorageService.setItem('tiledeskToken', this.g.jwt);
                    this.g.tiledeskToken = this.g.jwt;
                    // this.signInWithCustomToken(this.g.jwt) // moved to authenticate() in else(tiledeskToken)
                }

                /** INIT LABELS TRANSLATIONS */
                this.translatorService.initI18n().then((result) => {
                    this.logger.debug('[APP-COMP] »»»» APP-COMPONENT.TS initI18n result', result);
                    const browserLang = this.translatorService.getLanguage();
                    // moment.locale(browserLang)
                    dayjs.locale(browserLang)
                    this.translatorService.translate(this.g);
                }).then(() => {
                    /** INIT  */
                    that.initAll();
                    /** TRIGGER ONBEFORE INIT */
                    that.triggerOnBeforeInit();
                    /** AUTH */
                    that.setAuthSubscription();
                    /** SCRIPT LOAD */
                    that.loadCustomScript(this.appConfigService.getConfig())
                })
        
            }
        });
        this.subscriptions.push(obsSettingsService);
        this.globalSettingsService.initWidgetParamiters(this.g, this.el);

    }

    private initAll() {
        this.addComponentToWindow(this.ngZone);

        //INIT TRIGGER-HANDLER
        this.triggerHandler.setElement(this.el)
        this.triggerHandler.setWindowContext(this.g.windowContext)

        // /** TRANSLATION LOADER: */
        // //  this.translatorService.translate(this.g);
        // this.translatorService.initI18n().then((result) => {
        //     this.g.wdLog(['»»»» APP-COMPONENT.TS initI18n result', result]);
        //     this.translatorService.translate(this.g);
        // });

        /** SET ATTRIBUTES */
        const attributes = this.setAttributesFromStorageService();
        if (attributes) {
            this.g.attributes = attributes;
        }
        this.setStyleMap()

        // ------------------------------- //

        // ------------------------------- //
        /**
         * INIZIALIZE GLOBALS :
         * create settings object used in trigger
         * set isMobile
         * set attributes
        */
        this.g.initialize();
        // ------------------------------- //

        this.removeFirebasewebsocketFromLocalStorage();
        // this.triggerLoadParamsEvent();
        // this.addComponentToWindow(this.ngZone); // forse dovrebbe stare prima di tutti i triggers

        this.initLauncherButton();
        this.triggerLoadParamsEvent(); // first trigger
        //this.setAvailableAgentsStatus();


        /** NETWORK STATUS */
        this.listenToNetworkStatus();

        /** SET LOADING TO FALSE */
        this.loading = false;
        this.logger.debug('[APP-COMP-1] BBB - loading  false');

    }

    // ========= begin:: SUBSCRIPTIONS ============//
    private async setAuthSubscription(){
        this.logger.debug('[APP-COMP] setLoginSubscription : ');
        const that = this;
        
        const subAuthStateChanged = this.messagingAuthService.BSAuthStateChanged.subscribe(state => {

            const tiledeskTokenTEMP = this.appStorageService.getItem('tiledeskToken')
            if (tiledeskTokenTEMP && tiledeskTokenTEMP !== undefined) {
                that.g.tiledeskToken = tiledeskTokenTEMP;
            }

            const autoStart = this.g.autoStart;
            that.stateLoggedUser = state;
            if (state && state === AUTH_STATE_ONLINE) {
                /** sono loggato */
                const user = that.tiledeskAuthService.getCurrentUser()
                that.logger.info('[APP-COMP] ONLINE - LOGGED SUCCESSFULLY', user);
                // that.g.wdLog([' anonymousAuthenticationInNewProject']);
                // that.authService.resigninAnonymousAuthentication();
                // confronto id utente tiledesk con id utente di firebase
                // senderid deve essere == id di firebase

                // const fullName = user.firstname + ' ' + user.lastname;
                that.g.setParameter('senderId', user.uid);
                // this.g.setParameter('userFullname', fullName);
                // this.g.setAttributeParameter('userFullname', fullName);
                // this.g.setParameter('userEmail', user.email);
                // this.g.setAttributeParameter('userEmail', user.email);
                that.g.setParameter('isLogged', true);
                that.g.setParameter('attributes', that.setAttributesFromStorageService());
                // that.startUI();
                this.initConversationsHandler(this.g.tenant, that.g.senderId);
                
                /* If singleConversation mode is active wait to startUI: do it later in initConversationsHandler */
                that.g.singleConversation? null: that.startUI();
                that.triggerOnAuthStateChanged(that.stateLoggedUser);
                that.logger.debug('[APP-COMP]  1 - IMPOSTO STATO CONNESSO UTENTE ', autoStart);
                
                this.initAudioNotification()

                new Promise(async (resolve, reject)=> {
                    that.typingService.initialize(this.g.tenant);
                    await that.presenceService.initialize(this.g.tenant);
                    resolve(null)
                }).then(()=>{
                    that.presenceService.setPresence(user.uid);    
                });

                // this.initConversationsHandler(this.g.tenant, that.g.senderId);
                /* If singleConversation mode is active wait to showWidget: do it later in initConversationsHandler */
                if (autoStart && !that.g.singleConversation) { 
                    that.showWidget();
                }

                if(this.g.botsRules && !this.g.isOpen){
                    const rules = new Rules(that.tiledeskRequestsService, that.appStorageService,that.g)
                    rules.initRules(that.g.windowContext, that.g.tiledeskToken, user, that.generateNewUidConversation(), that.g.botsRules)
                }

                //if widget is closed subscribe to 'click' event and set a 60sec timer to disconnect if handler isn't fired
                if(!this.g.isOpen && this.g.disconnetTime > 0){
                    that.listenToWidgetClick()
                }



            } else if (state && state === AUTH_STATE_OFFLINE && !this.forceDisconnect) {
                /** non sono loggato */
                that.logger.info('[APP-COMP] OFFLINE - NO CURRENT USER AUTENTICATE: ');
                that.g.setParameter('isLogged', false);
                // that.hideWidget();
                // that.g.setParameter('isShown', false, true);
                that.triggerOnAuthStateChanged(that.stateLoggedUser);
                if (autoStart) {
                    that.authenticate();
                }
            } else if(state && state === AUTH_STATE_CLOSE ){
                that.logger.info('[APP-COMP] CLOSE - CHANNEL CLOSED: ', this.chatManager);
                if(this.g.recipientId){
                    this.chatManager.removeConversationHandler(this.g.recipientId)
                    this.g.recipientId = null;
                }
            }  

            /** DDP IF AUTOSTART IS FALSE, SHOW WIDGET */
            if(!autoStart){
                that.logger.info('[APP-COMP] OFFLINE - NO CURRENT USER AUTENTICATE: ');
                this.g.setParameter('isShown', true, true);
            }

        });
        this.subscriptions.push(subAuthStateChanged);


        const subUserLogOut = this.messagingAuthService.BSSignOut.subscribe((state) => {
            // that.ngZone.run(() => {
            this.logger.log('[FORCE] messagingAuthService BSSignOut', state, this.forceDisconnect)
            if (state === true && !this.forceDisconnect) { //state = true -> user has logged out
                /** ho effettuato il logout: nascondo il widget */
                that.logger.debug('[APP-COMP] sono nel caso logout -1');
                // that.g.wdLog(['obsLoggedUser', obsLoggedUser);
                // that.g.wdLog(['this.subscriptions', that.subscriptions);
                that.g.tiledeskToken = null; //reset token to restart widget with different tildeskToken
                that.g.setParameter('isLogged', false);
                that.g.setParameter('isOpenPrechatForm', false);
                that.g.setParameter('userFullname', null); //clar parameter to enable preChatForm on logout with other token
                that.g.setParameter('userEmail', null);//clar parameter to enable preChatForm on logout with other token
                that.g.setAttributeParameter('userFullname', null);//clar parameter to enable preChatForm on logout with other token
                that.g.setAttributeParameter('userEmail', null);//clar parameter to enable preChatForm on logout with other token
                this.g.setAttributeParameter('preChatForm', null)
                this.g.setParameter('conversationsBadge', 0);
                this.g.setParameter('recipientId', null, false)
                that.hideWidget();
                // that.g.setParameter('isShown', false, true);
                that.triggerOnAuthStateChanged('offline');
                // that.triggerOnLoggedOut()
            }
            // });
        });
        this.subscriptions.push(subUserLogOut);
    }
    // ========= end:: SUBSCRIPTIONS ============//

    // ========= begin:: AUTHENTICATION ============//
    /**
     * SET AUTHENTICATION:
     * authenticate in chat
     */
    private authenticate() {
        // that.g.wdLog(['---------------- setAuthentication ----------------');
        // this.g.wdLog([' ---------------- setAuthentication ---------------- ']);
        /**
         * 0 - controllo se è stato passato email e psw -> UNUSED
         *  SI - mi autentico con email e psw
         * 1 - controllo se è stato passato userId -> UNUSED
         *  SI - vado avanti senza autenticazione
         * 2 - controllo se esiste un token -> UNUSED
         *  SI - sono già autenticato
         * 3 - controllo se esiste currentUser
         *  SI - sono già autenticato
         *  NO - mi autentico
         *  4 - controllo se esiste currentUser
         */

        const tiledeskToken = this.g.tiledeskToken;
        const user = this.appStorageService.getItem('currentUser')
        this.logger.debug('[APP-COMP] tiledesktokennn', tiledeskToken, user)
        if (tiledeskToken) {
            //     //  SONO GIA' AUTENTICATO
            this.logger.debug('[APP-COMP]  ---------------- 13 ---------------- ');
            this.logger.debug('[APP-COMP]  ----------- sono già loggato ------- ');
            this.signInWithCustomToken(tiledeskToken)

        } else {
            //  AUTENTICAZIONE ANONIMA
            this.logger.debug('[APP-COMP]  ---------------- 14 ---------------- ');
            this.logger.debug('[APP-COMP]  authenticateFirebaseAnonymously');
            this.tiledeskAuthService.signInAnonymously(this.g.projectid).then(token => {
                this.messagingAuthService.createCustomToken(token)
                const user = this.tiledeskAuthService.getCurrentUser();
                //check if tiledesk_userFullname exist (passed from URL or tiledeskSettings) before update userFullname parameter
                //if tiledesk_userFullname not exist--> update parameter with tiledesk user returned from auth
                if ((user.firstname || user.lastname) && !this.g.userFullname) {
                    const fullName = user.firstname + ' ' + user.lastname;
                    this.g.setParameter('userFullname', fullName);
                    this.g.setAttributeParameter('userFullname', fullName);
                }
                //check if tiledesk_userEmail exist (passed from URL or tiledeskSettings) before update userEmail parameter
                //if tiledesk_userEmail not exist--> update parameter with tiledesk user returned from auth
                if (user.email && !this.g.userEmail) {
                    this.g.setParameter('userEmail', user.email);
                    this.g.setAttributeParameter('userEmail', user.email);
                }
            });
        }
    }

    private signInWithCustomToken(token: string):Promise<UserModel> {
        const that = this;
        const storedTiledeskToken = this.appStorageService.getItem('tiledeskToken');
        storedTiledeskToken === token? null: this.appStorageService.removeItem('recipientId')
        return this.tiledeskAuthService.signInWithCustomToken(token).then((user: UserModel) => {
            this.messagingAuthService.createCustomToken(token)
            this.logger.debug('[APP-COMP] signInWithCustomToken user::', user, this.g.userFullname)
            //check if tiledesk_userFullname exist (passed from URL or tiledeskSettings) before update userFullname parameter
            //if tiledesk_userFullname not exist--> update parameter with tiledesk user returned from auth
            
            if ((user.firstname || user.lastname) && !this.g.userFullname) {
                const fullName = user.firstname + ' ' + user.lastname;
                this.g.setParameter('userFullname', fullName);
                this.g.setAttributeParameter('userFullname', fullName);
            }
            //check if tiledesk_userEmail exist (passed from URL or tiledeskSettings) before update userEmail parameter
            //if tiledesk_userEmail not exist--> update parameter with tiledesk user returned from auth
            if (user.email && !this.g.userEmail) {
                this.g.setParameter('userEmail', user.email);
                this.g.setAttributeParameter('userEmail', user.email);
            }
            return Promise.resolve(user)
                // this.showWidget()
        }).catch(error => {
            this.logger.debug('[APP-COMP] signInWithCustomToken ERR ',error);
            that.signOut();
            return Promise.reject(error)
        });

    }

    private signInAnonymous(): Promise<UserModel> {
        this.logger.debug('[APP-COMP] signInAnonymous');
        return this.tiledeskAuthService.signInAnonymously(this.g.projectid).then((tiledeskToken) => {
            this.messagingAuthService.createCustomToken(tiledeskToken)
            const user = this.tiledeskAuthService.getCurrentUser();
            if (user.firstname || user.lastname) {
                const fullName = user.firstname + ' ' + user.lastname;
                this.g.setParameter('userFullname', fullName);
                this.g.setAttributeParameter('userFullname', fullName);
            }
            if (user.email) {
                this.g.setParameter('userEmail', user.email);
                this.g.setAttributeParameter('userEmail', user.email);
            }
            return Promise.resolve(user)
        }).catch((error)=> {
            this.logger.error('[APP-COMP] signInAnonymous ERR', error);
            return Promise.reject(error);
        });
    }
    // ========= end:: AUTHENTICATION ============//

    // ========= begin:: START UI ============//
    private startUI() {
        this.logger.debug('[APP-COMP]  ============ startUI ===============');
        const departments = this.g.departments;
        const attributes = this.g.attributes;
        const preChatForm = this.g.preChatForm;
        this.isOpenHome = true;
        this.isOpenConversation = false;
        this.g.setParameter('isOpenPrechatForm', false);
        this.isOpenSelectionDepartment = false;
        this.isOpenAllConversation = false;
        const recipientId : string = this.appStorageService.getItem('recipientId')
        this.logger.debug('[APP-COMP]  ============ idConversation ===============', recipientId, this.g.recipientId);
        // this.g.recipientId = null;
        this.logger.debug('[APP-COMP] singleConversation conv da ...', this.g.recipientId)
        if(this.g.restartConversation && this.g.singleConversation){
            this.logger.debug('[APP-COMP] RESTART-CONVERSARION::: start a new conversations...', this.g.restartConversation)
            this.onNewConversation();
        }else if(this.g.recipientId && this.g.singleConversation){
            //start widget from current recipientId conversation
            this.logger.debug('[APP-COMP] singleConversation conv da API', this.g.recipientId)
            this.isOpenHome = false;
            this.isOpenConversation = true;
            this.isOpenSelectionDepartment = false;
        }else if (!this.g.recipientId && this.g.singleConversation){
            //start newConversation
            this.logger.debug('[APP-COMP] singleConversation start new conv ', this.g.recipientId)
            this.isOpenHome = false;
            this.isOpenConversation = false;
            this.isOpenSelectionDepartment = false;
            // if (departments.length > 1 && !this.g.departmentID == null) {
            //     // this.logger.debug('[APP-COMP] 22222');
            //     this.isOpenSelectionDepartment = true;
            // } else {
            //     // this.logger.debug('[APP-COMP] 11111', this.g.isOpen, this.g.recipientId);
            //     this.isOpenConversation = false;
            //     if (!this.g.recipientId && this.g.isOpen) {
            //         // this.startNwConversation();
            //         this.openNewConversation();
            //     }
            // }
            this.onNewConversation();
        }else if(this.g.recipientId){
            this.logger.debug('[APP-COMP]  conv da urll', this.g.recipientId)
            if (this.g.isOpen) {
                this.isOpenConversation = true;
            }
            this.g.setParameter('recipientId', this.g.recipientId);
            this.appStorageService.setItem('recipientId', this.g.recipientId)
        }else if(recipientId){ 
            this.logger.debug('[APP-COMP]  conv da storagee', recipientId)
            if (this.g.isOpen) {
                this.isOpenConversation = true;
            }
            this.g.recipientId = recipientId;
            this.g.setParameter('recipientId', recipientId);
            // this.returnSelectedConversation(conversationActive);
        } else if (this.g.startFromHome) {
            // this.logger.debug('[APP-COMP] 66666');
            this.isOpenConversation = false;
            this.g.setParameter('isOpenPrechatForm', false);
            this.isOpenSelectionDepartment = false;
        } else if (preChatForm && (!attributes || !attributes.userFullname || !attributes.userEmail)) {
            // this.logger.debug('[APP-COMP] 55555');
            this.g.setParameter('isOpenPrechatForm', true);
            this.isOpenConversation = false;
            this.isOpenSelectionDepartment = false;
            if (departments.length > 1 && this.g.departmentID == null) {
                // this.logger.debug('[APP-COMP] 44444');
                this.isOpenSelectionDepartment = true;
            }
        } else {
            // this.logger.debug('[APP-COMP] 33333');
            this.g.setParameter('isOpenPrechatForm', false);
            this.isOpenConversation = false;
            this.isOpenSelectionDepartment = false;


            if (departments.length > 1 && !this.g.departmentID == null) {
                // this.logger.debug('[APP-COMP] 22222');
                this.isOpenSelectionDepartment = true;
            } else {
                // this.logger.debug('[APP-COMP] 11111', this.g.isOpen, this.g.recipientId);
                this.isOpenConversation = false;
                if (!this.g.recipientId && this.g.isOpen) {
                    // this.startNwConversation();
                    this.onNewConversation();
                }
            }
        }
      
        // visualizzo l'iframe!!!
        this.triggerOnViewInit();
        this.g.setParentBodyStyleMobile(this.g.isOpen, this.g.isMobile);
        this.g.setElementStyle(this.g.isOpen)
        // this.triggerOnAuthStateChanged(true)
        // mostro il widget
        // setTimeout(() => {
        //     const divWidgetContainer = this.g.windowContext.document.getElementById('tiledesk-container');
        //     if (divWidgetContainer) {
        //         divWidgetContainer.style.display = 'block';
        //     }
        // }, 500);
    }
    // ========= end:: START UI ============//


    /**
     * genero un nuovo conversationWith
     * al login o all'apertura di una nuova conversazione
     */
    private generateNewUidConversation() {
        this.logger.debug('[APP-COMP] generateUidConversation **************: senderId= ', this.g.senderId);
        return UID_SUPPORT_GROUP_MESSAGES + this.g.projectid + '-' + uuidv4().replace(/-/g, '');
        // return UID_SUPPORT_GROUP_MESSAGES + uuidv4(); >>>>>OLD 
    }

    /**
     * premendo sul pulsante 'APRI UNA NW CONVERSAZIONE'
     * attivo una nuova conversazione
     */
    private startNewConversation() {
        this.logger.debug('[APP-COMP] AppComponent::startNewConversation');
        const newConvId = this.generateNewUidConversation();
        this.g.setParameter('recipientId', newConvId);
        this.appStorageService.setItem('recipientId', newConvId)
        this.logger.debug('[APP-COMP]  recipientId: ', this.g.recipientId);
        this.isConversationArchived = false;
        
        /** allow to start conversation with an hidden message (without publishing 'new_conversation' event) */
        this.logger.debug('[APP-COMP] AppComponent::startNewConversation hiddenMessage',this.g.hiddenMessage );
        if(this.g.hiddenMessage){
            this.onNewConversationWithMessage(newConvId, this.g.hiddenMessage)
        }

        this.triggerNewConversationEvent(newConvId);
    }

    private setAttributesFromStorageService(): any {
        let attributes: any = {};
        try {
            attributes = JSON.parse(this.appStorageService.getItem('attributes'));
        } catch (error) {
            this.logger.debug('[APP-COMP] > Error  setAttributesFromStorageService:' + error);
        }

        const CLIENT_BROWSER = navigator.userAgent;
        const projectid = this.g.projectid;
        const userEmail = this.g.userEmail;
        const userFullname = this.g.userFullname;
        const senderId = this.g.senderId;
        const widgetVersion = this.g.BUILD_VERSION

        if (!attributes && attributes === null) {
            if (this.g.attributes) {
                attributes = this.g.attributes;
            } else {
                attributes = {};
            }
        }
        // console.log('attributes: ', attributes, this.g.attributes);
        // that.g.wdLog(['CLIENT_BROWSER: ', CLIENT_BROWSER);
        if (CLIENT_BROWSER) {
            attributes['client'] = CLIENT_BROWSER;
        }
        if (this.g.windowContext.window.location) {
            attributes['sourcePage'] = this.g.windowContext.window.location.href;
        }
        if(this.g.windowContext.window.document) {
            attributes['sourceTitle'] = this.g.windowContext.window.document.title;
        }
        // if(this.g.windowContext.window.document && this.g.windowContext.window.document.cookie) {
        //     attributes['cookie'] = this.g.windowContext.window.document.cookie;
        // }
        if (projectid) {
            attributes['projectId'] = projectid;
        }
        if (userEmail) {
            attributes['userEmail'] = userEmail;
        }
        if (userFullname) {
            attributes['userFullname'] = userFullname;
        }
        if (senderId) {
            attributes['requester_id'] = senderId;
        }
        if (widgetVersion) {
            attributes['widgetVer'] = widgetVersion;
        }
        try {
            // attributes['payload'] = this.g.customAttributes.payload;
            attributes['payload'] = []

            if (this.g.customAttributes) {
                attributes['payload'] = this.g.customAttributes;
            }
        } catch (error) {
            this.logger.debug('[APP-COMP] > Error is handled payload: ', error);
        }

        try{
            const preChatForm = attributes['preChatForm']
            if(preChatForm && preChatForm.userEmail) this.g.userEmail = preChatForm.userEmail;
            if(preChatForm && preChatForm.userFullname) this.g.userFullname = preChatForm.userFullname 
        } catch(error){
            this.logger.debug('[APP-COMP] > Error is handled preChatForm: ', error);
        }

        this.appStorageService.setItem('attributes', JSON.stringify(attributes));
        return attributes;
    }
    
    // SET AUDIO
    private initAudioNotification(){
        this.audio = new Audio();
        this.audio.src = this.g.baseLocation + URL_SOUND_LIST_CONVERSATION;
        this.audio.load();
    }

    private async initConversationsHandler(tenant: string, senderId: string) {
        this.logger.debug('[APP-COMP] initialize: ListConversationsComponent');
        const keys = ['YOU'];
        const translationMap = this.translateService.translateLanguage(keys);
        this.listConversations = [];
        this.archivedConversations = [];
        //this.availableAgents = this.g.availableAgents.slice(0, 5);

        this.logger.debug('[APP-COMP] senderId: ', senderId);
        this.logger.debug('[APP-COMP] tenant: ', tenant);

        // 1 - init chatConversationsHandler and  archviedConversationsHandler
        await this.conversationsHandlerService.initialize(tenant, senderId, translationMap)
        await this.archivedConversationsService.initialize(tenant, senderId, translationMap)
        // 2 - get conversations from storage
        // this.chatConversationsHandler.getConversationsFromStorage();
        // 3 - get conversation from database with REST Api call if singleConversation mode is active and widget is Opened; otherwize show only widget and start conversation when launcher icon is clicked
        if(this.g.singleConversation && this.g.isOpen){
            this.manageWidgetSingleConversation();
        }else if(this.g.singleConversation && !this.g.isOpen){
            this.showWidget()
        }
        // 5 - connect conversationHandler and archviedConversationsHandler to firebase event (add, change, remove)
        this.conversationsHandlerService.subscribeToConversations(() => { })
        this.archivedConversationsService.subscribeToConversations(() => { })
        this.listConversations = this.conversationsHandlerService.conversations;
        this.archivedConversations = this.archivedConversationsService.archivedConversations;
        // 6 - save conversationHandler in chatManager
        this.chatManager.setConversationsHandler(this.conversationsHandlerService);
        this.chatManager.setArchivedConversationsHandler(this.archivedConversationsService);

        this.logger.debug('[APP-COMP] this.listConversations.length', this.listConversations.length);
        this.logger.debug('[APP-COMP] this.listConversations appcomponent', this.listConversations, this.archivedConversations);

    }

    private initConversationHandler(conversationWith: string): ConversationHandlerService {
        const tenant = this.g.tenant;
        const keys = [
            // 'LABEL_AVAILABLE',
            // 'LABEL_NOT_AVAILABLE',
            // 'LABEL_TODAY',
            // 'LABEL_TOMORROW',
            // 'LABEL_TO',
            // 'LABEL_LAST_ACCESS',
            // 'ARRAY_DAYS',
            // 'LABEL_ACTIVE_NOW',
            // 'LABEL_WRITING',
            'INFO_SUPPORT_USER_ADDED_SUBJECT',
            'INFO_SUPPORT_USER_ADDED_YOU_VERB',
            'INFO_SUPPORT_USER_ADDED_COMPLEMENT',
            'INFO_SUPPORT_USER_ADDED_VERB',
            'INFO_SUPPORT_CHAT_REOPENED',
            'INFO_SUPPORT_CHAT_CLOSED',
            'INFO_A_NEW_SUPPORT_REQUEST_HAS_BEEN_ASSIGNED_TO_YOU',
            'INFO_SUPPORT_LEAD_UPDATED',
            'INFO_SUPPORT_MEMBER_LEFT_GROUP',
            'LABEL_TODAY',
            'LABEL_TOMORROW',
            'LABEL_LOADING',
            'LABEL_TO',
            'ARRAY_DAYS',
        ];

        const translationMap = this.translateService.translateLanguage(keys);

        //TODO-GAB: da sistemare loggedUser in firebase-conversation-handler.service
        const loggedUser = { uid: this.g.senderId }
        const conversationWithFullname = this.g.recipientFullname;
        let handler: ConversationHandlerService = this.chatManager.getConversationHandlerByConversationId(conversationWith);
        this.logger.debug('[APP-COMP] DETTAGLIO CONV - handler **************', handler, conversationWith);
        if (!handler) {
            const conversationHandlerService = this.conversationHandlerBuilderService.build();
            conversationHandlerService.initialize(
                conversationWith,
                conversationWithFullname,
                loggedUser,
                tenant,
                translationMap
            );

            this.logger.debug('[APP-COMP] DETTAGLIO CONV - NEW handler **************', conversationHandlerService);
            this.chatManager.addConversationHandler(conversationHandlerService);
            handler = conversationHandlerService

        }

        return handler
    }

    /** initLauncherButton
     * posiziono e visualizzo il launcher button
     */
    private initLauncherButton() {
        this.isInitialized = true;
        this.marginBottom = +this.g.marginY + 70;
    }

    /**
     * @description 
     * -if recipientId from tiledesk settings IS SET, not get last active conversation
     * and call startUI() and showWidget() from current recipientId
     * - if recipientId from tiledesk settings IS NOT SET, get last active
     * conversation from REST API call and then startUI() and showWidget()
     */
    manageWidgetSingleConversation(){
        if(this.g.recipientId){
            this.appStorageService.setItem('recipientId', this.g.recipientId)
            new Promise((resolve, reject)=>{
                this.startUI();
                resolve('ok')
            }).then((res)=> { this.showWidget() });
            return;
        }
        this.conversationsHandlerService.getLastConversation((conv, error)=> {
            this.logger.debug('[APP-COMP] getConverationRESTApi: conversation from rest API --> ', conv)
            if(error){
                this.logger.error("[APP-COMP] getConverationRESTApi: ERORR while retriving data", error)
            }

            if(conv){
                //start widget from this conversation
                const recipientId : string = conv.uid
                this.g.setParameter('recipientId', recipientId);
                this.appStorageService.setItem('recipientId', recipientId)
            } else {
                //start widget with NEW CONVERSATION
                this.logger.debug("[APP-COMP] getConverationRESTApi: NO active conversations")
                // this.isOpenHome = false;
                // this.isOpenConversation = true;
                // this.onNewConversation()
            }

            new Promise((resolve, reject)=>{
                this.startUI();
                resolve('ok')
            }).then((res)=> { this.showWidget() });
            
        });
    }

    // ========= begin:: FUNCTIONS ============//
    /**
     * 1 - clear local storage
     * 2 - remove user in firebase
    */
    signOut(): Promise<boolean> {
        this.logger.debug('[APP-COMP] SIGNOUT', this.g.isLogged);
        if (this.g.isLogged === true) {
            this.logger.debug('[APP-COMP] prima ero loggato allora mi sloggo!');
            this.g.setIsOpen(false);
            // this.g.setAttributeParameter('userFullname', null);
            // this.g.setAttributeParameter('userEmail', null);
            // this.g.setParameter('userFullname', null);
            // this.g.setParameter('userEmail', null);
            this.appStorageService.clear();
            this.presenceService.removePresence();
            this.tiledeskAuthService.logOut();
            return this.messagingAuthService.logout();
            // this.authService.signOut(-2);
        }
    }

    clearStorage(){
        this.logger.debug('[APP-COMP] clearStorage');
        this.appStorageService.clear();
    }

    /** show widget */
    private showWidget() {
        this.logger.debug('[APP-COMP] show widget--> autoStart:', this.g.autoStart, 'startHidden', this.g.startHidden, 'isShown', this.g.isShown)
        const startHidden = this.g.startHidden;
        const divWidgetContainer = this.g.windowContext.document.getElementById('tiledesk-container');
        if (divWidgetContainer && startHidden === false) {
            divWidgetContainer.style.display = 'block';
            this.g.setParameter('isShown', true, true);
        } else {
            this.g.startHidden = false;
            this.g.setParameter('isShown', false, true);
        }
    }

    /** hide widget */
    private hideWidget() {
        const divWidgetContainer = this.g.windowContext.document.getElementById('tiledesk-container');
        if (divWidgetContainer) {
            divWidgetContainer.style.display = 'none';
        }
        this.g.setParameter('isShown', false, true);
    }

    private disposeWidget(){
        const divWidgetContainer = this.g.windowContext.document.getElementById('tiledesk-container');
        if(divWidgetContainer){
            divWidgetContainer.remove()
        }
    }

    /** */
    private sendMessage(msgObect: MessageObj) {

        const tenant = msgObect.tenant 
        const senderId = msgObect.senderId
        const senderFullname = msgObect.senderFullname
        const message = msgObect.message
        const type = msgObect.type
        const metadata = msgObect.metadata
        const recipientId = msgObect.recipientId
        const recipientFullname  = msgObect.recipientFullname
        const attributes = msgObect.attributes
        const projectid = msgObect.projectid
        const channelType = msgObect.channelType


        this.logger.debug('[APP-COMP] sendMessage from window.tiledesk *********** ',tenant,senderId,senderFullname,
                                message,type,metadata,recipientId,recipientFullname,
                                attributes,projectid,channelType);
        const messageSent = this.initConversationHandler(recipientId).sendMessage(
            message,
            type,
            metadata,
            recipientId,
            recipientFullname,
            senderId,
            senderFullname,
            channelType,
            attributes)
    }

    /** */
    private setPreChatForm(state: boolean) {
        if (state != null) {
            this.g.setParameter('preChatForm', state);
            if (state === true) {
                this.appStorageService.setItem('preChatForm', state);
            } else {
                this.appStorageService.removeItem('preChatForm');
            }
        }
    }

    private setPreChatFormJson(form: Array<any>) {
        if(form){
            this.g.setParameter('preChatFormJson', form);
        }
        this.logger.debug('[APP-COMP] setPreChatFormJson from external', form)
    }

    private getPreChatFormJson() {
        let preChatForm = {}
        if(this.g.preChatFormJson){
            preChatForm = this.g.preChatFormJson
        }
        this.logger.debug('[APP-COMP] getPreChatFormJson from external', preChatForm)
        return preChatForm
    }

    private setPrivacyPolicy() {
        this.g.privacyApproved = true;
        this.g.setAttributeParameter('privacyApproved', this.g.privacyApproved);
        this.appStorageService.setItem('attributes', JSON.stringify(this.g.attributes));
        this.g.setParameter('preChatForm', false);
        this.appStorageService.removeItem('preChatForm');
    }

    /**
     * 1 - cleare local storage
     * 2 - remove div iframe widget
     * 3 - reinit widget
    */
    private reInit() {
        // if (!firebase.auth().currentUser) {
        if (!this.tiledeskAuthService.getCurrentUser()) {
            this.logger.debug('[APP-COMP] reInit ma NON SONO LOGGATO!');
        } else {
            this.tiledeskAuthService.logOut();
            this.messagingAuthService.logout();
            // this.authService.signOut(-2);
            /** ho fatto un reinit */
            this.logger.debug('[APP-COMP] sono nel caso reinit -2');
            this.g.setParameter('isLogged', false);
            this.hideWidget();
            // that.g.setParameter('isShown', false, true);
            this.appStorageService.removeItem('tiledeskToken');
            if (this.g.autoStart !== false) {
                this.authenticate();
                this.initAll();
            }
            this.appStorageService.clear();
        }
        const divWidgetRoot = this.g.windowContext.document.getElementsByTagName('chat-root')[0];
        const divWidgetContainer = this.g.windowContext.document.getElementById('tiledesk-container');
        divWidgetContainer.remove();
        divWidgetRoot.remove();
        this.g.windowContext.initWidget();
    }

    /**
     * 1 - cleare local storage
     * 2 - remove div iframe widget
     * 3 - reinit widget
    */
    private restart() {
        // if (!firebase.auth().currentUser) {
        
        this.hideWidget();
        // that.triggerOnAuthStateChanged(resp);
        if (this.g.autoStart !== false) {
            this.authenticate();
            this.initAll();
        }
        const divWidgetRoot = this.g.windowContext.document.getElementsByTagName('chat-root')[0];
        const divWidgetContainer = this.g.windowContext.document.getElementById('tiledesk-container');
        divWidgetContainer.remove();
        divWidgetRoot.remove();
        this.g.windowContext.initWidget();
    }

    private logout(): Promise<boolean> {
        return this.signOut();
    }

    /** show callout */
    private showCallout() {
        if (this.g.isOpen === false) {
            // this.g.setParameter('calloutTimer', 1)
            this.eyeeyeCatcherCardComponent.openEyeCatcher();
            this.g.setParameter('displayEyeCatcherCard', 'block');
            this.triggerOnOpenEyeCatcherEvent();
        }
    }

    /** open popup conversation */
    private f21_open() {
        const senderId = this.g.senderId;
        this.logger.debug('[APP-COMP] f21_open senderId: ', senderId);
        if (senderId) {
            // chiudo callout
            this.g.setParameter('displayEyeCatcherCard', 'none');
            // this.g.isOpen = true; // !this.isOpen;
            this.g.setIsOpen(true);
            this.isInitialized = true;
            this.appStorageService.setItem('isOpen', 'true');
            // this.g.displayEyeCatcherCard = 'none';
            this.triggerOnOpenEvent();
            // https://stackoverflow.com/questions/35232731/angular2-scroll-to-bottom-chat-style
        }
    }

    /** close popup conversation */
    private f21_close() {
        this.g.setIsOpen(false);
        this.g.isOpenNewMessage = false;
        this.appStorageService.setItem('isOpen', 'false');
        // this.g.setShadow(this.g.isOpen)
        this.triggerOnCloseEvent();
    }

    /**open widget in conversation when is closed */
    private _f21_open() {
        // const senderId = this.g.senderId;
        // this.logger.debug('[APP-COMP] f21_open senderId' , senderId) 
        // this.logger.printDebug()
        // this.g.wdLog(['f21_open senderId: ', senderId]);
        // if (senderId) {
        // chiudo callout
        this.g.setParameter('displayEyeCatcherCard', 'none');
        // this.g.isOpen = true; // !this.isOpen;
        this.g.setIsOpen(true);
        // this.isInitialized = true;
        this.appStorageService.setItem('isOpen', 'true');
        // this.g.displayEyeCatcherCard = 'none';
        this.triggerOnOpenEvent();
        // https://stackoverflow.com/questions/35232731/angular2-scroll-to-bottom-chat-style
        // }
    }

    private setParameter(parameterObj: {key: string, value: any}){
        this.g.setParameter(parameterObj.key, parameterObj.value)
    }

    private setAttributeParameter(parameterObj: {key: string, value: any}){
        this.g.setAttributeParameter(parameterObj.key, parameterObj.value)
        this.appStorageService.setItem('attributes', JSON.stringify(this.g.attributes));
    }

    private removeFirebasewebsocketFromLocalStorage() {
        this.logger.debug('[APP-COMP]  ---------------- A1 ---------------- ');
        // Related to https://github.com/firebase/angularfire/issues/970
        if (supports_html5_storage()) {
            this.appStorageService.removeItem('firebase:previous_websocket_failure');
        }
    }
    // ========= end:: FUNCTIONS ============//


    // ========= begin:: COMPONENT TO WINDOW ============//
    /**
     * http://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/
     */
    private addComponentToWindow(ngZone) {
        const that = this;
        const windowContext = this.g.windowContext;
        if (windowContext && windowContext['tiledesk']) {
            windowContext['tiledesk']['angularcomponent'] = { component: this, ngZone: ngZone };

            /** loggin with token */
            windowContext['tiledesk'].signInWithCustomToken = function (response):Promise<UserModel> {
                return ngZone.run(() => {
                    return windowContext['tiledesk']['angularcomponent'].component.signInWithCustomToken(response); 
                });
            };
            /** loggin anonymous */
            windowContext['tiledesk'].signInAnonymous = function ():Promise<UserModel> {
                return ngZone.run(() => {
                    return windowContext['tiledesk']['angularcomponent'].component.signInAnonymous();
                });
            };
            /** show all widget */
            windowContext['tiledesk'].show = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.showWidget();
                });
            };
            /** hidden  widget */
            windowContext['tiledesk'].hide = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.hideWidget();
                });
            };
            /** dispose widget */
            windowContext['tiledesk'].dispose = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.disposeWidget();
                });
            };
            /** close window chat */
            windowContext['tiledesk'].close = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.onCloseWidget();
                });
            };
            /** open window chat */
            windowContext['tiledesk'].open = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.onOpenCloseWidget();
                });
            };
            /** set state PreChatForm close/open */
            windowContext['tiledesk'].setPreChatForm = function (state) {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.setPreChatForm(state);
                });
            };

            windowContext['tiledesk'].setPrivacyPolicy = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.setPrivacyPolicy();
                });
            };

            /** send first message */
            windowContext['tiledesk'].sendMessage = function (msgObj: MessageObj) {
                const _globals = windowContext['tiledesk'].angularcomponent.component.g;

                let tenant = (msgObj.tenant? msgObj.tenant: null)
                let senderId = (msgObj.senderId? msgObj.senderId: null)
                let senderFullname = (msgObj.senderFullname? msgObj.senderFullname: null)
                let message = (msgObj.message? msgObj.message: null)
                let type = (msgObj.type? msgObj.type: null)
                let metadata = (msgObj.metadata? msgObj.metadata: null)
                let recipientId = (msgObj.recipientId? msgObj.recipientId: null)
                let recipientFullname = (msgObj.recipientFullname? msgObj.recipientFullname: null)
                let additional_attributes = (msgObj.attributes? msgObj.attributes: null)
                let projectid = (msgObj.projectid? msgObj.projectid: null)
                let channelType = (msgObj.channelType? msgObj.channelType: null)

                if (!tenant) {
                    tenant = _globals.tenant;
                }
                if (!senderId) {
                    senderId = _globals.senderId;
                }
                if (!senderFullname) {
                    senderFullname = _globals.senderFullname;
                }
                if (!message) {
                    message = 'hello';
                }
                if (!type) {
                    type = 'text';
                }
                if (!metadata) {
                    metadata = '';
                }
                if (!recipientId) {
                    recipientId = _globals.recipientId;
                }
                if (!recipientFullname) {
                    recipientFullname = _globals.recipientFullname;
                }
                if (!projectid) {
                    projectid = _globals.projectId;
                }
                if (!channelType || channelType === undefined) {
                    channelType = 'group';
                }
                // set default attributes
                const g_attributes = _globals.attributes;
                const attributes = <any>{};
                if (g_attributes) {
                    for (const [key, value] of Object.entries(g_attributes)) {
                        attributes[key] = value;
                    }
                }
                if (additional_attributes) {
                    for (const [key, value] of Object.entries(additional_attributes)) {
                        attributes[key] = value;
                    }
                }
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component
                        .sendMessage({   
                            tenant : tenant,
                            senderId :senderId,
                            senderFullname: senderFullname,
                            message : message,
                            type: type,
                            metadata: metadata,
                            recipientId: recipientId,
                            recipientFullname: recipientFullname,
                            attributes: attributes,
                            projectid: projectid,
                            channel_type: channelType
                        });
                });
            };


            /** send custom message from html page */
            windowContext['tiledesk'].sendSupportMessage = function (msgObj: MessageObj) {
                const _globals = windowContext['tiledesk'].angularcomponent.component.g;
                let message = (msgObj.message? msgObj.message: null)
                let recipientId = (msgObj.recipientId? msgObj.recipientId: null)
                let recipientFullname = (msgObj.recipientFullname? msgObj.recipientFullname: null)
                let type = (msgObj.type? msgObj.type: null)
                let metadata = (msgObj.metadata? msgObj.metadata: null)
                let additional_attributes = (msgObj.attributes? msgObj.attributes: null)             
                
                if (!message) {
                    message = 'hello';
                }
                if (!recipientId) {
                    recipientId = _globals.recipientId;
                }
                if (!type) {
                    type = 'text';
                }
                if (!metadata) {
                    metadata = {};
                }
                const g_attributes = _globals.attributes;
                const attributes = <any>{};
                if (g_attributes) {
                    for (const [key, value] of Object.entries(g_attributes)) {
                        attributes[key] = value;
                    }
                }
                if (additional_attributes) {
                    for (const [key, value] of Object.entries(additional_attributes)) {
                        attributes[key] = value;
                    }
                }
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component
                        .sendMessage({
                            tenant: _globals.tenant,
                            senderId: _globals.senderId,
                            senderFullname: _globals.userFullname,
                            message: message,
                            type: type,
                            metadata: metadata,
                            recipientId: recipientId,
                            recipientFullname: recipientFullname,
                            attributes: attributes,
                            projectid: _globals.projectid,
                            channelType: _globals.channelType
                        });
                });
            };

            /** start new conversation */
            windowContext['tiledesk'].startConversation = function (text: string) {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.onNewConversation(text);
                });
            };

            /** open widget with conversation ID */
            windowContext['tiledesk'].openConversationById = function (request_id: string) {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.openConversationById(request_id);
                });
            };

            /** set state reinit */
            windowContext['tiledesk'].reInit = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.reInit();
                });
            };

            /** set state reStart */
            windowContext['tiledesk'].restart = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.restart();
                });
            };

            /** set logout */
            windowContext['tiledesk'].logout = function (): Promise<boolean> {
                return ngZone.run(() => {
                    return windowContext['tiledesk']['angularcomponent'].component.logout();
                });
            };

             /** set logout */
             windowContext['tiledesk'].clearStorage = function (): Promise<boolean> {
                return ngZone.run(() => {
                    return windowContext['tiledesk']['angularcomponent'].component.clearStorage();
                });
            };

            /** show callout */
            windowContext['tiledesk'].showCallout = function () {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.showCallout();
                });
            };

            /** setPrechatForm  */
            windowContext['tiledesk'].setPreChatFormJson = function (form: Array<any>) {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.setPreChatFormJson(form);
                });
            };

            /** getPreChatForm  */
            windowContext['tiledesk'].getPreChatFormJson = function () {
                let preChatForm = {}
                ngZone.run(() => {
                    preChatForm = windowContext['tiledesk']['angularcomponent'].component.getPreChatFormJson();
                });
                return preChatForm
            };

            /** set a value to a parameter in widget  */
            windowContext['tiledesk'].setParameter = function (parameterObj: {key: string, value: any}) {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.setParameter(parameterObj);
                });
            };

            /** set a value to an attribute parameter in widget  */
            windowContext['tiledesk'].setAttributeParameter = function (parameterObj: {key: string, value: any}) {
                ngZone.run(() => {
                    windowContext['tiledesk']['angularcomponent'].component.setAttributeParameter(parameterObj);
                });
            };

        }
    }
    // ========= end:: COMPONENT TO WINDOW ============//


    // ======== START: manage sound and title ========//
    @HostListener('document:visibilitychange')
    visibilitychange() {
        // this.logger.printDebug("document TITLE", this.g.windowContext.window.document.title);
        if (document.hidden) {
            this.isTabVisible = false
            // this.g.windowContext.window.document.title = this.tabTitle
        } else {
            // TAB IS ACTIVE --> restore title and DO NOT SOUND
            if(!this.forceDisconnect){
                this.presenceService.imHere()
            }
            clearInterval(this.setIntervalTime)
            this.setIntervalTime = null;
            this.isTabVisible = true;
            this.g.windowContext.window.document.title = this.tabTitle;
            // this.g.windowContext.parent.title = "SHOWING"
            // this.g.windowContext.title = "SHOWING2"
        }
    }

    private manageTabNotification(canSound: boolean, calledby: string) {
        if (!this.isTabVisible) {
            // TAB IS HIDDEN --> manage title and SOUND 
            // this.g.windowContext.parent.title = "HIDDEN"
            // this.g.windowContext.title = "HIDDEN2"

            let badgeNewConverstionNumber = this.conversationsHandlerService.countIsNew()
            this.logger.debug('[APP-COMP] badgeNewConverstionNumber::', badgeNewConverstionNumber)
            badgeNewConverstionNumber > 0 ? null : badgeNewConverstionNumber= 1
            this.g.windowContext.window.document.title = "(" + badgeNewConverstionNumber + ") " + this.tabTitle
            clearInterval(this.setIntervalTime)
            const that = this
            this.setIntervalTime = window.setInterval(function () {
                if (that.g.windowContext.window.document.title.charAt(0) === '(') {
                    that.g.windowContext.window.document.title = that.tabTitle
                } else {
                    that.g.windowContext.window.document.title = "(" + badgeNewConverstionNumber + ") " + that.tabTitle;
                }
            }, 1000);
        }
        this.logger.debug('[APP-COMP] manageTabNotification canSound:calledby---->', canSound, calledby)
        if(canSound)
            this.soundMessage()
    }


    private soundMessage() {
        const that = this;
        const soundEnabled = this.g.soundEnabled;
        if (soundEnabled) {
            this.logger.debug('[APP-COMP] ****** soundMessage *****', this.audio);
            this.audio.pause();
            this.audio.currentTime = 0;
            clearTimeout(this.setTimeoutSound);
            this.setTimeoutSound = setTimeout(() => {
                that.audio.play().then(() => {
                    this.logger.debug('[APP-COMP] ****** soundMessage played *****');
                }).catch((error: any) => {
                    this.logger.debug('[APP-COMP] ***soundMessage error*', error);
                });
            }, 1000);
        }
    }
    // ======== END: manage sound and title ========//

    // ========= begin:: CALLBACK FUNCTIONS ============//
    /**
     * MOBILE VERSION:
     * onClick button close widget
     */
    onCloseWidget() {
        this.isOpenConversation = false;
        let badgeNewConverstionNumber = this.conversationsHandlerService.countIsNew()
        this.g.setParameter('conversationsBadge', badgeNewConverstionNumber);
        this.logger.debug('[APP-COMP] widgetclosed:::', this.g.conversationsBadge, this.conversationsHandlerService.countIsNew())
        // this.g.isOpen = false;
        // this.g.setIsOpen(false);
        // this.setBadgeNewConverstionNumber();
        this.f21_close();
    }


    /** DDP reload widget */
    async reloadWidget() { 
        this.openCloseWidget();
        this.logger.debug('[APP-COMP-1] AAA - hideWidget');
        // setTimeout(() => {
        await Promise.all([
                this.authenticate(),
                this.initAll()
            ]);
        // }, 20000);
        this.logger.debug('[APP-COMP-1] CCC - showWidget');
    }


    /**
     * LAUNCHER BUTTON:
     * onClick button open/close widget
     */
    onOpenCloseWidget($event) {
        this.logger.debug('[APP-COMP] onOpenCloseWidget', $event, this.g.isLogged);
        if(!this.g.isLogged){
            this.reloadWidget();
        } else {
            this.openCloseWidget();
        }
    }

    /** DDP show widget */
    openCloseWidget() {
        this.g.setParameter('displayEyeCatcherCard', 'none');
        // const conversationActive: ConversationModel = JSON.parse(this.appStorageService.getItem('activeConversation'));
        const recipientId : string = this.appStorageService.getItem('recipientId')
        this.g.setParameter('recipientId', recipientId);
        this.logger.debug('[APP-COMP] openCloseWidget', recipientId, this.g.isOpen, this.g.startFromHome);

        if (this.g.isOpen === false) {
            if(this.forceDisconnect){
                this.logger.log('[FORCE] onOpenCloseWidget --> reconnect', this.forceDisconnect)
                this.messagingAuthService.createCustomToken(this.g.tiledeskToken)
                this.forceDisconnect = false;
            }
            if (!recipientId) {
                if(this.g.singleConversation){
                    this.isOpenHome = false;
                    this.g.setParameter('isOpenPrechatForm', false)
                    this.initConversationsHandler(this.g.tenant, this.g.senderId)
                    // this.manageWidgetSingleConversation()
                } else if (this.g.startFromHome) {
                    this.isOpenHome = true;
                    this.isOpenConversation = false;
                } else {
                    this.isOpenHome = false;
                    this.isOpenConversation = true;
                    this.onNewConversation()
                    // this.startNwConversation();
                }
            } else { //conversation is present in localstorage
                this.isOpenHome = false;
                this.isOpenConversation = true;
                this.startUI()
            }
            this.triggerOnOpenEvent();
        } else {
            this.triggerOnCloseEvent();
        }
        //change status to the widget
        this.g.setIsOpen(!this.g.isOpen);
        this.appStorageService.setItem('isOpen', this.g.isOpen);
        //show loading if widget is open and user is not logged
        if(this.g.isOpen === true && !this.g.isLogged){
            this.loading = true;
        }
        // this.saveBadgeNewConverstionNumber();
    }


    /**
     * MODAL SELECTION DEPARTMENT:
     * selected department
     */
    onDepartmentSelected($event) {
        if ($event) {
            this.logger.debug('[APP-COMP] onSelectDepartment: ', $event);
            this.g.setParameter('departmentSelected', $event);
            // this.settingsSaverService.setVariable('departmentSelected', $event);
            // this.isOpenHome = true;
            // this.isOpenSelectionDepartment = false;
            // if (this.g.isOpenPrechatForm === false && this.isOpenSelectionDepartment === false) {
            //     this.isOpenConversation = true;
            //     this.startNewConversation();
            // }
            if (this.g.isOpenPrechatForm === false) {
                this.isOpenSelectionDepartment = false;
                this.isOpenConversation = true;
                setTimeout(() => {
                    this.isOpenHome = false 
                }, 0);
                // this.isOpenSelectionDepartment = false;
                this.startNewConversation();
            }
        }
    }

    /**
     * MODAL SELECTION DEPARTMENT:
     * close modal
     */
    onCloseModalDepartment() {
        if(!this.g.singleConversation){
            this.logger.debug('[APP-COMP] returnCloseModalDepartment');
            this.isOpenHome = true;
            this.isOpenSelectionDepartment = false;
            this.isOpenConversation = false;
        }else{
            this.onCloseWidget()
        }
        
    }


    /**
     * MODAL PRECHATFORM:
     * completed prechatform
     */
    onPrechatFormComplete() {
        this.logger.debug('[APP-COMP] onPrechatFormComplete');
        this.isOpenHome = true;
        this.g.setParameter('isOpenPrechatForm', false);
        if (this.g.isOpenPrechatForm === false && this.isOpenSelectionDepartment === false) {
            this.isOpenConversation = true;
            this.startNewConversation();
        }
        // this.settingsSaverService.setVariable('isOpenPrechatForm', false);
    }

    /**
     * MODAL PRECHATFORM:
     * close modal
     */
    onCloseModalPrechatForm() {
        this.logger.debug('[APP-COMP] onCloseModalPrechatForm');
        if(!this.g.singleConversation){
            this.isOpenHome = true;
            this.isOpenSelectionDepartment = false;
            this.isOpenConversation = false;
            this.g.setParameter('isOpenPrechatForm', false);
            this.g.newConversationStart = false;
        }else{
            this.onCloseWidget()
        }
        
        // this.settingsSaverService.setVariable('isOpenPrechatForm', false);
    }

    onSoundChange(soundEnabled) {
        this.g.setParameter('soundEnabled', soundEnabled);
    }

    onMenuOptionSignOut(){
        this.logger.debug('[APP-COMP] onMenuOptionSignOut');
        this.signOut()
        this.isOpenConversation = false;
        // this.onNewConversation();
    }

    /**
     * MODAL HOME:
     * @param $event
     * return conversation selected from chat-last-message output event
     */
    public onSelectedConversation($event: ConversationModel) {
        if ($event) {
            if (this.g.isOpen === false) {

                if(this.forceDisconnect){
                    this.logger.log('[FORCE] onSelectedConversation --> reconnect', this.forceDisconnect)
                    this.messagingAuthService.createCustomToken(this.g.tiledeskToken)
                    this.forceDisconnect = false;
                }
                //this.f21_open();
                this.f21_open();
            }
            // this.conversationSelected = $event;
            if($event.channel_type === CHANNEL_TYPE.DIRECT){
                this.g.setParameter('recipientId', $event.sender);
                this.appStorageService.setItem('recipientId', $event.sender)
            }else {
                this.g.setParameter('recipientId', $event.recipient);
                this.appStorageService.setItem('recipientId', $event.recipient)
            }
            this.g.isOpenPrechatForm = false;
            this.isOpenConversation = true;
            $event.archived? this.isConversationArchived = $event.archived : this.isConversationArchived = false;
            this.logger.debug('[APP-COMP] onSelectConversation in APP COMPONENT: ', $event);
            // this.messagingService.initialize(this.senderId, this.tenant, this.channelType);
            // this.messages = this.messagingService.messages;
        }
    }

    /**
     * MODAL HOME:
     * controllo se prechat form è attivo e lo carico - stack 3
     * controllo se departments è attivo e lo carico - stack 2
     * carico conversazione - stack 1
     * home - stack 0
     */
    onNewConversation(text?: string) {
        this.logger.debug('[APP-COMP] returnNewConversation in APP COMPONENT');
        if(text) this.g.setParameter('hiddenMessage', text);
        this.g.newConversationStart = true;
        // controllo i dipartimenti se sono 1 o 2 seleziono dipartimento e nascondo modale dipartimento
        // altrimenti mostro modale dipartimenti
        const preChatForm = this.g.preChatForm;
        const attributes = this.g.attributes;
        const departments = this.g.departments;
        // that.g.wdLog(['departments: ', departments, departments.length);
        this.logger.debug('[APP-COMP] attributesssss', this.g.attributes, this.g.preChatForm)
        if (preChatForm && (!attributes || !attributes.userFullname || !attributes.userEmail)) {
            // if (preChatForm && (!attributes.userFullname || !attributes.userEmail)) {
            this.isOpenConversation = false;
            this.g.setParameter('isOpenPrechatForm', true);
            // this.settingsSaverService.setVariable('isOpenPrechatForm', true);
            this.isOpenSelectionDepartment = false;
            if (departments && departments.length > 1 && this.g.departmentID == null) {
                this.isOpenSelectionDepartment = true;
            }
        } else {
            // this.g.isOpenPrechatForm = false;
            this.g.setParameter('isOpenPrechatForm', false);
            // this.settingsSaverService.setVariable('isOpenPrechatForm', false);
            this.isOpenConversation = false;
            this.isOpenSelectionDepartment = false;
            if (departments && departments.length > 1 && this.g.departmentID == null) {
                this.isOpenSelectionDepartment = true;
            } else {
                this.isOpenConversation = true;
            }
        }

        this.logger.debug('[APP-COMP] isOpenPrechatForm', this.g.isOpenPrechatForm, ' isOpenSelectionDepartment:', this.isOpenSelectionDepartment);
        if (this.g.isOpenPrechatForm === false && this.isOpenSelectionDepartment === false) {
            this.startNewConversation();
        }
    }


    onNewConversationWithMessage(recipientId: string, text: string, subType: string = 'info'){
        this.logger.log('[APP-COMP] onNewConversationWithMessage in APP COMPONENT', text);

        let message: any = {}
        message.attributes = { subtype: subType, ...this.g.attributes}
        message.userAgent = this.g.attributes['client']
        message.request_id = recipientId
        message.sourcePage = this.g.attributes['sourcePage']
        message.language = this.g.lang
        message.text = '/'+ text
        message.participants = this.g.participants
        message.departmentid = this.g.attributes.departmentId
        // this.sendMessage(message)
        this.tiledeskRequestsService.sendMessageToRequest(recipientId, this.g.tiledeskToken, message)
        return;
    }

    openConversationById(requestId){
        this.logger.log('[APP-COMP] openConversationById in APP COMPONENT', requestId);
        this.isOpenConversation = true;

        this.g.setParameter('recipientId', requestId);
        this.appStorageService.setItem('recipientId', requestId)

        this.isConversationArchived = false;
        if (this.g.isOpen === false) {
            this.f21_open();
        }
        
    }

    /**
     * MODAL HOME:
     * open all-conversation
     */
    onOpenAllConversation() {
        this.isOpenHome = true;
        this.isOpenConversation = false;
        this.isOpenAllConversation = true;
    }

    /**
     * MODAL EYE CATCHER CARD:
     * open chat
     */
    onOpenChatEyeEyeCatcherCard() {
        this.f21_open();
    }

    /**
     * MODAL EYE CATCHER CARD:
     * close button
     */
    onCloseEyeCatcherCard($e) {
        if ($e === true) {
            this.triggerOnOpenEyeCatcherEvent();
        } else {
            this.triggerOnClosedEyeCatcherEvent();
        }
    }

    /**
     * MODAL CONVERSATION:
     * close conversation
     */
    onBackConversation() {
        this.logger.debug('[APP-COMP] onCloseConversation')
        this.appStorageService.removeItem('recipientId');
        this.g.setParameter('recipientId', null, false)
        // this.g.setParameter('activeConversation', null, false);
        this.isOpenHome = true;
        this.isOpenAllConversation = false;
        this.isOpenConversation = false;
        // this.startNwConversation();
    }
        
    /**
     * MODAL CONVERSATION:
     * conversation archived
     * @param conversationId 
     * @description - if singleConversation is TRUE show new conv/load last active conversatio
     * - if singleConversation is FALSE -> back to Home component
     */
    onConversationClosed(conversationId: string){
        if(this.g.singleConversation){
            //manage single conversation
        }else{
            this.onBackConversation()
        }
    }

    /**
     * CONVERSATION DETAIL FOOTER:
     * floating button -> start new Conversation();
     */
    onNewConversationButtonClicked(event){
        this.logger.debug('[APP-COMP] onNewConversationButtonClicked');
        this.g.setParameter('hiddenMessage', null)
        
        this.isOpenConversation = false;
        this.g.singleConversation? this.isOpenHome = false: null;
        this.onNewConversation();
        // const departments = this.g.departments;
        // if (departments && departments.length > 1 && this.g.departmentID == null) {
        //     this.isOpenSelectionDepartment = true;
        // } 
        // // else {
        // //     this.isOpenConversation = true;
        // // }

        // this.logger.debug('[APP-COMP] isOpenPrechatForm', this.g.isOpenPrechatForm, ' isOpenSelectionDepartment:', this.isOpenSelectionDepartment);
        // if (this.g.isOpenPrechatForm === false && this.isOpenSelectionDepartment === false) {
        //     // this.isOpenConversation = true
        //     this.onNewConversation();
        //     // this.startNewConversation();
        // }
        // setTimeout(() => {
        //     this.onNewConversation();
        // }, 0); 
    }

    /**
     * MODAL ALL CONVERSATION:
     * close all-conversation
     */
    onCloseAllConversation() {
        this.logger.debug('[APP-COMP] Close all conversation');
        const isOpenHomeTEMP = this.isOpenHome;
        const isOpenConversationTEMP = this.isOpenConversation;
        this.isOpenHome = false;
        this.isOpenConversation = false;
        setTimeout(() => {
            this.isOpenHome = isOpenHomeTEMP;
            this.isOpenConversation = isOpenConversationTEMP;
            this.isOpenAllConversation = false;
        }, 200);
    }

    onAfterMessageSent(event: MessageModel){
        this.triggerHandler.triggerAfterSendMessageEvent(event)
        this.isSentMessage = true;
    }

    onImageLoaded(conversation: ConversationModel) {
        this.logger.debug('[APP-COMP] onLoadImage convvvv:::', conversation)
        conversation.image = this.imageRepoService.getImagePhotoUrl(conversation.sender)
    }

    onConversationLoaded(conversation: ConversationModel) {
        this.logger.debug('[APP-COMP] onConversationLoaded convvvv:::', conversation)
        const keys = ['YOU', 'SENT_AN_IMAGE', 'SENT_AN_ATTACHMENT'];
        const translationMap = this.translateService.translateLanguage(keys);
        if(conversation.sender === this.g.senderId){
            if (conversation.type === TYPE_MSG_IMAGE) {

                this.logger.log('[CONVS-LIST-PAGE] HAS SENT AN IMAGE');
                const SENT_AN_IMAGE = conversation['last_message_text'] = translationMap.get('SENT_AN_IMAGE')
                conversation.last_message_text = SENT_AN_IMAGE;
      
            // } else if (conversation.type !== "image" && conversation.type !== "text") {
            } else if (conversation.type === TYPE_MSG_FILE) {
                this.logger.log('[CONVS-LIST-PAGE] HAS SENT FILE')
                const SENT_AN_ATTACHMENT = conversation['last_message_text'] = translationMap.get('SENT_AN_ATTACHMENT')
                conversation.last_message_text =  SENT_AN_ATTACHMENT;
            }
        } else {
            if (conversation.type === TYPE_MSG_IMAGE) {

                this.logger.log('[CONVS-LIST-PAGE] HAS SENT AN IMAGE');
                const SENT_AN_IMAGE = conversation['last_message_text'] = translationMap.get('SENT_AN_IMAGE')
                conversation.last_message_text = SENT_AN_IMAGE;
      
            // } else if (conversation.type !== "image" && conversation.type !== "text") {
            } else if (conversation.type === TYPE_MSG_FILE) {
                this.logger.log('[CONVS-LIST-PAGE] HAS SENT FILE')
                const SENT_AN_ATTACHMENT = conversation['last_message_text'] = translationMap.get('SENT_AN_ATTACHMENT')
                conversation.last_message_text =  SENT_AN_ATTACHMENT;
            }
        }
    }

    /**
     * MODAL MENU SETTINGS:
     * logout
     */
    onSignOut() {
        this.signOut();
    }

    onMenuOptionClick(event: string) {
        this.logger.debug('[APP-COMP] onMenuOptionClick', event);
        switch(event) {
            case HEADER_MENU_OPTION.MAXIMIZE:
                this.onWidgetSizeChange('max');
                break;
            case HEADER_MENU_OPTION.MINIMIZE:
                this.onWidgetSizeChange('min');
                break;
            case HEADER_MENU_OPTION.TOP:
                this.onWidgetSizeChange('top');
                break;
        }
    }

    onWidgetSizeChange(mode: 'min' | 'max' | 'top') {
        var tiledeskDiv = this.g.windowContext.window.document.getElementById('tiledeskdiv');
        this.g.size = mode;
        let parent = tiledeskDiv.parentElement as HTMLElement | null;

        if(mode==='max'){
            tiledeskDiv.classList.add('max-size')
            tiledeskDiv.classList.remove('min-size')
            tiledeskDiv.classList.remove('top-size')
            if(parent) parent.classList.remove('overlay--popup');
        } else if(mode==='min'){
            tiledeskDiv.classList.add('min-size')
            tiledeskDiv.classList.remove('max-size')
            tiledeskDiv.classList.remove('top-size')
            if(parent) parent.classList.remove('overlay--popup');
        } else if(mode=== 'top'){
            tiledeskDiv.classList.add('top-size')
            tiledeskDiv.classList.remove('max-size')
            tiledeskDiv.classList.remove('min-size')
            if(parent) parent.classList.add('overlay--popup');
        }
    }

    /**
     * MODAL RATING WIDGET:
     * close modal page
     */
    onCloseModalRateChat() {
        if(!this.g.singleConversation && this.g.nativeRating){
            this.isOpenHome = true;
            this.g.setParameter('isOpenPrechatForm', false);
            // this.settingsSaverService.setVariable('isOpenPrechatForm', false);
            this.isOpenConversation = false;
            this.isOpenSelectionDepartment = false;
            this.g.setParameter('isOpenStartRating', false);
            // this.settingsSaverService.setVariable('isOpenStartRating', false);
            // this.startNwConversation();
            this.onBackConversation();
        }
    }

    /**
     * MODAL RATING WIDGET:
     * complete rate chat
     */
    onRateChatComplete() {
        if(!this.g.singleConversation && this.g.nativeRating){
            this.isOpenHome = true;
            this.g.setParameter('isOpenPrechatForm', false);
            // this.settingsSaverService.setVariable('isOpenPrechatForm', false);
            this.isOpenConversation = false;
            this.isOpenSelectionDepartment = false;
            this.g.setParameter('isOpenStartRating', false);
            // this.settingsSaverService.setVariable('isOpenStartRating', false);
            // this.startNwConversation();
            this.onBackConversation();
        }
    }
    // ========= end:: CALLBACK FUNCTIONS ============//


    // ========= START:: TRIGGER FUNCTIONS ============//
    /** onBeforeInit */
    private triggerOnBeforeInit() {
        const detailOBJ = { global: this.g, default_settings: this.g.default_settings, appConfigs: this.appConfigService.getConfig() }
        this.triggerHandler.triggerOnBeforeInit(detailOBJ)
    }
    /** onInit */  
    private triggerOnViewInit() {
        const detailOBJ = { global: this.g, default_settings: this.g.default_settings, appConfigs: this.appConfigService.getConfig() }
        this.triggerHandler.triggerOnViewInit(detailOBJ)
    }
    /** onOpen */  
    private triggerOnOpenEvent() {
        const detailOBJ = { default_settings: this.g.default_settings }
        this.triggerHandler.triggerOnOpenEvent(detailOBJ)
    }
    /** onClose */  
    private triggerOnCloseEvent() {
        const detailOBJ = { default_settings: this.g.default_settings }
        this.triggerHandler.triggerOnCloseEvent(detailOBJ)
    }
    /** onOpenEyeCatcher */  
    private triggerOnOpenEyeCatcherEvent() {
        const detailOBJ = { default_settings: this.g.default_settings }
        this.triggerHandler.triggerOnOpenEyeCatcherEvent(detailOBJ)
    }
    /** onClosedEyeCatcher */
    private triggerOnClosedEyeCatcherEvent() {
        this.triggerHandler.triggerOnClosedEyeCatcherEvent()
    }

    /** onLoggedIn */
    // private triggerOnLoggedIn() {
    //     const detailOBJ = { user_id: this.g.senderId, global: this.g, default_settings: this.g.default_settings, appConfigs: this.appConfigService.getConfig() }
    //     this.triggerHandler.triggerOnOpenEvent(detailOBJ)
    // }

    /** onLoggedOut */
    // private triggerOnLoggedOut() {
    //     const detailOBJ = { isLogged: this.g.isLogged, global: this.g, default_settings: this.g.default_settings, appConfigs: this.appConfigService.getConfig() }
    //     this.triggerHandler.triggerOnLoggedOut(detailOBJ)
    // }

    /** onAuthStateChanged */
    private triggerOnAuthStateChanged(event) {
        const detailOBJ = { event: event, isLogged: this.g.isLogged, user_id: this.g.senderId, global: this.g, default_settings: this.g.default_settings, appConfigs: this.appConfigService.getConfig() }
        this.triggerHandler.triggerOnAuthStateChanged(detailOBJ)
    }

    /** onNewConversation */
    private triggerNewConversationEvent(newConvId) {
        const detailOBJ = { global: this.g, default_settings: this.g.default_settings, newConvId: newConvId, appConfigs: this.appConfigService.getConfig() }
        this.triggerHandler.triggerNewConversationEvent(detailOBJ)
    }

    /** onLoadParams */
    private triggerLoadParamsEvent() {
        const detailOBJ = { default_settings: this.g.default_settings }
        this.triggerHandler.triggerLoadParamsEvent(detailOBJ)
    }

    /** onConversationUpdated */
    private triggerOnConversationUpdated(conversation: ConversationModel) {
        this.triggerHandler.triggerOnConversationUpdated(conversation)
    }

    /** onCloseMessagePreview */
    private triggerOnCloseMessagePreview() {
        this.triggerHandler.triggerOnCloseMessagePreview();
    }
    // ========= END:: TRIGGER FUNCTIONS ============//

    private setStyleMap() {
        this.styleMapConversation.set('foregroundColor', this.g.themeForegroundColor)
        this.styleMapConversation.set('themeColor', this.g.themeColor)
        this.styleMapConversation.set('colorGradient', this.g.colorGradient180)
        this.styleMapConversation.set('bubbleSentBackground', this.g.bubbleSentBackground)
        this.styleMapConversation.set('bubbleSentTextColor', this.g.bubbleSentTextColor)
        this.styleMapConversation.set('bubbleReceivedBackground', this.g.bubbleReceivedBackground)
        this.styleMapConversation.set('bubbleReceivedTextColor', this.g.bubbleReceivedTextColor)
        this.styleMapConversation.set('fontSize', this.g.fontSize)
        this.styleMapConversation.set('fontFamily', this.g.fontFamily)
        this.styleMapConversation.set('buttonFontSize', this.g.buttonFontSize)
        this.styleMapConversation.set('buttonBackgroundColor', this.g.buttonBackgroundColor)
        this.styleMapConversation.set('buttonTextColor', this.g.buttonTextColor)
        this.styleMapConversation.set('buttonHoverBackgroundColor',this.g.buttonHoverBackgroundColor)
        this.styleMapConversation.set('buttonHoverTextColor', this.g.buttonHoverTextColor)
        this.styleMapConversation.set('iconColor', '#5f6368')

        this.el.nativeElement.style.setProperty('--button-in-msg-background-color', this.g.bubbleSentBackground)
        this.el.nativeElement.style.setProperty('--button-in-msg-font-size', this.g.buttonFontSize)
        this.el.nativeElement.style.setProperty('--button-in-msg-font-family', this.g.fontFamily)
        this.el.nativeElement.style.setProperty('--chat-header-height', this.g.hideHeaderConversation? '0px': null)
        this.el.nativeElement.style.setProperty('--font-size-bubble-message', this.g.fontSize)
        this.el.nativeElement.style.setProperty('--font-family-bubble-message', this.g.fontFamily)

    }


    private loadCustomScript(config){
        if(config.hasOwnProperty("globalRemoteJSSrc")){
          this.scriptService.buildScriptArray(config['globalRemoteJSSrc'])
        }
    }


    private listenToWidgetClick(){
        const that = this
        let clickTimeout = setTimeout(() => {
            that.logger.log('[FORCE] --> NO INTERACTION: disconnection... <--- ')
            //disconnect 
            that.forceDisconnect = true
            that.messagingAuthService.logout()
        }, that.g.disconnetTime * 1000);
        window.addEventListener("click", function(){
            that.logger.log('[FORCE] <<INTERACTION>> within 1 minute')
            clearTimeout(clickTimeout)
        })
    }

    private listenToNetworkStatus(){
        window.addEventListener('online', () => {
            this.isShowErrorMessage = false;
            this.errorMessage = null;
            this.errorKeyMessage = null;
        });
        window.addEventListener('offline', () => {
            this.isShowErrorMessage = true;
            this.errorMessage = null;
            this.errorKeyMessage = 'CONNECTION_NETWORK_ERROR';
        });
        window.addEventListener('tooltipErrorMessage', (event: CustomEvent) => {
            // console.log('event-------------------> tooltipErrorMessage', event);
            this.isShowErrorMessage = event.detail?.error;
            this.errorKeyMessage = event.detail?.keyMessage || null;
            this.errorMessage = event.detail?.message || null;
            this.errorParams = event.detail?.params || {};                                        
        });
    }

    // ========= begin:: DESTROY ALL SUBSCRIPTIONS ============//
    /** elimino tutte le sottoscrizioni */
    ngOnDestroy() {
        this.logger.debug('[APP-COMP] this.subscriptions', this.subscriptions);
        const windowContext = this.g.windowContext;
        if (windowContext && windowContext['tiledesk']) {
            windowContext['tiledesk']['angularcomponent'] = null;
            // this.g.setParameter('windowContext', windowContext);
            this.g.windowContext = windowContext;
        }
        this.unsubscribe();
    }

    /** */
    unsubscribe() {
        this.subscriptions.forEach(function (subscription) {
            subscription.unsubscribe();
        });
        this.subscriptions = [];
        this.logger.debug('[APP-COMP] this.subscriptions', this.subscriptions);
    }
    // ========= end:: DESTROY ALL SUBSCRIPTIONS ============//


}
