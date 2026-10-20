import { Component, ElementRef, EventEmitter, Input, OnInit, OnDestroy, Output, SimpleChange, ViewChild } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormArray } from '../../../../../chat21-core/models/formArray';

@Component({
  selector: 'chat-form-text',
  templateUrl: './form-text.component.html',
  styleUrls: ['./form-text.component.scss']
})
export class FormTextComponent implements OnInit, OnDestroy {

  @Input() element: FormArray;
  @Input() controlName: string;
  @Input() translationErrorLabelMap: Map<string, string>;
  @Input() stylesMap: Map<string, string>;
  @Input() hasSubmitted: boolean;
  @Output() onKeyEnterPressed = new EventEmitter<any>(); 

  @ViewChild('div_input') input: ElementRef;
  form: FormGroup<any>;
  inputType: string = 'text'

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
  private valueChangesSub?: Subscription;

  constructor(private rootFormGroup: FormGroupDirective,
              private elementRef: ElementRef) { }

  ngOnInit() {
    this.form = this.rootFormGroup.control as FormGroup<any>;
    if(this.form && this.form.controls && this.form.controls[this.controlName]){
      this.valueChangesSub = this.form.controls[this.controlName].valueChanges.subscribe((value) => {
        this.hasSubmitted= false;
        this.setFormStyle();
      })
    }
  }

  ngOnDestroy() {
    this.valueChangesSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChange){
    if(this.controlName && (this.controlName.toLowerCase().includes('email') || this.controlName.toLowerCase().includes('e-mail')) ){
      this.inputType = 'email';
    }
    if(this.stylesMap && this.stylesMap.get('themeColor')) this.elementRef.nativeElement.style.setProperty('--themeColor', this.stylesMap.get('themeColor'));
    if(this.stylesMap && this.stylesMap.get('foregroundColor')) this.elementRef.nativeElement.style.setProperty('--foregroundColor', this.stylesMap.get('foregroundColor'));
  }

  onFocusOut(){
    this.input.nativeElement.classList.remove('is-focused')
  }

  onFocus(){
    this.input.nativeElement.classList.add('is-focused')
  }

  /**
   * FIRED when user press ENTER button on keyboard 
   * @param event 
   */
  onEnterPressed(event){
    this.onKeyEnterPressed.emit(event)
  }

  setFormStyle(){
    if(this.form.controls[this.controlName].hasError('pattern') || 
      this.form.controls[this.controlName].hasError('required') || 
      this.form.controls[this.controlName].invalid){
        this.input.nativeElement.classList.add('form-danger')
        this.input.nativeElement.classList.remove('form-success')
    } else if (this.form.controls[this.controlName].valid){
        this.input.nativeElement.classList.remove('form-danger')
        this.input.nativeElement.classList.add('form-success')
    }
  }

}
