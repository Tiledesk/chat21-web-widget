import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { Globals } from '../../utils/globals';

@Component({
    selector: 'chat-send-button',
    templateUrl: './send-button.component.html',
    styleUrls: ['./send-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SendButtonComponent implements OnInit {

  @Output() onSendButtonClicked = new EventEmitter()
  constructor(public g: Globals) { }

  ngOnInit() {
  }

  onSendPressed(event){
    this.onSendButtonClicked.emit(true)
  }

}
