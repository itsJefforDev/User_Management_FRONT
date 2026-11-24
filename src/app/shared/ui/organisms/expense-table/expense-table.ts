import { Component, input, output } from '@angular/core';
import {
  Expense,
  formatDate,
  getExpenseTypeLabel,
  getExpenseTypeBadgeVariant,
} from '../../../../core/models/expense.model';
import { formatCurrency } from '../../../../core/models/account.model';
import { BadgeComponent } from '../../atoms/badge/badge';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-expense-table',
  imports: [BadgeComponent, ButtonComponent],
  templateUrl: './expense-table.html',
  styleUrl: './expense-table.scss',
})
export class ExpenseTableComponent {
  expenses = input<Expense[]>([]);
  loading = input<boolean>(false);

  editExpense = output<Expense>();
  deleteExpense = output<Expense>();

  protected formatCurrency = formatCurrency;
  protected formatDate = formatDate;
  protected typeLabel = getExpenseTypeLabel;
  protected typeVariant = getExpenseTypeBadgeVariant;
}
