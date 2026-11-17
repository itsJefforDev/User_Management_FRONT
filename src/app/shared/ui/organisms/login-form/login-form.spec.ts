import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
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

  it('should create the login form', () => {
    const fixture = TestBed.createComponent(LoginFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should advance to password step if email exists', () => {
    const fixture = TestBed.createComponent(LoginFormComponent);
    const component = fixture.componentInstance;
    vi.spyOn(authService, 'checkEmailExists').mockReturnValue(of(true));

    component.email.set('admin@empresa.com');
    component['handleEmailSubmit'](new Event('submit'));

    expect(component.step()).toBe('password');
  });

  it('should transition to not-found step if email does not exist', () => {
    const fixture = TestBed.createComponent(LoginFormComponent);
    const component = fixture.componentInstance;
    vi.spyOn(authService, 'checkEmailExists').mockReturnValue(of(false));

    component.email.set('nuevo@empresa.com');
    component['handleEmailSubmit'](new Event('submit'));

    expect(component.step()).toBe('not-found');
  });
});
