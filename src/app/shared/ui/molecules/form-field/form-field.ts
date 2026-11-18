import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  imports: [],
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
})
export class FormFieldComponent {
  label = input<string>('');
  forId = input<string>('');
  required = input<boolean>(false);
  errorMessage = input<string | null>(null);
  hint = input<string>('');
}
