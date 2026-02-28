import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({
  name: 'marked'
})
export class MarkedPipe implements PipeTransform {

  transform(value: any): any {
    // Convertiamo tutto in stringa sicura
    const input =
      typeof value === 'string'
        ? value
        : (value === null || value === undefined) ? '' : String(value);

    // Converti \n letterali in newline reali
    const inputWithNewlines = input.replace(/\\n/g, '\n');

    // Renderer custom solo per i link
    const renderer = new marked.Renderer();
    const originalLinkRenderer = renderer.link.bind(renderer);

    // Lista protocolli / pattern pericolosi
    const dangerousPatterns = [
      /^javascript:/i,
      /^data:/i,
      /^vbscript:/i
    ];

    renderer.link = function({ href, title, tokens }) {
      const normalized = (href || '').trim();

      // Se il link è pericoloso, restituisci solo il testo
      const isDangerous = dangerousPatterns.some(pattern => pattern.test(normalized));
      if (isDangerous) {
        return tokens ? tokens.map(t => t.raw).join('') : href || '';
      }

      // Altrimenti delega al renderer originale di marked
      return originalLinkRenderer({ href, title, tokens });
    };

    // Opzioni marked
    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true
    });

    try {
      return marked.parse(inputWithNewlines);
    } catch (err) {
      console.error('Errore nel parsing markdown:', err);
      return inputWithNewlines;
    }
  }
}