import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  User,
  UserStatus,
  CreateUserRequest,
  UpdateUserRequest,
  getPrimaryRole,
} from '../../../../core/models/user.model';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { SearchBarComponent } from '../../../../shared/ui/molecules/search-bar/search-bar';
import { FormFieldComponent } from '../../../../shared/ui/molecules/form-field/form-field';
import { UserTableComponent } from '../../../../shared/ui/organisms/user-table/user-table';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { InputComponent } from '../../../../shared/ui/atoms/input/input';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { AlertComponent } from '../../../../shared/ui/atoms/alert/alert';

@Component({
  selector: 'app-users-page',
  imports: [
    MainLayoutComponent,
    SearchBarComponent,
    FormFieldComponent,
    UserTableComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    AlertComponent,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPageComponent implements OnInit {
  protected readonly userService = inject(UserService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Modal de creación
  protected showCreateModal = signal(false);
  protected newUserName = signal('');
  protected newUserEmail = signal('');
  protected newUserPassword = signal('');
  protected newUserRoles = signal<string[]>(['ROLE_USER']);
  protected createError = signal<string | null>(null);
  protected createLoading = signal(false);

  // Modal de edición
  protected showEditModal = signal(false);
  protected editingUser = signal<User | null>(null);
  protected editName = signal('');
  protected editStatus = signal<UserStatus>('ACTIVE');
  protected editRoles = signal<string[]>(['ROLE_USER']);
  protected editError = signal<string | null>(null);
  protected editLoading = signal(false);

  // Mensaje de éxito temporal
  protected successMessage = signal<string | null>(null);

  ngOnInit() {
    // Verificar que el usuario sea ADMIN
    if (this.authService.isAdmin()) {
      this.router.navigate(['/user']);
      return;
    }
    // Cargar todos los usuarios del backend
    this.userService.loadUsers();
  }

  protected onSearch(query: string) {
    this.userService.setSearchQuery(query);
  }

  // ─── Crear usuario (Modal) ────────────────────────────────────────

  protected toggleCreateModal(open: boolean) {
    this.showCreateModal.set(open);
    if (!open) {
      this.newUserName.set('');
      this.newUserEmail.set('');
      this.newUserPassword.set('');
      this.newUserRoles.set(['ROLE_USER']);
      this.createError.set(null);
    }
  }

  protected onCreateRoleChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.newUserRoles.set([val]);
  }

  protected saveUser() {
    const name = this.newUserName().trim();
    const email = this.newUserEmail().trim();
    const password = this.newUserPassword().trim();

    if (!name || !email || !password) {
      this.createError.set('Todos los campos son obligatorios.');
      return;
    }

    this.createError.set(null);
    this.createLoading.set(true);

    const request: CreateUserRequest = {
      name,
      email,
      password,
      roles: this.newUserRoles(),
    };

    this.userService.createUser(request).subscribe({
      next: (created) => {
        this.createLoading.set(false);
        this.toggleCreateModal(false);
        this.showSuccess(`Usuario "${created.name}" creado exitosamente.`);
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(err.message);
      },
    });
  }

  // ─── Editar usuario (Modal) ───────────────────────────────────────

  protected onEditUser(user: User) {
    this.editingUser.set(user);
    this.editName.set(user.name);
    this.editStatus.set(user.status);
    this.editRoles.set(user.roles?.length ? [...user.roles] : ['ROLE_USER']);
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  protected closeEditModal() {
    this.showEditModal.set(false);
    this.editingUser.set(null);
    this.editError.set(null);
  }

  protected onEditRoleChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.editRoles.set([val]);
  }

  protected onEditStatusChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as UserStatus;
    this.editStatus.set(val);
  }

  protected saveEdit() {
    const user = this.editingUser();
    if (!user) return;

    const name = this.editName().trim();
    if (!name) {
      this.editError.set('El nombre es obligatorio.');
      return;
    }

    this.editError.set(null);
    this.editLoading.set(true);

    const request: UpdateUserRequest = {
      name,
      status: this.editStatus(),
      roles: this.editRoles(),
    };

    this.userService.updateUser(user.id, request).subscribe({
      next: (updated) => {
        this.editLoading.set(false);
        this.closeEditModal();
        this.showSuccess(`Usuario "${updated.name}" actualizado correctamente.`);
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.message);
      },
    });
  }

  // ─── Eliminar usuario ─────────────────────────────────────────────

  protected onDeleteUser(user: User) {
    if (
      !confirm(
        `¿Estás seguro de desactivar al usuario "${user.name}"?\n\nEsto cambiará su estado a INACTIVE.`
      )
    )
      return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.showSuccess(
          `Usuario "${user.name}" desactivado correctamente.`
        );
      },
      error: (err) => {
        alert(`Error: ${err.message}`);
      },
    });
  }

  // ─── Recargar lista ───────────────────────────────────────────────

  protected reloadUsers() {
    this.userService.loadUsers();
  }

  // ─── Helper: mensaje de éxito temporal ────────────────────────────

  private showSuccess(msg: string) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), 3500);
  }

  protected getPrimaryRole = getPrimaryRole;
}
