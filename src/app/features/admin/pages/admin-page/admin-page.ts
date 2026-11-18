import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MainLayoutComponent } from '../../../../shared/ui/templates/main-layout/main-layout';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';

@Component({
  selector: 'app-admin-page',
  imports: [MainLayoutComponent, BadgeComponent, ButtonComponent],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPageComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  handleLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToUserManagement() {
    this.router.navigate(['/users-management']);
  }
}
