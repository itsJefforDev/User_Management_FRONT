import { Component, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-password-input',
  imports: [],
  templateUrl: './password-input.html',
  styleUrl: './password-input.scss',
})
export class PasswordInputComponent {
  value = model<string>('');
  placeholder = input<string>('••••••••');
  disabled = input<boolean>(false);
  id = input<string>('');

  protected showPassword = signal(false);

  protected togglePasswordVisibility() {
    if (!this.disabled()) {
      this.showPassword.update((val) => !val);
    }
  }

  protected onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.value.set(inputElement.value);
  }
}
