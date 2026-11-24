import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { IncomeTableComponent } from '../../../../shared/ui/organisms/income-table/income-table';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { InputComponent } from '../../../../shared/ui/atoms/input/input';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { AlertComponent } from '../../../../shared/ui/atoms/alert/alert';
import { FormFieldComponent } from '../../../../shared/ui/molecules/form-field/form-field';
import { IncomeService, IncomeSort } from '../../../../core/services/income.service';
import { AccountService } from '../../../../core/services/account.service';
import { CategoryService } from '../../../../core/services/category.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateIncomeRequest,
  INCOME_TYPES,
  Income,
  formatDate,
  todayISO,
} from '../../../../core/models/income.model';
import { formatCurrency } from '../../../../core/models/account.model';

@Component({
  selector: 'app-incomes-page',
  imports: [
    MainLayoutComponent,
    IncomeTableComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    AlertComponent,
    FormFieldComponent,
  ],
  templateUrl: './incomes-page.html',
  styleUrl: './incomes-page.scss',
})
export class IncomesPageComponent implements OnInit {
  protected readonly incomeService = inject(IncomeService);
  protected readonly accountService = inject(AccountService);
  protected readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  protected readonly incomeTypes = INCOME_TYPES;
  protected readonly sortOptions: { value: IncomeSort; label: string }[] = [
    { value: 'date_desc', label: 'Más recientes' },
    { value: 'date_asc', label: 'Más antiguos' },
    { value: 'amount_desc', label: 'Mayor valor' },
    { value: 'amount_asc', label: 'Menor valor' },
  ];

  // Modal crear / editar
  readonly showFormModal = signal<boolean>(false);
  readonly editingIncome = signal<Income | null>(null);
  readonly formAmount = signal<string>('');
  readonly formDescription = signal<string>('');
  readonly formDate = signal<string>(todayISO());
  readonly formCategoryId = signal<number | null>(null);
  readonly formAccountId = signal<number | null>(null);
  readonly formType = signal<string>('SALARY');
  readonly formObservations = signal<string>('');
  readonly formError = signal<string | null>(null);
  readonly formLoading = signal<boolean>(false);

  // Modal eliminar
  readonly showDeleteModal = signal<boolean>(false);
  readonly deletingIncome = signal<Income | null>(null);

  // Opciones del formulario (RN-007: solo categorías de ingreso; RN-008: cuenta activa)
  readonly incomeCategories = computed(() => {
    const selected = this.formCategoryId();
    return this.categoryService
      .allCategories()
      .filter(
        (c) =>
          (c.active && ['INCOME', 'BOTH'].includes((c.type || '').toUpperCase())) ||
          c.id === selected
      );
  });

  readonly selectableAccounts = computed(() => {
    const selected = this.formAccountId();
    return this.accountService.allAccounts().filter((a) => a.active || a.id === selected);
  });

  protected readonly monthVariation = computed(() => this.incomeService.monthComparison().variation);

  protected formatCurrency = formatCurrency;
  protected formatDate = formatDate;
  protected readonly maxDate = todayISO();

  protected formatPercent(value: number): string {
    return `${Math.abs(value).toFixed(1)}%`;
  }

  ngOnInit(): void {
    this.accountService.loadAccountsByUser();
    this.categoryService.loadCategories().subscribe();
    this.incomeService.loadIncomes().subscribe();
  }

  reload() {
    this.accountService.loadAccountsByUser();
    this.incomeService.loadIncomes().subscribe();
  }

  // ─── Filtros ─────────────────────────────────────────────────────────────
  onSearch(e: Event) { this.incomeService.setSearch((e.target as HTMLInputElement).value); }
  onCategoryFilter(e: Event) { this.incomeService.setCategoryFilter((e.target as HTMLSelectElement).value); }
  onAccountFilter(e: Event) { this.incomeService.setAccountFilter((e.target as HTMLSelectElement).value); }
  onTypeFilter(e: Event) { this.incomeService.setTypeFilter((e.target as HTMLSelectElement).value); }
  onSort(e: Event) { this.incomeService.setSort((e.target as HTMLSelectElement).value as IncomeSort); }
  onDateFrom(e: Event) { this.incomeService.setDateFrom((e.target as HTMLInputElement).value); }
  onDateTo(e: Event) { this.incomeService.setDateTo((e.target as HTMLInputElement).value); }

