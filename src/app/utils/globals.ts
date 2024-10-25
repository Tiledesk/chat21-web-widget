import { style } from '@angular/animations';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

/** CONSTANTS */
import { CHANNEL_TYPE } from 'src/chat21-core/utils/constants';

/** MODELS */
import { DepartmentModel } from 'src/models/department';
import { ProjectModel } from 'src/models/project';
import { UserAgent } from 'src/models/userAgent';

/** UTILS FUNCTIONS */
import { avatarPlaceholder, detectIfIsMobile, getParameterByName, setColorFromString } from 'src/app/utils/utils';
import { ConversationModel } from 'src/chat21-core/models/conversation';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { Rule } from 'src/models/rule';
import { BRAND_BASE_INFO } from './utils-resources';

@Injectable({
    providedIn: 'root'
  })
export class Globals {

  // ============ BEGIN: SET FUNCTION BY UTILS ==============//
  // getParameterByName = getParameterByName;
  // convertColorToRGBA = convertColorToRGBA;
  // ============ BEGIN: SET INTERNAL PARAMETERS ==============//

  project = new ProjectModel();
  senderId: string;
  tenant: string;
  channelType: string;
  default_settings: any;
  isMobile: boolean;
  isLogged: boolean;
  soundEnabled: boolean;
  BUILD_VERSION: String;
  baseLocation: string;
  availableAgents: Array<UserAgent> = [];
  
  attributes: any;
  preChatFormJson: any; // *******  new ********
  token: string;
  tiledeskToken: string;
  firebaseToken: string;
  lang: string;
  conversationsBadge: number;
  /**@deprecated */
  activeConversation: ConversationModel;
  
  isOpenStartRating: boolean;
  departments: DepartmentModel[];
  departmentSelected: DepartmentModel;
  departmentDefault: any;
  isOpenMenuOptions: boolean;
  isOpenPrechatForm: boolean;

  botsRules: Rule[];

  // areAgentsAvailable = false;
  areAgentsAvailableText: string;
  availableAgentsStatus = false; // indica quando è impostato lo stato degli agenti nel subscribe
  displayEyeCatcherCard: string;

  firstOpen = true;
  departmentID = null;
  privacyApproved = false;

  // ============ BEGIN: LABELS ==============//
  LABEL_PLACEHOLDER: string;
  LABEL_START_NW_CONV: string;
  LABEL_SELECT_TOPIC: string;
  LABEL_COMPLETE_FORM: string;
  LABEL_FIELD_NAME: string;
  LABEL_ERROR_FIELD_NAME: string;
  LABEL_FIELD_EMAIL: string;
  LABEL_ERROR_FIELD_EMAIL: string;
  LABEL_WRITING: string;
  LABEL_SEND_NEW_MESSAGE: string;
  AGENT_NOT_AVAILABLE: string;
  AGENT_AVAILABLE: string;
  GUEST_LABEL: string;
  ALL_AGENTS_OFFLINE_LABEL: string;
  CALLOUT_TITLE_PLACEHOLDER: string;
  CALLOUT_MSG_PLACEHOLDER: string;
  ALERT_LEAVE_CHAT: string;
  YES: string;
  NO: string;
  BUTTON_CLOSE_TO_ICON: string;
  BUTTON_EDIT_PROFILE: string;
  DOWNLOAD_TRANSCRIPT: string;
  RATE_CHAT: string;
  WELCOME_TITLE: string;
  WELCOME_MSG: string;
  WELCOME: string;
  OPTIONS: string;
  SOUND_ON: string;
  SOUND_OFF: string;
  LOGOUT: string;
  CUSTOMER_SATISFACTION: string;
  YOUR_OPINION_ON_OUR_CUSTOMER_SERVICE: string;
  YOUR_RATING: string;
  WRITE_YOUR_OPINION: string;
  SUBMIT: string;
  THANK_YOU_FOR_YOUR_EVALUATION: string;
  YOUR_RATING_HAS_BEEN_RECEIVED: string;
  CLOSE: string;
  PREV_CONVERSATIONS: string;
  YOU: string;
  SHOW_ALL_CONV: string;
  START_A_CONVERSATION: string;
  NO_CONVERSATION: string;
  SEE_PREVIOUS: string;
  WAITING_TIME_FOUND: string;
  WAITING_TIME_NOT_FOUND: string;
  CLOSED: string;
  LABEL_PREVIEW: string;

