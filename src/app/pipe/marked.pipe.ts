import { Pipe, PipeTransform } from '@angular/core';
import { marked, Tokens } from 'marked';

@Pipe({
  name: 'marked'
})
export class MarkedPipe implements PipeTransform {

  transform(value: any): string {

    const input =
      typeof value === 'string'
        ? value
        : (value === null || value === undefined) ? '' : String(value);

    const inputWithNewlines = input.replace(/\\n/g, '\n');

    const renderer = new marked.Renderer();

    /* --------------------------------------------------
       🔐 1. NON renderizzare HTML raw
    -------------------------------------------------- */
    renderer.html = function(token: Tokens.HTML | Tokens.Tag): string {
      const html = 'text' in token ? token.text : '';

      return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    /* --------------------------------------------------
       🔐 2. Link sicuri
    -------------------------------------------------- */
    const originalLinkRenderer = renderer.link.bind(renderer);

    const dangerousProtocols = [
      /^javascript:/i,
      /^data:/i,
      /^vbscript:/i
    ];

    renderer.link = function({ href, title, tokens }) {

      const normalized = (href || '').trim();

      const isDangerous = dangerousProtocols.some(pattern =>
        pattern.test(normalized)
      );

      if (isDangerous) {
        return tokens ? tokens.map(t => t.raw).join('') : href || '';
      }

      const html = originalLinkRenderer({ href, title, tokens });

      // aggiunge sicurezza ai link
      return html.replace(
        '<a ',
        '<a target="_blank" rel="noopener noreferrer" '
      );
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true
    });

    try {
      return marked.parse(inputWithNewlines) as string;
    } catch (err) {
      console.error('Errore parsing markdown:', err);
      return inputWithNewlines;
    }
  }
}