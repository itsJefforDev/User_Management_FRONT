import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UserPageComponent } from './user-page';
import { AuthService } from '../../../../core/services/auth.service';

describe('UserPageComponent', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  it('should create the user page', () => {
    const fixture = TestBed.createComponent(UserPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should logout and redirect to login', () => {
    const fixture = TestBed.createComponent(UserPageComponent);
    const component = fixture.componentInstance;
    const logoutSpy = vi.spyOn(authService, 'logout');
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.handleLogout();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
