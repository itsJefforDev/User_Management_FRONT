import { Component, input, model, computed } from '@angular/core';

@Component({
  selector: 'app-input',
  imports: [],
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class InputComponent {
  value = model<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  disabled = input<boolean>(false);
  id = input<string>('');
  name = input<string>('');
  customClass = input<string>('');

  protected inputClasses = computed(() => {
    const base =
      'w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition duration-150';
    return this.customClass() ? `${base} ${this.customClass()}` : base;
  });

  protected onInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.value.set(inputElement.value);
  }
}