  // ============ BEGIN: EXTERNAL PARAMETERS ==============//
  autoStart: boolean;
  startHidden: boolean;
  isShown: boolean;
  isOpen: boolean;
  startFromHome: boolean;
  projectid: string;
  preChatForm: boolean; 
  align: string;
  calloutTimer: number;
  calloutTitle: string;
  calloutMsg: string;
  calloutStaus: boolean;
  userFullname: string;
  userEmail: string;
  widgetTitle: string;
  fullscreenMode: boolean;
  hideHeaderCloseButton: boolean;
  themeColor: string;
  themeColorOpacity: number;
  themeForegroundColor: string;
  colorGradient: string;
  colorGradient180: string;
  allowTranscriptDownload: boolean;
  poweredBy: string;
  logoChat: string;
  welcomeTitle: string;
  welcomeMsg: string;
  recipientId: string;
  newConversationStart: boolean;
  recipientFullname: string;
  //  userId: string;
  //  userToken: string;
  marginX: string;
  marginY: string;
  mobileMarginX: string;
  mobileMarginY: string;
  launcherWidth: string;
  launcherHeight: string;
  baloonImage: string;
  baloonShape: string;
  isLogEnabled: boolean;
  openExternalLinkButton: boolean;
  hideHeaderConversationOptionsMenu: boolean;
  hideCloseConversationOptionMenu: boolean;
  hideRestartConversationOptionsMenu: boolean;
  hideSettings: boolean;
  filterByRequester: boolean;
  persistence;
  windowContext;

  showWaitTime: boolean;
  showAvailableAgents: boolean;
  showLogoutOption: boolean;
  supportMode: boolean;

  customAttributes: any;
  showAttachmentButton: boolean;
  showAllConversations: boolean;
  //  privacyField: string;
  jwt: string;

  isOpenNewMessage: boolean;
  dynamicWaitTimeReply: boolean; // *******  new ********
  logLevel: string; // *******  new ********

  bubbleSentBackground: string; // *******  new ********
  bubbleSentTextColor: string; // *******  new ********
  bubbleReceivedBackground: string; // *******  new ********
  bubbleReceivedTextColor: string; // *******  new ********
  fontSize: string; // *******  new ********
  fontFamily: string; // *******  new ********
  buttonFontSize: string; // *******  new ********
  buttonBackgroundColor: string // *******  new ********
  buttonTextColor: string // *******  new ********
  buttonHoverBackgroundColor: string // *******  new ********
  buttonHoverTextColor: string // *******  new ********
  singleConversation: boolean; // *******  new ********
  restartConversation: boolean; // *******  new ********
  nativeRating: boolean; // *******  new ********
  showInfoMessage: Array<string>; // *******  new ********
  typingLocation: string; // *******  new ********
  allowReopen: boolean; // *******  new ********
  // continueConversationBeforeTime: number; // *******  new ********
  participants: Array<string>; // *******  new ********
  whatsappNumber: string; // *******  new ********
  messangerPageTitle: string; // *******  new ********
  telegramUsername: string; // *******  new ********
  fileUploadAccept: string; // *******  new ********
  disconnetTime: number; // *******  new ********

  onPageChangeVisibilityMobile: 'open' | 'close' | 'last'; // *******  new ********
  onPageChangeVisibilityDesktop: 'open' | 'close' | 'last'; // *******  new ********
  displayOnMobile: boolean; // *******  new ********
  displayOnDesktop: boolean; // *******  new ********

  hiddenMessage: string; // *******  new ********
  isDevMode: boolean; // *******  new ********
  constructor(
  ) { }


