import { Component, input, output } from '@angular/core';
import { User } from '../../../../core/models/user.model';
import { AvatarComponent } from '../../atoms/avatar/avatar';
import { BadgeComponent } from '../../atoms/badge/badge';
import { ButtonComponent } from '../../atoms/button/button';

@Component({
  selector: 'app-user-table',
  imports: [AvatarComponent, BadgeComponent, ButtonComponent],
  templateUrl: './user-table.html',
  styleUrl: './user-table.scss',
})
export class UserTableComponent {
  users = input<User[]>([]);
  loading = input<boolean>(false);

  editUser = output<User>();
  deleteUser = output<User>();
  /** Envía el correo de activación (solo cuentas inactivas). */
  activateUser = output<User>();
}