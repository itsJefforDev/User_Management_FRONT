import { Component, input, output, computed } from '@angular/core';
import {
  SavingGoal,
  daysUntil,
  formatDate,
  getSavingPending,
  getSavingProgress,
  getSavingStatusBadgeVariant,
  getSavingStatusLabel,
} from '../../../../core/models/saving.model';
import { formatCurrency } from '../../../../core/models/account.model';
import { BadgeComponent, BadgeVariant } from '../../atoms/badge/badge';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-saving-goal-card',
  imports: [BadgeComponent, ButtonComponent],
  templateUrl: './saving-goal-card.html',
  styleUrl: './saving-goal-card.scss',
})
export class SavingGoalCardComponent {
  goal = input.required<SavingGoal>();

  contribute = output<SavingGoal>();
  viewHistory = output<SavingGoal>();
  edit = output<SavingGoal>();
  cancelGoal = output<SavingGoal>();

  protected formatCurrency = formatCurrency;

  protected readonly isActive = computed(() => this.goal().status === 'IN_PROGRESS');
  protected readonly progress = computed(() => getSavingProgress(this.goal()));
  protected readonly pending = computed(() => getSavingPending(this.goal()));
  protected readonly statusLabel = computed(() => getSavingStatusLabel(this.goal().status));
  protected readonly statusVariant = computed(() => getSavingStatusBadgeVariant(this.goal().status));

  protected readonly theme = computed(() => {
    switch (this.goal().status) {
      case 'COMPLETED':
        return { gradient: 'from-emerald-500 to-teal-600', bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' };
      case 'CANCELLED':
        return { gradient: 'from-slate-400 to-slate-500', bar: 'bg-slate-400', icon: 'bg-slate-100 text-slate-500' };
      default:
        return { gradient: 'from-indigo-500 to-purple-600', bar: 'bg-indigo-500', icon: 'bg-indigo-50 text-indigo-600' };
    }
  });

  protected readonly deadline = computed<{ text: string; variant: BadgeVariant }>(() => {
    const g = this.goal();
    if (g.status === 'COMPLETED') return { text: 'Meta cumplida', variant: 'success' };
    if (g.status === 'CANCELLED') return { text: 'Cancelada', variant: 'neutral' };

    const days = daysUntil(g.targetDate);
    if (days === null) return { text: 'Sin fecha objetivo', variant: 'neutral' };
    if (days < 0) return { text: `Vencida hace ${-days} día${-days === 1 ? '' : 's'}`, variant: 'danger' };
    if (days === 0) return { text: 'Vence hoy', variant: 'warning' };
    if (days <= 30) return { text: `Vence en ${days} día${days === 1 ? '' : 's'}`, variant: 'warning' };
    return { text: `Meta: ${formatDate(g.targetDate)}`, variant: 'info' };
  });
}
