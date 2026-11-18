import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if email exists with fallback', () => {
    service.checkEmailExists('admin@empresa.com').subscribe((exists) => {
      expect(exists).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/check-email'));
    req.error(new ProgressEvent('Network error'));
  });

  it('should login and set authentication state', () => {
    service.login({ email: 'admin@empresa.com', password: 'password123' }).subscribe((res) => {
      expect(res.token).toBeTruthy();
      expect(service.isAuthenticated()).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/login'));
    req.flush({ token: 'test-token', role: 'ADMIN', email: 'admin@empresa.com' });
  });

  it('should clear authentication on logout', () => {
    service.logout();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
