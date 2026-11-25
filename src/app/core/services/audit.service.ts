import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { AuditLog } from '../models/audit.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:8080/userManagement/api/v1/audits';

  // Eventos demo para modo local (backend no disponible)
  private readonly fallbackLogs: AuditLog[] = [
    { id: 101, user: 'admin@empresa.com', action: 'LOGIN_SUCCESS', module: 'AUTH', result: 'SUCCESS', ipAddress: '192.168.1.45', timestamp: '2026-11-23T15:45:12' },
    { id: 102, user: 'admin@empresa.com', action: 'ACCOUNT_CREATED', module: 'ACCOUNTS', resource: 'Account', resourceId: 4, result: 'SUCCESS', ipAddress: '192.168.1.45', timestamp: '2026-11-23T14:30:00' },
    { id: 103, user: 'carlos.mendoza@empresa.com', action: 'EXPENSE_CREATED', module: 'EXPENSES', resource: 'Expense', resourceId: 12, result: 'SUCCESS', ipAddress: '10.0.0.12', timestamp: '2026-11-23T13:12:44' },
    { id: 104, user: 'intruso@desconocido.com', action: 'LOGIN_FAILED', module: 'AUTH', result: 'UNAUTHORIZED', ipAddress: '185.220.101.5', timestamp: '2026-11-23T11:05:19' },
    { id: 105, user: 'admin@empresa.com', action: 'USER_UPDATED', module: 'USERS', resource: 'User', resourceId: 3, result: 'SUCCESS', ipAddress: '192.168.1.45', timestamp: '2026-11-22T09:20:10' },
  ];

  private readonly logsSignal = signal<AuditLog[]>(this.fallbackLogs);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly allLogs = this.logsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /** GET /api/v1/audits (solo administradores, HU-18) */
  loadLogs(): Observable<AuditLog[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const token = this.authService.token();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    return this.http.get<AuditLog[]>(this.apiUrl, { headers }).pipe(
      tap((logs) => this.logsSignal.set(logs)),
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status !== 0) {
          this.errorSignal.set(err.error?.message || 'Error al cargar los registros de auditoría.');
        }
        return of(this.logsSignal());
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
}
