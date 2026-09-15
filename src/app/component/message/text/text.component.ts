import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'chat-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class TextComponent implements OnInit {

  @Input() text: string;
  @Input() htmlEnabled: boolean = false;
  @Input() color: string;
  /** When set, words are revealed one-by-one inside the same chat-text styles. */
  @Input() streamingWords: Array<{ word: string; index: number }> | null = null;
  /** When set, TTS karaoke highlight runs inside the same chat-text styles. */
  @Input() karaokeWords: Array<{ text: string; state: 'future' | 'active' | 'past' }> | null = null;
  @Output() onBeforeMessageRender = new EventEmitter();
  @Output() onAfterMessageRender = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }


  printMessage(text, messageEl, component) {
    const messageOBJ = { messageEl: messageEl, component: component}
    this.onBeforeMessageRender.emit(messageOBJ)
    const messageText = text;
    this.onAfterMessageRender.emit(messageOBJ)
    // this.triggerBeforeMessageRender(message, messageEl, component);
    // const messageText = message.text;
    // this.triggerAfterMessageRender(message, messageEl, component);
    return messageText;
  }

  trackStreamingWord(_index: number, item: { word: string; index: number }): number {
    return item.index;
  }

  trackKaraokeWord(index: number): number {
    return index;
  }

}
