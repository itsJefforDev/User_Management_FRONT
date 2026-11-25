import { formatCurrency } from './account.model';
import { formatDate } from './expense.model';

export type ReportType =
  | 'SUMMARY'
  | 'EXPENSES'
  | 'INCOMES'
  | 'MOVEMENTS'
  | 'ACCOUNTS'
  | 'SAVINGS'
  | 'USERS'
  | 'AUDIT';

export type ReportFormat = 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'percent';
export type ReportFilterKey = 'date' | 'account' | 'category' | 'movement' | 'status';

export interface ReportTypeInfo {
  value: ReportType;
  label: string;
  icon: string;
  description: string;
  adminOnly: boolean;
  filters: ReportFilterKey[];
}

export const REPORT_TYPES: ReportTypeInfo[] = [
  { value: 'SUMMARY', label: 'Resumen financiero', icon: '📊', description: 'Ingresos, gastos, ahorros y disponible', adminOnly: false, filters: ['date', 'account'] },
  { value: 'EXPENSES', label: 'Gastos', icon: '📉', description: 'Detalle por categoría y cuenta', adminOnly: false, filters: ['date', 'account', 'category'] },
  { value: 'INCOMES', label: 'Ingresos', icon: '📈', description: 'Fuentes y detalle de ingresos', adminOnly: false, filters: ['date', 'account', 'category'] },
  { value: 'MOVEMENTS', label: 'Movimientos', icon: '🔄', description: 'Ingresos y gastos por período', adminOnly: false, filters: ['date', 'account', 'category', 'movement'] },
  { value: 'ACCOUNTS', label: 'Cuentas', icon: '💳', description: 'Saldos y movimientos por cuenta', adminOnly: false, filters: ['date', 'account'] },
  { value: 'SAVINGS', label: 'Ahorros', icon: '🎯', description: 'Metas, progreso y aportes', adminOnly: false, filters: ['date', 'account', 'status'] },
  { value: 'USERS', label: 'Usuarios', icon: '👥', description: 'Usuarios, roles y estados', adminOnly: true, filters: ['status'] },
  { value: 'AUDIT', label: 'Auditoría', icon: '🛡️', description: 'Eventos y trazabilidad del sistema', adminOnly: true, filters: ['date', 'status'] },
];

export type ReportPreset = 'MONTH' | 'LAST_MONTH' | 'QUARTER' | 'YEAR' | 'ALL' | 'CUSTOM';

export const REPORT_PRESETS: { value: ReportPreset; label: string }[] = [
  { value: 'MONTH', label: 'Este mes' },
  { value: 'LAST_MONTH', label: 'Mes anterior' },
  { value: 'QUARTER', label: 'Trimestre' },
  { value: 'YEAR', label: 'Año actual' },
  { value: 'ALL', label: 'Todo' },
];

export interface ReportKpi {
  label: string;
  value: number | string;
  format: ReportFormat;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative';
}

export interface ReportBreakdownItem {
  name: string;
  total: number;
  percent: number;
}

export interface ReportBreakdown {
  title: string;
  format: ReportFormat;
  items: ReportBreakdownItem[];
}

export interface ReportEvolutionPoint {
  label: string;
  income: number;
  expense: number;
}

export interface ReportColumn {
  key: string;
  label: string;
  format: ReportFormat;
  align?: 'right';
}

export type ReportRow = Record<string, string | number | null | undefined>;

export interface ReportView {
  type: ReportType;
  title: string;
  description: string;
  kpis: ReportKpi[];
  breakdowns: ReportBreakdown[];
  evolution: ReportEvolutionPoint[];
  evolutionSeries: ('income' | 'expense')[];
  columns: ReportColumn[];
  rows: ReportRow[];
}

const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Rango de fechas (yyyy-MM-dd) de un período rápido. */
export function presetRange(preset: ReportPreset): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'MONTH':
      return { from: ymd(new Date(y, m, 1)), to: ymd(new Date(y, m + 1, 0)) };
    case 'LAST_MONTH':
      return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
    case 'QUARTER': {
      const start = Math.floor(m / 3) * 3;
      return { from: ymd(new Date(y, start, 1)), to: ymd(new Date(y, start + 3, 0)) };
    }
    case 'YEAR':
      return { from: ymd(new Date(y, 0, 1)), to: ymd(new Date(y, 11, 31)) };
    default:
      return { from: '', to: '' };
  }
}

export function periodLabel(from: string, to: string): string {
  if (!from && !to) return 'Todo el historial';
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  return from ? `Desde ${formatDate(from)}` : `Hasta ${formatDate(to)}`;
}

/** Texto para mostrar en pantalla. */
export function formatReportValue(value: unknown, format: ReportFormat): string {
  if (value === null || value === undefined || value === '') return '—';
  switch (format) {
    case 'currency':
      return formatCurrency(value as number | string);
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('es-CO') : String(value);
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'date':
      return formatDate(String(value));
    case 'datetime':
      return String(value).replace('T', ' ').slice(0, 16);
    default:
      return String(value);
  }
}

/** Texto para exportar a CSV (decimales con coma para Excel en español). */
export function toExportValue(value: unknown, format: ReportFormat): string {
  if (value === null || value === undefined) return '';
  switch (format) {
    case 'currency':
    case 'number':
      return typeof value === 'number' ? String(value).replace('.', ',') : String(value);
    case 'percent':
      return typeof value === 'number' ? value.toFixed(1).replace('.', ',') : String(value);
    case 'date':
      return formatDate(String(value));
    case 'datetime':
      return String(value).replace('T', ' ').slice(0, 16);
    default:
      return String(value);
  }
}
