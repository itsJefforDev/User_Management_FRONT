import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { CategoryService } from './category.service';
import { ExpenseService } from './expense.service';
import { IncomeService } from './income.service';
import { SavingService } from './saving.service';
import { UserService } from './user.service';
import { AuditService } from './audit.service';
import { Expense, getExpenseTypeLabel } from '../models/expense.model';
import { Income, getIncomeTypeLabel } from '../models/income.model';
import { SavingContribution, getSavingPending, getSavingProgress, getSavingStatusLabel } from '../models/saving.model';
import { getAccountTypeLabel } from '../models/account.model';
import {
  REPORT_TYPES,
  ReportBreakdown,
  ReportEvolutionPoint,
  ReportFormat,
  ReportPreset,
  ReportType,
  ReportView,
  periodLabel,
  presetRange,
} from '../models/report.model';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly authService = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly categoryService = inject(CategoryService);
  private readonly expenseService = inject(ExpenseService);
  private readonly incomeService = inject(IncomeService);
  private readonly savingService = inject(SavingService);
  private readonly userService = inject(UserService);
  private readonly auditService = inject(AuditService);

  // ─── Filtros ─────────────────────────────────────────────────────────────
  readonly reportType = signal<ReportType>('SUMMARY');
  readonly preset = signal<ReportPreset>('YEAR');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');
  readonly accountFilter = signal<string>('ALL');
  readonly categoryFilter = signal<string>('ALL');
  readonly movementFilter = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  readonly statusFilter = signal<string>('ALL');

  private readonly contributionsSignal = signal<SavingContribution[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    this.applyPreset('YEAR');
  }

  // ─── Metadatos ───────────────────────────────────────────────────────────
  readonly availableReports = computed(() =>
    REPORT_TYPES.filter((r) => !r.adminOnly || this.authService.isAdmin())
  );

  readonly currentInfo = computed(
    () => REPORT_TYPES.find((r) => r.value === this.reportType()) ?? REPORT_TYPES[0]
  );

  readonly periodText = computed(() =>
    this.reportType() === 'USERS'
      ? 'Estado actual del sistema'
      : periodLabel(this.dateFrom(), this.dateTo())
  );

  readonly accountOptions = computed(() =>
    [...new Set(this.accountService.allAccounts().map((a) => a.name))].sort()
  );

  readonly categoryOptions = computed(() => {
    const type = this.reportType();
    const allowed =
      type === 'EXPENSES' ? ['EXPENSE', 'BOTH'] : type === 'INCOMES' ? ['INCOME', 'BOTH'] : null;
    return [
      ...new Set(
        this.categoryService
          .allCategories()
          .filter((c) => !allowed || allowed.includes((c.type || '').toUpperCase()))
          .map((c) => c.name)
      ),
    ].sort();
  });

  readonly statusOptions = computed<{ value: string; label: string }[]>(() => {
    switch (this.reportType()) {
      case 'SAVINGS':
        return ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((v) => ({ value: v, label: getSavingStatusLabel(v) }));
      case 'USERS':
        return [
          { value: 'ACTIVE', label: 'Activo' },
          { value: 'INACTIVE', label: 'Inactivo' },
          { value: 'LOCKED', label: 'Bloqueado' },
        ];
      case 'AUDIT':
        return ['SUCCESS', 'FAILED', 'UNAUTHORIZED'].map((v) => ({ value: v, label: v }));
      default:
        return [];
    }
  });

  // ─── Acciones sobre filtros ──────────────────────────────────────────────
  setReportType(type: ReportType) {
    const info = REPORT_TYPES.find((r) => r.value === type);
    if (!info || (info.adminOnly && !this.authService.isAdmin())) return;
    this.reportType.set(type);
    this.categoryFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.movementFilter.set('ALL');
  }

  applyPreset(preset: ReportPreset) {
    const { from, to } = presetRange(preset);
    this.preset.set(preset);
    this.dateFrom.set(from);
    this.dateTo.set(to);
  }

  setDateFrom(v: string) { this.dateFrom.set(v); this.preset.set('CUSTOM'); }
  setDateTo(v: string) { this.dateTo.set(v); this.preset.set('CUSTOM'); }

  resetFilters() {
    this.accountFilter.set('ALL');
    this.categoryFilter.set('ALL');
    this.movementFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.applyPreset('YEAR');
  }

  // ─── Carga de datos (reutiliza los servicios de cada módulo) ─────────────
  loadAll(): Observable<void> {
    this.loadingSignal.set(true);
    this.accountService.loadAccountsByUser();

    if (this.authService.isAdmin()) {
      this.userService.loadUsers();
      this.auditService.loadLogs().subscribe();
    }

    return forkJoin([
      this.categoryService.loadCategories(),
      this.expenseService.loadExpenses(),
      this.incomeService.loadIncomes(),
      this.savingService.loadGoals(),
    ]).pipe(
      switchMap(([, , , goals]) =>
        goals.length
          ? forkJoin(
              goals.map((g) =>
                this.savingService
                  .loadContributions(g.id)
                  .pipe(catchError(() => of([] as SavingContribution[])))
              )
            )
          : of([] as SavingContribution[][])
      ),
      tap((groups) => this.contributionsSignal.set(groups.flat())),
      map(() => undefined),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  // ─── Datos filtrados ─────────────────────────────────────────────────────
  private inRange(date: string): boolean {
    const d = (date || '').slice(0, 10);
    const from = this.dateFrom();
    const to = this.dateTo();
    return (!from || d >= from) && (!to || d <= to);
  }

  readonly filteredExpenses = computed(() => {
    const acc = this.accountFilter();
    const cat = this.categoryFilter();
    return this.expenseService
      .allExpenses()
      .filter(
        (e) =>
          this.inRange(e.date) &&
          (acc === 'ALL' || e.accountName === acc) &&
          (cat === 'ALL' || e.categoryName === cat)
      );
  });

  readonly filteredIncomes = computed(() => {
    const acc = this.accountFilter();
    const cat = this.categoryFilter();
    return this.incomeService
      .allIncomes()
      .filter(
        (i) =>
          this.inRange(i.date) &&
          (acc === 'ALL' || i.accountName === acc) &&
          (cat === 'ALL' || i.categoryName === cat)
      );
  });

  readonly filteredContributions = computed(() => {
    const acc = this.accountFilter();
    return this.contributionsSignal().filter(
      (c) => this.inRange(c.date) && (acc === 'ALL' || c.accountName === acc)
    );
  });

  // ─── Reporte actual ──────────────────────────────────────────────────────
  readonly report = computed<ReportView>(() => {
    let type = this.reportType();
    const info = REPORT_TYPES.find((r) => r.value === type);
    if (info?.adminOnly && !this.authService.isAdmin()) type = 'SUMMARY';

    switch (type) {
      case 'EXPENSES': return this.buildExpenses();
      case 'INCOMES': return this.buildIncomes();
      case 'MOVEMENTS': return this.buildMovements();
      case 'ACCOUNTS': return this.buildAccounts();
      case 'SAVINGS': return this.buildSavings();
      case 'USERS': return this.buildUsers();
      case 'AUDIT': return this.buildAudit();
      default: return this.buildSummary();
    }
  });

  // ─── Helpers de cálculo ──────────────────────────────────────────────────
  private sum(values: number[]): number {
    return values.reduce((acc, v) => acc + (Number(v) || 0), 0);
  }

  private breakdown<T>(
    title: string,
    list: T[],
    key: (t: T) => string,
    value: (t: T) => number,
    format: ReportFormat = 'currency'
  ): ReportBreakdown {
    const map = new Map<string, number>();
    let total = 0;
    for (const item of list) {
      const k = key(item) || 'Sin dato';
      const v = Number(value(item)) || 0;
      map.set(k, (map.get(k) ?? 0) + v);
      total += v;
    }
    const items = [...map.entries()]
      .map(([name, t]) => ({ name, total: t, percent: total > 0 ? (t / total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);
    return { title, format, items };
  }

  private evolution(incomes: Income[], expenses: Expense[]): ReportEvolutionPoint[] {
    const months = new Map<string, { income: number; expense: number }>();
    const bucket = (date: string) => {
      const key = (date || '').slice(0, 7);
      if (!months.has(key)) months.set(key, { income: 0, expense: 0 });
      return months.get(key)!;
    };
    for (const i of incomes) bucket(i.date).income += Number(i.amount) || 0;
    for (const e of expenses) bucket(e.date).expense += Number(e.amount) || 0;

    return [...months.entries()]
      .filter(([key]) => key.length === 7)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, v]) => {
        const [y, m] = key.split('-');
        return { label: `${MONTHS[Number(m) - 1] ?? m} ${y}`, income: v.income, expense: v.expense };
      });
  }

  private byDateDesc<T extends { date: string; id: number }>(list: T[]): T[] {
    return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }

  // ─── Constructores de reportes ───────────────────────────────────────────
  private buildSummary(): ReportView {
    const incomes = this.filteredIncomes();
    const expenses = this.filteredExpenses();
    const totalIncome = this.sum(incomes.map((i) => i.amount));
    const totalExpense = this.sum(expenses.map((e) => e.amount));
    const saved = this.sum(this.filteredContributions().map((c) => c.amount));
    const available = totalIncome - totalExpense - saved;
    const evolution = this.evolution(incomes, expenses);

    return {
      type: 'SUMMARY',
      title: 'Resumen financiero',
      description: 'Ingresos, gastos, aportes a ahorro y disponible del período',
      kpis: [
        { label: 'Ingresos', value: totalIncome, format: 'currency', tone: 'positive' },
        { label: 'Gastos', value: totalExpense, format: 'currency', tone: 'negative' },
        { label: 'Aportes a ahorro', value: saved, format: 'currency' },
        {
          label: 'Disponible',
          value: available,
          format: 'currency',
          tone: available >= 0 ? 'positive' : 'negative',
          hint: totalIncome > 0 ? `Tasa de ahorro: ${((saved / totalIncome) * 100).toFixed(1)}%` : undefined,
        },
      ],
      breakdowns: [
        this.breakdown('Gastos por categoría', expenses, (e) => e.categoryName, (e) => e.amount),
        this.breakdown('Ingresos por categoría', incomes, (i) => i.categoryName, (i) => i.amount),
      ],
      evolution,
      evolutionSeries: ['income', 'expense'],
      columns: [
        { key: 'month', label: 'Mes', format: 'text' },
        { key: 'income', label: 'Ingresos', format: 'currency', align: 'right' },
        { key: 'expense', label: 'Gastos', format: 'currency', align: 'right' },
        { key: 'balance', label: 'Balance', format: 'currency', align: 'right' },
      ],
      rows: evolution.map((p) => ({
        month: p.label,
        income: p.income,
        expense: p.expense,
        balance: p.income - p.expense,
      })),
    };
  }

  private buildExpenses(): ReportView {
    const list = this.byDateDesc(this.filteredExpenses());
    const total = this.sum(list.map((e) => e.amount));
    const max = list.reduce<Expense | null>(
      (best, e) => (!best || Number(e.amount) > Number(best.amount) ? e : best),
      null
    );

    return {
      type: 'EXPENSES',
      title: 'Reporte de gastos',
      description: 'Detalle de gastos por período, categoría y cuenta',
      kpis: [
        { label: 'Total gastado', value: total, format: 'currency', tone: 'negative' },
        { label: 'Promedio por gasto', value: list.length ? total / list.length : 0, format: 'currency' },
        { label: 'Mayor gasto', value: max ? Number(max.amount) : 0, format: 'currency', hint: max?.description },
        { label: 'Movimientos', value: list.length, format: 'number' },
      ],
      breakdowns: [
        this.breakdown('Gastos por categoría', list, (e) => e.categoryName, (e) => e.amount),
        this.breakdown('Gastos por cuenta', list, (e) => e.accountName, (e) => e.amount),
      ],
      evolution: this.evolution([], list),
      evolutionSeries: ['expense'],
      columns: [
        { key: 'date', label: 'Fecha', format: 'date' },
        { key: 'description', label: 'Descripción', format: 'text' },
        { key: 'category', label: 'Categoría', format: 'text' },
        { key: 'account', label: 'Cuenta', format: 'text' },
        { key: 'type', label: 'Tipo', format: 'text' },
        { key: 'amount', label: 'Valor', format: 'currency', align: 'right' },
      ],
      rows: list.map((e) => ({
        date: e.date,
        description: e.description,
        category: e.categoryName,
        account: e.accountName,
        type: getExpenseTypeLabel(e.expenseType),
        amount: Number(e.amount),
      })),
    };
  }

  private buildIncomes(): ReportView {
    const list = this.byDateDesc(this.filteredIncomes());
    const total = this.sum(list.map((i) => i.amount));
    const max = list.reduce<Income | null>(
      (best, i) => (!best || Number(i.amount) > Number(best.amount) ? i : best),
      null
    );

    return {
      type: 'INCOMES',
      title: 'Reporte de ingresos',
      description: 'Fuentes y detalle de ingresos por período, categoría y cuenta',
      kpis: [
        { label: 'Total recibido', value: total, format: 'currency', tone: 'positive' },
        { label: 'Promedio por ingreso', value: list.length ? total / list.length : 0, format: 'currency' },
        { label: 'Mayor ingreso', value: max ? Number(max.amount) : 0, format: 'currency', hint: max?.description },
        { label: 'Movimientos', value: list.length, format: 'number' },
      ],
      breakdowns: [
        this.breakdown('Fuentes de ingreso (categoría)', list, (i) => i.categoryName, (i) => i.amount),
        this.breakdown('Ingresos por cuenta', list, (i) => i.accountName, (i) => i.amount),
      ],
      evolution: this.evolution(list, []),
      evolutionSeries: ['income'],
      columns: [
        { key: 'date', label: 'Fecha', format: 'date' },
        { key: 'description', label: 'Descripción', format: 'text' },
        { key: 'category', label: 'Categoría', format: 'text' },
        { key: 'account', label: 'Cuenta destino', format: 'text' },
        { key: 'type', label: 'Tipo', format: 'text' },
        { key: 'amount', label: 'Valor', format: 'currency', align: 'right' },
      ],
      rows: list.map((i) => ({
        date: i.date,
        description: i.description,
        category: i.categoryName,
        account: i.accountName,
        type: getIncomeTypeLabel(i.incomeType),
        amount: Number(i.amount),
      })),
    };
  }

  private buildMovements(): ReportView {
    const mv = this.movementFilter();
    const incomes = mv === 'EXPENSE' ? [] : this.filteredIncomes();
    const expenses = mv === 'INCOME' ? [] : this.filteredExpenses();
    const totalIncome = this.sum(incomes.map((i) => i.amount));
    const totalExpense = this.sum(expenses.map((e) => e.amount));

    const rows = [
      ...incomes.map((i) => ({ id: i.id, kind: 'Ingreso', date: i.date, description: i.description, category: i.categoryName, account: i.accountName, amount: Number(i.amount) })),
      ...expenses.map((e) => ({ id: e.id, kind: 'Gasto', date: e.date, description: e.description, category: e.categoryName, account: e.accountName, amount: -Number(e.amount) })),
    ].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

    return {
      type: 'MOVEMENTS',
      title: 'Movimientos por período',
      description: 'Ingresos y gastos ordenados cronológicamente',
      kpis: [
        { label: 'Ingresos', value: totalIncome, format: 'currency', tone: 'positive' },
        { label: 'Gastos', value: totalExpense, format: 'currency', tone: 'negative' },
        { label: 'Balance neto', value: totalIncome - totalExpense, format: 'currency', tone: totalIncome - totalExpense >= 0 ? 'positive' : 'negative' },
        { label: 'Movimientos', value: rows.length, format: 'number' },
      ],
      breakdowns: [],
      evolution: this.evolution(incomes, expenses),
      evolutionSeries: ['income', 'expense'],
      columns: [
        { key: 'date', label: 'Fecha', format: 'date' },
        { key: 'kind', label: 'Movimiento', format: 'text' },
        { key: 'description', label: 'Descripción', format: 'text' },
        { key: 'category', label: 'Categoría', format: 'text' },
        { key: 'account', label: 'Cuenta', format: 'text' },
        { key: 'amount', label: 'Valor', format: 'currency', align: 'right' },
      ],
      rows,
    };
  }

  private buildAccounts(): ReportView {
    const acc = this.accountFilter();
    const accounts = this.accountService.allAccounts().filter((a) => acc === 'ALL' || a.name === acc);
    const incomes = this.filteredIncomes();
    const expenses = this.filteredExpenses();
    const active = accounts.filter((a) => a.active);

    return {
      type: 'ACCOUNTS',
      title: 'Reporte de cuentas',
      description: 'Saldos actuales y movimientos del período por cuenta',
      kpis: [
        { label: 'Saldo total activo', value: this.sum(active.map((a) => a.balance)), format: 'currency', tone: 'positive' },
        { label: 'Cuentas', value: accounts.length, format: 'number', hint: `${active.length} activa(s)` },
        { label: 'Ingresos del período', value: this.sum(incomes.map((i) => i.amount)), format: 'currency' },
        { label: 'Gastos del período', value: this.sum(expenses.map((e) => e.amount)), format: 'currency' },
      ],
      breakdowns: [
        this.breakdown('Saldo por cuenta', active, (a) => a.name, (a) => a.balance),
      ],
      evolution: [],
      evolutionSeries: [],
      columns: [
        { key: 'name', label: 'Cuenta', format: 'text' },
        { key: 'type', label: 'Tipo', format: 'text' },
        { key: 'status', label: 'Estado', format: 'text' },
        { key: 'balance', label: 'Saldo', format: 'currency', align: 'right' },
        { key: 'income', label: 'Ingresos', format: 'currency', align: 'right' },
        { key: 'expense', label: 'Gastos', format: 'currency', align: 'right' },
        { key: 'movements', label: 'Movimientos', format: 'number', align: 'right' },
      ],
      rows: accounts.map((a) => {
        const inc = incomes.filter((i) => i.accountName === a.name);
        const exp = expenses.filter((e) => e.accountName === a.name);
        return {
          name: a.name,
          type: getAccountTypeLabel(a.type),
          status: a.active ? 'Activa' : 'Inactiva',
          balance: Number(a.balance),
          income: this.sum(inc.map((i) => i.amount)),
          expense: this.sum(exp.map((e) => e.amount)),
          movements: inc.length + exp.length,
        };
      }),
    };
  }

  private buildSavings(): ReportView {
    const status = this.statusFilter();
    const allGoals = this.savingService.allGoals();
    const goals = allGoals.filter((g) => status === 'ALL' || g.status === status);
    const counted = goals.filter((g) => g.status !== 'CANCELLED');
    const saved = this.sum(counted.map((g) => g.currentAmount));
    const target = this.sum(counted.map((g) => g.targetAmount));
    const contributions = this.filteredContributions();
    const goalName = (id: number) => allGoals.find((g) => g.id === id)?.name ?? `Meta #${id}`;

    return {
      type: 'SAVINGS',
      title: 'Reporte de ahorros',
      description: 'Metas de ahorro, progreso y aportes del período',
      kpis: [
        { label: 'Total ahorrado', value: saved, format: 'currency', tone: 'positive' },
        { label: 'Objetivo total', value: target, format: 'currency' },
        { label: 'Progreso general', value: target > 0 ? Math.min(100, (saved / target) * 100) : 0, format: 'percent' },
        { label: 'Aportes del período', value: this.sum(contributions.map((c) => c.amount)), format: 'currency', hint: `${contributions.length} aporte(s)` },
      ],
      breakdowns: [
        this.breakdown('Aportes por meta', contributions, (c) => goalName(c.savingGoalId), (c) => c.amount),
      ],
      evolution: [],
      evolutionSeries: [],
      columns: [
        { key: 'name', label: 'Meta', format: 'text' },
        { key: 'status', label: 'Estado', format: 'text' },
        { key: 'target', label: 'Objetivo', format: 'currency', align: 'right' },
        { key: 'saved', label: 'Ahorrado', format: 'currency', align: 'right' },
        { key: 'pending', label: 'Pendiente', format: 'currency', align: 'right' },
        { key: 'progress', label: 'Progreso', format: 'percent', align: 'right' },
        { key: 'targetDate', label: 'Fecha objetivo', format: 'date' },
      ],
      rows: goals.map((g) => ({
        name: g.name,
        status: getSavingStatusLabel(g.status),
        target: Number(g.targetAmount),
        saved: Number(g.currentAmount),
        pending: getSavingPending(g),
        progress: getSavingProgress(g),
        targetDate: g.targetDate ?? null,
      })),
    };
  }

  private buildUsers(): ReportView {
    const status = this.statusFilter();
    const users = this.userService.allUsers().filter((u) => status === 'ALL' || u.status === status);
    const roleItems: string[] = users.flatMap((u) => (u.roles?.length ? u.roles : ['Sin rol']));
    const roleCounts = this.breakdown('Usuarios por rol', roleItems, (r) => r, () => 1, 'number');

    return {
      type: 'USERS',
      title: 'Reporte de usuarios',
      description: 'Usuarios registrados, roles y estados de cuenta',
      kpis: [
        { label: 'Total usuarios', value: users.length, format: 'number' },
        { label: 'Activos', value: users.filter((u) => u.status === 'ACTIVE').length, format: 'number', tone: 'positive' },
        { label: 'Inactivos', value: users.filter((u) => u.status === 'INACTIVE').length, format: 'number' },
        { label: 'Bloqueados', value: users.filter((u) => u.status === 'LOCKED').length, format: 'number', tone: 'negative' },
      ],
      breakdowns: [roleCounts],
      evolution: [],
      evolutionSeries: [],
      columns: [
        { key: 'id', label: 'ID', format: 'text' },
        { key: 'name', label: 'Nombre', format: 'text' },
        { key: 'email', label: 'Correo', format: 'text' },
        { key: 'roles', label: 'Roles', format: 'text' },
        { key: 'status', label: 'Estado', format: 'text' },
        { key: 'createdAt', label: 'Creación', format: 'date' },
      ],
      rows: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        roles: (u.roles ?? []).join(', ') || 'Sin rol',
        status: u.status,
        createdAt: u.createdAt ?? null,
      })),
    };
  }

  private buildAudit(): ReportView {
    const status = this.statusFilter();
    const logs = this.auditService
      .allLogs()
      .filter((l) => this.inRange(l.timestamp) && (status === 'ALL' || l.result === status))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return {
      type: 'AUDIT',
      title: 'Reporte de auditoría',
      description: 'Eventos registrados en el sistema con usuario, módulo y resultado',
      kpis: [
        { label: 'Eventos', value: logs.length, format: 'number' },
        { label: 'Exitosos', value: logs.filter((l) => l.result === 'SUCCESS').length, format: 'number', tone: 'positive' },
        { label: 'Fallidos / no autorizados', value: logs.filter((l) => l.result !== 'SUCCESS').length, format: 'number', tone: 'negative' },
        { label: 'Usuarios distintos', value: new Set(logs.map((l) => l.user)).size, format: 'number' },
      ],
      breakdowns: [
        this.breakdown('Eventos por módulo', logs, (l) => l.module, () => 1, 'number'),
        this.breakdown('Eventos por acción', logs, (l) => l.action, () => 1, 'number'),
      ],
      evolution: [],
      evolutionSeries: [],
      columns: [
        { key: 'timestamp', label: 'Fecha y hora', format: 'datetime' },
        { key: 'user', label: 'Usuario', format: 'text' },
        { key: 'action', label: 'Acción', format: 'text' },
        { key: 'module', label: 'Módulo', format: 'text' },
        { key: 'resource', label: 'Recurso', format: 'text' },
        { key: 'result', label: 'Resultado', format: 'text' },
        { key: 'ip', label: 'IP', format: 'text' },
      ],
      rows: logs.map((l) => ({
        timestamp: l.timestamp,
        user: l.user,
        action: l.action,
        module: l.module,
        resource: l.resource ? `${l.resource}${l.resourceId ? ' #' + l.resourceId : ''}` : null,
        result: l.result,
        ip: l.ipAddress ?? null,
      })),
    };
  }
}
