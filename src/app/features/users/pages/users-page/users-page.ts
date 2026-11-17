import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../core/services/user.service';
import { User, UserRole, UserStatus } from '../../../../core/models/user.model';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { SearchBarComponent } from '../../../../shared/ui/molecules/search-bar/search-bar';
import { FormFieldComponent } from '../../../../shared/ui/molecules/form-field/form-field';
import { UserTableComponent } from '../../../../shared/ui/organisms/user-table/user-table';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { InputComponent } from '../../../../shared/ui/atoms/input/input';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';

@Component({
  selector: 'app-users-page',
  imports: [
    CommonModule,
    MainLayoutComponent,
    SearchBarComponent,
    FormFieldComponent,
    UserTableComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPageComponent {
  protected readonly userService = inject(UserService);

  protected showCreateModal = signal(false);
  protected newUserName = signal('');
  protected newUserEmail = signal('');
  protected newUserRole = signal<UserRole>('Viewer');

  protected onSearch(query: string) {
    this.userService.setSearchQuery(query);
  }

  protected toggleCreateModal(open: boolean) {
    this.showCreateModal.set(open);
    if (!open) {
      this.newUserName.set('');
      this.newUserEmail.set('');
      this.newUserRole.set('Viewer');
    }
  }

  protected onRoleChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as UserRole;
    this.newUserRole.set(val);
  }

  protected saveUser() {
    if (!this.newUserName() || !this.newUserEmail()) return;

    this.userService.addUser({
      name: this.newUserName(),
      email: this.newUserEmail(),
      role: this.newUserRole(),
      status: 'active' as UserStatus,
    });

    this.toggleCreateModal(false);
  }

  protected onEditUser(user: User) {
    alert(`Editar usuario: ${user.name}`);
  }

  protected onDeleteUser(user: User) {
    if (confirm(`¿Estás seguro de eliminar al usuario ${user.name}?`)) {
      this.userService.deleteUser(user.id);
    }
  }
}
