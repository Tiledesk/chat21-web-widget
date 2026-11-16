import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { FormArray } from '../../../../../chat21-core/models/formArray';

@Component({
    selector: 'chat-form-label',
    templateUrl: './form-label.component.html',
    styleUrls: ['./form-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FormLabelComponent implements OnInit {

  @Input() element: FormArray;
  @Input() controlName: string;
  @Input() hasSubmitted: boolean; 

  form: FormGroup<any>;
  constructor(private rootFormGroup: FormGroupDirective) { }

  ngOnInit() {
    this.form = this.rootFormGroup.control;
  }

}
