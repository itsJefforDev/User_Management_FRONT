import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { SavingGoalCardComponent } from '../../../../shared/ui/molecules/saving-goal-card/saving-goal-card';
import { FormFieldComponent } from '../../../../shared/ui/molecules/form-field/form-field';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { InputComponent } from '../../../../shared/ui/atoms/input/input';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { AlertComponent } from '../../../../shared/ui/atoms/alert/alert';
import { SavingService } from '../../../../core/services/saving.service';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateContributionRequest,
  CreateSavingGoalRequest,
  SavingContribution,
  SavingGoal,
  SavingStatus,
  UpdateSavingGoalRequest,
  formatDate,
  getSavingPending,
  todayISO,
} from '../../../../core/models/saving.model';
import { formatCurrency } from '../../../../core/models/account.model';

@Component({
  selector: 'app-savings-page',
  imports: [
    MainLayoutComponent,
    SavingGoalCardComponent,
    FormFieldComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    AlertComponent,
  ],
  templateUrl: './savings-page.html',
  styleUrl: './savings-page.scss',
})
export class SavingsPageComponent implements OnInit {
  protected readonly savingService = inject(SavingService);
  protected readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

protected readonly statusFilters: { value: 'ALL' | SavingStatus; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

  protected formatCurrency = formatCurrency;
  protected formatDate = formatDate;

  // Modal crear / editar meta
  readonly showGoalModal = signal<boolean>(false);
  readonly editingGoal = signal<SavingGoal | null>(null);
  readonly goalName = signal<string>('');
  readonly goalDescription = signal<string>('');
  readonly goalTarget = signal<string>('');
  readonly goalDate = signal<string>('');
  readonly goalError = signal<string | null>(null);
  readonly goalLoading = signal<boolean>(false);

  // Modal aporte
  readonly showContribModal = signal<boolean>(false);
  readonly contribGoal = signal<SavingGoal | null>(null);
  readonly contribAmount = signal<string>('');
  readonly contribDate = signal<string>(todayISO());
  readonly contribAccountId = signal<number | null>(null);
  readonly contribNotes = signal<string>('');
  readonly contribError = signal<string | null>(null);
  readonly contribLoading = signal<boolean>(false);

  // Modal historial
  readonly showHistoryModal = signal<boolean>(false);
  readonly historyGoal = signal<SavingGoal | null>(null);
  readonly historyItems = signal<SavingContribution[]>([]);
  readonly historyLoading = signal<boolean>(false);
  readonly historyError = signal<string | null>(null);

  // Modal cancelar meta
  readonly showCancelModal = signal<boolean>(false);
  readonly cancellingGoal = signal<SavingGoal | null>(null);

  readonly activeAccounts = computed(() => this.accountService.allAccounts().filter((a) => a.active));

  readonly contribPending = computed(() => {
    const goal = this.contribGoal();
    return goal ? getSavingPending(goal) : 0;
  });

  readonly historyTotal = computed(() =>
    this.historyItems().reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  );

  ngOnInit(): void {
    this.accountService.loadAccountsByUser();
    this.savingService.loadGoals().subscribe();
  }

  reload() {
    this.accountService.loadAccountsByUser();
    this.savingService.loadGoals().subscribe();
  }

  onSearch(e: Event) {
    this.savingService.setSearch((e.target as HTMLInputElement).value);
  }

  // ─── Crear / Editar meta ─────────────────────────────────────────────────
  openCreateGoal() {
    this.editingGoal.set(null);
    this.goalName.set('');
    this.goalDescription.set('');
    this.goalTarget.set('');
    this.goalDate.set('');
    this.goalError.set(null);
    this.showGoalModal.set(true);
  }

  openEditGoal(goal: SavingGoal) {
    this.editingGoal.set(goal);
    this.goalName.set(goal.name);
    this.goalDescription.set(goal.description || '');
    this.goalTarget.set(String(goal.targetAmount));
    this.goalDate.set((goal.targetDate || '').slice(0, 10));
    this.goalError.set(null);
    this.showGoalModal.set(true);
  }

  closeGoalModal() {
    this.showGoalModal.set(false);
    this.editingGoal.set(null);
    this.goalError.set(null);
  }

  submitGoal() {
    const name = this.goalName().trim();
    const target = Number(this.goalTarget());
    const date = this.goalDate();
    const editing = this.editingGoal();

    // Validaciones (RN-009, HU-14)
    if (!name) return this.goalError.set('El nombre de la meta es obligatorio.');
    if (!target || target <= 0) return this.goalError.set('El monto objetivo debe ser mayor a cero.');
    if (!date) return this.goalError.set('La fecha objetivo es obligatoria.');
    if ((!editing || date !== (editing.targetDate || '').slice(0, 10)) && date <= todayISO()) {
      return this.goalError.set('La fecha objetivo debe ser posterior a la fecha actual.');
    }
    if (editing && target <= Number(editing.currentAmount)) {
      return this.goalError.set(
        `El monto objetivo debe ser mayor a lo ya ahorrado (${formatCurrency(editing.currentAmount)}).`
      );
    }

    this.goalError.set(null);
    this.goalLoading.set(true);
    const description = this.goalDescription().trim() || undefined;

    const request$ = editing
      ? this.savingService.updateGoal(editing.id, {
          name,
          description,
          targetAmount: target,
          targetDate: date,
          status: editing.status,
        } as UpdateSavingGoalRequest)
      : this.savingService.createGoal({
          name,
          description,
          targetAmount: target,
          targetDate: date,
          userId: this.authService.currentUserId(),
        } as CreateSavingGoalRequest);

    request$.subscribe({
      next: (saved) => {
        this.goalLoading.set(false);
        this.closeGoalModal();
        this.notificationService.showSuccess(
          editing
            ? `Meta "${saved.name}" actualizada correctamente.`
            : `Meta "${saved.name}" creada. ¡A ahorrar!`,
          editing ? 'Cambios Guardados' : 'Meta Creada'
        );
      },
      error: (err) => {
        this.goalLoading.set(false);
        this.goalError.set(err?.message || 'Error al guardar la meta.');
      },
    });
  }

  // ─── Aportes ─────────────────────────────────────────────────────────────
  openContribution(goal: SavingGoal) {
    this.contribGoal.set(goal);
    this.contribAmount.set('');
    this.contribDate.set(todayISO());
    this.contribAccountId.set(null);
    this.contribNotes.set('');
    this.contribError.set(null);
    this.showContribModal.set(true);
  }

  closeContribModal() {
    this.showContribModal.set(false);
    this.contribGoal.set(null);
    this.contribError.set(null);
  }

  onContribAccountChange(e: Event) {
    this.contribAccountId.set(Number((e.target as HTMLSelectElement).value) || null);
  }

  fillPending() {
    this.contribAmount.set(String(this.contribPending()));
  }

  submitContribution() {
    const goal = this.contribGoal();
    if (!goal) return;

    const amount = Number(this.contribAmount());
    const date = this.contribDate();
    const pending = this.contribPending();

    // Validaciones (RN-006, RN-010)
    if (!amount || amount <= 0) return this.contribError.set('El aporte debe ser mayor a cero.');
    if (amount > pending) {
      return this.contribError.set(
        `El aporte no puede superar el monto pendiente (${formatCurrency(pending)}).`
      );
    }
    if (!date) return this.contribError.set('La fecha del aporte es obligatoria.');
    if (date > todayISO()) return this.contribError.set('La fecha del aporte no puede ser posterior a hoy.');

    const request: CreateContributionRequest = {
      amount,
      date,
      notes: this.contribNotes().trim() || undefined,
      savingGoalId: goal.id,
      accountId: this.contribAccountId(),
    };

    this.contribError.set(null);
    this.contribLoading.set(true);

    this.savingService.addContribution(request).subscribe({
      next: () => {
        this.contribLoading.set(false);
        this.closeContribModal();
        this.accountService.loadAccountsByUser();

        const updated = this.savingService.allGoals().find((g) => g.id === goal.id);
        if (updated?.status === 'COMPLETED') {
          this.notificationService.showSuccess(
            `¡Felicitaciones! Cumpliste tu meta "${goal.name}".`,
            'Meta Cumplida 🎉'
          );
        } else {
          this.notificationService.showSuccess(
            `Aporte de ${formatCurrency(amount)} registrado en "${goal.name}".`,
            'Aporte Registrado'
          );
        }
      },
      error: (err) => {
        this.contribLoading.set(false);
        this.contribError.set(err?.message || 'Error al registrar el aporte.');
      },
    });
  }

  // ─── Historial ───────────────────────────────────────────────────────────
  openHistory(goal: SavingGoal) {
    this.historyGoal.set(goal);
    this.historyItems.set([]);
    this.historyError.set(null);
    this.historyLoading.set(true);
    this.showHistoryModal.set(true);

    this.savingService.loadContributions(goal.id).subscribe({
      next: (list) => {
        this.historyItems.set(
          [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        );
        this.historyLoading.set(false);
      },
      error: (err) => {
        this.historyError.set(err?.message || 'No se pudo cargar el historial.');
        this.historyLoading.set(false);
      },
    });
  }

  closeHistory() {
    this.showHistoryModal.set(false);
    this.historyGoal.set(null);
  }

  // ─── Cancelar meta ───────────────────────────────────────────────────────
  openCancelModal(goal: SavingGoal) {
    this.cancellingGoal.set(goal);
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.cancellingGoal.set(null);
  }

  confirmCancel() {
    const goal = this.cancellingGoal();
    if (!goal) return;

    this.savingService.cancelGoal(goal).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `La meta "${goal.name}" fue cancelada. Su historial se conserva.`,
          'Meta Cancelada'
        );
        this.closeCancelModal();
      },
      error: (err) => {
        this.notificationService.showError(err?.message || 'No se pudo cancelar la meta.');
        this.closeCancelModal();
      },
    });
  }
}
