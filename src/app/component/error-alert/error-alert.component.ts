import { Component, Input, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/chat21-core/providers/custom-translate.service';
import * as CONSTANTS from 'src/app/utils/constants';

@Component({
  selector: 'chat-error-alert',
  templateUrl: './error-alert.component.html',
  styleUrls: ['./error-alert.component.scss']
})
export class ErrorAlertComponent implements OnInit {

  @Input() errorMessage: string = '';
  @Input() errorKeyMessage: string = '';
  @Input() errorParams: Record<string, any> = {}; 

  translationMap: Map<string, string>;

  constructor(
    private customTranslateService: CustomTranslateService,
  ){}

  ngOnInit(): void {
    let rawMessage: string = '';
    // Combina costanti globali + parametri passati come input
    const replacements = { ...CONSTANTS, ...this.errorParams };
    if (this.errorKeyMessage) {
      // Traduci il messaggio e sostituisci i placeholder
        rawMessage = this.customTranslateService
        .translateLanguage([this.errorKeyMessage])
        .get(this.errorKeyMessage);
    } else if (this.errorMessage) {
      rawMessage = this.errorMessage;
    }
    this.errorMessage = this.interpolate(rawMessage, replacements);
  }

  /** Sostituisce {{placeholders}} con i valori corrispondenti */
  private interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const trimmedKey = key.trim();
      return variables[trimmedKey] ?? `{{${trimmedKey}}}`;
    });
  }

}


