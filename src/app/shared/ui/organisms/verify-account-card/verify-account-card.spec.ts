import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { VerifyAccountCardComponent } from './verify-account-card';
import { AuthService } from '../../../../core/services/auth.service';

describe('VerifyAccountCardComponent', () => {
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyAccountCardComponent],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
  });

  it('should create the verify card', () => {
    const fixture = TestBed.createComponent(VerifyAccountCardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should verify account if token is provided', () => {
    vi.spyOn(authService, 'verifyAccount').mockReturnValue(of('Cuenta activada'));

    const fixture = TestBed.createComponent(VerifyAccountCardComponent);
    fixture.componentRef.setInput('token', 'valid-token-123');
    fixture.detectChanges();

    expect(fixture.componentInstance.status()).toBe('success');
  });
});
