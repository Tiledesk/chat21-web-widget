import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';


@Pipe({
  name: 'marked'
})

export class MarkedPipe implements PipeTransform {
  transform(value: any): any {
    const renderer = new marked.Renderer();
    renderer.link = function({ href, title, tokens }) {
      // Normalizza l'href per evitare falsi negativi
      const normalized = (href || '').trim().toLowerCase();

      // Blocca javascript:, data:, vbscript: ecc.
      if (normalized.startsWith('javascript:') ||
          normalized.startsWith('data:') ||
          normalized.startsWith('vbscript:')) {
        // Ritorna solo il testo come stringa, niente <a>
        return tokens ? tokens.map(token => token.raw).join('') : href || '';
      }

      const text = tokens
        ? tokens.map(token => token.raw).join('')
        : href; // fallback se tokens non c'è
      if (!href) return text;

      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true
    });

    if (value && value.length > 0) {
      try {
        return marked.parse(value);
      } catch (err) {
        console.error('Errore nel parsing markdown:', err);
        return value;
      }
    }
    return value;
  }

}
