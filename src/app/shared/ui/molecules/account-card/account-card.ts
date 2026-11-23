import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Account,
  getAccountTypeLabel,
  formatCurrency,
} from '../../../../core/models/account.model';
import { BadgeComponent } from '../../atoms/badge/badge';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-account-card',
  imports: [CommonModule, BadgeComponent, ButtonComponent],
  templateUrl: './account-card.html',
  styleUrl: './account-card.scss',
})
export class AccountCardComponent {
  account = input.required<Account>();

  edit = output<Account>();
  deactivate = output<Account>();

  protected readonly typeLabel = computed(() =>
    getAccountTypeLabel(this.account().type)
  );

  protected readonly formattedBalance = computed(() =>
    formatCurrency(this.account().balance)
  );

  protected readonly typeTheme = computed(() => {
    const t = (this.account().type || '').toUpperCase();
    if (t === 'BANK') {
      return {
        badgeVariant: 'info' as const,
        bgGradient: 'from-blue-600 to-indigo-700',
        iconBg: 'bg-indigo-50 text-indigo-600',
      };
    }
    if (t === 'DIGITAL_WALLET') {
      return {
        badgeVariant: 'success' as const,
        bgGradient: 'from-emerald-600 to-teal-700',
        iconBg: 'bg-emerald-50 text-emerald-600',
      };
    }
    return {
      badgeVariant: 'warning' as const,
      bgGradient: 'from-amber-600 to-orange-700',
      iconBg: 'bg-amber-50 text-amber-600',
    };
  });
}
