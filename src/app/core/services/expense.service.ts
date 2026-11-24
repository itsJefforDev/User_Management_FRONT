import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from '../models/expense.model';
import { Account } from '../models/account.model';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';

export type ExpenseSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);

  private readonly baseUrl = 'http://localhost:8080/userManagement/api/v1';
  private readonly apiUrl = `${this.baseUrl}/expenses`;
  private readonly accountsUrl = `${this.baseUrl}/accounts`;

  // Gastos demo para modo local (backend no disponible)
  private readonly fallbackExpenses: Expense[] = [
    { id: 1, amount: 450000, description: 'Supermercado del mes', date: '2026-11-03', categoryName: 'Alimentación y Comida', accountName: 'Cuenta de Ahorros Principal', expenseType: 'VARIABLE', observations: 'Compra quincenal' },
    { id: 2, amount: 180000, description: 'Gasolina y peajes', date: '2026-11-08', categoryName: 'Transporte y Movilidad', accountName: 'Billetera Digital Nequi', expenseType: 'VARIABLE' },
    { id: 3, amount: 300000, description: 'Servicios públicos', date: '2026-11-10', categoryName: 'Servicios Públicos e Internet', accountName: 'Cuenta Corriente Nómina', expenseType: 'FIXED', observations: 'Agua, luz e internet' },
    { id: 4, amount: 45000, description: 'Suscripción streaming', date: '2026-11-15', categoryName: 'Servicios Públicos e Internet', accountName: 'Cuenta Corriente Nómina', expenseType: 'RECURRING' },
    { id: 5, amount: 62000, description: 'Almuerzo con amigos', date: '2026-11-20', categoryName: 'Alimentación y Comida', accountName: 'Caja Menor / Efectivo', expenseType: 'VARIABLE' },
    { id: 6, amount: 410000, description: 'Supermercado del mes', date: '2026-10-04', categoryName: 'Alimentación y Comida', accountName: 'Cuenta de Ahorros Principal', expenseType: 'VARIABLE' },
    { id: 7, amount: 300000, description: 'Servicios públicos', date: '2026-10-10', categoryName: 'Servicios Públicos e Internet', accountName: 'Cuenta Corriente Nómina', expenseType: 'FIXED' },
    { id: 8, amount: 150000, description: 'Transporte mensual', date: '2026-10-12', categoryName: 'Transporte y Movilidad', accountName: 'Billetera Digital Nequi', expenseType: 'RECURRING' },
  ];

  // ─── Estado ──────────────────────────────────────────────────────────────
  private readonly expensesSignal = signal<Expense[]>(this.fallbackExpenses);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly allExpenses = this.expensesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // ─── Filtros / orden / paginación ────────────────────────────────────────
  readonly searchQuery = signal<string>('');
  readonly categoryFilter = signal<string>('ALL');
  readonly accountFilter = signal<string>('ALL');
  readonly typeFilter = signal<string>('ALL');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');
  readonly sortBy = signal<ExpenseSort>('date_desc');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // ─── Computados ──────────────────────────────────────────────────────────
  readonly categoryOptions = computed(() =>
    [...new Set(this.expensesSignal().map((e) => e.categoryName).filter(Boolean))].sort()
  );

  readonly accountOptions = computed(() =>
    [...new Set(this.expensesSignal().map((e) => e.accountName).filter(Boolean))].sort()
  );

  readonly filteredExpenses = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.categoryFilter();
    const acc = this.accountFilter();
    const type = this.typeFilter().toUpperCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    const sort = this.sortBy();

    const list = this.expensesSignal().filter((e) => {
      const day = (e.date || '').slice(0, 10);
      const matchesSearch =
        !q ||
        (e.description ?? '').toLowerCase().includes(q) ||
        (e.observations ?? '').toLowerCase().includes(q) ||
        (e.categoryName ?? '').toLowerCase().includes(q) ||
        (e.accountName ?? '').toLowerCase().includes(q);
      const matchesCat = cat === 'ALL' || e.categoryName === cat;
      const matchesAcc = acc === 'ALL' || e.accountName === acc;
      const matchesType = type === 'ALL' || (e.expenseType ?? '').toUpperCase() === type;
      const matchesFrom = !from || day >= from;
      const matchesTo = !to || day <= to;
      return matchesSearch && matchesCat && matchesAcc && matchesType && matchesFrom && matchesTo;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'date_asc':
          return a.date.localeCompare(b.date) || a.id - b.id;
        case 'amount_desc':
          return Number(b.amount) - Number(a.amount);
        case 'amount_asc':
          return Number(a.amount) - Number(b.amount);
        default:
          return b.date.localeCompare(a.date) || b.id - a.id;
      }
    });
  });

  readonly totalFiltered = computed(() => this.filteredExpenses().length);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize()))
  );

  readonly safePage = computed(() => Math.min(this.currentPage(), this.totalPages()));

  readonly pagedExpenses = computed(() => {
    const start = (this.safePage() - 1) * this.pageSize();
    return this.filteredExpenses().slice(start, start + this.pageSize());
  });

  readonly pageStart = computed(() =>
    this.totalFiltered() === 0 ? 0 : (this.safePage() - 1) * this.pageSize() + 1
  );

  readonly pageEnd = computed(() =>
    Math.min(this.safePage() * this.pageSize(), this.totalFiltered())
  );

  /** Agregados de los gastos filtrados (RF-009). */
  readonly summary = computed(() => {
    const list = this.filteredExpenses();
    const total = list.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const max = list.reduce<Expense | null>(
      (best, e) => (!best || Number(e.amount) > Number(best.amount) ? e : best),
      null
    );
    return {
      total,
      count: list.length,
      average: list.length ? total / list.length : 0,
      max,
    };
  });

  readonly byCategory = computed(() => {
    const totals = new Map<string, number>();
    for (const e of this.filteredExpenses()) {
      const key = e.categoryName || 'Sin categoría';
      totals.set(key, (totals.get(key) ?? 0) + (Number(e.amount) || 0));
    }
    const grand = this.summary().total;
    return [...totals.entries()]
      .map(([name, total]) => ({ name, total, percent: grand ? (total / grand) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  });

  /** Comparativo mes actual vs mes anterior (sobre todos los gastos). */
  readonly monthComparison = computed(() => {
    const now = new Date();
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const current = key(now);
    const previous = key(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    let cur = 0;
    let prev = 0;
    for (const e of this.expensesSignal()) {
      const month = (e.date || '').slice(0, 7);
      if (month === current) cur += Number(e.amount) || 0;
      else if (month === previous) prev += Number(e.amount) || 0;
    }
    return {
      current: cur,
      previous: prev,
      variation: prev > 0 ? ((cur - prev) / prev) * 100 : null,
    };
  });

  readonly hasActiveFilters = computed(
    () =>
      !!this.searchQuery() ||
      this.categoryFilter() !== 'ALL' ||
      this.accountFilter() !== 'ALL' ||
      this.typeFilter() !== 'ALL' ||
      !!this.dateFrom() ||
      !!this.dateTo()
  );

  // ─── Setters de filtros (reinician la paginación) ────────────────────────
  setSearch(v: string) { this.searchQuery.set(v); this.currentPage.set(1); }
  setCategoryFilter(v: string) { this.categoryFilter.set(v); this.currentPage.set(1); }
  setAccountFilter(v: string) { this.accountFilter.set(v); this.currentPage.set(1); }
  setTypeFilter(v: string) { this.typeFilter.set(v); this.currentPage.set(1); }
  setDateFrom(v: string) { this.dateFrom.set(v); this.currentPage.set(1); }
  setDateTo(v: string) { this.dateTo.set(v); this.currentPage.set(1); }
  setSort(v: ExpenseSort) { this.sortBy.set(v); this.currentPage.set(1); }

  resetFilters() {
    this.searchQuery.set('');
    this.categoryFilter.set('ALL');
    this.accountFilter.set('ALL');
    this.typeFilter.set('ALL');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    this.currentPage.set(Math.min(Math.max(1, page), this.totalPages()));
  }
  nextPage() { this.goToPage(this.safePage() + 1); }
  prevPage() { this.goToPage(this.safePage() - 1); }

  // ─── Helpers privados ────────────────────────────────────────────────────
  private getHeaders(): { headers: HttpHeaders } {
    const token = this.authService.token();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  /** Solo se usa el fallback local cuando el backend no es alcanzable (status 0). */
  private isOffline(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 0;
  }

  private toMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse && err.error?.message) {
      return err.error.message;
    }
    return fallback;
  }

  private buildLocalExpense(id: number, r: CreateExpenseRequest, createdAt?: string): Expense {
    const category = this.categoryService.allCategories().find((c) => c.id === r.categoryId);
    const account = this.accountService.allAccounts().find((a) => a.id === r.accountId);
    const now = new Date().toISOString();
    return {
      id,
      amount: Number(r.amount),
      description: r.description,
      date: r.date,
      categoryName: category?.name ?? 'Sin categoría',
      accountName: account?.name ?? 'Sin cuenta',
      expenseType: r.expenseType,
      observations: r.observations,
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  /**
   * Carga los gastos del usuario autenticado.
   * El backend no filtra GET /expenses por usuario, por eso se consultan las cuentas
   * del usuario (GET /accounts/user/{id}) y luego GET /expenses/account/{accountId}
   * de cada una, garantizando el aislamiento de datos (RNF-003).
   */
  loadExpenses(): Observable<Expense[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    const userId = this.authService.currentUserId();
    const options = this.getHeaders();

    return this.http.get<Account[]>(`${this.accountsUrl}/user/${userId}`, options).pipe(
      switchMap((accounts) =>
        accounts.length
          ? forkJoin(
              accounts.map((a) =>
                this.http.get<Expense[]>(`${this.apiUrl}/account/${a.id}`, options)
              )
            )
          : of([] as Expense[][])
      ),
      map((groups) => groups.flat()),
      tap((list) => this.expensesSignal.set(list)),
      catchError((err) => {
        if (!this.isOffline(err)) {
          this.errorSignal.set(this.toMessage(err, 'Error al cargar los gastos.'));
        } else {
          console.warn('[ExpenseService] Backend no disponible, usando datos locales:', err.message);
        }
        return of(this.expensesSignal());
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** POST /api/v1/expenses */
  create(request: CreateExpenseRequest): Observable<Expense> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Expense>(this.apiUrl, request, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) {
          return of(this.buildLocalExpense(Date.now(), request));
        }
        return throwError(() => new Error(this.toMessage(err, 'No se pudo registrar el gasto.')));
      }),
      tap((created) => this.expensesSignal.update((list) => [created, ...list])),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** PUT /api/v1/expenses/{id} */
  update(id: number, request: UpdateExpenseRequest): Observable<Expense> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<Expense>(`${this.apiUrl}/${id}`, request, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) {
          const existing = this.expensesSignal().find((e) => e.id === id);
          return of(this.buildLocalExpense(id, request, existing?.createdAt));
        }
        return throwError(() => new Error(this.toMessage(err, 'No se pudo actualizar el gasto.')));
      }),
      tap((updated) =>
        this.expensesSignal.update((list) => list.map((e) => (e.id === id ? updated : e)))
      ),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** DELETE /api/v1/expenses/{id} (eliminación física en el backend) */
  delete(id: number): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) return of(undefined as void);
        return throwError(() => new Error(this.toMessage(err, 'No se pudo eliminar el gasto.')));
      }),
      tap(() => this.expensesSignal.update((list) => list.filter((e) => e.id !== id))),
      finalize(() => this.loadingSignal.set(false))
    );
  }
}
