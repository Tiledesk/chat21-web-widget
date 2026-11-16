import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Globals } from '../../utils/globals';

import { convertColorToRGBA } from 'src/chat21-core/utils/utils';
import { AppStorageService } from '../../../chat21-core/providers/abstract/app-storage.service';
// vedi: https://angular.io/guide/animations

@Component({
    selector: 'chat-launcher-button',
    templateUrl: './launcher-button.component.html',
    styleUrls: ['./launcher-button.component.scss'],
    standalone: false
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
     
    } 
    this.onButtonClicked.emit( this.g.isOpen );
  }

}
