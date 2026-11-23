import { Component, input, inject } from '@angular/core';
import { NavbarComponent } from '../../organisms/navbar/navbar';
import { FooterComponent } from '../../organisms/footer/footer';
import { AlertComponent } from '../../atoms/alert/alert';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-main-layout',
  imports: [NavbarComponent, FooterComponent, AlertComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  protected readonly notificationService = inject(NotificationService);
  appTitle = input<string>('User Management');
}
