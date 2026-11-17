import { Component, inject, signal, input, output } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { UserResponse } from '../../../../core/models/auth.model';
import { AuthHeaderComponent } from '../../molecules/auth-header/auth-header';
import { FormFieldComponent } from '../../molecules/form-field/form-field';
import { PasswordInputComponent } from '../../molecules/password-input/password-input';
import { AlertComponent } from '../../atoms/alert/alert';
import { ButtonComponent } from '../../atoms/button/button';
import { InputComponent } from '../../atoms/input/input';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register-form',
  imports: [
    AuthHeaderComponent,
    FormFieldComponent,
    PasswordInputComponent,
    AlertComponent,
    ButtonComponent,
    InputComponent,
  ],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})
export class RegisterFormComponent {
  private readonly authService = inject(AuthService);

  initialEmail = input<string>('');

  registered = output<UserResponse>();
  accountVerified = output<string>();
  goToLogin = output<void>();

  formData = signal<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  errors = signal<Record<string, string | null>>({});
  isVerificationStep = signal<boolean>(false);
  activationToken = signal<string>('');
  tokenError = signal<string | null>(null);

  loading = signal<boolean>(false);
  verifyingToken = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    if (this.initialEmail()) {
      this.formData.update((state) => ({ ...state, email: this.initialEmail() }));
    }
  }

  updateField(field: keyof FormState, value: string) {
    this.formData.update((state) => ({ ...state, [field]: value }));
    this.errors.update((errs) => ({ ...errs, [field]: null }));
    this.errorMessage.set(null);
  }

  validate(): boolean {
    const data = this.formData();
    const newErrors: Record<string, string | null> = {};

    if (!data.name.trim()) {
      newErrors['name'] = 'El nombre completo es requerido';
    } else if (data.name.trim().length < 3) {
      newErrors['name'] = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!data.email.trim()) {
      newErrors['email'] = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      newErrors['email'] = 'Ingresa un formato de correo válido';
    }

    if (!data.password) {
      newErrors['password'] = 'La contraseña es requerida';
    } else if (data.password.length < 6) {
      newErrors['password'] = 'La contraseña debe tener mínimo 6 caracteres';
    }

    if (!data.confirmPassword) {
      newErrors['confirmPassword'] = 'Por favor confirma tu contraseña';
    } else if (data.password !== data.confirmPassword) {
      newErrors['confirmPassword'] = 'Las contraseñas no coinciden';
    }

    this.errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  handleRegisterSubmit(event: Event) {
    event.preventDefault();
    if (!this.validate()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { name, email, password } = this.formData();

    this.authService
      .register({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      .subscribe({
        next: (createdUser) => {
          this.loading.set(false);
          this.registered.emit(createdUser);
          this.isVerificationStep.set(true);
          this.successMessage.set(
            '¡Cuenta creada exitosamente! Revisa tu correo para el token de activación.'
          );
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            err?.error?.message ||
            'Error al registrar la cuenta. Es posible que el correo ya esté en uso.';
          this.errorMessage.set(msg);
        },
      });
  }

  handleVerifyAccount() {
    const token = this.activationToken().trim();
    if (!token) {
      this.tokenError.set('Ingresa el token de verificación');
      return;
    }

    this.verifyingToken.set(true);
    this.tokenError.set(null);
    this.errorMessage.set(null);

    this.authService.verifyAccount(token).subscribe({
      next: (msg) => {
        this.verifyingToken.set(false);
        this.successMessage.set('¡Cuenta verificada y activada con éxito!');
        setTimeout(() => {
          this.accountVerified.emit(this.formData().email);
        }, 1200);
      },
      error: (err) => {
        this.verifyingToken.set(false);
        this.tokenError.set(
          err?.error?.message || 'El token de verificación no es válido o ha expirado.'
        );
      },
    });
  }
}
