import { ElementRef, Renderer2 } from '@angular/core';

import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
  it('should create', () => {
    const el = document.createElement('span');
    const renderer = jasmine.createSpyObj('Renderer2', ['createElement', 'appendChild', 'addClass', 'removeClass', 'removeChild', 'setStyle']);
    const directive = new TooltipDirective(new ElementRef(el), renderer as unknown as Renderer2);
    expect(directive).toBeTruthy();
  });
});
