import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { ExpenseTableComponent } from '../../../../shared/ui/organisms/expense-table/expense-table';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { InputComponent } from '../../../../shared/ui/atoms/input/input';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { AlertComponent } from '../../../../shared/ui/atoms/alert/alert';
import { FormFieldComponent } from '../../../../shared/ui/molecules/form-field/form-field';
import { ExpenseService, ExpenseSort } from '../../../../core/services/expense.service';
import { AccountService } from '../../../../core/services/account.service';
import { CategoryService } from '../../../../core/services/category.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateExpenseRequest,
  EXPENSE_TYPES,
  Expense,
  formatDate,
  todayISO,
} from '../../../../core/models/expense.model';
import { formatCurrency } from '../../../../core/models/account.model';

@Component({
  selector: 'app-expenses-page',
  imports: [
    MainLayoutComponent,
    ExpenseTableComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    AlertComponent,
    FormFieldComponent,
  ],
  templateUrl: './expenses-page.html',
  styleUrl: './expenses-page.scss',
})
export class ExpensesPageComponent implements OnInit {
  protected readonly expenseService = inject(ExpenseService);
  protected readonly accountService = inject(AccountService);
  protected readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  protected readonly expenseTypes = EXPENSE_TYPES;
  protected readonly sortOptions: { value: ExpenseSort; label: string }[] = [
    { value: 'date_desc', label: 'Más recientes' },
    { value: 'date_asc', label: 'Más antiguos' },
    { value: 'amount_desc', label: 'Mayor valor' },
    { value: 'amount_asc', label: 'Menor valor' },
  ];

  // Modal crear / editar
  readonly showFormModal = signal<boolean>(false);
  readonly editingExpense = signal<Expense | null>(null);
  readonly formAmount = signal<string>('');
  readonly formDescription = signal<string>('');
  readonly formDate = signal<string>(todayISO());
  readonly formCategoryId = signal<number | null>(null);
  readonly formAccountId = signal<number | null>(null);
  readonly formType = signal<string>('VARIABLE');
  readonly formObservations = signal<string>('');
  readonly formError = signal<string | null>(null);
  readonly formLoading = signal<boolean>(false);

  // Modal eliminar
  readonly showDeleteModal = signal<boolean>(false);
  readonly deletingExpense = signal<Expense | null>(null);

  // Opciones del formulario (RN-007: solo categorías de gasto; RN-008: cuenta activa)
  readonly expenseCategories = computed(() => {
    const selected = this.formCategoryId();
    return this.categoryService
      .allCategories()
      .filter(
        (c) =>
          (c.active && ['EXPENSE', 'BOTH'].includes((c.type || '').toUpperCase())) ||
          c.id === selected
      );
  });

  readonly selectableAccounts = computed(() => {
    const selected = this.formAccountId();
    return this.accountService.allAccounts().filter((a) => a.active || a.id === selected);
  });

  protected readonly monthVariation = computed(() => this.expenseService.monthComparison().variation);

  protected formatCurrency = formatCurrency;
  protected formatDate = formatDate;
  protected readonly maxDate = todayISO();

  protected formatPercent(value: number): string {
    return `${Math.abs(value).toFixed(1)}%`;
  }

  ngOnInit(): void {
    this.accountService.loadAccountsByUser();
    this.categoryService.loadCategories().subscribe();
    this.expenseService.loadExpenses().subscribe();
  }

  reload() {
    this.accountService.loadAccountsByUser();
    this.expenseService.loadExpenses().subscribe();
  }

  // ─── Filtros ─────────────────────────────────────────────────────────────
  onSearch(e: Event) { this.expenseService.setSearch((e.target as HTMLInputElement).value); }
  onCategoryFilter(e: Event) { this.expenseService.setCategoryFilter((e.target as HTMLSelectElement).value); }
  onAccountFilter(e: Event) { this.expenseService.setAccountFilter((e.target as HTMLSelectElement).value); }
  onTypeFilter(e: Event) { this.expenseService.setTypeFilter((e.target as HTMLSelectElement).value); }
  onSort(e: Event) { this.expenseService.setSort((e.target as HTMLSelectElement).value as ExpenseSort); }
  onDateFrom(e: Event) { this.expenseService.setDateFrom((e.target as HTMLInputElement).value); }
  onDateTo(e: Event) { this.expenseService.setDateTo((e.target as HTMLInputElement).value); }

