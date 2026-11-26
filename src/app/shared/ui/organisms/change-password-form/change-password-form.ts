import { Component, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { FormFieldComponent } from '../../molecules/form-field/form-field';
import { PasswordInputComponent } from '../../molecules/password-input/password-input';
import { AlertComponent } from '../../atoms/alert/alert';
import { ButtonComponent } from '../../atoms/button/button';
import { AuthHeaderComponent } from '../../molecules/auth-header/auth-header';

/**
 * Formulario de cambio obligatorio de contraseña.
 * Se usa cuando el usuario ingresa con una contraseña temporal (vigente o vencida).
 * La contraseña temporal actúa como "contraseña actual" y no abre sesión por sí sola.
 */
@Component({
  selector: 'app-change-password-form',
  imports: [FormFieldComponent, PasswordInputComponent, AlertComponent, ButtonComponent, AuthHeaderComponent],
  templateUrl: './change-password-form.html',
  styleUrl: './change-password-form.scss',
})
export class ChangePasswordFormComponent {
  private readonly authService = inject(AuthService);

  email = input.required<string>();
  currentPassword = input.required<string>(); // Contraseña temporal digitada en el login

  /** Emite la nueva contraseña una vez actualizada en el backend. */
  passwordChanged = output<string>();
  cancelled = output<void>();

  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  errors = signal<Record<string, string | null>>({});
  errorMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  updateField(field: 'newPassword' | 'confirmPassword', value: string) {
    this[field].set(value);
    this.errors.update((errs) => ({ ...errs, [field]: null }));
    this.errorMessage.set(null);
  }

  /** Política (HU-06): mínimo 8 caracteres, al menos una letra y un número. */
  validate(): boolean {
    const pwd = this.newPassword();
    const errs: Record<string, string | null> = {};

    if (!pwd) {
      errs['newPassword'] = 'La nueva contraseña es requerida';
    } else if (pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) {
      errs['newPassword'] = 'Mínimo 8 caracteres, con al menos una letra y un número';
    } else if (pwd === this.currentPassword()) {
      errs['newPassword'] = 'La nueva contraseña debe ser diferente a la temporal';
    }

    if (!this.confirmPassword()) {
      errs['confirmPassword'] = 'Confirma tu nueva contraseña';
    } else if (pwd !== this.confirmPassword()) {
      errs['confirmPassword'] = 'Las contraseñas no coinciden';
    }

    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  submit(event: Event) {
    event.preventDefault();
    if (!this.validate()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .changePassword(this.email(), this.currentPassword(), this.newPassword())
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.passwordChanged.emit(this.newPassword());
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err?.error?.message || 'No se pudo actualizar la contraseña. Intenta nuevamente.',
          );
        },
      });
  }
}