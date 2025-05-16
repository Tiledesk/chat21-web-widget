import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { LoggerService } from '../abstract/logger.service';
import { LoggerInstance } from '../logger/loggerInstance';

// mqtt
import {Chat21Service} from './chat-service';

// models
import { MessageModel } from '../../models/message';
import { UserModel } from '../../models/user';

// services
import { ConversationHandlerService } from '../abstract/conversation-handler.service';

// utils
import { MSG_STATUS_RECEIVED, TYPE_DIRECT, MESSAGE_TYPE_INFO, INFO_MESSAGE_TYPE } from '../../utils/constants';
import { compareValues, searchIndexInArrayForUid } from '../../utils/utils';
import { messageType, checkIfIsMemberJoinedGroup, hideInfoMessage, isJustRecived, isSender, infoMessageType } from '../../utils/utils-message';
import { v4 as uuidv4 } from 'uuid';


// @Injectable({ providedIn: 'root' })
@Injectable()
export class MQTTConversationHandler extends ConversationHandlerService {

    // BehaviorSubject
    messageAdded: BehaviorSubject<MessageModel> = new BehaviorSubject<MessageModel>(null);;
    messageChanged: BehaviorSubject<MessageModel> = new BehaviorSubject<MessageModel>(null);;
    messageRemoved: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    messageWait: BehaviorSubject<any> = new BehaviorSubject<string>(null);
    messageInfo: BehaviorSubject<MessageModel> = new BehaviorSubject<MessageModel>(null);

    // public variables
    public attributes: any;
    public messages: MessageModel[];
    public conversationWith: string;
    public ref: any;

    // private variables
    private translationMap: Map<string, string>; // LABEL_TODAY, LABEL_TOMORROW
    private showInfoMessage: string[];
    private recipientId: string;
    private recipientFullname: string;
    private tenant: string;
    private loggedUser: UserModel;
    private senderId: string;
    private listSubsriptions: any[];
    private CLIENT_BROWSER: string;
    private startTime: Date = new Date();
    private logger: LoggerService = LoggerInstance.getInstance()

    constructor(
        public chat21Service: Chat21Service,
        @Inject('skipMessage') private skipInfoMessage: boolean
    ) {
        super();
    }

    /**
     * inizializzo conversation handler
     */
    initialize(recipientId: string, recipientFullName: string,loggedUser: UserModel,
                tenant: string,translationMap: Map<string, string>, showInfoMessage: string[]) {
        this.logger.log('[MQTTConversationHandlerSERVICE] initWithRecipient:', tenant);
        this.recipientId = recipientId;
        this.recipientFullname = recipientFullName;
        this.loggedUser = loggedUser;
        if (loggedUser) {
            this.senderId = loggedUser.uid;
        }
        this.tenant = tenant;
        this.translationMap = translationMap;

        this.listSubsriptions = [];
        this.CLIENT_BROWSER = navigator.userAgent;
        this.conversationWith = recipientId;
        this.messages = [];
        this.showInfoMessage = showInfoMessage;
        // this.attributes = this.setAttributes();
        return;
    }

    /**
     * mi connetto al nodo messages
     * recupero gli ultimi 100 messaggi
     * creo la reference
     * mi sottoscrivo a change, removed, added
     */
    connect() {
        this.logger.log('[MQTTConversationHandlerSERVICE] connecting conversation handler...');
        if (this.conversationWith == null) {
            this.logger.error('[MQTTConversationHandlerSERVICE] cant connect invalid this.conversationWith', this.conversationWith);
            return;
        }
        this.chat21Service.chatClient.lastMessages(this.conversationWith, async (err, messages) => {
            if (!err) {
                this.logger.log('[MQTTConversationHandlerSERVICE] message lastMessages:', messages);
                messages.sort(compareValues('timestamp', 'asc'));
                const that = this
                
                // messages.forEach(async (message) => {
                for (const message of messages){
                    // this.addedMessage(msg);
                    const msg: MessageModel = message;
                    msg.uid = message.message_id;

                    //escape command message is already in list checking by parendUid 
                    if(this.messages.filter(message => message.attributes['parentUid'] === msg.uid).length > 0){
                        return;
                    }

                    if (msg.attributes && msg.attributes.commands) {
                        this.logger.debug('[MQTTConversationHandlerSERVICE] splitted message::::', this.messages, msg)
                        await this.addCommandMessage(msg)
                    } else {
                        this.logger.debug('[MQTTConversationHandlerSERVICE] NOT splitted message::::', msg)
                        this.addedMessage(msg)
                    }
                };
            }
        });
        const handler_message_added = this.chat21Service.chatClient.onMessageAddedInConversation(
            this.conversationWith, async (message, topic) => {
                this.logger.log('[MQTTConversationHandlerSERVICE] message added:', message, 'on topic:', topic, this.messages);
                // this.addedMessage(msg);
                const msg: MessageModel = message;

                //allow to replace message in unknown status (pending status: '0')
                if(message.attributes && message.attributes.tempUID){
                    msg.uid = message.attributes.tempUID;
                }else{
                    msg.uid = message.message_id
                }

                //escape command message is already is in list checking by parendUid 
                // if(this.messages.filter(message => message.attributes['parentUid'] === msg.uid).length > 0){
                //     return;
                // }
                
                if (msg.attributes && msg.attributes.commands) {
                    this.logger.debug('[MQTTConversationHandlerSERVICE] splitted message::::', msg)
                    await this.addCommandMessage(msg)
                } else {
                    this.logger.debug('[MQTTConversationHandlerSERVICE] NOT splitted message::::', msg)
                    this.addedMessage(msg)
                }
        });
        const handler_message_updated = this.chat21Service.chatClient.onMessageUpdatedInConversation(
            this.conversationWith,  (message, topic) => {
            this.logger.log('[MQTTConversationHandlerSERVICE] message updated:', message, 'on topic:', topic);
            this.changed(message);
        });
    }

