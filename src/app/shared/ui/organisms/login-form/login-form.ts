import { Component, inject, signal, computed, output, input } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginResponse } from '../../../../core/models/auth.model';
import { AuthHeaderComponent } from '../../molecules/auth-header/auth-header';
import { FormFieldComponent } from '../../molecules/form-field/form-field';
import { PasswordInputComponent } from '../../molecules/password-input/password-input';
import { AlertComponent } from '../../atoms/alert/alert';
import { ButtonComponent } from '../../atoms/button/button';
import { InputComponent } from '../../atoms/input/input';

export type LoginStep = 'email' | 'password' | 'not-found';

@Component({
  selector: 'app-login-form',
  imports: [
    AuthHeaderComponent,
    FormFieldComponent,
    PasswordInputComponent,
    AlertComponent,
    ButtonComponent,
    InputComponent,
  ],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginFormComponent {
  private readonly authService = inject(AuthService);

  // Initial email input (if redirected from register or other flow)
  initialEmail = input<string>('');

  // Outputs
  loginSuccess = output<LoginResponse>();
  goToRegister = output<string>();

  // State
  step = signal<LoginStep>('email');
  email = signal<string>('');
  password = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  emailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  protected isEmailValid = computed(() => {
    const raw = this.email().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  });

  protected headerTitle = computed(() => {
    switch (this.step()) {
      case 'password':
        return 'Ingresa tu contraseña';
      case 'not-found':
        return 'Cuenta no encontrada';
      default:
        return 'Iniciar Sesión';
    }
  });

  protected headerSubtitle = computed(() => {
    switch (this.step()) {
      case 'password':
        return 'Ingresa tu contraseña para acceder';
      case 'not-found':
        return 'Verifica tu correo o regístrate en la plataforma';
      default:
        return 'Ingresa tu correo para comenzar';
    }
  });

  ngOnInit() {
    if (this.initialEmail()) {
      this.email.set(this.initialEmail());
    }
  }

  protected onEmailChange(val: string) {
    this.email.set(val);
    this.emailError.set(null);
    this.errorMessage.set(null);
  }

  protected onPasswordChange(val: string) {
    this.password.set(val);
    this.passwordError.set(null);
    this.errorMessage.set(null);
  }

  protected handleEmailSubmit(event: Event) {
    event.preventDefault();
    const emailVal = this.email().trim();

    if (!emailVal) {
      this.emailError.set('El correo electrónico es requerido');
      return;
    }

    if (!this.isEmailValid()) {
      this.emailError.set('Ingresa un correo electrónico válido');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.checkEmailExists(emailVal).subscribe({
      next: (exists) => {
        this.loading.set(false);
        if (exists) {
          this.step.set('password');
        } else {
          this.step.set('not-found');
        }
      },
      error: () => {
        this.loading.set(false);
        // En caso de error de red o no disponible, ofrecer registro
        this.step.set('not-found');
      },
    });
  }

  protected handlePasswordSubmit(event: Event) {
    event.preventDefault();
    const pwd = this.password().trim();

    if (!pwd) {
      this.passwordError.set('La contraseña es requerida');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .login({
        email: this.email().trim(),
        password: pwd,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.loginSuccess.emit(res);
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            err?.error?.message ||
            'Credenciales inválidas. Por favor verifica tu contraseña.';
          this.errorMessage.set(msg);
        },
      });
  }

  protected resetToEmailStep() {
    this.step.set('email');
    this.password.set('');
    this.errorMessage.set(null);
    this.emailError.set(null);
    this.passwordError.set(null);
  }

  protected proceedToRegister() {
    this.goToRegister.emit(this.email().trim());
  }
}
