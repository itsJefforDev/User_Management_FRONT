import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginResponse } from '../../../../core/models/auth.model';
import { AuthHeaderComponent } from '../../molecules/auth-header/auth-header';
import { FormFieldComponent } from '../../molecules/form-field/form-field';
import { PasswordInputComponent } from '../../molecules/password-input/password-input';
import { AlertComponent } from '../../atoms/alert/alert';
import { ButtonComponent } from '../../atoms/button/button';
import { InputComponent } from '../../atoms/input/input';
import { ChangePasswordFormComponent } from '../change-password-form/change-password-form';

export type LoginStep = 'email' | 'password' | 'not-found' | 'forgot' | 'change-password';

/** expired: la temporal venció (modal) · required: la temporal está vigente (formulario) */
export type ChangeReason = 'expired' | 'required';

/** Veces que el correo puede no encontrarse antes de ofrecer crear una cuenta. */
const MAX_EMAIL_NOT_FOUND = 3;

@Component({
  selector: 'app-login-form',
  imports: [
    AuthHeaderComponent,
    FormFieldComponent,
    PasswordInputComponent,
    AlertComponent,
    ButtonComponent,
    InputComponent,
    ChangePasswordFormComponent,
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
  changeReason = signal<ChangeReason>('required');
  email = signal<string>('');
  password = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);
  emailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  notFoundAttempts = signal<number>(0);

  // <dialog> nativo: se muestra en la capa superior (no depende de los contenedores con transform)
  private readonly expiredDialog = viewChild<ElementRef<HTMLDialogElement>>('expiredDialog');

  constructor() {
    // Abre/cierra el modal de contraseña vencida según el paso actual
    effect(() => {
      const dialog = this.expiredDialog()?.nativeElement;
      if (!dialog || typeof dialog.showModal !== 'function') return;

      const shouldOpen = this.step() === 'change-password' && this.changeReason() === 'expired';
      if (shouldOpen && !dialog.open) dialog.showModal();
      if (!shouldOpen && dialog.open) dialog.close();
    });
  }

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
      case 'forgot':
        return 'Recordar contraseña';
      case 'change-password':
        return 'Cambia tu contraseña';
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
      case 'forgot':
        return 'Te enviaremos una contraseña temporal por correo';
      case 'change-password':
        return 'Por seguridad debes definir una nueva contraseña';
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
          this.notFoundAttempts.set(0);
          this.step.set('password');
          return;
        }

        // Solo tras 3 intentos sin encontrar el correo se ofrece crear una cuenta
        const attempts = this.notFoundAttempts() + 1;
        this.notFoundAttempts.set(attempts);

        if (attempts >= MAX_EMAIL_NOT_FOUND) {
          this.step.set('not-found');
        } else {
          this.emailError.set(
            `No encontramos una cuenta con este correo. Intento ${attempts} de ${MAX_EMAIL_NOT_FOUND}.`,
          );
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('No se pudo verificar el correo. Intenta nuevamente.');
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
    this.infoMessage.set(null);

    this.authService
      .login({
        email: this.email().trim(),
        password: pwd,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);

          // Ingresó con una contraseña temporal vigente: debe cambiarla antes de continuar
          if (res.mustChangePassword) {
            this.changeReason.set('required');
            this.step.set('change-password');
            return;
          }
          this.loginSuccess.emit(res);
        },
        error: (err) => {
          this.loading.set(false);

          // Contraseña temporal vencida: se obliga a cambiarla mediante un modal
          if (err?.error?.code === 'PASSWORD_EXPIRED') {
            this.changeReason.set('expired');
            this.step.set('change-password');
            return;
          }

          this.errorMessage.set(
            err?.error?.message || 'Credenciales inválidas. Por favor verifica tu contraseña.',
          );
        },
      });
  }

  // ─── Recordatorio de contraseña ─────────────────────────────────────────
  protected openForgot() {
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.step.set('forgot');
  }

  protected sendTemporaryPassword() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword(this.email().trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.password.set('');
        this.infoMessage.set(
          'Si la cuenta existe, enviamos una contraseña temporal de 8 dígitos a tu correo. Úsala para iniciar sesión.',
        );
        this.step.set('password');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'No se pudo enviar el correo. Intenta nuevamente.');
      },
    });
  }

  // ─── Cambio obligatorio de contraseña ───────────────────────────────────
  /** Tras cambiar la contraseña se inicia sesión automáticamente con la nueva. */
  protected onPasswordChanged(newPassword: string) {
    this.loading.set(true);

    this.authService.login({ email: this.email().trim(), password: newPassword }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loginSuccess.emit(res);
      },
      error: () => {
        this.loading.set(false);
        this.password.set('');
        this.infoMessage.set('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
        this.step.set('password');
      },
    });
  }

  protected resetToEmailStep() {
    this.step.set('email');
    this.password.set('');
    this.notFoundAttempts.set(0);
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.emailError.set(null);
    this.passwordError.set(null);
  }

  protected proceedToRegister() {
    this.notFoundAttempts.set(0);
    this.goToRegister.emit(this.email().trim());
  }
}