    /**
     * bonifico url in testo messaggio
     * recupero time attuale
     * recupero lingua app
     * recupero senderFullname e recipientFullname
     * aggiungo messaggio alla reference
     * @param msg
     * @param conversationWith
     * @param conversationWithDetailFullname
     */
    // sendMessage(
    //     msg,
    //     type,
    //     metadata,
    //     this.conversationWith,
    //     this.conversationWithFullname,
    //     this.loggedUser.uid,
    //     fullname,
    //     this.channelType
    //   );
    sendMessage(
        msg: string,
        typeMsg: string,
        metadataMsg: string,
        conversationWith: string,
        conversationWithFullname: string,
        sender: string,
        senderFullname: string,
        channelType: string,
        attributes: any
    ) {
        const that = this;
        if (!channelType || channelType === 'undefined') {
            channelType = TYPE_DIRECT;
        }

        this.logger.log('[MQTTConversationHandlerSERVICE] Senderfullname', senderFullname);
        const language = document.documentElement.lang;
        const recipientFullname = conversationWithFullname;
        const recipientId = conversationWith;
        attributes.lang = language;
        attributes.tempUID = uuidv4(); //allow to show message in a pending status
        this.chat21Service.chatClient.sendMessage(
            msg,
            typeMsg,
            recipientId,
            recipientFullname,
            senderFullname,
            attributes,
            metadataMsg,
            channelType,
            // language,
            (err, message) => {
                if (err) {
                    message.status = '-100';
                    this.logger.log('[MQTTConversationHandlerSERVICE] ERROR', err);
                } else {
                    message.status = '150';
                }
            }
        );
        
        const message = new MessageModel(
            attributes.tempUID, //allow to show message in a pending status 
            language,
            conversationWith,
            recipientFullname,
            sender,
            senderFullname,
            0,
            metadataMsg,
            msg,
            Date.now(),
            typeMsg,
            attributes,
            channelType,
            false
        );
        this.addedMessage(message) //allow to show message in a pending status: add pending message in array of messages

        return new MessageModel(
            '',
            language,
            conversationWith,
            recipientFullname,
            sender,
            senderFullname,
            0,
            metadataMsg,
            msg,
            Date.now(),
            typeMsg,
            this.attributes,
            channelType,
            false
        );
    }

    /**
     * dispose reference della conversazione
     */
    dispose() {
        // this.ref.off();
    }

