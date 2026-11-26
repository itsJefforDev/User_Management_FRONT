import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarComponent } from '../../atoms/avatar/avatar';
import { BadgeComponent } from '../../atoms/badge/badge';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Navbar público.
 * - Sin sesión: navbar tradicional (enlaces + iniciar sesión / registrarse).
 * - Con sesión: solo el botón para entrar al espacio de trabajo y el avatar del usuario.
 *   La navegación entre módulos vive en el sidebar del espacio de trabajo.
 */
@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
    BadgeComponent,
    EditProfileModalComponent,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  title = input<string>('User Management');

  // UI state signals
  readonly isDropdownOpen = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly showEditProfileModal = signal<boolean>(false);

  // Auth computed signals
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly userName = computed(() => this.authService.userDisplayName());
  readonly userEmail = computed(() => this.authService.userEmail());
  readonly userRole = computed(() => this.authService.userRole());
  readonly isAdmin = computed(() => this.authService.isAdmin());

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
      this.isMobileMenuOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen.update((open) => !open);
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  /** Entra al espacio de trabajo (inicio según el rol). */
  goToDashboard() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.router.navigate([this.isAdmin() ? '/admin' : '/user']);
  }

  openEditProfile() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.showEditProfileModal.set(true);
  }

  closeEditProfile() {
    this.showEditProfileModal.set(false);
  }

  handleLogout() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}