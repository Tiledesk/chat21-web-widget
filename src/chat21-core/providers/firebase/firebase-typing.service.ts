import { TIME_TYPING_MESSAGE } from './../../utils/constants';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// firebase
// import firebase from 'firebase/app';

// services
import { TypingService } from '../abstract/typing.service';
import { LoggerService } from '../abstract/logger.service';
import { LoggerInstance } from '../logger/loggerInstance';

export class TypingModel {

  constructor(
      public uid: string,
      public timestamp: any,
      public message: string,
      public name: string
  ) { }
}

// @Injectable({
//   providedIn: 'root'
// })
@Injectable()
export class FirebaseTypingService extends TypingService {

  // BehaviorSubject
  BSIsTyping: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  BSSetTyping: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // private params
  private urlNodeTypings: string;
  private setTimeoutWritingMessages: any;
  private tenant: string;
  private logger: LoggerService = LoggerInstance.getInstance();
  // private ref: firebase.database.Query;

  private firebase: any;
  private ref: any;

  constructor() {
    super();
  }

  /** */
  public async initialize(tenant: string) {
    this.tenant = tenant;
    this.logger.debug('[FIREBASETypingSERVICE] initialize - tenant ', this.tenant)
    this.urlNodeTypings = '/apps/' + this.tenant + '/typings/';

    const { default: firebase} = await import("firebase/app");
    await Promise.all([import("firebase/database")]);
    this.firebase = firebase
    this.ref = this.firebase.database['Query'];

  }

  /** */
  public isTyping(idConversation: string, idCurrentUser: string, isDirect: boolean ) {
    const that = this;
    let urlTyping = this.urlNodeTypings + idConversation;
    if (isDirect) {
      urlTyping = this.urlNodeTypings + idCurrentUser + '/' + idConversation;
    }
    this.logger.debug('[FIREBASETypingSERVICE] urlTyping: ', urlTyping);
    this.ref = this.firebase.database().ref(urlTyping);
    this.ref.on('child_changed', (childSnapshot) => {
      const precence: TypingModel = childSnapshot.val();
      that.logger.debug('[FIREBASETypingSERVICE] child_changed: ', precence);
      that.BSIsTyping.next({uid: idConversation, uidUserTypingNow: precence.uid, nameUserTypingNow: precence.name, waitTime: TIME_TYPING_MESSAGE});
    });
  }

  /** */
  public setTyping(idConversation: string, message: string, recipientId: string, userFullname: string) {
    const that = this;
    clearTimeout(this.setTimeoutWritingMessages);
    this.setTimeoutWritingMessages = setTimeout(() => {
      const urlTyping = this.urlNodeTypings + idConversation + '/' + recipientId;// + '/user';
      this.logger.debug('[FIREBASETypingSERVICE] setWritingMessages:', urlTyping, userFullname);
      const timestampData =  that.firebase.database.ServerValue.TIMESTAMP;
      const precence = new TypingModel(recipientId, timestampData, message, userFullname);
      that.firebase.database().ref(urlTyping).set(precence, ( error ) => {
        if (error) {
          this.logger.error('[FIREBASETypingSERVICE] setTyping error', error);
        } else {
          this.BSSetTyping.next({uid: idConversation, typing: precence});
        }
      });
    }, 500);
  }

}
