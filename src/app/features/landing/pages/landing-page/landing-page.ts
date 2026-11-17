import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../../shared/ui/organisms/navbar/navbar';
import { FooterComponent } from '../../../../shared/ui/organisms/footer/footer';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge';
import { ButtonComponent } from '../../../../shared/ui/atoms/button/button';
import { AvatarComponent } from '../../../../shared/ui/atoms/avatar/avatar';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    NavbarComponent,
    FooterComponent,
    BadgeComponent,
    ButtonComponent,
    AvatarComponent,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPageComponent {
  protected readonly authService = inject(AuthService);
  protected readonly userService = inject(UserService);
  private readonly router = inject(Router);

  // Reactive auth signals
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly userName = computed(() => this.authService.userDisplayName());
  readonly userRole = computed(() => this.authService.userRole());
  readonly isAdmin = computed(() => this.authService.isAdmin());

  // Interactive showcase state
  readonly activeTab = signal<'rbac' | 'jwt' | 'verification' | 'audit'>('rbac');

  // Preview user list for interactive mockup
  readonly previewUsers = computed(() => this.userService.allUsers().slice(0, 4));

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
