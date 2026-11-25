import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '../models/account.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = 'http://localhost:8080/userManagement/api/v1/accounts';

  // Cuentas demo iniciales para contingencia/modo local si el backend no está disponible
  private readonly fallbackAccounts: Account[] = [
    {
      id: 1,
      name: 'Cuenta de Ahorros Principal',
      type: 'BANK',
      balance: 4850000,
      active: true,
      userId: 1,
      createdAt: '2026-01-10T10:00:00',
      updatedAt: '2026-02-15T15:30:00',
    },
    {
      id: 2,
      name: 'Billetera Digital Nequi',
      type: 'DIGITAL_WALLET',
      balance: 780000,
      active: true,
      userId: 1,
      createdAt: '2026-01-20T11:20:00',
      updatedAt: '2026-02-28T09:15:00',
    },
    {
      id: 3,
      name: 'Caja Menor / Efectivo',
      type: 'CASH',
      balance: 320000,
      active: true,
      userId: 1,
      createdAt: '2026-02-01T08:00:00',
      updatedAt: '2026-03-01T14:45:00',
    },
    {
      id: 4,
      name: 'Cuenta Corriente Nómina',
      type: 'BANK',
      balance: 9200000,
      active: true,
      userId: 1,
      createdAt: '2026-02-10T16:00:00',
      updatedAt: '2026-03-05T12:00:00',
    },
  ];

  // Estado reactivo con Signals
  private readonly accountsSignal = signal<Account[]>(this.fallbackAccounts);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Filtros
  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');

  // Señales públicas de solo lectura
  readonly allAccounts = this.accountsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computados reactivos
  readonly filteredAccounts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const type = this.typeFilter().toUpperCase();
    const status = this.statusFilter().toUpperCase();

    return this.accountsSignal().filter((acc) => {
      const matchesSearch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.type.toLowerCase().includes(q);

      const matchesType = type === 'ALL' || acc.type.toUpperCase() === type;

      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' && acc.active) ||
        (status === 'INACTIVE' && !acc.active);

      return matchesSearch && matchesType && matchesStatus;
    });
  });

  readonly totalAccounts = computed(() => this.accountsSignal().length);

  readonly activeAccountsCount = computed(
    () => this.accountsSignal().filter((a) => a.active).length
  );

  readonly totalBalance = computed(() =>
    this.accountsSignal()
      .filter((a) => a.active)
      .reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0)
  );

  readonly bankCount = computed(
    () => this.accountsSignal().filter((a) => a.active && a.type.toUpperCase() === 'BANK').length
  );

  readonly walletCount = computed(
    () =>
      this.accountsSignal().filter(
        (a) => a.active && a.type.toUpperCase() === 'DIGITAL_WALLET'
      ).length
  );

  readonly cashCount = computed(
    () => this.accountsSignal().filter((a) => a.active && a.type.toUpperCase() === 'CASH').length
  );

  setSearchQuery(q: string) {
    this.searchQuery.set(q);
  }

  setTypeFilter(type: string) {
    this.typeFilter.set(type);
  }

  setStatusFilter(status: string) {
    this.statusFilter.set(status);
  }

  /**
   * NUEVO MÉTODO: Actualiza el saldo de una cuenta localmente.
   * Sirve para que la interfaz reste o sume el dinero al instante
   * cuando el backend no está disponible.
   */
  updateLocalBalance(accountId: number, amount: number): void {
    this.accountsSignal.update((accounts) =>
      accounts.map((acc) =>
        acc.id === accountId ? { ...acc, balance: acc.balance + amount } : acc
      )
    );
  }

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

  /**
   * GET /api/v1/accounts/user/{userId}
   * Carga las cuentas asociadas al usuario especificado.
   */
  loadAccountsByUser(userId?: number): void {
    const targetUserId = userId || this.authService.currentUserId();
    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    this.http
      .get<Account[]>(`${this.apiUrl}/user/${targetUserId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((accounts) => {
          this.accountsSignal.set(accounts);
        }),
        catchError((error) => {
          console.warn(
            '[AccountService] Backend no disponible o error al consultar cuentas. Usando datos locales de contingencia:',
            error
          );
          // Mantiene las cuentas en memoria
          return of(this.accountsSignal());
        }),
        finalize(() => this.loadingSignal.set(false))
      )
      .subscribe();
  }

  /**
   * GET /api/v1/accounts/{id}
   */
  getAccountById(id: number): Observable<Account> {
    return this.http
      .get<Account>(`${this.apiUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError(() => {
          const found = this.accountsSignal().find((a) => a.id === id);
          if (found) return of(found);
          return throwError(() => new Error(`Cuenta con ID ${id} no encontrada`));
        })
      );
  }

  /**
   * POST /api/v1/accounts
   */
  createAccount(request: CreateAccountRequest): Observable<Account> {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    return this.http
      .post<Account>(this.apiUrl, request, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.warn('[AccountService] Fallback local para creación de cuenta:', error);
          const fallbackNewAccount: Account = {
            id: Date.now(),
            name: request.name,
            type: request.type,
            balance: Number(request.initialBalance) || 0,
            active: true,
            userId: request.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return of(fallbackNewAccount);
        }),
        tap((created) => {
          this.accountsSignal.update((list) => [created, ...list]);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * PUT /api/v1/accounts/{id}
   */
  updateAccount(id: number, request: UpdateAccountRequest): Observable<Account> {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    return this.http
      .put<Account>(`${this.apiUrl}/${id}`, request, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.warn('[AccountService] Fallback local para actualización de cuenta:', error);
          const current = this.accountsSignal().find((a) => a.id === id);
          if (current) {
            const updated: Account = {
              ...current,
              name: request.name || current.name,
              type: request.type || current.type,
              updatedAt: new Date().toISOString(),
            };
            return of(updated);
          }
          return throwError(() => error);
        }),
        tap((updated) => {
          this.accountsSignal.update((list) =>
            list.map((a) => (a.id === id ? updated : a))
          );
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * DELETE /api/v1/accounts/{id} (Desactivación lógica de la cuenta)
   */
  deactivateAccount(id: number): Observable<void> {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);

    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.warn('[AccountService] Fallback local para desactivación de cuenta:', error);
          return of(undefined as void);
        }),
        tap(() => {
          this.accountsSignal.update((list) =>
            list.map((a) => (a.id === id ? { ...a, active: false } : a))
          );
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  /**
   * GET /api/v1/accounts/{id}/balance
   */
  getAccountBalance(id: number): Observable<number> {
    return this.http
      .get<number>(`${this.apiUrl}/${id}/balance`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError(() => {
          const acc = this.accountsSignal().find((a) => a.id === id);
          return of(acc ? acc.balance : 0);
        })
      );
  }
}