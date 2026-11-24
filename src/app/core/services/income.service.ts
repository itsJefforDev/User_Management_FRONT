import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  Income,
  CreateIncomeRequest,
  UpdateIncomeRequest,
} from '../models/income.model';
import { Account } from '../models/account.model';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';

export type IncomeSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

@Injectable({
  providedIn: 'root',
})
export class IncomeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);

  private readonly baseUrl = 'http://localhost:8080/userManagement/api/v1';
  private readonly apiUrl = `${this.baseUrl}/incomes`;
  private readonly accountsUrl = `${this.baseUrl}/accounts`;

  // Ingresos demo para modo local (backend no disponible)
  private readonly fallbackIncomes: Income[] = [
    { id: 1, amount: 3500000, description: 'Salario noviembre', date: '2026-11-01', categoryName: 'Salario y Nómina', accountName: 'Cuenta Corriente Nómina', incomeType: 'SALARY', observations: 'Pago mensual' },
    { id: 2, amount: 280000, description: 'Venta de artículos usados', date: '2026-11-12', categoryName: 'Ventas y Negocios', accountName: 'Billetera Digital Nequi', incomeType: 'EXTRA' },
    { id: 3, amount: 900000, description: 'Proyecto freelance de diseño', date: '2026-11-18', categoryName: 'Ventas y Negocios', accountName: 'Cuenta de Ahorros Principal', incomeType: 'FREELANCE', observations: 'Cliente externo' },
    { id: 4, amount: 120000, description: 'Rendimientos CDT', date: '2026-11-20', categoryName: 'Transferencias y Ajustes', accountName: 'Cuenta de Ahorros Principal', incomeType: 'INVESTMENT' },
    { id: 5, amount: 3500000, description: 'Salario octubre', date: '2026-10-01', categoryName: 'Salario y Nómina', accountName: 'Cuenta Corriente Nómina', incomeType: 'SALARY' },
    { id: 6, amount: 400000, description: 'Bonificación trimestral', date: '2026-10-15', categoryName: 'Salario y Nómina', accountName: 'Cuenta Corriente Nómina', incomeType: 'EXTRA' },
  ];

  // ─── Estado ──────────────────────────────────────────────────────────────
  private readonly incomesSignal = signal<Income[]>(this.fallbackIncomes);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly allIncomes = this.incomesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // ─── Filtros / orden / paginación ────────────────────────────────────────
  readonly searchQuery = signal<string>('');
  readonly categoryFilter = signal<string>('ALL');
  readonly accountFilter = signal<string>('ALL');
  readonly typeFilter = signal<string>('ALL');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');
  readonly sortBy = signal<IncomeSort>('date_desc');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // ─── Computados ──────────────────────────────────────────────────────────
  readonly categoryOptions = computed(() =>
    [...new Set(this.incomesSignal().map((e) => e.categoryName).filter(Boolean))].sort()
  );

  readonly accountOptions = computed(() =>
    [...new Set(this.incomesSignal().map((e) => e.accountName).filter(Boolean))].sort()
  );

  readonly filteredIncomes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.categoryFilter();
    const acc = this.accountFilter();
    const type = this.typeFilter().toUpperCase();
    const from = this.dateFrom();
    const to = this.dateTo();
    const sort = this.sortBy();

    const list = this.incomesSignal().filter((e) => {
      const day = (e.date || '').slice(0, 10);
      const matchesSearch =
        !q ||
        (e.description ?? '').toLowerCase().includes(q) ||
        (e.observations ?? '').toLowerCase().includes(q) ||
        (e.categoryName ?? '').toLowerCase().includes(q) ||
        (e.accountName ?? '').toLowerCase().includes(q);
      const matchesCat = cat === 'ALL' || e.categoryName === cat;
      const matchesAcc = acc === 'ALL' || e.accountName === acc;
      const matchesType = type === 'ALL' || (e.incomeType ?? '').toUpperCase() === type;
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

  readonly totalFiltered = computed(() => this.filteredIncomes().length);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize()))
  );

  readonly safePage = computed(() => Math.min(this.currentPage(), this.totalPages()));

  readonly pagedIncomes = computed(() => {
    const start = (this.safePage() - 1) * this.pageSize();
    return this.filteredIncomes().slice(start, start + this.pageSize());
  });

  readonly pageStart = computed(() =>
    this.totalFiltered() === 0 ? 0 : (this.safePage() - 1) * this.pageSize() + 1
  );

  readonly pageEnd = computed(() =>
    Math.min(this.safePage() * this.pageSize(), this.totalFiltered())
  );

  /** Agregados de los ingresos filtrados (RF-009). */
  readonly summary = computed(() => {
    const list = this.filteredIncomes();
    const total = list.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const max = list.reduce<Income | null>(
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
    for (const e of this.filteredIncomes()) {
      const key = e.categoryName || 'Sin categoría';
      totals.set(key, (totals.get(key) ?? 0) + (Number(e.amount) || 0));
    }
    const grand = this.summary().total;
    return [...totals.entries()]
      .map(([name, total]) => ({ name, total, percent: grand ? (total / grand) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
  });

  /** Comparativo mes actual vs mes anterior (sobre todos los ingresos). */
  readonly monthComparison = computed(() => {
    const now = new Date();
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const current = key(now);
    const previous = key(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    let cur = 0;
    let prev = 0;
    for (const e of this.incomesSignal()) {
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
  setSort(v: IncomeSort) { this.sortBy.set(v); this.currentPage.set(1); }

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

  private buildLocalIncome(id: number, r: CreateIncomeRequest, createdAt?: string): Income {
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
      incomeType: r.incomeType,
      observations: r.observations,
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  /**
   * Carga los ingresos del usuario autenticado.
   * El backend no filtra GET /incomes por usuario, por eso se consultan las cuentas
   * del usuario (GET /accounts/user/{id}) y luego GET /incomes/account/{accountId}
   * de cada una, garantizando el aislamiento de datos (RNF-003).
   */
  loadIncomes(): Observable<Income[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    const userId = this.authService.currentUserId();
    const options = this.getHeaders();

    return this.http.get<Account[]>(`${this.accountsUrl}/user/${userId}`, options).pipe(
      switchMap((accounts) =>
        accounts.length
          ? forkJoin(
              accounts.map((a) =>
                this.http.get<Income[]>(`${this.apiUrl}/account/${a.id}`, options)
              )
            )
          : of([] as Income[][])
      ),
      map((groups) => groups.flat()),
      tap((list) => this.incomesSignal.set(list)),
      catchError((err) => {
        if (!this.isOffline(err)) {
          this.errorSignal.set(this.toMessage(err, 'Error al cargar los ingresos.'));
        } else {
          console.warn('[IncomeService] Backend no disponible, usando datos locales:', err.message);
        }
        return of(this.incomesSignal());
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** POST /api/v1/incomes */
  create(request: CreateIncomeRequest): Observable<Income> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Income>(this.apiUrl, request, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) {
          return of(this.buildLocalIncome(Date.now(), request));
        }
        return throwError(() => new Error(this.toMessage(err, 'No se pudo registrar el ingreso.')));
      }),
      tap((created) => this.incomesSignal.update((list) => [created, ...list])),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** PUT /api/v1/incomes/{id} */
  update(id: number, request: UpdateIncomeRequest): Observable<Income> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<Income>(`${this.apiUrl}/${id}`, request, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) {
          const existing = this.incomesSignal().find((e) => e.id === id);
          return of(this.buildLocalIncome(id, request, existing?.createdAt));
        }
        return throwError(() => new Error(this.toMessage(err, 'No se pudo actualizar el ingreso.')));
      }),
      tap((updated) =>
        this.incomesSignal.update((list) => list.map((e) => (e.id === id ? updated : e)))
      ),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** DELETE /api/v1/incomes/{id} (eliminación física en el backend) */
  delete(id: number): Observable<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) return of(undefined as void);
        return throwError(() => new Error(this.toMessage(err, 'No se pudo eliminar el ingreso.')));
      }),
      tap(() => this.incomesSignal.update((list) => list.filter((e) => e.id !== id))),
      finalize(() => this.loadingSignal.set(false))
    );
  }
}
