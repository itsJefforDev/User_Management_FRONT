import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UserResponse,
  MessageResponse,
  UpdateProfileRequest,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/userManagement/api/v1/auth';
  private readonly profileUrl = 'http://localhost:8080/userManagement/api/v1/profile';

  // State signals
  readonly currentUser = signal<LoginResponse | null>(this.getStoredUser());
  readonly token = signal<string | null>(this.getStoredToken());
  readonly isAuthenticated = computed(() => !!this.token());

  // Helper computed signals for reactive UI
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    return user?.name || user?.user?.name || (user?.email ? user.email.split('@')[0] : 'Usuario');
  });

  readonly userEmail = computed(() => {
    const user = this.currentUser();
    return user?.email || user?.user?.email || '';
  });

  readonly userRole = computed(() => {
    const user = this.currentUser();

    const role = user?.role?.[0]?.name || user?.user?.role?.[0]?.name || 'ROLE_USER';

    return role.toUpperCase();
  });

  readonly isAdmin = computed(() => {
    return this.userRole().includes('ADMIN');
  });

  readonly currentUserId = computed<number>(() => {
    const user = this.currentUser();
    if (user?.userId) return Number(user.userId);
    if (user?.user?.id) return Number(user.user.id);
    return 1;
  });

  // In-memory registered cache for local testing / fallback
  private readonly knownUsers = new Map<string, { role: string; name: string }>([
    ['admin@empresa.com', { role: 'ADMIN', name: 'Administrador' }],
    ['user@empresa.com', { role: 'ROLE_USER', name: 'Usuario Estándar' }],
  ]);

  /** true solo cuando el backend no es alcanzable (modo demo local). */
  private isOffline(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 0;
  }

  /**
   * Identifica si el correo electrónico existe en el sistema.
   * Consume el endpoint GET /api/v1/auth/check-email?email=... del backend Spring Boot,
   * el cual retorna un booleano (ResponseEntity<Boolean>).
   */
  checkEmailExists(email: string): Observable<boolean> {
    const normalizedEmail = email.trim().toLowerCase();

    return this.http
      .get<boolean>(`${this.apiUrl}/check-email`, {
        params: { email: normalizedEmail },
      })
      .pipe(
        catchError(() => {
          // Fallback para pruebas locales si el backend no está corriendo
          return of(this.knownUsers.has(normalizedEmail));
        }),
      );
  }

  /**
   * Inicia sesión con email y contraseña.
   * Si el backend responde mustChangePassword = true (contraseña temporal vigente)
   * NO se abre sesión: el formulario de login debe forzar el cambio de contraseña.
   * Si la temporal venció, el backend responde 403 con code = PASSWORD_EXPIRED.
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        if (response.token && !response.mustChangePassword) {
          this.handleAuthSuccess(response);
        }
      }),
    );
  }

  /**
   * Registro de nuevo usuario (estado INACTIVE).
   * El backend envía un código de 4 dígitos al correo.
   */
  register(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, request).pipe(
      catchError((error) => {
        // El fallback local solo aplica sin conexión; los errores reales (ej. correo duplicado) se propagan
        if (!this.isOffline(error)) return throwError(() => error);

        const normalizedEmail = request.email.trim().toLowerCase();
        this.knownUsers.set(normalizedEmail, {
          role: 'ROLE_USER',
          name: request.name,
        });
        const mockCreatedUser: UserResponse = {
          id: Date.now(),
          name: request.name,
          email: normalizedEmail,
          role: 'ROLE_USER',
          status: 'INACTIVE',
        };
        return of(mockCreatedUser);
      }),
      tap((res) => {
        this.knownUsers.set(res.email.toLowerCase(), {
          role: res.role || 'ROLE_USER',
          name: res.name,
        });
      }),
    );
  }

  /**
   * Activa la cuenta mediante el token (enlace) recibido por correo electrónico.
   * Flujo de cuentas creadas por el administrador.
   */
  verifyAccount(token: string): Observable<string> {
    return this.http
      .get(`${this.apiUrl}/verify`, {
        params: { token },
        responseType: 'text',
      })
      .pipe(
        catchError((error) => {
          if (token && token.length > 3) {
            return of('Cuenta activada exitosamente');
          }
          return throwError(() => new Error('Token de verificación inválido o expirado'));
        }),
      );
  }

  /** Activa la cuenta con el código de 4 dígitos enviado al correo (auto-registro). */
  verifyCode(email: string, code: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/verify-code`, { email, code }).pipe(
      catchError((error) => {
        // Demo local sin backend: acepta cualquier código de 4 dígitos
        if (this.isOffline(error) && /^\d{4}$/.test(code)) {
          return of({ message: 'Cuenta activada exitosamente' });
        }
        return throwError(() => error);
      }),
    );
  }

  /** Solicita un nuevo código de 4 dígitos. */
  resendCode(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/resend-code`, { email }).pipe(
      catchError((error) =>
        this.isOffline(error)
          ? of({ message: 'Código reenviado (modo local)' })
          : throwError(() => error),
      ),
    );
  }

  /** Recordatorio de contraseña: el backend envía una contraseña temporal de 8 dígitos al correo. */
  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError((error) =>
        this.isOffline(error)
          ? of({ message: 'Si el correo está registrado, enviamos una contraseña temporal.' })
          : throwError(() => error),
      ),
    );
  }

  /**
   * Cambia la contraseña. currentPassword puede ser la temporal (incluso vencida);
   * este endpoint no abre sesión: después se debe iniciar sesión con la nueva contraseña.
   */
  changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/change-password`, {
      email,
      currentPassword,
      newPassword,
    });
  }

  /** Headers con el JWT: el backend identifica al usuario por el token. */
  private authHeaders(): { headers: HttpHeaders } {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.token();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return { headers };
  }

  /** Perfil: envía un código de 4 dígitos al NUEVO correo antes de guardar el cambio. */
  requestEmailChangeCode(email: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.profileUrl}/email-code`, { email }, this.authHeaders())
      .pipe(
        catchError((error) =>
          this.isOffline(error)
            ? of({ message: 'Código enviado (modo local)' })
            : throwError(() => error),
        ),
      );
  }

  /**
   * Perfil: guarda nombre, correo (con código) y/o contraseña.
   * El backend devuelve una sesión nueva (el token depende del correo) que reemplaza la actual.
   */
  updateProfile(request: UpdateProfileRequest): Observable<LoginResponse> {
    return this.http.put<LoginResponse>(this.profileUrl, request, this.authHeaders()).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        // Demo local sin backend: solo actualiza nombre/correo en la sesión guardada
        if (this.isOffline(error) && (!request.email || /^\d{4}$/.test(request.emailCode ?? ''))) {
          this.updateUserProfile({ name: request.name ?? this.userDisplayName(), email: request.email });
          return of(this.currentUser() as LoginResponse);
        }
        return throwError(() => error);
      }),
    );
  }

  updateUserProfile(updates: { name: string; email?: string }) {
    const current = this.currentUser();
    if (!current) return;
    const updatedUser: LoginResponse = {
      ...current,
      name: updates.name || current.name,
      email: updates.email || current.email,
      user: current.user
        ? {
            ...current.user,
            name: updates.name || current.user.name,
            email: updates.email || current.user.email,
          }
        : undefined,
    };
    this.currentUser.set(updatedUser);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  private handleAuthSuccess(response: LoginResponse) {
    if (!response.token) return;
    this.token.set(response.token);
    this.currentUser.set(response);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response));
    }
  }

  private getStoredToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getStoredUser(): LoginResponse | null {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}