  // ─── Crear / Editar ──────────────────────────────────────────────────────
  openCreateModal() {
    this.editingIncome.set(null);
    this.formAmount.set('');
    this.formDescription.set('');
    this.formDate.set(todayISO());
    this.formCategoryId.set(null);
    this.formAccountId.set(null);
    this.formType.set('SALARY');
    this.formObservations.set('');
    this.formError.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(income: Income) {
    // La respuesta del backend solo trae nombres: se resuelven los ids por nombre.
    const category = this.categoryService.allCategories().find((c) => c.name === income.categoryName);
    const account = this.accountService.allAccounts().find((a) => a.name === income.accountName);

    this.editingIncome.set(income);
    this.formAmount.set(String(income.amount));
    this.formDescription.set(income.description);
    this.formDate.set((income.date || '').slice(0, 10));
    this.formCategoryId.set(category?.id ?? null);
    this.formAccountId.set(account?.id ?? null);
    this.formType.set((income.incomeType || 'SALARY').toUpperCase());
    this.formObservations.set(income.observations || '');
    this.formError.set(null);
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
    this.editingIncome.set(null);
    this.formError.set(null);
  }

  onCategoryChange(e: Event) {
    this.formCategoryId.set(Number((e.target as HTMLSelectElement).value) || null);
  }

  onAccountChange(e: Event) {
    this.formAccountId.set(Number((e.target as HTMLSelectElement).value) || null);
  }

  onTypeChange(e: Event) {
    this.formType.set((e.target as HTMLSelectElement).value);
  }

  submitForm() {
    const amount = Number(this.formAmount());
    const description = this.formDescription().trim();
    const date = this.formDate();
    const categoryId = this.formCategoryId();
    const accountId = this.formAccountId();

    // Validaciones (RN-006, RN-007, RN-008, HU-24)
    if (!amount || amount <= 0) return this.formError.set('El valor del ingreso debe ser mayor a cero.');
    if (!description) return this.formError.set('La descripción es obligatoria.');
    if (!date) return this.formError.set('La fecha es obligatoria.');
    if (categoryId === null) return this.formError.set('Selecciona una categoría.');
    if (accountId === null) return this.formError.set('Selecciona la cuenta de destino.');

    const payload: CreateIncomeRequest = {
      amount,
      description,
      date,
      categoryId,
      accountId,
      incomeType: this.formType(),
      observations: this.formObservations().trim() || undefined,
    };

    this.formError.set(null);
    this.formLoading.set(true);

    const editing = this.editingIncome();
    const request$ = editing
      ? this.incomeService.update(editing.id, payload)
      : this.incomeService.create(payload);

    request$.subscribe({
      next: (saved) => {
        this.formLoading.set(false);
        this.closeFormModal();
        this.accountService.loadAccountsByUser();
        this.notificationService.showSuccess(
          editing
            ? `Ingreso "${saved.description}" actualizado correctamente.`
            : `Ingreso "${saved.description}" registrado exitosamente.`,
          editing ? 'Cambios Guardados' : 'Ingreso Registrado'
        );
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.message || 'Error al guardar el ingreso.');
      },
    });
  }

  // ─── Eliminar ────────────────────────────────────────────────────────────
  openDeleteModal(income: Income) {
    this.deletingIncome.set(income);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletingIncome.set(null);
  }

  confirmDelete() {
    const income = this.deletingIncome();
    if (!income) return;

    this.incomeService.delete(income.id).subscribe({
      next: () => {
        this.accountService.loadAccountsByUser();
        this.notificationService.showSuccess(
          `Ingreso "${income.description}" eliminado correctamente.`,
          'Ingreso Eliminado'
        );
        this.closeDeleteModal();
      },
      error: (err) => {
        this.notificationService.showError(err?.message || 'No se pudo eliminar el ingreso.');
        this.closeDeleteModal();
      },
    });
  }
}