  /**
   * 1: initParameters
   */
  initDefafultParameters() {
    let wContext: any = window;
    if (window.frameElement && window.frameElement.getAttribute('tiledesk_context') === 'parent') {
      wContext = window.parent;
    }
    const windowcontextFromWindow = getParameterByName(window, 'windowcontext');
    if (windowcontextFromWindow !== null && windowcontextFromWindow === 'window.parent') {
      wContext = window.parent;
    }
    // this.parameters['windowContext'] = windowContext;
    this.windowContext = wContext;

    // ============ BEGIN: SET EXTERNAL PARAMETERS ==============//
    this.baseLocation = 'https://widget.tiledesk.com/v2';
    this.autoStart = true;
    this.startHidden = false;
    /** start Authentication and startUI */
    this.isShown = true;
    /** show/hide all widget -> js call: showAllWidget */
    this.isOpen = false;
    /** show/hide window widget -> js call: hideAllWidget */
    this.startFromHome = true;
    /** start from Home or Conversation */
    this.isOpenPrechatForm = true;
    /** check open/close modal prechatform if g.preChatForm is true  */
    this.isOpenStartRating = false;
    /** show/hide all rating chat */
    this.projectid = '';
    /** The TileDesk project id. Find your TileDesk ProjectID in the
    TileDesk Dashboard under the Widget menu. */
    this.preChatForm = false;
    /** You can require customers to enter information like name and email
    before sending a chat message by enabling the Pre-Chat form. Permitted
    values: true, false. The default value is false. */
    this.align = '';
    /** if it is true, the chat window is automatically open when the
    widget is loaded. Permitted values: true, false. Default value : false */
    this.calloutTimer = -1;
    /** Proactively open the chat windows to increase the customer engagement.
    Permitted values: -1 (Disabled), 0 (Immediatly) or a positive integer value.
    For exmaple: 5 (After 5 seconds), 10 (After 10 seconds). */
    this.calloutTitle = '';
    /** title box callout */
    this.calloutMsg = '';
    /** stato callout (shown only first time) */
    this.calloutStaus = true;
    /** message box callout */
    this.userFullname = '';
    /** userFullname: Current user fullname. Set this parameter to specify
    the visitor fullname. */
    this.userEmail = '';
    /** Current user email address. Set this parameter to specify the visitor
    email address.  */
    this.widgetTitle = '';
    /** Set the widget title label shown in the widget header. Value type : string.
    The default value is Tiledesk. */
    this.dynamicWaitTimeReply = true;  
    /** The user can decide whether or not to share the 
     * average response time of his team (if 'dynamicWaitTimeReply' is 
     * false the WAITING_TIME_NOT_FOUND will always be displayed) 
     * is set to true for backward compatibility with old projects */
    this.hideHeaderCloseButton = false;
    /** Hide the close button in the widget header. Permitted values: true,
    false. The default value is false. */
    this.fullscreenMode = false;
    /** if it is true, the chat window is open in fullscreen mode. Permitted
    values: true, false. Default value : false */
    this.themeColor = convertColorToRGBA('#2a6ac1', 100);
    /** allows you to change the main widget's color
    (color of the header, color of the launcher button,
    other minor elements). Permitted values: Hex color
    codes, e.g. #87BC65 and RGB color codes, e.g. rgb(135,188,101) */
    this.themeColorOpacity = 100
    /**allows you to change opacity in background headers component 
     * Permitted values: [0..1] */
    this.themeForegroundColor = convertColorToRGBA('#ffffff', 100);
    /** allows you to change text and icons' color.
    Permitted values: Hex color codes, e.g. #425635 and RGB color
    codes, e.g. rgb(66,86,53) */
    this.allowTranscriptDownload = false;
    /** allows the user to download the chat transcript. The download button appears
    when the chat is closed by the operator. Permitter values: true, false.
    Default value: false */
    this.poweredBy = BRAND_BASE_INFO.POWERED_BY;
    /** link nel footer widget */
    this.logoChat = BRAND_BASE_INFO.LOGO_CHAT;
    /** url img logo */
    this.marginX = '20px';
    /** set margin left or rigth widget  */
    this.marginY = '20px';
    /** set margin bottom widget */
    this.mobileMarginX = '0px';
    /** set margin left or rigth widget for mobile */
    this.mobileMarginY = '0px';
    /** set margin bottom widget for mobile*/
    this.launcherWidth = '60px'
    /** set launcher width widget  */
    this.launcherHeight = '60px'
    /** set launcher height widget  */
    this.baloonImage='';
    /** set launcher baloon widget image: require SVG url  */
    this.baloonShape = '50%';
    /** set launcher balon widget shape: can set corner by corner   */
    this.isLogEnabled = false;
    // this.parameters['isLogEnabled'] = false;
    this.openExternalLinkButton = true;
    /** enable to hide/show upper-right header conversation options menu */
    this.hideHeaderConversationOptionsMenu = false;
    /** enable to close a conversation from upper-right header menu  */
    this.hideCloseConversationOptionMenu = false;
    /** enable to hide/show options menu in conversation detail header */
    this.hideRestartConversationOptionsMenu = false;
    /** enable to hide/show options menu in conversation detail header */
    this.hideSettings = false;
    /** enable to hide/show options menu in home component */
    this.filterByRequester = false;
    /** show conversations with conversation.attributes.requester_id == user.uid */
    this.persistence = 'local';
    /** set the auth persistence */
    this.preChatFormJson = [{name: "userFullname", type:"text", mandatory:true, label:"LABEL_FIELD_NAME"},{name:"userEmail", type:"text", mandatory:true, regex:"/^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/", label:"LABEL_FIELD_EMAIL", errorLabel:"LABEL_ERROR_FIELD_EMAIL"}]
    /** set the preChatForm Json as default if preChatFormCustomFieldsEnabled is false or not exist */
    this.bubbleSentBackground = convertColorToRGBA('#2a6ac1', 100); //'#62a8ea'
    /** set the background of bubble sent message */
    this.bubbleSentTextColor = convertColorToRGBA('#ffffff', 100); //'#ffffff'
    /** set the text color of bubble sent message */
    this.bubbleReceivedBackground= convertColorToRGBA('#f0f2f7', 100); //#f7f7f7;
    /** set the background of bubble received message */
    this.bubbleReceivedTextColor = convertColorToRGBA('#06132b', 100); //#1a1a1a
    /** set the text color of bubble received message */
    this.fontSize = '1.4em'
    /** set the text size of bubble messages */
    this.fontFamily = "'Roboto','Google Sans', Helvetica, Arial, sans-serif'"
    /** set the text family of bubble messages */
    this.buttonFontSize = '15px'
    /** set the text size of attachment-buttons */
    this.buttonBackgroundColor = convertColorToRGBA('#ffffff', 100)
    /** set the backgroundColor of attachment-buttons */
    this.buttonTextColor = convertColorToRGBA('#2a6ac1', 100)
    /** set the text color of attachment-buttons */
    this.buttonHoverBackgroundColor = convertColorToRGBA('#2a6ac1', 100)
    /** set the text size of attachment-buttons */
    this.buttonHoverTextColor = convertColorToRGBA('#ffffff', 100);
    /** set the text size of attachment-buttons */
    this.singleConversation = false;
    /** set the single conversation mode for the widget */
    this.restartConversation = false;
    /** allow you to always restart a new converazioe */
    this.nativeRating = true;
    /** set if native rating componet has to be shown */
    this.showInfoMessage = 'MEMBER_JOINED_GROUP'.split(',').map(key => { return key.trim()});
    /** disable or show bubble info message 'MEMBER_JOINED_CHAT' */
    this.typingLocation = 'content'
    /** set the location of typing indicator (header or content) */
    this.allowReopen = false;
    /** enable the user to reopen a closed conversation */
    // this.continueConversationBeforeTime = 48;
    /** enable user to continue archived confersation before the value time from last timeout message */
    this.participants = [];
    /** enable user to talk with specific chat-bots/humans */
    this.whatsappNumber = '';
    /**enable user to set a whatsapp business number to chat with */
    this.messangerPageTitle = ''
    /**enable user to set a facebook messanger page to chat with */
    this.telegramUsername = ''
    /**enable user to set a telegram number to chat with */
    this.fileUploadAccept = "image/*,.pdf,.txt"
    /**enable auto disconnect from messaging after a defined amount of time (s)*/
    this.disconnetTime = 0

    this.showWaitTime = true;

    this.showAvailableAgents = true;
    // this.parameters['availableAgents'] = [];

    this.showLogoutOption = false;

    this.isOpenNewMessage = false;
    this.showAttachmentButton = true;
    this.showAllConversations = true;

    //WIDGET VISIBILITY - desktop
    this.displayOnDesktop = true
    this.onPageChangeVisibilityDesktop ='close'
    //WIDGET VISIBILITY - mobile
    this.displayOnMobile = true
    this.onPageChangeVisibilityMobile = 'close'

    /**set an hidden message to show when conversation starts */
    this.hiddenMessage = null

    // ============ END: SET EXTERNAL PARAMETERS ==============//


    // ============ BEGIN: SET INTERNAL PARAMETERS ==============//
    this.tenant = environment.firebaseConfig.tenant;
    // this.parameters['tenant'] = environment.tenant;
    // this.parameters.push({'tenant': environment.tenant});

    /** Set the widget title label shown in the widget header. Value type : string.
    The default value is Tiledesk. */
                                                        /** name tenant ex: tilechat */
    this.channelType = CHANNEL_TYPE.GROUP;
    // this.parameters['channelType'] = CHANNEL_TYPE.GROUP;
    // this.parameters.push({'channelType': CHANNEL_TYPE.GROUP});
                                                        /** channelType: group/direct  */
    this.default_settings = {};
    // this.parameters.push({'default_settings': '' });
                                                        /** settings for pass variables to js */
    this.isMobile = false;
    // this.parameters['isMobile'] = false;
    // this.parameters.push({'isMobile': false});  /** detect is mobile : detectIfIsMobile() */

    this.isLogged = false;
    // this.parameters['isLogged'] = false;
    // this.parameters.push({'isLogged': false});  /** detect is logged */

    this.BUILD_VERSION = 'v.' + environment.version;
    // this.parameters['BUILD_VERSION'] = 'v.' + environment.version;
    // this.parameters.push({'BUILD_VERSION': 'v.' + environment.version});

    this.soundEnabled = true;
    // this.parameters['soundEnabled'] = true;
    // this.parameters.push({'soundEnabled': true});

    this.conversationsBadge = 0;
    // this.parameters['conversationsBadge'] = 0;
    // this.parameters.push({'conversationsBadge': 0});

    this.isOpenMenuOptions = false;
    // this.parameters['isOpenMenuOptions'] = false;
    // this.parameters.push({'isOpenMenuOptions': false});

    this.displayEyeCatcherCard = 'none';
    // this.parameters['displayEyeCatcherCard'] = 'none';
    // this.parameters.push({'displayEyeCatcherCard': 'none'});
    // ============ END: SET INTERNAL PARAMETERS ==============//

    this.supportMode = true;
    // this.parameters['supportMode'] = true;
    // this.parameters.push({'supportMode': true});

    this.newConversationStart = true;

    this.isDevMode = false;

  }


