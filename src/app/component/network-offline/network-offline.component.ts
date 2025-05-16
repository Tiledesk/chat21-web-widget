import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';

@Component({
  selector: 'chat-network-offline',
  templateUrl: './network-offline.component.html',
  styleUrls: ['./network-offline.component.scss']
})
export class NetworkOfflineComponent implements OnInit {

  translationMap: Map< string, string>;

  constructor(
    private customTranslateService: CustomTranslateService
  ){}

  ngOnInit(): void {
    let keys = [
      'CONNECTION_NETWORK_ERROR'
    ]
    this.translationMap = this.customTranslateService.translateLanguage(keys)
  }

}
