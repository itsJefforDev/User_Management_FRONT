import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthLayoutComponent } from '../../../../shared/ui/templates/auth-layout/auth-layout';
import { RegisterFormComponent } from '../../../../shared/ui/organisms/register-form/register-form';

@Component({
  selector: 'app-register-page',
  imports: [AuthLayoutComponent, RegisterFormComponent],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
})
export class RegisterPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  initialEmail = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.initialEmail.set(params['email']);
      }
    });
  }

  onAccountVerified(email: string) {
    this.router.navigate(['/login'], {
      queryParams: { email, verified: 'true' },
    });
  }

  onGoToLogin() {
    this.router.navigate(['/login']);
  }
}
