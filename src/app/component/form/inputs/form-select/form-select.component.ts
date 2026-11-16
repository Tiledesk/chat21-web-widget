import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'chat-form-select',
    templateUrl: './form-select.component.html',
    styleUrls: ['./form-select.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FormSelectComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
