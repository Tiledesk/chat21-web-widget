import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


// @Injectable({
//   providedIn: 'root'
// })
@Injectable()
export abstract class TypingService {

  // BehaviorSubject
  abstract BSIsTyping: BehaviorSubject<any>;
  abstract BSSetTyping: BehaviorSubject<any>;

  // params
  // private DEFAULT_TENANT: string = environment.firebaseConfig.tenant;
  // private _tenant: string;
  
  // public setTenant(tenant): void {
  //   this._tenant = tenant;
  // }
  // public getTenant(): string {
  //   if (this._tenant) {
  //     return this._tenant;
  //   } else {
  //     return this.DEFAULT_TENANT
  //   }
  // }

  // functions
  abstract initialize(tenant: string): void;
  abstract isTyping(idConversation: string, idCurrentUser: string, isDirect: boolean): void;
  abstract setTyping(idConversation: string, message: string, idUser: string, userFullname: string): void;
}
