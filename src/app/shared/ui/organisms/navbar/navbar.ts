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
import { ButtonComponent } from '../../atoms/button/button';
import { InputComponent } from '../../atoms/input/input';
import { FormFieldComponent } from '../../molecules/form-field/form-field';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    FormFieldComponent,
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

  // Edit profile form state
  readonly editName = signal<string>('');
  readonly editEmail = signal<string>('');
  readonly editSuccess = signal<boolean>(false);

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

  goToDashboard() {
    this.closeDropdown();
    this.closeMobileMenu();
    if (this.isAdmin()) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/user']);
    }
  }

  goToUsersManagement() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.router.navigate(['/users-management']);
  }

  goToAccounts() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.router.navigate(['/accounts']);
  }

    goToCategories() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.router.navigate(['/categories']);
  }

  goToExpenses() {
  this.closeDropdown();
  this.closeMobileMenu();
  this.router.navigate(['/expenses']);
}

  openEditProfile() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.editName.set(this.userName());
    this.editEmail.set(this.userEmail());
    this.editSuccess.set(false);
    this.showEditProfileModal.set(true);
  }

  closeEditProfile() {
    this.showEditProfileModal.set(false);
    this.editSuccess.set(false);
  }

  saveProfile() {
    const trimmedName = this.editName().trim();
    if (!trimmedName) return;

    this.authService.updateUserProfile({
      name: trimmedName,
      email: this.editEmail().trim() || undefined,
    });

    this.editSuccess.set(true);
    setTimeout(() => {
      this.closeEditProfile();
    }, 900);
  }

  handleLogout() {
    this.closeDropdown();
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
