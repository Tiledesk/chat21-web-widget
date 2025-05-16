import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Globals } from '../../utils/globals';

import { animate, style, transition, trigger } from '@angular/animations';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { AppStorageService } from '../../../chat21-core/providers/abstract/app-storage.service';
// vedi: https://angular.io/guide/animations

@Component({
  selector: 'chat-launcher-button',
  templateUrl: './launcher-button.component.html',
  styleUrls: ['./launcher-button.component.scss'],
  animations: [
    trigger(
      'enterCloseAnimation', [
        transition(':enter', [
          style({ transform: 'rotate(-90deg)', opacity: 1 }),
          animate('450ms ease-out', style({ transform: 'rotate(0deg)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'scale(1)', opacity: 1 }),
          animate('200ms ease-in', style({ transform: 'scale(0.5)', opacity: 0 }))
        ])
      ]
    ),
    trigger(
      'enterBubbleAnimation', [
        transition(':enter', [
          style({ transform: 'scale(0.5)', opacity: 0 }),
          animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
        ]),
        transition(':leave', [
          style({ transform: 'scale(1)', opacity: 1 }),
          animate('200ms ease-in', style({ transform: 'scale(0.5)', opacity: 0 }))
        ])
      ]
    )
  ]
})

export class LauncherButtonComponent implements OnInit, AfterViewInit {
  @ViewChild('aflauncherbutton', {static: false}) private aflauncherbutton: ElementRef;
  @Output() onButtonClicked = new EventEmitter<boolean>();

  constructor(
    public g: Globals,
    public appStorageService: AppStorageService
  ) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    setTimeout(() => {
        if (!this.g.isOpen && this.aflauncherbutton) {
          // this.aflauncherbutton.nativeElement.focus();
          this.aflauncherbutton.nativeElement.style['box-shadow'] = '0px 4px 20px ' + convertColorToRGBA(this.g.themeColor, 50);;
        }
    }, 0);
  }


  openCloseWidget() {
    const isLogged = this.g.isLogged;
    if (isLogged === true) {
      // this.g.isOpen = !this.g.isOpen;
      // this.g.setIsOpen(!this.g.isOpen);
      // this.appStorageService.setItem('isOpen', this.g.isOpen);
      this.onButtonClicked.emit( this.g.isOpen );
    }
  }

}
