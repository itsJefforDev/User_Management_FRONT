import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  formatCurrency,
} from '../../../../core/models/account.model';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { AccountCardComponent } from '../../../../shared/ui/molecules/account-card/account-card';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { InputComponent } from '../../../../shared/ui/atoms/input/input';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { AlertComponent } from '../../../../shared/ui/atoms/alert/alert';
import { FormFieldComponent } from '../../../../shared/ui/molecules/form-field/form-field';

@Component({
  selector: 'app-accounts-page',
  imports: [
    CommonModule,
    MainLayoutComponent,
    AccountCardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    AlertComponent,
    FormFieldComponent,
  ],
  templateUrl: './accounts-page.html',
  styleUrl: './accounts-page.scss',
})
export class AccountsPageComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly authService = inject(AuthService);

  // Modales
  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly showEditModal = signal<boolean>(false);

  // Formulario de creación
  protected readonly newName = signal<string>('');
  protected readonly newType = signal<string>('BANK');
  protected readonly newBalance = signal<number>(0);
  protected readonly createLoading = signal<boolean>(false);
  protected readonly createError = signal<string | null>(null);

  // Formulario de edición
  protected readonly editingAccount = signal<Account | null>(null);
  protected readonly editName = signal<string>('');
  protected readonly editType = signal<string>('BANK');
  protected readonly editLoading = signal<boolean>(false);
  protected readonly editError = signal<string | null>(null);

  // Mensaje de notificación
  protected readonly successMessage = signal<string | null>(null);

  ngOnInit() {
    this.accountService.loadAccountsByUser();
  }

  protected onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.accountService.setSearchQuery(val);
  }

  protected setTypeFilter(type: string) {
    this.accountService.setTypeFilter(type);
  }

  protected setStatusFilter(status: string) {
    this.accountService.setStatusFilter(status);
  }

  // ─── Creación ─────────────────────────────────────────────────────────────
  protected openCreateModal() {
    this.newName.set('');
    this.newType.set('BANK');
    this.newBalance.set(0);
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  protected closeCreateModal() {
    this.showCreateModal.set(false);
  }

  protected onNewTypeChange(event: Event) {
    this.newType.set((event.target as HTMLSelectElement).value);
  }

  protected onNewBalanceChange(value: string) {
    const parsed = parseFloat(value);
    this.newBalance.set(isNaN(parsed) ? 0 : parsed);
  }

  protected saveNewAccount() {
    const name = this.newName().trim();
    if (!name) {
      this.createError.set('El nombre de la cuenta es obligatorio.');
      return;
    }

    this.createError.set(null);
    this.createLoading.set(true);

    const request: CreateAccountRequest = {
      name,
      type: this.newType(),
      initialBalance: this.newBalance(),
      userId: this.authService.currentUserId(),
    };

    this.accountService.createAccount(request).subscribe({
      next: (created) => {
        this.createLoading.set(false);
        this.closeCreateModal();
        this.notifySuccess(`Cuenta "${created.name}" creada exitosamente.`);
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(err?.message || 'Error al crear la cuenta bancaria.');
      },
    });
  }

  // ─── Edición ──────────────────────────────────────────────────────────────
  protected onEditAccount(account: Account) {
    this.editingAccount.set(account);
    this.editName.set(account.name);
    this.editType.set(account.type);
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  protected closeEditModal() {
    this.showEditModal.set(false);
    this.editingAccount.set(null);
  }

  protected onEditTypeChange(event: Event) {
    this.editType.set((event.target as HTMLSelectElement).value);
  }

  protected saveEditAccount() {
    const acc = this.editingAccount();
    if (!acc) return;

    const name = this.editName().trim();
    if (!name) {
      this.editError.set('El nombre de la cuenta es obligatorio.');
      return;
    }

    this.editError.set(null);
    this.editLoading.set(true);

    const request: UpdateAccountRequest = {
      name,
      type: this.editType(),
    };

    this.accountService.updateAccount(acc.id, request).subscribe({
      next: (updated) => {
        this.editLoading.set(false);
        this.closeEditModal();
        this.notifySuccess(`Cuenta "${updated.name}" actualizada con éxito.`);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.message || 'Error al actualizar la cuenta.');
      },
    });
  }

  // ─── Desactivación ────────────────────────────────────────────────────────
  protected onDeactivateAccount(account: Account) {
    if (
      !confirm(
        `¿Deseas desactivar la cuenta "${account.name}"?\nSu saldo dejará de computarse en el balance activo.`
      )
    ) {
      return;
    }

    this.accountService.deactivateAccount(account.id).subscribe({
      next: () => {
        this.notifySuccess(`Cuenta "${account.name}" desactivada correctamente.`);
      },
      error: (err) => {
        alert(err?.message || 'Error al desactivar la cuenta.');
      },
    });
  }

  protected reloadAccounts() {
    this.accountService.loadAccountsByUser();
  }

  private notifySuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3500);
  }

  protected formatCurrency = formatCurrency;
}
