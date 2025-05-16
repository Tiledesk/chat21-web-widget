import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getParameterByName } from 'src/chat21-core/utils/utils';
import { environment } from 'src/environments/environment';
import { Globals } from '../utils/globals';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  private appConfig;

  constructor(private http: HttpClient, public g: Globals) {
    this.appConfig = environment;
  }

  loadAppConfig() {
    // START GET BASE URL and create absolute url of remoteConfigUrl //
    let urlConfigFile = this.appConfig.remoteConfigUrl;
    if (!this.appConfig.remoteConfigUrl.startsWith('http')) {
      let wContext: any = window;
      if (window.frameElement && window.frameElement.getAttribute('tiledesk_context') === 'parent') {
        wContext = window.parent;
      }
      const windowcontextFromWindow = getParameterByName(window, 'windowcontext');
      if (windowcontextFromWindow !== null && windowcontextFromWindow === 'window.parent') {
        wContext = window.parent;
      }
      if (!wContext['tiledesk']) {
        return;
      } else {
          const baseLocation =  wContext['tiledesk'].getBaseLocation();
          if (baseLocation !== undefined) {
              // globals.setParameter('baseLocation', baseLocation);
              this.g.baseLocation = baseLocation;
              urlConfigFile = this.g.baseLocation + this.appConfig.remoteConfigUrl;
          }
      }
    }
    // END GET BASE URL and create absolute url of remoteConfigUrl //
    const that = this;
    return this.http.get(urlConfigFile).toPromise().then(data => {
      that.appConfig = data;
      }).catch(err => {
        console.error('error loadAppConfig', err);
      });
  }

  getConfig() {
    return this.appConfig;
  }
}
