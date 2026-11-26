import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LoginFormComponent } from './login-form';
import { AuthService } from '../../../../core/services/auth.service';

describe('LoginFormComponent', () => {
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
  });

  const submitEmail = (component: LoginFormComponent, email: string) => {
    component.email.set(email);
    component['handleEmailSubmit'](new Event('submit'));
  };

  it('should create the login form', () => {
    const fixture = TestBed.createComponent(LoginFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should advance to password step if email exists', () => {
    const component = TestBed.createComponent(LoginFormComponent).componentInstance;
    vi.spyOn(authService, 'checkEmailExists').mockReturnValue(of(true));

    submitEmail(component, 'admin@empresa.com');

    expect(component.step()).toBe('password');
  });

  it('should stay on the email step until the email is not found 3 times', () => {
    const component = TestBed.createComponent(LoginFormComponent).componentInstance;
    vi.spyOn(authService, 'checkEmailExists').mockReturnValue(of(false));

    submitEmail(component, 'nuevo@empresa.com');
    expect(component.step()).toBe('email');
    expect(component.emailError()).toContain('Intento 1 de 3');

    submitEmail(component, 'nuevo@empresa.com');
    expect(component.step()).toBe('email');

    submitEmail(component, 'nuevo@empresa.com');
    expect(component.step()).toBe('not-found');
  });

  it('should require changing the password when logging in with a valid temporary password', () => {
    const component = TestBed.createComponent(LoginFormComponent).componentInstance;
    vi.spyOn(authService, 'login').mockReturnValue(of({ mustChangePassword: true }));

    component.email.set('user@empresa.com');
    component.password.set('12345678');
    component['handlePasswordSubmit'](new Event('submit'));

    expect(component.step()).toBe('change-password');
    expect(component.changeReason()).toBe('required');
  });

  it('should open the change password modal when the temporary password expired', () => {
    const component = TestBed.createComponent(LoginFormComponent).componentInstance;
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => ({ error: { code: 'PASSWORD_EXPIRED' } })),
    );

    component.email.set('user@empresa.com');
    component.password.set('12345678');
    component['handlePasswordSubmit'](new Event('submit'));

    expect(component.step()).toBe('change-password');
    expect(component.changeReason()).toBe('expired');
  });

  it('should send the temporary password reminder and return to the password step', () => {
    const component = TestBed.createComponent(LoginFormComponent).componentInstance;
    const spy = vi.spyOn(authService, 'forgotPassword').mockReturnValue(of({ message: 'ok' }));

    component.email.set('user@empresa.com');
    component['sendTemporaryPassword']();

    expect(spy).toHaveBeenCalledWith('user@empresa.com');
    expect(component.step()).toBe('password');
    expect(component.infoMessage()).toContain('contraseña temporal');
  });
});