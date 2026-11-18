/**
 * Modelo de Usuario alineado con el backend Spring Boot.
 *
 * Backend DTOs de referencia:
 *   - UserResponse     → User (interfaz principal)
 *   - CreateUserRequest → CreateUserRequest
 *   - UpdateUserRequest → UpdateUserRequest
 *
 * Enum UserStatus del backend: ACTIVE, INACTIVE, LOCKED
 */

// ─── Tipos de estado y rol del backend ──────────────────────────────
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

// ─── Interfaz principal: mapea UserResponse del backend ─────────────
export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  failedLoginAttempts?: number;
  roles: string[];        // Ej: ['ROLE_USER'], ['ADMIN', 'ROLE_USER']
  createdAt?: string;     // ISO timestamp del backend
  updatedAt?: string;     // ISO timestamp del backend
  avatarUrl?: string;     // Para uso local en la UI (no viene del backend)
}

// ─── Request para crear usuario (Admin lo crea ACTIVO) ──────────────
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roles?: string[];       // Opcional: si no se envía, el backend asigna ROLE_USER
}

// ─── Request para actualizar usuario ────────────────────────────────
export interface UpdateUserRequest {
  name?: string;
  status?: UserStatus;
  roles?: string[];
}

// ─── Helper: obtener el rol principal para mostrar en la UI ─────────
export function getPrimaryRole(roles: string[] | undefined): string {
  if (!roles || roles.length === 0) return 'ROLE_USER';
  if (roles.includes('ADMIN')) return 'ADMIN';
  return roles[0];
}

// ─── Helper: traducir status a texto en español ─────────────────────
export function getStatusLabel(status: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    LOCKED: 'Bloqueado',
  };
  return labels[status] || status;
}
