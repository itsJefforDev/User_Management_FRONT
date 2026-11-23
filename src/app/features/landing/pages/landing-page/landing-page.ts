import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../../shared/ui/organisms/navbar/navbar';
import { FooterComponent } from '../../../../shared/ui/organisms/footer/footer';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { AvatarComponent } from '../../../../shared/ui/atoms/avatar/avatar';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    NavbarComponent,
    FooterComponent,
    BadgeComponent,
    AvatarComponent,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPageComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Reactive auth signals
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly userName = computed(() => this.authService.userDisplayName());
  readonly userRole = computed(() => this.authService.userRole());
  readonly isAdmin = computed(() => this.authService.isAdmin());

  // Interactive showcase state
  readonly activeTab = signal<'rbac' | 'jwt' | 'verification' | 'audit'>('rbac');

  /**
   * Datos de demostración para el mockup de la landing.
   * No consume el endpoint real (que requiere autenticación ADMIN).
   */
  readonly previewUsers: User[] = [
    { id: 1, name: 'Sofia Gomez', email: 'sofia.gomez@empresa.com', roles: ['ADMIN'], status: 'ACTIVE', createdAt: '2026-01-15' },
    { id: 2, name: 'Carlos Mendoza', email: 'carlos.mendoza@empresa.com', roles: ['ROLE_USER'], status: 'ACTIVE', createdAt: '2026-02-10' },
    { id: 3, name: 'Laura Restrepo', email: 'laura.restrepo@empresa.com', roles: ['ROLE_USER'], status: 'INACTIVE', createdAt: '2026-03-01' },
    { id: 4, name: 'Mateo Morales', email: 'mateo.morales@empresa.com', roles: ['ROLE_USER'], status: 'LOCKED', createdAt: '2026-03-12' },
  ];

  /** Helper para obtener el rol principal a mostrar en la tabla del mockup */
  getPrimaryRole(roles: string[]): string {
    if (!roles || roles.length === 0) return 'ROLE_USER';
    if (roles.includes('ADMIN')) return 'ADMIN';
    return roles[0];
  }

  setTab(tab: 'rbac' | 'jwt' | 'verification' | 'audit') {
    this.activeTab.set(tab);
  }

  goToDashboard() {
    if (this.isAdmin()) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/user']);
    }
  }

  goToUsersManagement() {
    this.router.navigate(['/users-management']);
  }
}
