import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'chat-conversation-emojii',
  templateUrl: './conversation-emojii.component.html',
  styleUrls: ['./conversation-emojii.component.scss']
})
export class ConversationEmojiiComponent implements OnInit {

  @Input() var: string;
  @Output() addEmoji = new EventEmitter();
  
  emojiiOptions = {
    emojiPerLine : 9,
    totalFrequentLines: 1,
    showPreview: false,
    darkMode: false,
    enableSearch: false,
    include: [ 'recent', 'people', 'nature', 'activity', 'flags']
  }

  constructor(){}

  ngOnInit(): void {
  }

  addEmojiFN(event){
    this.addEmoji.emit(event)
  }

}
