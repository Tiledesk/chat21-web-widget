import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'chat-form-radio-button',
    templateUrl: './form-radio-button.component.html',
    styleUrls: ['./form-radio-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FormRadioButtonComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
