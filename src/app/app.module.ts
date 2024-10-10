import { DateAgoPipe } from './pipe/date-ago.pipe';
import { EventsService } from './providers/events.service';

// ************** COMPONENTS ************** //
import { AppComponent } from './app.component';
/** HOME COMPONENTS */
import { HomeComponent } from './component/home/home.component';
import { HomeConversationsComponent } from './component/home-conversations/home-conversations.component';
import { ListConversationsComponent } from './component/list-conversations/list-conversations.component';
import { ListAllConversationsComponent } from './component/list-all-conversations/list-all-conversations.component';
/** CONVERSATION COMPONENTS */
import { ConversationComponent } from './component/conversation-detail/conversation/conversation.component';
import { ConversationHeaderComponent } from './component/conversation-detail/conversation-header/conversation-header.component';
import { ConversationContentComponent } from './component/conversation-detail/conversation-content/conversation-content.component';
import { ConversationFooterComponent } from './component/conversation-detail/conversation-footer/conversation-footer.component';
import { ConversationInternalFrameComponent } from './component/conversation-detail/conversation-internal-frame/conversation-internal-frame.component';
import { ConversationPreviewComponent } from './component/conversation-detail/conversation-preview/conversation-preview.component';
/** CONVERSATION-DETAIL COMPONENTS */
import { BubbleMessageComponent } from './component/message/bubble-message/bubble-message.component';
import { AvatarComponent } from './component/message/avatar/avatar.component';
import { TextComponent } from './component/message/text/text.component';
import { ImageComponent } from './component/message/image/image.component';
import { InfoMessageComponent } from './component/message/info-message/info-message.component';
import { HtmlComponent } from './component/message/html/html.component';
import { FrameComponent } from './component/message/frame/frame.component';
import { AudioComponent } from './component/message/audio/audio.component';
import { UserTypingComponent } from './../chat21-core/utils/user-typing/user-typing.component';
/** MESSAGE ATTACHMENTS COMPONENTS */
import { MessageAttachmentComponent } from './component/message-attachment/message-attachment.component';
import { ActionButtonComponent } from './component/message/buttons/action-button/action-button.component';
import { LinkButtonComponent } from './component/message/buttons/link-button/link-button.component';
import { TextButtonComponent } from './component/message/buttons/text-button/text-button.component';
import { ReturnReceiptComponent } from './component/message/return-receipt/return-receipt.component';
/** FORM COMPONENTS */
import { PrechatFormComponent } from './component/form/prechat-form/prechat-form.component';
import { FormBuilderComponent } from './component/form/form-builder/form-builder.component';
import { FormSelectComponent } from './component/form/inputs/form-select/form-select.component';
import { FormRadioButtonComponent } from './component/form/inputs/form-radio-button/form-radio-button.component';
import { FormTextComponent } from './component/form/inputs/form-text/form-text.component';
import { FormLabelComponent } from './component/form/inputs/form-label/form-label.component';
import { FormCheckboxComponent } from './component/form/inputs/form-checkbox/form-checkbox.component';
import { FormTextareaComponent } from './component/form/inputs/form-textarea/form-textarea.component';
/** OTHER COMPONENTS */
import { LastMessageComponent } from './component/last-message/last-message.component';
import { StarRatingWidgetComponent } from './component/star-rating-widget/star-rating-widget.component';
import { LauncherButtonComponent } from './component/launcher-button/launcher-button.component';
import { EyeeyeCatcherCardComponent } from './component/eyeeye-catcher-card/eyeeye-catcher-card.component';
import { SelectionDepartmentComponent } from './component/selection-department/selection-department.component';
import { MenuOptionsComponent } from './component/menu-options/menu-options.component';

//ANGULAR MODULES
import { AppConfigService } from './providers/app-config.service';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';

//THIRD-PART MODULES
import { TranslateModule } from '@ngx-translate/core';
// import { MomentModule } from 'ngx-moment';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { LoggerModule, NGXLogger, NgxLoggerLevel } from "ngx-logger";

//DIRECTIVES-PIPES
import { HtmlEntitiesEncodePipe } from './pipe/html-entities-encode.pipe';
import { MarkedPipe } from './pipe/marked.pipe';
import { SafeHtmlPipe } from './pipe/safe-html.pipe';
import { TooltipDirective } from 'src/app/directives/tooltip.directive';

