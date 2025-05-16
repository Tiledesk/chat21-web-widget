import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Globals } from 'src/app/utils/globals';
import { convertColorToRGBA } from 'src/chat21-core/utils/utils';



@Component({
  selector: 'chat-menu-options',
  templateUrl: './menu-options.component.html',
  styleUrls: ['./menu-options.component.scss']
})
export class MenuOptionsComponent implements OnInit {

  @Input() isHover: boolean = false;
  @Output() onSignOut = new EventEmitter();
  
  themeColor50: string;

  constructor(
    public g: Globals
  ) { }

  ngOnInit() {
    this.themeColor50 = convertColorToRGBA(this.g.themeColor, 50);
  }

  f21_toggle_options() {
    this.g.setParameter('isOpenMenuOptions', !this.g.isOpenMenuOptions, true);
  }

  toggleSound() {
    this.g.setParameter('soundEnabled', !this.g.soundEnabled, true);
    this.g.setParameter('isOpenMenuOptions', false, true);
    // this.g.soundEnabled = !this.g.soundEnabled;
    // if ( this.g.soundEnabled === false ) {
    //   this.storageService.setItem('soundEnabled', false);
    // } else {
    //   this.storageService.setItem('soundEnabled', true);
    // }
  }

  signOut() {
    this.g.setParameter('isOpenMenuOptions', false, true);
    this.onSignOut.emit();
  }

}
