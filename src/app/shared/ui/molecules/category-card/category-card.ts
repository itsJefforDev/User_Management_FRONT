import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Category,
  getCategoryTypeLabel,
  getCategoryTypeBadgeVariant,
} from '../../../../core/models/category.model';
import { BadgeComponent } from '../../atoms/badge/badge';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-category-card',
  imports: [CommonModule, BadgeComponent, ButtonComponent],
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
})
export class CategoryCardComponent {
  category = input.required<Category>();
  readonly = input<boolean>(false);

  edit = output<Category>();
  toggleStatus = output<Category>();
  delete = output<Category>();

  protected readonly typeLabel = computed(() =>
    getCategoryTypeLabel(this.category().type)
  );

  protected readonly badgeVariant = computed(() =>
    getCategoryTypeBadgeVariant(this.category().type)
  );

  protected readonly typeTheme = computed(() => {
    const t = (this.category().type || '').toUpperCase();
    if (t === 'EXPENSE') {
      return {
        badgeVariant: 'danger' as const,
        bgGradient: 'from-rose-500 to-red-600',
        iconBg: 'bg-rose-50 text-rose-600',
      };
    }
    if (t === 'INCOME') {
      return {
        badgeVariant: 'success' as const,
        bgGradient: 'from-emerald-500 to-teal-600',
        iconBg: 'bg-emerald-50 text-emerald-600',
      };
    }
    return {
      badgeVariant: 'info' as const,
      bgGradient: 'from-indigo-500 to-purple-600',
      iconBg: 'bg-indigo-50 text-indigo-600',
    };
  });
}