  /**
   * @param attributes
   */
  initialize() {
    this.createDefaultSettingsObject();
    this.setParameter('isMobile', detectIfIsMobile(this.windowContext));
    this.setParameter('attributes', this.attributes);
    this.setProjectParameters();
  }

  /** */
  public setProjectParameters() {
    let projectName = this.project.name;
    if (this.widgetTitle && this.widgetTitle !== '') {
      projectName = this.widgetTitle;
    }
    this.project.customization(
      projectName,
      this.logoChat,
      avatarPlaceholder(projectName),
      setColorFromString(projectName),
      this.welcomeTitle,
      this.welcomeMsg
    );
    // console.log('this.project::::: ', this.project);
  }

  /**
   * 1: setDefaultSettings
   */
  createDefaultSettingsObject() {
    this.default_settings = {
      'align': this.align,
      'allowReopen': this.allowReopen,
      'allowTranscriptDownload': this.allowTranscriptDownload,
      'autoStart': this.autoStart,
      'baloonShape': this.baloonShape, 'baloonImage': this.baloonImage,
      'bubbleSentBackground' : this.bubbleSentBackground, 'bubbleSentTextColor': this.bubbleSentTextColor,   
      'bubbleReceivedBackground': this.bubbleReceivedBackground, 'bubbleReceivedTextColor': this.bubbleReceivedTextColor,
      'buttonBackgroundColor': this.buttonBackgroundColor, 'buttonTextColor': this.buttonTextColor, 'buttonFontSize': this.buttonFontSize,
      'buttonHoverBackgroundColor': this.buttonHoverBackgroundColor, 'buttonHoverTextColor': this.buttonHoverTextColor,
      'calloutTitle': this.calloutTitle, 'calloutMsg': this.calloutMsg,
      'calloutTimer': this.calloutTimer, 'calloutStaus': this.calloutStaus,
      'channelType': this.channelType,
      'dynamicWaitTimeReply': this.dynamicWaitTimeReply,
      'fontSize': this.fontSize, 'fontFamily': this.fontFamily, 
      'fullscreenMode': this.fullscreenMode,
      'filterByRequester': this.filterByRequester,
      'hideHeaderConversationOptionsMenu': this.hideHeaderConversationOptionsMenu, 'hideHeaderCloseButton': this.hideHeaderCloseButton,
      'hideCloseConversationOptionMenu': this.hideCloseConversationOptionMenu, 'hideRestartConversationOptionsMenu': this.hideRestartConversationOptionsMenu,
      'hideSettings': this.hideSettings,
      'isLogEnabled': this.isLogEnabled,
      'isOpen': this.isOpen, 'isShown': this.isShown,
      'jwt': this.jwt,
      'logLevel': this.logLevel,
      'logoChat': this.logoChat,
      'lang': this.lang, 
      'lancherWidth': this.launcherWidth, 'lancherHeight': this.launcherHeight,
      'marginX': this.marginX, 'marginY': this.marginY,
      'mobileMarginX': this.mobileMarginX, 'mobileMarginY': this.mobileMarginY,
      'nativeRating': this.nativeRating,
      'openExternalLinkButton': this.openExternalLinkButton, 
      'participants':this.participants,
      'persistence': this.persistence,
      'poweredBy': this.poweredBy,
      'preChatForm': this.preChatForm, 'preChatFormJson': this.preChatFormJson,
      'projectid': this.projectid,
      'recipientId': this.recipientId,
      'restartConversation': this.restartConversation,
      'singleConversation': this.singleConversation,
      'showInfoMessage': this.showInfoMessage, 'showAllConversations': this.showAllConversations, 
      'showWaitTime': this.showWaitTime, 'showAvailableAgents': this.showAvailableAgents,
      'showLogoutOption': this.showLogoutOption, 'showAttachmentButton': this.showAttachmentButton,
      'soundEnabled': this.soundEnabled, 
      'startHidden': this.startHidden, 'startFromHome': this.startFromHome, 
      'tenant': this.tenant, 
      'themeColor': this.themeColor, 'themeColorOpacity': this.themeColorOpacity, 'themeForegroundColor': this.themeForegroundColor,
      'typingLocation': this.typingLocation, 
      'userEmail': this.userEmail, 'userFullname': this.userFullname, 
      'widgetTitle': this.widgetTitle,
      'welcomeMsg': this.welcomeMsg, 'welcomeTitle': this.welcomeTitle, 
    };
  }


