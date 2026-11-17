import { Component, input, computed, output } from '@angular/core';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
})
export class AlertComponent {
  variant = input<AlertVariant>('info');
  title = input<string>('');
  dismissible = input<boolean>(false);

  dismissed = output<void>();

  protected alertClasses = computed(() => {
    const base = 'p-4 rounded-xl border text-sm transition-all';

    const variants = {
      info: 'bg-sky-50/80 border-sky-200 text-sky-950',
      success: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
      warning: 'bg-amber-50/80 border-amber-200 text-amber-950',
      danger: 'bg-rose-50/80 border-rose-200 text-rose-950',
    }[this.variant()];

    return `${base} ${variants}`;
  });
}
