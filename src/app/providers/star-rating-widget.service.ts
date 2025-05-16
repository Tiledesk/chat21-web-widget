import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// services
import { map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/providers/app-config.service';
import { Globals } from 'src/app/utils/globals';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';


@Injectable()
export class StarRatingWidgetService {
  // private BASE_URL_SEND_RATE: string;
  public obsCloseConversation: any;
  private API_URL;
  public senderId: any;
  public requestid: any;
  private logger: LoggerService = LoggerInstance.getInstance();
  // private requestid: String = 'LKfJrBCk6G5up3uNH1L';
  // private projectid: String = '5b55e806c93dde00143163dd';

  constructor(
    public http: HttpClient,
    public g: Globals,
    public appConfigService: AppConfigService
  ) {

    this.API_URL = this.appConfigService.getConfig().apiUrl;
    //  that.g.wdLog(['AgentAvailabilityService:: this.API_URL',  this.API_URL );
    if (!this.API_URL) {
      throw new Error('apiUrl is not defined');
    }
    this.obsCloseConversation = new BehaviorSubject<boolean>(null);

    // this.observable = new BehaviorSubject<boolean>(null);
    // this.auth.obsLoggedUser.subscribe((current_user) => {
    //    that.g.wdLog(['»»» START-RATING-WIDGET SERVICE - USER GET FROM AUTH SUBSCRIPTION ', current_user);
    //   if (current_user) {
    //     this.senderId = current_user.user.uid;
    //      that.g.wdLog(['»»» START-RATING-WIDGET SERVICE - USER UID (alias SENDER ID) ', this.senderId);
    //     setTimeout(() => {
    //       this.requestid = sessionStorage.getItem(this.senderId);
    //       this.requestid = this.appStorageService.getItem(this.senderId);
    //        that.g.wdLog(['»»» START-RATING-WIDGET SERVICE - REQUEST ID GET FRO STORAGE', this.requestid);
    //     }, 100);
    //   }
    // });
  }

  httpSendRate(rate, message): Observable<string> {
    const token = this.g.tiledeskToken;
    const projectId = this.g.projectid;
    const recipientId = this.g.recipientId;
    if (rate && token && projectId && recipientId) {
      const headers = new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        Authorization: token,
      });
      // const url = this.API_URL + this.projectid + '/requests/' + this.requestid;
      // const url = this.API_URL + 'chat/support/tilechat/requests/' + recipientId + '/rate?token=chat21-secret-orgAa,&rating=' 
      // tslint:disable-next-line:max-line-length
      const url = this.API_URL + projectId + '/requests/' + recipientId + '/rating';
      // 'chat/support/tilechat/requests/' + recipientId + '/rate?token=chat21-secret-orgAa,&rating=' + rate + '&rating_message=' + message;
      // project_id/requests/:id/rating
      this.logger.debug('[STAR-RATING-SERVICE] ------------------> url: ', url);
      const body = {
        'rating': rate,
        'rating_message': message
      };
      this.logger.debug('[STAR-RATING-SERVICE] ------------------> options: ', headers);
      this.logger.debug('[STAR-RATING-SERVICE] ------------------> body: ', JSON.stringify(body));
      return this.http.patch(url, JSON.stringify(body), { headers: headers })
                      .pipe(map((res: any) => (res.json())));
    }
  }

  //  setProjectid(projectid: String) {
  //    this.projectid = projectid;
  //  }

  //  setRequestid(requestid: String) {
  //   this.requestid = requestid;
  // }

  setOsservable(bool) {
    this.logger.debug('[STAR-RATING-SERVICE] ------------------> setOsservable: ', bool);
    this.obsCloseConversation.next(bool);
  }

  _dowloadTranscript(recipientId) {
    const url = this.API_URL + 'public/requests/' + recipientId + '/messages-user.html';
    const windowContext = this.g.windowContext;
    windowContext.open(url, '_blank');
    // windowContext.location.reload(true);
  }

}
