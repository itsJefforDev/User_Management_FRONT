import { Component, input, inject, signal } from '@angular/core';
import { SidebarComponent } from '../../organisms/sidebar/sidebar';
import { FooterComponent } from '../../organisms/footer/footer';
import { EditProfileModalComponent } from '../../organisms/edit-profile-modal/edit-profile-modal';
import { AlertComponent } from '../../atoms/alert/alert';
import { AvatarComponent } from '../../atoms/avatar/avatar';
import { BadgeComponent } from '../../atoms/badge/badge';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SidebarService } from '../../../../core/services/sidebar.service';

/**
 * Layout del espacio de trabajo: sidebar expandible + barra superior + contenido.
 * Reemplaza al navbar en todas las páginas privadas.
 */
@Component({
  selector: 'app-main-layout',
  imports: [
    SidebarComponent,
    FooterComponent,
    EditProfileModalComponent,
    AlertComponent,
    AvatarComponent,
    BadgeComponent,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  protected readonly notificationService = inject(NotificationService);
  protected readonly authService = inject(AuthService);
  protected readonly sidebar = inject(SidebarService);

  appTitle = input<string>('User Management');

  // El modal vive aquí (fuera del sidebar) para que `fixed` cubra toda la pantalla
  protected readonly showProfileModal = signal<boolean>(false);
}