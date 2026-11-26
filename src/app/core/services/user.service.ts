import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from '../models/user.model';
import { MessageResponse } from '../models/auth.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /**
   * URL base del endpoint de usuarios del backend Spring Boot.
   * El context-path del backend es /userManagement
   */
  private readonly apiUrl =
    'http://localhost:8080/userManagement/api/v1/users';

  //Estado reactivo con Signals
  private readonly usersSignal = signal<User[]>([]);
  private readonly searchQuery = signal<string>('');
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  //Señales públicas de solo lectura
  readonly allUsers = this.usersSignal.asReadonly();
  readonly currentSearch = this.searchQuery.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  //Computed: filtrado local reactivo
  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const users = this.usersSignal();
    if (!q) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.roles && user.roles.some((r) => r.toLowerCase().includes(q))) ||
        user.status.toLowerCase().includes(q)
    );
  });

  readonly totalUsers = computed(() => this.usersSignal().length);

  readonly activeUsers = computed(
    () => this.usersSignal().filter((u) => u.status === 'ACTIVE').length
  );

  readonly inactiveUsers = computed(
    () => this.usersSignal().filter((u) => u.status === 'INACTIVE').length
  );

  readonly lockedUsers = computed(
    () => this.usersSignal().filter((u) => u.status === 'LOCKED').length
  );

  //Helpers privados

  /**
   * Construye los headers HTTP con el token JWT de autorización.
   * Todas las llamadas al endpoint /api/v1/users requieren rol ADMIN.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private clearError() {
    this.errorSignal.set(null);
  }

  /** Contraseña temporal aleatoria de 8 dígitos (solo para el modo demo sin backend). */
  private randomTemporaryPassword(): string {
    const value = crypto.getRandomValues(new Uint32Array(1))[0] % 100_000_000;
    return String(value).padStart(8, '0');
  }

  // Búsqueda local

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  // CRUD: Consumo de endpoints del backend

  /**
   * GET /api/v1/users
   * Obtiene todos los usuarios del sistema.
   * Solo accesible por ADMIN.
   */
  loadUsers(): void {
    this.clearError();
    this.loadingSignal.set(true);

    this.http
      .get<User[]>(this.apiUrl, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((users) => {
          this.usersSignal.set(users);
        }),
        catchError((error) => {
          const message =
            error.status === 403
              ? 'No tienes permisos para ver los usuarios. Se requiere rol ADMIN.'
              : error.status === 401
                ? 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
                : error.error?.message ||
                  'Error al cargar los usuarios. Verifica que el backend esté corriendo.';
          this.errorSignal.set(message);
          console.error('[UserService] Error al cargar usuarios:', error);
          return of([]);
        }),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe();
  }

  /**
   * GET /api/v1/users/:id
   * Obtiene un usuario específico por su ID.
   */
  getUserById(id: number): Observable<User> {
    this.clearError();

    return this.http
      .get<User>(`${this.apiUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          const message =
            error.status === 404
              ? `Usuario con ID ${id} no encontrado.`
              : error.error?.message || 'Error al obtener el usuario.';
          this.errorSignal.set(message);
          console.error('[UserService] Error getUserById:', error);
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * GET /api/v1/users/temporary-password
   * Genera una contraseña temporal aleatoria de 8 dígitos (botón "Generar" del admin).
   */
  generateTemporaryPassword(): Observable<string> {
    return this.http
      .get<{ password: string }>(`${this.apiUrl}/temporary-password`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((res) => res.password),
        catchError((error) => {
          // Sin conexión al backend: se genera localmente para poder probar la UI
          if (error.status === 0) return of(this.randomTemporaryPassword());
          return throwError(
            () => new Error(error.error?.message || 'No se pudo generar la contraseña temporal.')
          );
        })
      );
  }

  /**
   * POST /api/v1/users/:id/send-activation
   * Envía al usuario el correo de activación por enlace.
   */
  sendActivationEmail(id: number): Observable<string> {
    return this.http
      .post<MessageResponse>(`${this.apiUrl}/${id}/send-activation`, {}, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((res) => res.message),
        catchError((error) => {
          const message =
            error.status === 0
              ? 'No se pudo conectar con el servidor para enviar el correo.'
              : error.error?.message || 'No se pudo enviar el correo de activación.';
          return throwError(() => new Error(message));
        })
      );
  }

  /**
   * POST /api/v1/users
   * Crea un nuevo usuario (por el administrador → estado INACTIVE con contraseña temporal).
   * El backend recibe: { name, email, password, roles?, temporaryPasswordHours? }
   */
  createUser(request: CreateUserRequest): Observable<User> {
    this.clearError();
    this.loadingSignal.set(true);

    return this.http
      .post<User>(this.apiUrl, request, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((createdUser) => {
          // Agregar al inicio de la lista local
          this.usersSignal.update((users) => [createdUser, ...users]);
        }),
        catchError((error) => {
          const message =
            error.status === 400
              ? error.error?.message ||
                'El email ya se encuentra registrado u otro error de validación.'
              : error.status === 403
                ? 'No tienes permisos para crear usuarios.'
                : error.error?.message || 'Error al crear el usuario.';
          this.errorSignal.set(message);
          console.error('[UserService] Error createUser:', error);
          return throwError(() => new Error(message));
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * PUT /api/v1/users/:id
   * Actualiza un usuario existente.
   * El backend recibe: { name?, status?, roles?, password?, temporaryPasswordHours? }
   */
  updateUser(id: number, request: UpdateUserRequest): Observable<User> {
    this.clearError();
    this.loadingSignal.set(true);

    return this.http
      .put<User>(`${this.apiUrl}/${id}`, request, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((updatedUser) => {
          // Actualizar en la lista local
          this.usersSignal.update((users) =>
            users.map((u) => (u.id === id ? updatedUser : u))
          );
        }),
        catchError((error) => {
          const message =
            error.status === 404
              ? `Usuario con ID ${id} no encontrado.`
              : error.status === 403
                ? 'No tienes permisos para editar usuarios.'
                : error.error?.message || 'Error al actualizar el usuario.';
          this.errorSignal.set(message);
          console.error('[UserService] Error updateUser:', error);
          return throwError(() => new Error(message));
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * DELETE /api/v1/users/:id
   * Elimina (soft delete) un usuario → lo pasa a INACTIVE en el backend.
   * Retorna 204 No Content.
   */
  deleteUser(id: number): Observable<void> {
    this.clearError();
    this.loadingSignal.set(true);

    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap(() => {
          // Actualizar el estado local: cambiar a INACTIVE (soft delete)
          this.usersSignal.update((users) =>
            users.map((u) =>
              u.id === id ? { ...u, status: 'INACTIVE' as const } : u
            )
          );
        }),
        catchError((error) => {
          const message =
            error.status === 404
              ? `Usuario con ID ${id} no encontrado.`
              : error.status === 403
                ? 'No tienes permisos para eliminar usuarios.'
                : error.error?.message || 'Error al eliminar el usuario.';
          this.errorSignal.set(message);
          console.error('[UserService] Error deleteUser:', error);
          return throwError(() => new Error(message));
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }
}