//LOGGER SERVICES
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { CustomLogger } from 'src/chat21-core/providers/logger/customLogger';

// TRANSLATOR SERVICE
import { TranslatorService } from './providers/translator.service';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';

//ABSTRACT SERVICES
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { MessagingAuthService } from 'src/chat21-core/providers/abstract/messagingAuth.service';
import { ConversationsHandlerService } from 'src/chat21-core/providers/abstract/conversations-handler.service';
import { ArchivedConversationsHandlerService } from 'src/chat21-core/providers/abstract/archivedconversations-handler.service';
import { ConversationHandlerBuilderService } from 'src/chat21-core/providers/abstract/conversation-handler-builder.service';
import { ConversationHandlerService } from 'src/chat21-core/providers/abstract/conversation-handler.service';
import { ImageRepoService } from 'src/chat21-core/providers/abstract/image-repo.service';
import { PresenceService } from 'src/chat21-core/providers/abstract/presence.service';
import { TypingService } from 'src/chat21-core/providers/abstract/typing.service';
import { UploadService } from 'src/chat21-core/providers/abstract/upload.service';

//FIREBASE SERVICES
import { FirebaseInitService } from 'src/chat21-core/providers/firebase/firebase-init-service';
import { FirebaseAuthService } from 'src/chat21-core/providers/firebase/firebase-auth-service';
import { FirebaseConversationsHandler } from 'src/chat21-core/providers/firebase/firebase-conversations-handler';
import { FirebaseArchivedConversationsHandler } from 'src/chat21-core/providers/firebase/firebase-archivedconversations-handler';
import { FirebaseConversationHandlerBuilderService } from 'src/chat21-core/providers/firebase/firebase-conversation-handler-builder.service';
import { FirebaseConversationHandler } from 'src/chat21-core/providers/firebase/firebase-conversation-handler';
import { FirebaseTypingService } from 'src/chat21-core/providers/firebase/firebase-typing.service';
import { FirebasePresenceService } from 'src/chat21-core/providers/firebase/firebase-presence.service';
import { FirebaseImageRepoService } from 'src/chat21-core/providers/firebase/firebase-image-repo';
import { FirebaseUploadService } from 'src/chat21-core/providers/firebase/firebase-upload.service';

//MQTT SERVICES
import { Chat21Service } from 'src/chat21-core/providers/mqtt/chat-service';
import { MQTTAuthService } from 'src/chat21-core/providers/mqtt/mqtt-auth-service';
import { MQTTConversationsHandler } from 'src/chat21-core/providers/mqtt/mqtt-conversations-handler';
import { MQTTArchivedConversationsHandler } from 'src/chat21-core/providers/mqtt/mqtt-archivedconversations-handler';
import { MQTTConversationHandlerBuilderService } from 'src/chat21-core/providers/mqtt/mqtt-conversation-handler-builder.service';
import { MQTTConversationHandler } from 'src/chat21-core/providers/mqtt/mqtt-conversation-handler';
import { MQTTTypingService } from 'src/chat21-core/providers/mqtt/mqtt-typing.service';
import { MQTTPresenceService } from 'src/chat21-core/providers/mqtt/mqtt-presence.service';

// NATIVE TILEDESK SERVICES
import { TiledeskAuthService } from './../chat21-core/providers/tiledesk/tiledesk-auth.service';
import { TiledeskRequestsService } from 'src/chat21-core/providers/tiledesk/tiledesk-requests.service';
import { NativeImageRepoService } from 'src/chat21-core/providers/native/native-image-repo';
import { NativeUploadService } from 'src/chat21-core/providers/native/native-upload-service';

//CONSTANTS
import { CHAT_ENGINE_MQTT, UPLOAD_ENGINE_NATIVE } from 'src/chat21-core/utils/constants';

//STORAGE
import { LocalSessionStorage } from 'src/chat21-core/providers/localSessionStorage';

import { Globals } from './utils/globals';
import { GlobalSettingsService } from './providers/global-settings.service';
import { Triggerhandler } from 'src/chat21-core/utils/triggerHandler';
import { WaitingService } from './providers/waiting.service';
import { StarRatingWidgetService } from './providers/star-rating-widget.service';
import { LikeUnlikeComponent } from './component/message/like-unlike/like-unlike.component';
import { Rules } from './utils/rules';
import { ScriptService } from 'src/chat21-core/providers/scripts/script.service';
import { CarouselComponent } from './component/message/carousel/carousel.component';
import { BrandService } from './providers/brand.service';
import { NetworkOfflineComponent } from './component/network-offline/network-offline.component';
import { ConfirmCloseComponent } from './modals/confirm-close/confirm-close.component';



