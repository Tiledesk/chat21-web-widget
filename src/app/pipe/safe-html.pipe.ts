import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {

  constructor(protected sanitizer: DomSanitizer) {}
  
  transform(value: any, args?: any): any {
    // console.log('SafeHtmlPipe html ', html)
    // return this.sanitizer.bypassSecurityTrustResourceUrl(html);
    return this.sanitizer.bypassSecurityTrustHtml(value);;
  }

}
