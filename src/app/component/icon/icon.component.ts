import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LUCIDE_ICONS, LucideIconName } from '../../icons/lucide-icons';

/**
 * Renders one Lucide icon. Size, stroke and color come from
 * src/app/sass/_icons.scss (`--chat-icon-size`, `--chat-icon-stroke`, `--chat-icon-color`).
 */
@Component({
  selector: 'chat-icon',
  template: `<span class="chat-icon__glyph" [innerHTML]="markup()"></span>`,
  host: {
    '[style.--chat-icon-size]': 'sizeStyle()',
    '[style.--chat-icon-stroke]': 'stroke()',
    '[style.color]': 'color()',
    '[class.filled]': 'filled()',
    'aria-hidden': 'true',
  },
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<LucideIconName>();
  readonly size = input<number | string | null>(null);
  readonly stroke = input<number | string | null>(null);
  readonly color = input<string | null>(null);
  readonly filled = input(false);

  readonly sizeStyle = computed(() => {
    const size = this.size();
    if (size === null || size === undefined || size === '') {
      return null;
    }
    return typeof size === 'number' ? `${size}px` : size;
  });

  readonly markup = computed(() => {
    const body = LUCIDE_ICONS[this.name()];
    if (!body) {
      return '';
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">${body}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });
}