const appInitializerFn = (appConfig: AppConfigService, brandService: BrandService, logger: NGXLogger) => {
  return async() => {
    let customLogger = new CustomLogger(logger)
    LoggerInstance.setInstance(customLogger)
    if (environment.remoteConfig) {
      await appConfig.loadAppConfig();
    }
    await brandService.loadBrand();
  };
};


export function authenticationFactory(http: HttpClient, appConfig: AppConfigService, chat21Service: Chat21Service, appSorage: AppStorageService) {
  const config = appConfig.getConfig()
  if (config.chatEngine === CHAT_ENGINE_MQTT) {
    chat21Service.config = config.chat21Config;
    chat21Service.initChat();
    const auth = new MQTTAuthService(http, chat21Service, appSorage);
    auth.setBaseUrl(appConfig.getConfig().apiUrl)
    return auth
  } else {
    FirebaseInitService.initFirebase(config.firebaseConfig)
    const auth= new FirebaseAuthService(http);
    auth.setBaseUrl(config.apiUrl)
    return auth
  }
}

export function conversationsHandlerFactory(chat21Service: Chat21Service, httpClient: HttpClient, appConfig: AppConfigService ) {
  const config = appConfig.getConfig()
  if (config.chatEngine === CHAT_ENGINE_MQTT) {
    return new MQTTConversationsHandler(chat21Service);
  } else {
    return new FirebaseConversationsHandler(httpClient, appConfig);
  }
}

export function archivedConversationsHandlerFactory(chat21Service: Chat21Service, appConfig: AppConfigService) {
  const config = appConfig.getConfig()
  if (config.chatEngine === CHAT_ENGINE_MQTT) {
    return new MQTTArchivedConversationsHandler(chat21Service);
  } else {
    return new FirebaseArchivedConversationsHandler();
  }
}

export function conversationHandlerBuilderFactory(chat21Service: Chat21Service, appConfig: AppConfigService) {
  const config = appConfig.getConfig()
  if (config.chatEngine === CHAT_ENGINE_MQTT) {
    return new MQTTConversationHandlerBuilderService(chat21Service);
  } else {
    return new FirebaseConversationHandlerBuilderService();
  }
}

export function conversationHandlerFactory(chat21Service: Chat21Service, appConfig: AppConfigService) {
  const config = appConfig.getConfig()
  if (config.chatEngine === CHAT_ENGINE_MQTT) {
    return new MQTTConversationHandler(chat21Service, true);
  } else {
    return new FirebaseConversationHandler(true);
  }
}

export function typingFactory(chat21Service: Chat21Service, appConfig: AppConfigService) {
  const config = appConfig.getConfig()
  if (config.chatEngine === CHAT_ENGINE_MQTT) {
    return new MQTTTypingService();
  } else {  
    return new FirebaseTypingService(); 
  }
}

export function presenceFactory(chat21Service: Chat21Service, appConfig: AppConfigService) {
  const config = appConfig.getConfig()
  if (config.chatEngine === CHAT_ENGINE_MQTT) {
    return new MQTTPresenceService(chat21Service);
  } else {
    return new FirebasePresenceService();
  }
}

export function imageRepoFactory(appConfig: AppConfigService, http: HttpClient) {
  const config = appConfig.getConfig()
  if (config.uploadEngine === UPLOAD_ENGINE_NATIVE) {
    const imageService = new NativeImageRepoService(http)
    imageService.setImageBaseUrl(config.baseImageUrl)
    return imageService
  } else {
    const imageService = new FirebaseImageRepoService(http);
    FirebaseInitService.initFirebase(config.firebaseConfig)
    imageService.setImageBaseUrl(config.baseImageUrl)
    return imageService
  }
}

export function uploadFactory(http: HttpClient, appConfig: AppConfigService, appStorage: AppStorageService) {
  const config = appConfig.getConfig()
  if (config.uploadEngine === UPLOAD_ENGINE_NATIVE) {
    const nativeUploadService = new NativeUploadService(http, appStorage)
    nativeUploadService.setBaseUrl(config.baseImageUrl)
    return nativeUploadService
  } else {
    return new FirebaseUploadService();
  }
}


