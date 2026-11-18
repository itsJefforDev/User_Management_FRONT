import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthLayoutComponent } from '../../../../shared/ui/templates/auth-layout/auth-layout';
import { VerifyAccountCardComponent } from '../../../../shared/ui/organisms/verify-account-card/verify-account-card';

@Component({
  selector: 'app-verify-page',
  imports: [AuthLayoutComponent, VerifyAccountCardComponent],
  templateUrl: './verify-page.html',
  styleUrl: './verify-page.scss',
})
export class VerifyPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  token = signal<string>('');

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.token.set(params['token'] || '');
    });
  }

  onGoToLogin() {
    this.router.navigate(['/login']);
  }
}
