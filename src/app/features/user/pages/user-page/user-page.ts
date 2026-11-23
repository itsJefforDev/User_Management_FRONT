import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';

@Component({
  selector: 'app-user-page',
  imports: [MainLayoutComponent, BadgeComponent, ButtonComponent],
  templateUrl: './user-page.html',
  styleUrl: './user-page.scss',
})
export class UserPageComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    const isDenied = this.route.snapshot.queryParamMap.get('accessDenied');
    if (isDenied === 'true' && !this.notificationService.currentAlert()) {
      this.notificationService.showWarning(
        'Acceso Restringido: El módulo al que intentaste acceder requiere privilegios de Administrador. Has sido dirigido a tu portal personal.',
        'Advertencia de Seguridad'
      );
    }
  }

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
