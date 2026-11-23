import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, CreateUserRequest, UserResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/userManagement/api/v1/auth';

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
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      // catchError((error) => {
      //   // Fallback para modo offline/demo local si el backend no responde
      //   const normalizedEmail = request.email.trim().toLowerCase();
      //   if (this.knownUsers.has(normalizedEmail) && request.password) {
      //     const userMeta = this.knownUsers.get(normalizedEmail)!;
      //     const mockResponse: LoginResponse = {
      //       token: 'mock-jwt-token-' + Date.now(),
      //       role: userMeta.role,
      //       email: normalizedEmail,
      //       name: userMeta.name,
      //     };
      //     return of(mockResponse);
      //   }
      //   return throwError(() => error);
      // }),
      tap((response) => this.handleAuthSuccess(response)),
    );
  }

  /**
   * Registro de nuevo usuario (estado INACTIVE).
   */
  register(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, request).pipe(
      catchError((error) => {
        // Fallback en modo local
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
   * Activa la cuenta mediante el token recibido por correo electrónico.
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