    /** */
    private addedMessage(messageSnapshot: MessageModel): Promise<boolean> {
        const msg = this.messageGenerate(messageSnapshot);
        let isInfoMessage = messageType(MESSAGE_TYPE_INFO, msg)
        if(isInfoMessage){
            this.messageInfo.next(msg)
        }
        
        if(isInfoMessage && hideInfoMessage(msg, this.showInfoMessage)){
            //if showBubbleInfoMessage array keys not includes msg.attributes.messagelabel['key'] exclude CURRENT INFO MESSAGE
            return;
        } else if(isInfoMessage && !hideInfoMessage(msg, this.showInfoMessage)){
            if(!checkIfIsMemberJoinedGroup(msg, this.loggedUser)){
                    //skipMessage= false: if showInfoMessageKeys includes msg.attributes.messagelabel['key'] include CURRENT INFO MESSAGE
                    //only if a member (not a bot) has joined the group
                return;
            }
        }

        this.logger.log('[MQTTConversationHandlerSERVICE] adding message:' + JSON.stringify(msg));
        // this.logger.log('childSnapshot.message_id:' + msg.message_id);
        // this.logger.log('childSnapshot.key:' + msg.key);
        // this.logger.log('childSnapshot.uid:' + msg.uid);
        this.addReplaceMessageInArray(msg.uid, msg);
        this.updateMessageStatusReceived(msg);
        this.messageAdded.next(msg);
    }


    /** */
    private changed(patch: any) {
        if(messageType(MESSAGE_TYPE_INFO, patch) ){
            return;
        }
        this.logger.log('[MQTTConversationHandlerSERVICE] updating message with patch', patch);
        const index = searchIndexInArrayForUid(this.messages, patch.message_id);
        if (index > -1) {
            const message = this.messages[index];
            if (message) {
                message.status = patch.status;
                this.logger.log('[MQTTConversationHandlerSERVICE] message found and patched (replacing)', message);
                this.addReplaceMessageInArray(message.uid, message);
                this.messageChanged.next(message);
            }
        }
    }

    /** */
    private removed(childSnapshot: any) {
        const index = searchIndexInArrayForUid(this.messages, childSnapshot.key);
        // controllo superfluo sarà sempre maggiore
        if (index > -1) {
            this.messages.splice(index, 1);
            this.messageRemoved.next(childSnapshot.key);
        }
    }

    /** */
    private messageGenerate(childSnapshot: any) {
        // const msg: MessageModel = childSnapshot.val();
        this.logger.log("[MQTTConversationHandlerSERVICE] childSnapshot >" + JSON.stringify(childSnapshot));
        const msg = childSnapshot;
        // msg.uid = childSnapshot.key;
        if(msg.text) msg.text = msg.text.trim(); //remove black msg with only spaces
        // controllo fatto per i gruppi da rifattorizzare
        if (!msg.sender_fullname || msg.sender_fullname === 'undefined') {
            msg.sender_fullname = msg.sender;
        }
        // bonifico messaggio da url
        // if (msg.type === 'text') {
        //     msg.text = htmlEntities(msg.text);
        // }
        // verifico che il sender è il logged user
        this.logger.log("[MQTTConversationHandlerSERVICE] ****>msg.sender:" + msg.sender);
        msg.isSender = isSender(msg.sender, this.loggedUser.uid);
        // traduco messaggi se sono del server
        if (messageType(MESSAGE_TYPE_INFO, msg)) {
            this.translateInfoSupportMessages(msg);
        }
        return msg;
    }

    /** */
    private addReplaceMessageInArray(uid: string, msg: MessageModel) {
        const index = searchIndexInArrayForUid(this.messages, uid);
        if (index > -1) {
            this.messages.splice(index, 1, msg);
        } else {
            this.messages.splice(0, 0, msg);
        }
        this.messages.sort(compareValues('timestamp', 'asc'));
    }

