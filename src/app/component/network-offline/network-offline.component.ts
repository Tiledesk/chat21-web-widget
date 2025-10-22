import { Component, Input, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';

@Component({
  selector: 'chat-network-offline',
  templateUrl: './network-offline.component.html',
  styleUrls: ['./network-offline.component.scss']
})
export class NetworkOfflineComponent implements OnInit {

  @Input() keyErrorMessage: string = 'CONNECTION_NETWORK_ERROR';
  translationMap: Map< string, string>;

  constructor(
    private customTranslateService: CustomTranslateService
  ){}

  ngOnInit(): void {
    let keys = [
      this.keyErrorMessage
    ]
    this.translationMap = this.customTranslateService.translateLanguage(keys)
  }

}