@NgModule({
  declarations: [
    AppComponent,
    LauncherButtonComponent,
    EyeeyeCatcherCardComponent,
    HomeConversationsComponent,
    HomeComponent,
    ListConversationsComponent,
    ListAllConversationsComponent,
    MenuOptionsComponent,
    SelectionDepartmentComponent,
    StarRatingWidgetComponent,
    MessageAttachmentComponent,
    LastMessageComponent,
    /**FORM COMPONENTS */
    PrechatFormComponent,
    FormBuilderComponent,
    FormTextComponent,
    FormLabelComponent,
    FormCheckboxComponent,
    FormTextareaComponent,
    FormRadioButtonComponent,
    FormSelectComponent,
    /**CONVERSATION-DETAILL COMPONENTS */
    ConversationComponent,
    ConversationHeaderComponent,
    ConversationContentComponent,
    ConversationFooterComponent,
    ConversationPreviewComponent,
    ConversationInternalFrameComponent,
    BubbleMessageComponent,
    AvatarComponent,
    FrameComponent,
    HtmlComponent,
    ImageComponent,
    InfoMessageComponent,
    ReturnReceiptComponent,
    TextComponent,
    ActionButtonComponent,
    LinkButtonComponent,
    TextButtonComponent,
    UserTypingComponent,
    /**DIRECTIVES */
    HtmlEntitiesEncodePipe,
    MarkedPipe,
    DateAgoPipe,
    SafeHtmlPipe,
    LikeUnlikeComponent,
    TooltipDirective,
    AudioComponent,
    CarouselComponent,
    NetworkOfflineComponent,
    ConfirmCloseComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    // AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    PickerModule,
    TranslateModule.forRoot(//),
    {
      // loader: {
      //   provide: TranslateLoader,
      //   useFactory: (createTranslateLoader),
      //   deps: [HttpClient]
      // }
    }),
    LoggerModule.forRoot({
      level: NgxLoggerLevel.DEBUG,
      // timestampFormat: 'HH:mm:ss.SSS',
      enableSourceMaps: false,
      disableFileDetails: true,
      colorScheme: ['purple', 'yellow', 'gray', 'gray', 'red', 'red', 'red'],
      //serverLoggingUrl: 'https://tiledesk-server-pre.herokuapp.com/logs'
    }),
  ],
  providers: [
    AppConfigService,
    Chat21Service,
    Globals,
    Rules,
    GlobalSettingsService,
    EventsService,
    StarRatingWidgetService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService, BrandService, NGXLogger]
    },
    {
      provide: AppStorageService,
      useClass: LocalSessionStorage
    },
    {
      provide: MessagingAuthService,
      useFactory: authenticationFactory,
      deps: [HttpClient, AppConfigService, Chat21Service, AppStorageService ]
    },
    {
      provide: ConversationsHandlerService,
      useFactory: conversationsHandlerFactory,
      deps: [Chat21Service, HttpClient, AppConfigService]
    },
    {
      provide: ArchivedConversationsHandlerService,
      useFactory: archivedConversationsHandlerFactory,
      deps: [Chat21Service, AppConfigService]
    },
    {
      provide: ConversationHandlerBuilderService,
      useFactory: conversationHandlerBuilderFactory,
      deps: [Chat21Service, AppConfigService]
    },
    {
      provide: ConversationHandlerService,
      useFactory: conversationHandlerFactory,
      deps: [Chat21Service, AppConfigService]
    },
    {
      provide: ImageRepoService,
      useFactory: imageRepoFactory,
      deps: [AppConfigService, HttpClient]
    },
    {
      provide: PresenceService,
      useFactory: presenceFactory,
      deps: [Chat21Service, AppConfigService]
    },
    {
      provide: TypingService,
      useFactory: typingFactory,
      deps: [Chat21Service, AppConfigService]
    },
    {
      provide: UploadService,
      useFactory: uploadFactory,
      deps: [HttpClient, AppConfigService, AppStorageService ]
    },
    TiledeskAuthService,
    TiledeskRequestsService,
    TranslatorService,
    CustomTranslateService,
    Triggerhandler,
    WaitingService,
    ScriptService,
    BrandService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
