import { Component, OnInit } from '@angular/core';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from './../../../../chat21-core/providers/logger/loggerInstance';

@Component({
  selector: 'chat-like-unlike',
  templateUrl: './like-unlike.component.html',
  styleUrls: ['./like-unlike.component.scss']
})
export class LikeUnlikeComponent implements OnInit {

  private logger: LoggerService = LoggerInstance.getInstance();
  constructor() { }

  ngOnInit(): void {
  }

  onClick(icon: string){
    this.logger.debug('[LIKE-UNLIKE] onClick-->', icon)
  }

}
