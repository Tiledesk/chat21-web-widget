import { Component, EventEmitter, Input, IterableDiffers, OnInit, Output, SimpleChanges } from '@angular/core';
import { ConversationModel } from '../../../chat21-core/models/conversation';
import { LoggerService } from '../../../chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from '../../../chat21-core/providers/logger/loggerInstance';
import { avatarPlaceholder, convertMessage, setColorFromString } from '../../utils/utils';

@Component({
  selector: 'chat-list-conversations',
  templateUrl: './list-conversations.component.html',
  styleUrls: ['./list-conversations.component.scss']
})
export class ListConversationsComponent implements OnInit {

  // ========= begin:: Input/Output values ============//
  @Input() listConversations: Array<ConversationModel>;
  @Input() limit?: number
  @Input() stylesMap: Map<string, string>;
  @Input() translationMap: Map< string, string>;
  @Output() onConversationSelected = new EventEmitter<ConversationModel>();
  @Output() onImageLoaded = new EventEmitter<ConversationModel>();
  @Output() onConversationLoaded = new EventEmitter<ConversationModel>();
  // ========= end:: Input/Output values ============//

  // ========= begin:: dichiarazione funzioni ======= //
  convertMessage = convertMessage;
  setColorFromString = setColorFromString;
  avatarPlaceholder = avatarPlaceholder;
  // ========= end:: dichiarazione funzioni ========= //

  iterableDifferListConv: any;
  private logger: LoggerService = LoggerInstance.getInstance();

  empDifferMap: Map<string, any> = new Map<string, any>();
  empMap = new Map<string, ConversationModel>();
  arrayDiffer: any;

  uidConvSelected: string;
  constructor(private iterableDiffers: IterableDiffers) {
      this.iterableDifferListConv = this.iterableDiffers.find([]).create(null);
      
    }

  ngOnInit() {
    this.logger.debug('[LISTCONVERSATIONS] ngOnInit', this.listConversations);
  }

  ngOnChanges(changes: SimpleChanges){

  }

  public openConversationByID(conversation) {
    this.logger.debug('[LISTCONVERSATIONS] openConversationByID: ', conversation);
    if ( conversation ) {
      // this.conversationsService.updateIsNew(conversation);
      // this.conversationsService.updateConversationBadge();
      this.uidConvSelected = conversation.uid
      this.onConversationSelected.emit(conversation);
    }
  }

  ngAfterViewInit() {
    this.logger.debug('[LISTCONVERSATIONS] ---ngAfterViewInit---: listConversations ', this.listConversations);
  }

  ngDoCheck() {
    let changesListConversation = this.iterableDifferListConv.diff(this.listConversations);

  }


}