  setColorWithGradient() {
    this.colorGradient = 'linear-gradient(' + this.themeColor + ', ' + convertColorToRGBA(this.themeColor, this.themeColorOpacity) + ')';
    this.colorGradient180 = 'linear-gradient( 180grad, ' + this.themeColor + ', ' + convertColorToRGBA(this.themeColor, this.themeColorOpacity) + ')';
    this.bubbleSentBackground = 'linear-gradient( 135grad, ' + this.bubbleSentBackground + ', ' + convertColorToRGBA(this.bubbleSentBackground, 80) + ')';
  }


  setParentBodyStyleMobile(isOpen: boolean, isMobile: boolean){
    if(isOpen && isMobile){
      //block body scroll
      // window.parent.document.body.style.height = '100vh';
      window.parent.document.body.style.setProperty('height', '0', 'important')
      window.parent.document.body.style.setProperty('width', '100%', 'important')
      window.parent.document.body.style.setProperty('overflow-y', 'hidden', 'important')
      window.parent.document.body.style.setProperty('position', 'fixed', 'important')
    }else if(!isOpen && isMobile){
      //reset body style
      window.parent.document.body.style.removeProperty('height')
      window.parent.document.body.style.removeProperty('width')
      window.parent.document.body.style.removeProperty('overflow-y')
      window.parent.document.body.style.removeProperty('position')
    }
  }

