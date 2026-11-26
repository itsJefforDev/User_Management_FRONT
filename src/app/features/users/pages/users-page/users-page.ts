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

  // Opciones de vigencia de la contraseña temporal (el backend acepta 1-720 horas)
  protected readonly durationOptions = [
    { hours: 1, label: '1 hora' },
    { hours: 6, label: '6 horas' },
    { hours: 24, label: '24 horas' },
    { hours: 48, label: '48 horas' },
    { hours: 72, label: '3 días' },
    { hours: 168, label: '7 días' },
  ];

  // Modal de creación
  protected showCreateModal = signal(false);
  protected newUserName = signal('');
  protected newUserEmail = signal('');
  protected newUserPassword = signal(''); // Contraseña temporal generada con el botón
  protected newUserTempHours = signal(24);
  protected newUserSendActivation = signal(false);
  protected newUserRoles = signal<string[]>(['ROLE_USER']);
  protected createError = signal<string | null>(null);
  protected createLoading = signal(false);
  protected generatingPassword = signal(false);

  // Modal de edición
  protected showEditModal = signal(false);
  protected editingUser = signal<User | null>(null);
  protected editName = signal('');
  protected editStatus = signal<UserStatus>('ACTIVE');
  protected editRoles = signal<string[]>(['ROLE_USER']);
  protected editNewPassword = signal(''); // Nueva contraseña temporal (opcional)
  protected editTempHours = signal(24);
  protected editError = signal<string | null>(null);
  protected editLoading = signal(false);

  // Mensaje de éxito temporal
  protected successMessage = signal<string | null>(null);

  ngOnInit() {
    // Verificar que el usuario sea ADMIN
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/user']);
      return;
    }
    // Cargar todos los usuarios del backend
    this.userService.loadUsers();
  }

  protected onSearch(query: string) {
    this.userService.setSearchQuery(query);
  }

  /** Etiqueta legible de una vigencia en horas. */
  protected durationLabel(hours: number): string {
    return this.durationOptions.find((o) => o.hours === hours)?.label ?? `${hours} horas`;
  }

  //Crear usuario (Modal)

  protected toggleCreateModal(open: boolean) {
    this.showCreateModal.set(open);
    if (!open) {
      this.newUserName.set('');
      this.newUserEmail.set('');
      this.newUserPassword.set('');
      this.newUserTempHours.set(24);
      this.newUserSendActivation.set(false);
      this.newUserRoles.set(['ROLE_USER']);
      this.createError.set(null);
    }
  }

  protected onCreateRoleChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.newUserRoles.set([val]);
  }

  protected onCreateHoursChange(event: Event) {
    this.newUserTempHours.set(Number((event.target as HTMLSelectElement).value));
  }

  /** Botón "Generar": pide al backend una contraseña temporal aleatoria de 8 dígitos. */
  protected generateCreatePassword() {
    this.generatingPassword.set(true);
    this.createError.set(null);

    this.userService.generateTemporaryPassword().subscribe({
      next: (password) => {
        this.newUserPassword.set(password);
        this.generatingPassword.set(false);
      },
      error: (err) => {
        this.createError.set(err.message);
        this.generatingPassword.set(false);
      },
    });
  }

  protected saveUser() {
    const name = this.newUserName().trim();
    const email = this.newUserEmail().trim();
    const password = this.newUserPassword();

    if (!name || !email) {
      this.createError.set('El nombre y el correo son obligatorios.');
      return;
    }
    if (!password) {
      this.createError.set('Genera la contraseña temporal con el botón "Generar".');
      return;
    }

    this.createError.set(null);
    this.createLoading.set(true);

    const hours = this.newUserTempHours();
    const sendActivation = this.newUserSendActivation();

    // El usuario nace INACTIVO con contraseña temporal; el backend define el estado
    const request: CreateUserRequest = {
      name,
      email,
      password,
      roles: this.newUserRoles(),
      temporaryPasswordHours: hours,
    };

    this.userService.createUser(request).subscribe({
      next: (created) => {
        this.createLoading.set(false);
        this.toggleCreateModal(false);

        const base =
          `Usuario "${created.name}" creado como INACTIVO. ` +
          `Contraseña temporal: ${password} (vigencia: ${this.durationLabel(hours)}).`;

        if (!sendActivation) {
          this.showSuccess(base, 15000);
          return;
        }

        // Envío opcional del correo de activación al crear
        this.userService.sendActivationEmail(created.id).subscribe({
          next: () => this.showSuccess(`${base} Correo de activación enviado.`, 15000),
          error: (err) => this.showSuccess(`${base} ${err.message}`, 15000),
        });
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(err.message);
      },
    });
  }

  //Editar usuario (Modal)

  protected onEditUser(user: User) {
    this.editingUser.set(user);
    this.editName.set(user.name);
    this.editStatus.set(user.status);
    this.editRoles.set(user.roles?.length ? [...user.roles] : ['ROLE_USER']);
    this.editNewPassword.set('');
    this.editTempHours.set(24);
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

  protected onEditHoursChange(event: Event) {
    this.editTempHours.set(Number((event.target as HTMLSelectElement).value));
  }

  /** Botón "Generar" del modal de edición: nueva contraseña temporal aleatoria. */
  protected generateEditPassword() {
    this.generatingPassword.set(true);
    this.editError.set(null);

    this.userService.generateTemporaryPassword().subscribe({
      next: (password) => {
        this.editNewPassword.set(password);
        this.generatingPassword.set(false);
      },
      error: (err) => {
        this.editError.set(err.message);
        this.generatingPassword.set(false);
      },
    });
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

    const newPassword = this.editNewPassword();

    // Cambiar el estado a ACTIVE activa la cuenta manualmente (sin correo de activación)
    const request: UpdateUserRequest = {
      name,
      status: this.editStatus(),
      roles: this.editRoles(),
      ...(newPassword
        ? { password: newPassword, temporaryPasswordHours: this.editTempHours() }
        : {}),
    };

    this.userService.updateUser(user.id, request).subscribe({
      next: (updated) => {
        this.editLoading.set(false);
        this.closeEditModal();
        this.showSuccess(
          newPassword
            ? `Usuario "${updated.name}" actualizado. Contraseña temporal: ${newPassword} (vigencia: ${this.durationLabel(request.temporaryPasswordHours!)}).`
            : `Usuario "${updated.name}" actualizado correctamente.`,
          newPassword ? 15000 : 3500,
        );
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.message);
      },
    });
  }

  //Activación por correo (cuentas inactivas)

  protected onActivateUser(user: User) {
    if (!confirm(`¿Enviar el correo de activación a "${user.email}"?`)) return;

    this.userService.sendActivationEmail(user.id).subscribe({
      next: () => this.showSuccess(`Correo de activación enviado a ${user.email}.`),
      error: (err) => alert(`Error: ${err.message}`),
    });
  }

  //Eliminar usuario

  protected onDeleteUser(user: User) {
    if (
      !confirm(
        `¿Estás seguro de desactivar al usuario "${user.name}"?\n\nEsto cambiará su estado a INACTIVE.`,
      )
    )
      return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.showSuccess(`Usuario "${user.name}" desactivado correctamente.`);
      },
      error: (err) => {
        alert(`Error: ${err.message}`);
      },
    });
  }

  //Recargar lista

  protected reloadUsers() {
    this.userService.loadUsers();
  }

  //Helper: mensaje de éxito temporal (ms configurable para mensajes con la contraseña)

  private showSuccess(msg: string, ms = 3500) {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(null), ms);
  }

  protected getPrimaryRole = getPrimaryRole;

  //Eliminar permanentemente usuario

  protected onPermanentDeleteUser(user: User) {
    if (
      !confirm(
        `⚠️ ADVERTENCIA: ¿Estás seguro de ELIMINAR PERMANENTEMENTE al usuario "${user.name}" (${user.email})?\n\nEsta acción borrará el registro de la base de datos y NO se puede deshacer.`,
      )
    )
      return;

    this.userService.permanentDeleteUser(user.id).subscribe({
      next: () => {
        this.showSuccess(`Usuario "${user.name}" eliminado permanentemente de la base de datos.`);
      },
      error: (err) => {
        alert(`Error: ${err.message}`);
      },
    });
  }
}
