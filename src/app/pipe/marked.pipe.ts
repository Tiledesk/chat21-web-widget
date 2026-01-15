import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { BLOCKED_DOMAINS } from '../utils/utils';
import { htmlEntities } from 'src/chat21-core/utils/utils';


@Pipe({
  name: 'marked'
})

export class MarkedPipe implements PipeTransform {
  transform(value: any): any {
    // Security hardening:
    // - Do not allow raw HTML from chat messages to be interpreted as DOM.
    // - Keep Markdown working (marked will generate the needed HTML tags).
    // This makes inputs like "<h1>Title</h1>" render exactly as typed.
    const input =
      typeof value === 'string'
        ? value
        : (value === null || value === undefined) ? '' : String(value);
    const safeInput = htmlEntities(input);

    const renderer = new marked.Renderer();
    renderer.link = function({ href, title, tokens }) {
      // Normalizza l'href per evitare falsi negativi
      const normalized = (href || '').trim().toLowerCase();
      // Pattern pericolosi da cercare nell'intero URL (non solo all'inizio)
      const dangerousPatterns = [
        /javascript:/i,           // javascript: protocol
        /data:/i,                // data: protocol  
        /vbscript:/i,            // vbscript: protocol
        /on\w+\s*=/i,           // event handlers (onclick, onload, etc.)
        /alert\s*\(/i,          // alert() function
        /eval\s*\(/i,           // eval() function
        /document\./i,          // document object access
        /window\./i,            // window object access
        /\.appendChild\s*\(/i,  // DOM manipulation
        /\.createElement\s*\(/i, // DOM creation
        /<script/i,             // script tags
        /<\/script>/i,          // closing script tags
        /function\s*\(/i,       // function definitions
        /\(function/i,          // IIFE patterns
        /setTimeout\s*\(/i,     // setTimeout
        /setInterval\s*\(/i,    // setInterval
        /location\./i,          // location object manipulation
        /history\./i,           // history object manipulation
        /localStorage\./i,      // localStorage access
        /sessionStorage\./i,    // sessionStorage access
        /cookie/i,              // cookie manipulation
        /fetch\s*\(/i,          // fetch API
        /XMLHttpRequest/i,      // XHR
        /FormData/i,            // FormData
        /Blob\s*\(/i,           // Blob constructor
        /FileReader/i,          // FileReader
        /crypto\./i,            // crypto object
        /btoa\s*\(/i,           // base64 encoding
        /atob\s*\(/i,           // base64 decoding
        /decodeURI/i,           // URI decoding
        /encodeURI/i,           // URI encoding
        /String\.fromCharCode/i, // character code conversion
        /unescape\s*\(/i,       // unescape function
        /escape\s*\(/i          // escape function
      ];

      // Controlla se l'URL contiene pattern pericolosi
      const isDangerous = dangerousPatterns.some(pattern => pattern.test(normalized));
      if (isDangerous) {
        // Ritorna solo il testo come stringa, niente <a>
        return tokens ? tokens.map(token => token.raw).join('') : href || '';
      }

      // tokens = this.cleanInput(href);

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

    if (safeInput && safeInput.length > 0) {
      try {
        return marked.parse(safeInput);
      } catch (err) {
        console.error('Errore nel parsing markdown:', err);
        return safeInput;
      }
    }
    return safeInput;
  }


  private cleanInput(input: string): string {
    if (!input) return '';
    let cleaned = (input || '').trim().toLowerCase();

    BLOCKED_DOMAINS.forEach(domain => {
    const escapedDomain = domain.replace(/\./g, '\\.');
    // Pattern che copre TUTTI i casi
    const comprehensivePattern = new RegExp(
      `(\\[([^\\]]*)\\]\\([^)]*(?:https?://)?(?:www\\.)?${escapedDomain}(?:/[^)]*)?\\))|((?:https?://)?(?:www\\.)?${escapedDomain}(?:/\\S*)?)`,
      'gi'
    );
    
    cleaned = cleaned.replace(comprehensivePattern, (match, p1, p2, p3) => {
      // Se è un link markdown [text](url), mantieni il testo
      if (p2) return `${p2} 🔒`;
      // Se è un URL diretto, sostituisci con dominio + 🔒
      if (p3) return `${domain} 🔒`;
      return match;
      });
   
    });


    // Pattern che sostituisce i link pericolosi con solo il testo
    const dangerousLinkPatterns = [
      // Sostituisce [text](javascript:...) con "text"
      /\[([^\]]*)\]\(javascript:[^)]*\)/gi,
      /\[([^\]]*)\]\(data:[^)]*\)/gi,
      /\[([^\]]*)\]\(vbscript:[^)]*\)/gi,
      /\[([^\]]*)\]\([^)]*alert\([^)]*\)/gi
    ];

    dangerousLinkPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '$1'); // $1 = il testo del link
    });

    // Pattern generali per sicurezza (rimuovono completamente)
    const generalPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<script[^>]*>[\s\S]*?<\/script>/gi, // Script multi-linea
      /<script[^>]*>.*?<\/script>/gi, // Script single-line
      /<script[^>]*>/gi, // Solo tag di apertura
      /<\/script>/gi, // Solo tag di chiusura
      /javascript:/gi,
      /vbscript:/gi,
      /data:/gi,
      /on\w+\s*=/gi,
      /alert\(/gi,
      /eval\(/gi,
      /document\./gi,
      /window\./gi,
      /\(function\s*\(\)\s*\{/gi,
      /\.appendChild\(/gi,
      /\.createElement\(/gi,
      /\.getElementsByTagName\(/gi,
    
      // ✅ PATTERN PER FUNZIONI IIFE (Immediately Invoked Function Expression):
      /\(function\s*\(\s*\)\s*\{[\s\S]*?\}\)\(\s*\)\s*;/gi,
      /\(function\s*\(\)\s*\{/gi
    ];

    generalPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

}
