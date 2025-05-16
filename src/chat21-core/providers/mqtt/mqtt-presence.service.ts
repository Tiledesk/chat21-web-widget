import { Chat21Service } from 'src/chat21-core/providers/mqtt/chat-service';
import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// firebase
// import * as firebase from 'firebase/app';
// import 'firebase/messaging';
// import 'firebase/database';

// services
// import { EventsService } from '../events-service';
import { PresenceService } from '../abstract/presence.service';

// utils
import { setLastDate } from '../../utils/utils';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../abstract/logger.service';
import { LoggerInstance } from '../logger/loggerInstance';

// @Injectable({ providedIn: 'root' })
@Injectable()
export class MQTTPresenceService extends PresenceService {
  

  // BehaviorSubject
  BSIsOnline: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  BSLastOnline: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // private params
  private tenant: string;
  private urlNodePresence: string;
  private logger: LoggerService = LoggerInstance.getInstance();

  constructor(
    public chat21Service: Chat21Service,
    @Optional() @Inject('webSocketService') public webSocketService?: any,
  ) {
    super();
  }

  initialize(tenant: string) {
    // this.tenant = this.getTenant();
    this.tenant = tenant;
    this.logger.debug('[MQTT-PRESENCE] initialize this.tenant', this.tenant);
    this.urlNodePresence = '/apps/' + this.tenant + '/presence/';
  }

  userIsOnline(userid: string): Observable<any> {
    const that = this;
    let local_BSIsOnline = new BehaviorSubject<any>(null);
    this.webSocketService.wsRequesterStatus$.subscribe((data: any) => {
    // this.logger.log('[NATIVEPresenceSERVICE] $subs to wsService - data ', data, userid);
    if (data && data.presence && data.presence.status === 'online' ) {
        that.BSIsOnline.next({ uid: data.uuid_user, isOnline: true });
        local_BSIsOnline.next({ uid: data.uuid_user, isOnline: true });
    } else {
        that.BSIsOnline.next({ uid: data.uuid_user, isOnline: false });
        local_BSIsOnline.next({ uid: data.uuid_user, isOnline: false });
    }
    });

    return local_BSIsOnline
  }

  lastOnlineForUser(userid: string) {

  }

  public setPresence(userid: string): void  {

  }

  public imHere(): void {
    this.logger.debug('[MQTT-PRESENCE] imHere', this.tenant);
    setTimeout(() => {
      this.chat21Service.chatClient.ImHere()
    }, 2000);
  }

  /**
   * removePresence
   * richiamato prima del logout
   */
  public removePresence(): void {

  }

}