  setElementStyle(isOpen: boolean){
    const divTiledeskWidget = this.windowContext.document.getElementById('tiledeskdiv');
    const chat21conversationsEL = document.getElementById('chat21-conversations')

    //customize shadow for 'tiledeskdiv' and 'chat21-conversations'
    if(isOpen && divTiledeskWidget){
      setTimeout(() => {
        divTiledeskWidget.classList.add('shadow')
        chat21conversationsEL.classList.add('shadow')
      }, 1000);
    } else if(!isOpen && divTiledeskWidget){
      divTiledeskWidget.classList.remove('shadow')
      chat21conversationsEL.classList.remove('shadow')
    }


    //customize border-radius for 'chat21-conversations'
    if(isOpen && this.isMobile && chat21conversationsEL){
      chat21conversationsEL.classList.add('isMobile')
    } else if(!isOpen && chat21conversationsEL){
      chat21conversationsEL.classList.remove('isMobile')
    }


    //customize position for 'tiledeskdiv' for mobile
    if(isOpen && this.isMobile && divTiledeskWidget){
      divTiledeskWidget.style.right = '0px'
      divTiledeskWidget.style.bottom = '0px'
    } else if(!isOpen && this.isMobile && divTiledeskWidget){
      divTiledeskWidget.style.bottom = this.marginY
      this.align === 'left'?  divTiledeskWidget.style.left = this.mobileMarginX : divTiledeskWidget.style.right = this.mobileMarginX; 
    }


  }

