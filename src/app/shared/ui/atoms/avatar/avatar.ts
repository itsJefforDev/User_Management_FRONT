import { Component, input, computed } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class AvatarComponent {
  name = input<string>('');
  src = input<string | undefined>(undefined);
  size = input<AvatarSize>('md');

  protected containerClasses = computed(() => {
    return {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    }[this.size()];
  });

  protected initials = computed(() => {
    const raw = this.name().trim();
    if (!raw) return '?';
    const parts = raw.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  });
}
