import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { FormArray } from '../../../../../chat21-core/models/formArray';

@Component({
  selector: 'chat-form-checkbox',
  templateUrl: './form-checkbox.component.html',
  styleUrls: ['./form-checkbox.component.scss']
})
export class FormCheckboxComponent implements OnInit {

  @Input() element: FormArray;
  @Input() controlName: string;
  @Input() translationErrorLabelMap: Map<string, string>;
  @Input() stylesMap: Map<string, string>;
  @Input() hasSubmitted: boolean;
  @Output() onKeyEnterPressed = new EventEmitter<any>();
  
  form: FormGroup<any>;

  get fieldBaseId(): string {
    const raw = this.element?.name || this.controlName || 'field';
    return 'c21-prechat-' + String(raw).replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  get errorsId(): string {
    return this.fieldBaseId + '-errors';
  }

  get ariaDescribedByErrors(): string | null {
    const name = this.element?.name;
    if (!this.hasSubmitted || !this.form?.controls?.[name]?.errors) {
      return null;
    }
    return this.errorsId;
  }

  get ariaInvalid(): 'true' | 'false' {
    const name = this.element?.name;
    if (!this.hasSubmitted || !this.form?.controls?.[name]) {
      return 'false';
    }
    return this.form.controls[name].invalid ? 'true' : 'false';
  }

  constructor(private rootFormGroup: FormGroupDirective,
              private elementRef: ElementRef) { }

  ngOnInit() {
    this.form = this.rootFormGroup.control;
  }

  ngOnChanges(changes: SimpleChanges){
    if(this.stylesMap && this.stylesMap.get('themeColor')) this.elementRef.nativeElement.style.setProperty('--themeColor', this.stylesMap.get('themeColor'));
    if(this.stylesMap && this.stylesMap.get('foregroundColor')) this.elementRef.nativeElement.style.setProperty('--foregroundColor', this.stylesMap.get('foregroundColor'));
  }

  /**
   * FIRED when user press ENTER button on keyboard 
   * @param event 
   */
  onEnterPressed(event){
    this.onKeyEnterPressed.emit(event)
  }

}
