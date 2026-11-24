import { Component, input, output } from '@angular/core';
import {
  Income,
  formatDate,
  getIncomeTypeLabel,
  getIncomeTypeBadgeVariant,
} from '../../../../core/models/income.model';
import { formatCurrency } from '../../../../core/models/account.model';
import { BadgeComponent } from '../../atoms/badge/badge';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-income-table',
  imports: [BadgeComponent, ButtonComponent],
  templateUrl: './income-table.html',
  styleUrl: './income-table.scss',
})
export class IncomeTableComponent {
  incomes = input<Income[]>([]);
  loading = input<boolean>(false);

  editIncome = output<Income>();
  deleteIncome = output<Income>();

  protected formatCurrency = formatCurrency;
  protected formatDate = formatDate;
  protected typeLabel = getIncomeTypeLabel;
  protected typeVariant = getIncomeTypeBadgeVariant;
}
