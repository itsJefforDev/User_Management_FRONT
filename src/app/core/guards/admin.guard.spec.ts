import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

describe('adminGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin', 'userRole']);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showWarning']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });
  });

  it('debe permitir el acceso si el usuario es administrador', () => {
    authServiceSpy.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(result).toBeTrue();
    expect(notificationServiceSpy.showWarning).not.toHaveBeenCalled();
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('debe bloquear el acceso, emitir advertencia y redirigir a /user si el usuario es ROLE_USER', () => {
    authServiceSpy.isAdmin.and.returnValue(false);
    authServiceSpy.userRole.and.returnValue('ROLE_USER');
    const mockTree = {} as UrlTree;
    routerSpy.createUrlTree.and.returnValue(mockTree);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(mockTree);
    expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith(
      jasmine.stringMatching(/Acceso Denegado/),
      'Advertencia de Privilegios'
    );
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/user'], {
      queryParams: { accessDenied: 'true' },
    });
  });
});