  // ─── Crear / Editar ──────────────────────────────────────────────────────
  openCreateModal() {
    this.editingExpense.set(null);
    this.formAmount.set('');
    this.formDescription.set('');
    this.formDate.set(todayISO());
    this.formCategoryId.set(null);
    this.formAccountId.set(null);
    this.formType.set('VARIABLE');
    this.formObservations.set('');
    this.formError.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(expense: Expense) {
    // La respuesta del backend solo trae nombres: se resuelven los ids por nombre.
    const category = this.categoryService.allCategories().find((c) => c.name === expense.categoryName);
    const account = this.accountService.allAccounts().find((a) => a.name === expense.accountName);

    this.editingExpense.set(expense);
    this.formAmount.set(String(expense.amount));
    this.formDescription.set(expense.description);
    this.formDate.set((expense.date || '').slice(0, 10));
    this.formCategoryId.set(category?.id ?? null);
    this.formAccountId.set(account?.id ?? null);
    this.formType.set((expense.expenseType || 'VARIABLE').toUpperCase());
    this.formObservations.set(expense.observations || '');
    this.formError.set(null);
    this.showFormModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
    this.editingExpense.set(null);
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

    // Validaciones (RN-006, RN-007, RN-008, HU-22)
    if (!amount || amount <= 0) return this.formError.set('El valor del gasto debe ser mayor a cero.');
    if (!description) return this.formError.set('La descripción es obligatoria.');
    if (!date) return this.formError.set('La fecha es obligatoria.');
    if (date > todayISO()) return this.formError.set('La fecha no puede ser posterior a hoy.');
    if (categoryId === null) return this.formError.set('Selecciona una categoría.');
    if (accountId === null) return this.formError.set('Selecciona la cuenta de origen.');

    const payload: CreateExpenseRequest = {
      amount,
      description,
      date,
      categoryId,
      accountId,
      expenseType: this.formType(),
      observations: this.formObservations().trim() || undefined,
    };

    this.formError.set(null);
    this.formLoading.set(true);

    const editing = this.editingExpense();
    const request$ = editing
      ? this.expenseService.update(editing.id, payload)
      : this.expenseService.create(payload);

    request$.subscribe({
      next: (saved) => {
        this.formLoading.set(false);
        this.closeFormModal();

        // --- LÓGICA DE ACTUALIZACIÓN LOCAL DEL SALDO ---
        if (editing) {
          // Si es edición, primero devolvemos el dinero a la cuenta antigua
          const oldAccount = this.accountService.allAccounts().find((a) => a.name === editing.accountName);
          if (oldAccount) {
            this.accountService.updateLocalBalance(oldAccount.id, Number(editing.amount));
          }
        }
        // Restamos el nuevo gasto a la cuenta seleccionada actualmente
        this.accountService.updateLocalBalance(accountId, -amount);
        // -----------------------------------------------

        this.accountService.loadAccountsByUser();
        this.notificationService.showSuccess(
          editing
            ? `Gasto "${saved.description}" actualizado correctamente.`
            : `Gasto "${saved.description}" registrado exitosamente.`,
          editing ? 'Cambios Guardados' : 'Gasto Registrado'
        );
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.message || 'Error al guardar el gasto.');
      },
    });
  }

  // ─── Eliminar ────────────────────────────────────────────────────────────
  openDeleteModal(expense: Expense) {
    this.deletingExpense.set(expense);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletingExpense.set(null);
  }

  confirmDelete() {
    const expense = this.deletingExpense();
    if (!expense) return;

    this.expenseService.delete(expense.id).subscribe({
      next: () => {
        // --- LÓGICA DE ACTUALIZACIÓN LOCAL DEL SALDO ---
        // Devolvemos el dinero a la cuenta porque el gasto se eliminó
        const account = this.accountService.allAccounts().find((a) => a.name === expense.accountName);
        if (account) {
          this.accountService.updateLocalBalance(account.id, Number(expense.amount));
        }
        // -----------------------------------------------

        this.accountService.loadAccountsByUser();
        this.notificationService.showSuccess(
          `Gasto "${expense.description}" eliminado correctamente.`,
          'Gasto Eliminado'
        );
        this.closeDeleteModal();
      },
      error: (err) => {
        this.notificationService.showError(err?.message || 'No se pudo eliminar el gasto.');
        this.closeDeleteModal();
      },
    });
  }
}