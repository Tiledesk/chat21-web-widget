import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from '../providers/app-config.service';
import { Globals } from '../utils/globals';

@Injectable()
export class WaitingService {
  API_URL: string;

  constructor(
    public http: HttpClient,
    public g: Globals,
    public appConfigService: AppConfigService
    ) {

    this.API_URL = appConfigService.getConfig().apiUrl;
  }

  public getCurrent(projectId): Observable<any> {
    const url = this.API_URL + projectId + '/publicanalytics/waiting/current';
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    // headers.append('Authorization', TOKEN);
    return this.http.get(url, { headers })
                    .pipe(map((response: any) => { return response}))

  }

}
