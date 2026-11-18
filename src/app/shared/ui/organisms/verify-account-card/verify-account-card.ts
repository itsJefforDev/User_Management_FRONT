import { Component, inject, signal, input, output, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthHeaderComponent } from '../../molecules/auth-header/auth-header';
import { AlertComponent } from '../../atoms/alert/alert';
import { ButtonComponent } from '../../atoms/button/button';

export type VerificationStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-account-card',
  imports: [AuthHeaderComponent, AlertComponent, ButtonComponent],
  templateUrl: './verify-account-card.html',
  styleUrl: './verify-account-card.scss',
})
export class VerifyAccountCardComponent implements OnInit {
  private readonly authService = inject(AuthService);

  token = input<string>('');
  goToLogin = output<void>();

  status = signal<VerificationStatus>('loading');
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    const tokenVal = this.token().trim();
    if (!tokenVal) {
      this.status.set('error');
      this.errorMessage.set('No se proporcionó ningún token de activación en el enlace.');
      return;
    }

    this.authService.verifyAccount(tokenVal).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(
          err?.error?.message || 'El enlace de activación ha expirado o es inválido.'
        );
      },
    });
  }
}