    /** */
    private translateInfoSupportMessages(message: MessageModel) {
        // check if the message attributes has parameters and it is of the "MEMBER_JOINED_GROUP" type
        const INFO_SUPPORT_USER_ADDED_SUBJECT = this.translationMap.get('INFO_SUPPORT_USER_ADDED_SUBJECT');
        const INFO_SUPPORT_USER_ADDED_YOU_VERB = this.translationMap.get('INFO_SUPPORT_USER_ADDED_YOU_VERB');
        const INFO_SUPPORT_USER_ADDED_COMPLEMENT = this.translationMap.get('INFO_SUPPORT_USER_ADDED_COMPLEMENT');
        const INFO_SUPPORT_USER_ADDED_VERB = this.translationMap.get('INFO_SUPPORT_USER_ADDED_VERB');
        const INFO_SUPPORT_CHAT_REOPENED = this.translationMap.get('INFO_SUPPORT_CHAT_REOPENED');
        const INFO_SUPPORT_CHAT_CLOSED = this.translationMap.get('INFO_SUPPORT_CHAT_CLOSED');
        const INFO_SUPPORT_LEAD_UPDATED = this.translationMap.get('INFO_SUPPORT_LEAD_UPDATED');
        const INFO_SUPPORT_MEMBER_LEFT_GROUP = this.translationMap.get('INFO_SUPPORT_MEMBER_LEFT_GROUP');
        const INFO_A_NEW_SUPPORT_REQUEST_HAS_BEEN_ASSIGNED_TO_YOU = this.translationMap.get('INFO_A_NEW_SUPPORT_REQUEST_HAS_BEEN_ASSIGNED_TO_YOU');
        const INFO_SUPPORT_LIVE_PAGE = this.translationMap.get('INFO_SUPPORT_LIVE_PAGE');
        
        if (infoMessageType(message) === INFO_MESSAGE_TYPE.MEMBER_JOINED_GROUP && message.attributes.messagelabel.parameters ) {
            let subject: string;
            let verb: string;
            let complement: string;
            if (message.attributes.messagelabel.parameters.member_id === this.loggedUser.uid) {
                subject = INFO_SUPPORT_USER_ADDED_SUBJECT;
                verb = INFO_SUPPORT_USER_ADDED_YOU_VERB;
                complement = INFO_SUPPORT_USER_ADDED_COMPLEMENT;
            } else {
                if (message.attributes.messagelabel.parameters.fullname) {
                    // other user has been added to the group (and he has a fullname)
                    subject = message.attributes.messagelabel.parameters.fullname;
                    verb = INFO_SUPPORT_USER_ADDED_VERB;
                    complement = INFO_SUPPORT_USER_ADDED_COMPLEMENT;
                } else {
                    // other user has been added to the group (and he has not a fullname, so use hes useruid)
                    subject = message.attributes.messagelabel.parameters.member_id;
                    verb = INFO_SUPPORT_USER_ADDED_VERB;
                    complement = INFO_SUPPORT_USER_ADDED_COMPLEMENT;
                }
            }
            message.text = subject + ' ' + verb + ' ' + complement;
        } else if (infoMessageType(message) === INFO_MESSAGE_TYPE.CHAT_REOPENED) {
            message.text = INFO_SUPPORT_CHAT_REOPENED;
        } else if (infoMessageType(message) ===  INFO_MESSAGE_TYPE.CHAT_CLOSED) {
            message.text = INFO_SUPPORT_CHAT_CLOSED;
        } else if ((infoMessageType(message) ===INFO_MESSAGE_TYPE.TOUCHING_OPERATOR) && message.sender === "system") {
            // console.log('FIREBASEConversationHandlerSERVICE message text', message.text)
            const textAfterColon = message.text.split(":")[1]
            // console.log('FIREBASEConversationHandlerSERVICE message text - textAfterColon', textAfterColon)
            if (textAfterColon !== undefined) {
                message.text = INFO_A_NEW_SUPPORT_REQUEST_HAS_BEEN_ASSIGNED_TO_YOU + ': ' + textAfterColon;
            }
        } else if (infoMessageType(message) === INFO_MESSAGE_TYPE.LEAD_UPDATED) {
            message.text = INFO_SUPPORT_LEAD_UPDATED;
        } else if (infoMessageType(message) === INFO_MESSAGE_TYPE.MEMBER_LEFT_GROUP) {
           let subject: string;
           if (message.attributes.messagelabel.parameters.fullname) {
               subject = message.attributes.messagelabel.parameters.fullname;
           }else{
               subject = message.attributes.messagelabel.parameters.member_id;
           }
           message.text = subject + ' ' +  INFO_SUPPORT_MEMBER_LEFT_GROUP ;
        } else if(infoMessageType(message) === INFO_MESSAGE_TYPE.LIVE_PAGE){
            let sourceUrl: string = '';
            if(message.attributes && message.attributes.sourcePage){
                sourceUrl = message.attributes.sourcePage 
            }
            if(message.attributes && message.attributes.sourceTitle){
                sourceUrl = '['+message.attributes.sourceTitle+']('+sourceUrl+')'
            }
            message.text= INFO_SUPPORT_LIVE_PAGE + ': ' + sourceUrl
        }
    }


    /**
     * aggiorno lo stato del messaggio
     * questo stato indica che è stato consegnato al client e NON che è stato letto
     * se il messaggio NON è stato inviato da loggedUser AGGIORNO stato a 200
     * @param item
     * @param conversationWith
     */
    private updateMessageStatusReceived(msg) {
        this.logger.log('[MQTTConversationHandlerSERVICE] updateMessageStatusReceived', msg);
        if (msg['status'] < MSG_STATUS_RECEIVED && msg['status'] > 0) {
            this.logger.log('[MQTTConversationHandlerSERVICE] status ', msg['status'], ' < (RECEIVED:200)', MSG_STATUS_RECEIVED);
            let uid = msg.uid
            msg.attributes && msg.attributes.commands? uid = msg.attributes.parentUid: null 
            if (msg.sender !== this.loggedUser.uid && msg.status < MSG_STATUS_RECEIVED) {
                this.logger.log('[MQTTConversationHandlerSERVICE] updating message with status received');
                this.chat21Service.chatClient.updateMessageStatus(uid, this.conversationWith, MSG_STATUS_RECEIVED, null);
            }
        }
    }


