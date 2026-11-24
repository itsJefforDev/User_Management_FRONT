import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import {
  SavingGoal,
  SavingContribution,
  CreateSavingGoalRequest,
  UpdateSavingGoalRequest,
  CreateContributionRequest,
  daysUntil,
} from '../models/saving.model';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class SavingService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);

  private readonly apiUrl = 'http://localhost:8080/userManagement/api/v1/savings';

  // Metas demo para modo local (backend no disponible)
  private readonly fallbackGoals: SavingGoal[] = [
    { id: 1, name: 'Comprar computador', description: 'Portátil para trabajo y estudio', targetAmount: 4000000, currentAmount: 2500000, targetDate: '2027-06-30', status: 'IN_PROGRESS', userId: 1, progressPercentage: 62.5 },
    { id: 2, name: 'Fondo de emergencia', description: 'Equivalente a tres meses de gastos', targetAmount: 5000000, currentAmount: 1200000, targetDate: '2026-12-15', status: 'IN_PROGRESS', userId: 1, progressPercentage: 24 },
    { id: 3, name: 'Viaje a Cartagena', description: 'Vacaciones de fin de año', targetAmount: 2000000, currentAmount: 2000000, targetDate: '2026-10-20', status: 'COMPLETED', userId: 1, progressPercentage: 100 },
    { id: 4, name: 'Moto nueva', description: 'Meta pospuesta', targetAmount: 9000000, currentAmount: 500000, targetDate: '2027-12-01', status: 'CANCELLED', userId: 1, progressPercentage: 5.5 },
  ];

  // Aportes creados en modo local (para el historial sin backend)
  private readonly localContributions = new Map<number, SavingContribution[]>();

  // ─── Estado ──────────────────────────────────────────────────────────────
  private readonly goalsSignal = signal<SavingGoal[]>(this.fallbackGoals);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly allGoals = this.goalsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Filtros
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  // ─── Computados ──────────────────────────────────────────────────────────
  readonly filteredGoals = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const order: Record<string, number> = { IN_PROGRESS: 0, COMPLETED: 1, CANCELLED: 2 };

    return this.goalsSignal()
      .filter((g) => {
        const matchesSearch =
          !q ||
          (g.name ?? '').toLowerCase().includes(q) ||
          (g.description ?? '').toLowerCase().includes(q);
        const matchesStatus = status === 'ALL' || (g.status ?? '').toUpperCase() === status;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const byStatus = (order[a.status] ?? 3) - (order[b.status] ?? 3);
        if (byStatus !== 0) return byStatus;
        return (a.targetDate || '9999-12-31').localeCompare(b.targetDate || '9999-12-31');
      });
  });

  readonly statusCounts = computed(() => {
    const goals = this.goalsSignal();
    const count = (s: string) => goals.filter((g) => (g.status ?? '').toUpperCase() === s).length;
    return {
      ALL: goals.length,
      IN_PROGRESS: count('IN_PROGRESS'),
      COMPLETED: count('COMPLETED'),
      CANCELLED: count('CANCELLED'),
    };
  });

  /** Indicadores generales (las metas canceladas no cuentan). */
  readonly summary = computed(() => {
    const goals = this.goalsSignal().filter((g) => g.status !== 'CANCELLED');
    const inProgress = goals.filter((g) => g.status === 'IN_PROGRESS');
    const saved = goals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);
    const target = goals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
    const pending = inProgress.reduce(
      (acc, g) => acc + Math.max(0, (Number(g.targetAmount) || 0) - (Number(g.currentAmount) || 0)),
      0
    );
    const dueSoon = inProgress.filter((g) => {
      const d = daysUntil(g.targetDate);
      return d !== null && d <= 30;
    }).length;

    return {
      saved,
      target,
      pending,
      percent: target > 0 ? Math.min(100, (saved / target) * 100) : 0,
      active: inProgress.length,
      completed: goals.filter((g) => g.status === 'COMPLETED').length,
      dueSoon,
    };
  });

  readonly hasActiveFilters = computed(
    () => !!this.searchQuery() || this.statusFilter() !== 'ALL'
  );

  setSearch(v: string) { this.searchQuery.set(v); }
  setStatusFilter(v: string) { this.statusFilter.set(v); }
  resetFilters() { this.searchQuery.set(''); this.statusFilter.set('ALL'); }

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

  private withProgress(goal: SavingGoal): SavingGoal {
    const target = Number(goal.targetAmount) || 0;
    return {
      ...goal,
      progressPercentage: target > 0 ? (Number(goal.currentAmount) / target) * 100 : 0,
    };
  }

  /** Refleja localmente lo que hace el backend al registrar un aporte (suma y completa la meta). */
  private applyContribution(c: SavingContribution) {
    this.goalsSignal.update((list) =>
      list.map((g) => {
        if (g.id !== c.savingGoalId) return g;
        const current = (Number(g.currentAmount) || 0) + (Number(c.amount) || 0);
        const completed = current >= (Number(g.targetAmount) || 0);
        return this.withProgress({
          ...g,
          currentAmount: current,
          status: completed ? 'COMPLETED' : g.status,
        });
      })
    );
  }

  // ─── Metas ───────────────────────────────────────────────────────────────

  /** GET /api/v1/savings/goals/user/{userId} */
  loadGoals(): Observable<SavingGoal[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    const userId = this.authService.currentUserId();

    return this.http.get<SavingGoal[]>(`${this.apiUrl}/goals/user/${userId}`, this.getHeaders()).pipe(
      tap((goals) => this.goalsSignal.set(goals)),
      catchError((err) => {
        if (!this.isOffline(err)) {
          this.errorSignal.set(this.toMessage(err, 'Error al cargar las metas de ahorro.'));
        } else {
          console.warn('[SavingService] Backend no disponible, usando datos locales:', err.message);
        }
        return of(this.goalsSignal());
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** POST /api/v1/savings/goals */
  createGoal(request: CreateSavingGoalRequest): Observable<SavingGoal> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<SavingGoal>(`${this.apiUrl}/goals`, request, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) {
          const now = new Date().toISOString();
          return of(
            this.withProgress({
              id: Date.now(),
              name: request.name,
              description: request.description,
              targetAmount: Number(request.targetAmount),
              currentAmount: 0,
              targetDate: request.targetDate,
              status: 'IN_PROGRESS',
              userId: request.userId,
              createdAt: now,
              updatedAt: now,
            })
          );
        }
        return throwError(() => new Error(this.toMessage(err, 'No se pudo crear la meta.')));
      }),
      tap((created) => this.goalsSignal.update((list) => [created, ...list])),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** PUT /api/v1/savings/goals/{id} */
  updateGoal(id: number, request: UpdateSavingGoalRequest): Observable<SavingGoal> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<SavingGoal>(`${this.apiUrl}/goals/${id}`, request, this.getHeaders()).pipe(
      catchError((err) => {
        if (this.isOffline(err)) {
          const existing = this.goalsSignal().find((g) => g.id === id);
          if (existing) {
            return of(
              this.withProgress({
                ...existing,
                name: request.name,
                description: request.description,
                targetAmount: Number(request.targetAmount),
                targetDate: request.targetDate,
                status: request.status ?? existing.status,
                updatedAt: new Date().toISOString(),
              })
            );
          }
        }
        return throwError(() => new Error(this.toMessage(err, 'No se pudo actualizar la meta.')));
      }),
      tap((updated) =>
        this.goalsSignal.update((list) => list.map((g) => (g.id === id ? updated : g)))
      ),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /** Cancelar meta = PUT con status CANCELLED (conserva el historial, RN-013). */
  cancelGoal(goal: SavingGoal): Observable<SavingGoal> {
    return this.updateGoal(goal.id, {
      name: goal.name,
      description: goal.description,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      status: 'CANCELLED',
    });
  }

  // ─── Aportes ─────────────────────────────────────────────────────────────

  /** GET /api/v1/savings/goals/{goalId}/contributions */
  loadContributions(goalId: number): Observable<SavingContribution[]> {
    return this.http
      .get<SavingContribution[]>(`${this.apiUrl}/goals/${goalId}/contributions`, this.getHeaders())
      .pipe(
        catchError((err) => {
          if (this.isOffline(err)) return of(this.localContributions.get(goalId) ?? []);
          return throwError(() => new Error(this.toMessage(err, 'No se pudo cargar el historial.')));
        })
      );
  }

  /** POST /api/v1/savings/contributions */
  addContribution(request: CreateContributionRequest): Observable<SavingContribution> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<SavingContribution>(`${this.apiUrl}/contributions`, request, this.getHeaders())
      .pipe(
        catchError((err) => {
          if (this.isOffline(err)) {
            const account = this.accountService
              .allAccounts()
              .find((a) => a.id === request.accountId);
            const local: SavingContribution = {
              id: Date.now(),
              amount: Number(request.amount),
              date: request.date,
              notes: request.notes,
              savingGoalId: request.savingGoalId,
              accountName: account?.name,
              createdAt: new Date().toISOString(),
            };
            this.localContributions.set(request.savingGoalId, [
              local,
              ...(this.localContributions.get(request.savingGoalId) ?? []),
            ]);
            return of(local);
          }
          return throwError(() => new Error(this.toMessage(err, 'No se pudo registrar el aporte.')));
        }),
        tap((contribution) => this.applyContribution(contribution)),
        finalize(() => this.loadingSignal.set(false))
      );
  }
}
