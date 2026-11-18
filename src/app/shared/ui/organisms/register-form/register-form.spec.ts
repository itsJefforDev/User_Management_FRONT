import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { RegisterFormComponent } from './register-form';
import { AuthService } from '../../../../core/services/auth.service';

describe('RegisterFormComponent', () => {
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterFormComponent],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
  });

  it('should create the register form', () => {
    const fixture = TestBed.createComponent(RegisterFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should invalidate form when passwords do not match', () => {
    const fixture = TestBed.createComponent(RegisterFormComponent);
    const component = fixture.componentInstance;

    component.formData.set({
      name: 'Carlos Ruiz',
      email: 'carlos@empresa.com',
      password: 'password123',
      confirmPassword: 'differentPassword',
    });

    const isValid = component.validate();
    expect(isValid).toBe(false);
    expect(component.errors()['confirmPassword']).toBe('Las contraseñas no coinciden');
  });

  it('should call register service and transition to verification step', () => {
    const fixture = TestBed.createComponent(RegisterFormComponent);
    const component = fixture.componentInstance;

    vi.spyOn(authService, 'register').mockReturnValue(
      of({ id: 1, name: 'Carlos', email: 'carlos@empresa.com', status: 'INACTIVE' })
    );

    component.formData.set({
      name: 'Carlos Ruiz',
      email: 'carlos@empresa.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.handleRegisterSubmit(new Event('submit'));

    expect(component.isVerificationStep()).toBe(true);
  });
});
