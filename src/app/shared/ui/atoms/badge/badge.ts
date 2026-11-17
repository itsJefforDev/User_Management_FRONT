import { Component, input, computed } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  size = input<BadgeSize>('sm');

  protected badgeClasses = computed(() => {
    const base = 'inline-flex items-center font-medium rounded-full select-none';

    const sizes = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    }[this.size()];

    const variants = {
      success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
      warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
      danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
      info: 'bg-sky-50 text-sky-700 border border-sky-200/60',
      neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    }[this.variant()];

    return `${base} ${sizes} ${variants}`;
  });

  protected dotClasses = computed(() => {
    return {
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-rose-500',
      info: 'bg-sky-500',
      neutral: 'bg-slate-400',
    }[this.variant()];
  });
}