    unsubscribe(key: string) {
        this.logger.log('[MQTTConversationHandlerSERVICE] unsubscribe: ', key);
        this.listSubsriptions.forEach(sub => {
        this.logger.log('[MQTTConversationHandlerSERVICE] unsubscribe: ', sub.uid, key);
        if (sub.uid === key) {
            sub.unsubscribe(key, null);
            return;
        }
        });
    }

    private async addCommandMessage(msg: MessageModel): Promise<boolean>{
        const that = this;
        const commands = msg.attributes.commands;
        let i=0;
        return new Promise((resolve, reject)=>{
            function execute(command){
                if(command.type === "message"){
                    that.logger.debug('[MQTTConversationHandlerSERVICE] addCommandMessage --> type="message"', command, i)
                    if (i >= 2) {
                        
                        //check if previus wait message type has time value, otherwize set to 1000ms
                        !commands[i-1].time? commands[i-1].time= 1000 : commands[i-1].time
                        command.message.timestamp = commands[i-2].message.timestamp + commands[i-1].time;
                        
                        /** CHECK IF MESSAGE IS JUST RECEIVED: IF false, set next message time (if object exist) to 0 -> this allow to show it immediately */
                        if(!isJustRecived(that.startTime.getTime(), msg.timestamp)){
                            let previewsTimeMsg = msg.timestamp;
                            commands[i-2]? previewsTimeMsg = commands[i-2].message.timestamp : null;
                            command.message.timestamp = previewsTimeMsg + 100
                            commands[i+1]? commands[i+1].time = 0 : null
                        }
                    } else { /**MANAGE FIRST MESSAGE */
                        command.message.timestamp = msg.timestamp;
                        if(!isJustRecived(that.startTime.getTime(), msg.timestamp)){
                            commands[i+1]? commands[i+1].time = 0 : null
                        }
                    }
                    that.generateMessageObject(msg, command.message, i, function () {
                        i += 1
                        if (i < commands.length) {
                            execute(commands[i])
                        }
                        else {
                            that.logger.debug('[MQTTConversationHandlerSERVICE] addCommandMessage --> last command executed (wait), exit') 
                            resolve(true)
                        }
                    })
                }else if(command.type === "wait"){
                    that.logger.debug('[MQTTConversationHandlerSERVICE] addCommandMessage --> type="wait"', command, i, commands.length)
                    //publish waiting event to simulate user typing
                    if(isJustRecived(that.startTime.getTime(), msg.timestamp)){
                        // console.log('message just received::', command, i, commands)
                        that.messageWait.next({uid: that.conversationWith, uidUserTypingNow: msg.sender, nameUserTypingNow: msg.sender_fullname, waitTime: command.time, command: command})
                    }
                    setTimeout(function() {
                        i += 1
                        if (i < commands.length) {
                            execute(commands[i])
                        }
                        else {
                            that.logger.debug('[MQTTConversationHandlerSERVICE] addCommandMessage --> last command executed (send message), exit') 
                            resolve(true)
                        }
                    },command.time)
                }
            }
            execute(commands[0]) //START render first message
        })
    }
    
    private generateMessageObject(message, command_message, index, callback) {
        let parentUid = message.uid
        // command_message.uid = uuidv4();
        command_message.uid = message.uid + '_' + index
        if(command_message.text) command_message.text = command_message.text.trim()//remove black msg with only spaces
        command_message.language = message.language;
        command_message.recipient = message.recipient;
        command_message.recipient_fullname = message.recipient_fullname;
        command_message.sender = message.sender;
        command_message.sender_fullname = message.sender_fullname;
        command_message.channel_type = message.channel_type;
        command_message.status = message.status;
        command_message.isSender = message.isSender;
        command_message.attributes? command_message.attributes.commands = true : command_message.attributes = {commands : true}
        command_message.attributes.parentUid = parentUid //added to manage message STATUS UPDATES
        command_message.attributes = {...message.attributes, ...command_message.attributes}
        this.addedMessage(command_message)
        callback();
    }

}
