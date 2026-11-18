import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginPageComponent } from './login-page';

describe('LoginPageComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the login page', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should navigate to /admin when role is ADMIN', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onLoginSuccess({ token: 'tok', role: 'ADMIN' });
    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
  });

  it('should navigate to /user when role is ROLE_USER', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onLoginSuccess({ token: 'tok', role: 'ROLE_USER' });
    expect(navigateSpy).toHaveBeenCalledWith(['/user']);
  });
});
