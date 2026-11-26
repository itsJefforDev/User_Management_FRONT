import { Component, computed, inject, output, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { UpdateProfileRequest } from '../../../../core/models/auth.model';
import { AvatarComponent } from '../../atoms/avatar/avatar';
import { BadgeComponent } from '../../atoms/badge/badge';
import { ButtonComponent } from '../../atoms/button/button';
import { InputComponent } from '../../atoms/input/input';
import { AlertComponent } from '../../atoms/alert/alert';
import { FormFieldComponent } from '../../molecules/form-field/form-field';
import { PasswordInputComponent } from '../../molecules/password-input/password-input';

/**
 * Modal de edición del perfil del usuario autenticado.
 * - Permite cambiar nombre, correo y (opcionalmente) la contraseña.
 * - Si el correo cambia, primero se verifica con un código de 4 dígitos enviado
 *   al NUEVO correo; los cambios solo se guardan después de verificarlo.
 */
@Component({
  selector: 'app-edit-profile-modal',
  imports: [
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    AlertComponent,
    FormFieldComponent,
    PasswordInputComponent,
  ],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.scss',
})
export class EditProfileModalComponent {
  protected readonly authService = inject(AuthService);

  closed = output<void>();

  // 'form': datos del perfil · 'verify': código de 4 dígitos del nuevo correo
  step = signal<'form' | 'verify'>('form');

  name = signal<string>(this.authService.userDisplayName());
  email = signal<string>(this.authService.userEmail());

  changePassword = signal<boolean>(false);
  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');

  code = signal<string>('');

  errors = signal<Record<string, string | null>>({});
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  loading = signal<boolean>(false);
  resending = signal<boolean>(false);

  /** true si el correo digitado es distinto al actual. */
  readonly emailChanged = computed(
    () => this.email().trim().toLowerCase() !== this.authService.userEmail().toLowerCase(),
  );

  updateField(field: 'name' | 'email' | 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) {
    this[field].set(value);
    this.errors.update((errs) => ({ ...errs, [field]: null }));
    this.errorMessage.set(null);
  }

  /** Validaciones del formulario (política de contraseña HU-06: 8+ caracteres, letra y número). */
  validate(): boolean {
    const errs: Record<string, string | null> = {};

    if (!this.name().trim()) errs['name'] = 'El nombre es obligatorio';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim())) {
      errs['email'] = 'Ingresa un correo electrónico válido';
    }

    if (this.changePassword()) {
      const pwd = this.newPassword();
      if (!this.currentPassword()) errs['currentPassword'] = 'Ingresa tu contraseña actual';

      if (!pwd) {
        errs['newPassword'] = 'La nueva contraseña es requerida';
      } else if (pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) {
        errs['newPassword'] = 'Mínimo 8 caracteres, con al menos una letra y un número';
      } else if (pwd === this.currentPassword()) {
        errs['newPassword'] = 'Debe ser diferente a la contraseña actual';
      }

      if (pwd !== this.confirmPassword()) errs['confirmPassword'] = 'Las contraseñas no coinciden';
    }

    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  /** Paso 1: si el correo cambió se pide el código; si no, se guarda directamente. */
  submit() {
    if (!this.validate()) return;

    if (this.emailChanged()) {
      this.requestCode();
    } else {
      this.save();
    }
  }

  /** Envía (o reenvía) el código de 4 dígitos al nuevo correo. */
  requestCode(isResend = false) {
    (isResend ? this.resending : this.loading).set(true);
    this.errorMessage.set(null);

    this.authService.requestEmailChangeCode(this.email().trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.resending.set(false);
        this.code.set('');
        this.infoMessage.set(`Enviamos un código de 4 dígitos a ${this.email().trim()}.`);
        this.step.set('verify');
      },
      error: (err) => {
        this.loading.set(false);
        this.resending.set(false);
        this.errorMessage.set(err?.error?.message || 'No se pudo enviar el código. Intenta nuevamente.');
      },
    });
  }

  /** Solo permite dígitos (máx. 4) en el campo del código. */
  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = digits;
    this.code.set(digits);
    this.errorMessage.set(null);
  }

  /** Paso 2 (o único): guarda todos los cambios en el backend. */
  save() {
    if (this.emailChanged() && !/^\d{4}$/.test(this.code())) {
      this.errorMessage.set('Ingresa el código de 4 dígitos');
      return;
    }

    const request: UpdateProfileRequest = {
      name: this.name().trim(),
      ...(this.emailChanged() ? { email: this.email().trim(), emailCode: this.code() } : {}),
      ...(this.changePassword()
        ? { currentPassword: this.currentPassword(), newPassword: this.newPassword() }
        : {}),
    };

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.updateProfile(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.infoMessage.set(null);
        this.successMessage.set('¡Perfil actualizado correctamente!');
        setTimeout(() => this.closed.emit(), 900);
      },
      error: (err) => {
        this.loading.set(false);
        const errorCode: string = err?.error?.code ?? '';
        this.errorMessage.set(err?.error?.message || 'No se pudo actualizar el perfil.');

        // Errores que no son del código (ej. contraseña actual incorrecta) vuelven al formulario
        if (this.step() === 'verify' && !errorCode.startsWith('CODE_')) {
          this.step.set('form');
        }
      },
    });
  }
}