  setWidgetPreviewContainerSize(width: number, height: number){
    const divTiledeskWidget = this.windowContext.document.querySelector('.messagePreview');
    
    let headerPadding = 10
    let style = getComputedStyle(divTiledeskWidget)
    // console.log('computedddd', style.getPropertyValue('--messagePreviewHeight'))
    let currentHeight = +style.getPropertyValue('--messagePreviewHeight').substring(0, style.getPropertyValue('--messagePreviewHeight').length -2)
    this.windowContext.document.documentElement.style.setProperty('--messagePreviewHeight', currentHeight + height + headerPadding + 'px');
  }


  /**
   *
   * @param val
   */
  public setIsOpen(val: boolean) {
    // console.log('setIsOpen', val);
    this.isOpen = val;
    this.setParentBodyStyleMobile(val, this.isMobile)
    this.setElementStyle(val)
  }

  /**
   *
   * @param key
   * @param val
   */
  public setParameter(key: string, val: any, storage?: boolean) {
    // storage = true;
    this[key] = val;
    const obj = {'key': key, 'val': val};
  }

  /**
   *
   * @param key
   * @param val
   */
  public setAttributeParameter(key: string, val: any) {
    this.attributes[key] = val;
    this.setParameter('attributes', this.attributes, true);
  }

}