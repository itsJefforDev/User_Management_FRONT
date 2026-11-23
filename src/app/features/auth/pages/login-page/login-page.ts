import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthLayoutComponent } from '../../../../shared/ui/templates/auth-layout/auth-layout';
import { LoginFormComponent } from '../../../../shared/ui/organisms/login-form/login-form';
import { LoginResponse } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-login-page',
  imports: [AuthLayoutComponent, LoginFormComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPageComponent implements OnInit {
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

  onLoginSuccess(res: LoginResponse) {
      const role = (
    res.role?.[0]?.name ||
    res.user?.role?.[0]?.name ||
    ''
  ).toUpperCase();
    if (role.includes('ADMIN')) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/user']);
    }
  }

  onGoToRegister(email: string) {
    this.router.navigate(['/register'], {
      queryParams: email ? { email } : undefined,
    });
  }
}
