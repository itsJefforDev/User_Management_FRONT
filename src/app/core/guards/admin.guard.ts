import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Guard de control de acceso para módulos exclusivos de Administrador.
 *
 * Si un usuario con rol estándar (ej. ROLE_USER) o sin permisos de administrador
 * intenta ingresar a una ruta protegida para administradores:
 *  1. Emite una advertencia mediante NotificationService indicando la falta de permisos.
 *  2. Redirige al usuario a su panel correspondiente (/user).
 */
export const adminGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (authService.isAdmin()) {
    return true;
  }

  // Notificar al usuario la restricción de privilegios
  notificationService.showWarning(
    'Acceso Denegado: No cuentas con permisos de administrador para acceder a este módulo corporativo. Has sido redirigido a tu panel de usuario.',
    'Advertencia de Privilegios'
  );

  return router.createUrlTree(['/user'], {
    queryParams: { accessDenied: 'true' },
  });
};
