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
    let roleStr = '';
    if (typeof res.role === 'string') {
      roleStr = res.role;
    } else if (Array.isArray(res.role) && res.role.length > 0) {
      roleStr = typeof res.role[0] === 'string' ? res.role[0] : (res.role[0]?.name || '');
    } else if (res.user?.role) {
      if (typeof res.user.role === 'string') {
        roleStr = res.user.role;
      } else if (Array.isArray(res.user.role) && res.user.role.length > 0) {
        roleStr = typeof res.user.role[0] === 'string' ? res.user.role[0] : (res.user.role[0]?.name || '');
      }
    }

    if (roleStr.toUpperCase().includes('ADMIN')) {
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
