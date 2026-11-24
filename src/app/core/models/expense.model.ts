/**
 * Modelo de Gasto alineado con el backend Spring Boot.
 *
 * Backend DTOs de referencia (ExpenseDTOs.java):
 *   - ExpenseResponse      -> Expense
 *   - CreateExpenseRequest -> CreateExpenseRequest
 *   - UpdateExpenseRequest -> UpdateExpenseRequest
 *
 * Nota: ExpenseResponse solo expone categoryName y accountName (no los ids).
 */

export type ExpenseType = 'FIXED' | 'VARIABLE' | 'RECURRING';

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string; // yyyy-MM-dd (LocalDate)
  categoryName: string;
  accountName: string;
  expenseType: ExpenseType | string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  date: string;
  categoryId: number;
  accountId: number;
  expenseType: string;
  observations?: string;
}

export type UpdateExpenseRequest = CreateExpenseRequest;

export const EXPENSE_TYPES: { value: ExpenseType; label: string }[] = [
  { value: 'FIXED', label: 'Fijo' },
  { value: 'VARIABLE', label: 'Variable' },
  { value: 'RECURRING', label: 'Recurrente' },
];

export function getExpenseTypeLabel(type: string): string {
  const found = EXPENSE_TYPES.find((t) => t.value === (type || '').toUpperCase());
  return found ? found.label : type || 'Otro';
}

export function getExpenseTypeBadgeVariant(type: string): 'info' | 'warning' | 'neutral' {
  switch ((type || '').toUpperCase()) {
    case 'FIXED':
      return 'info';
    case 'VARIABLE':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Fecha local de hoy en formato yyyy-MM-dd (sin desfases por zona horaria). */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** yyyy-MM-dd -> dd/MM/yyyy */
export function formatDate(iso: string | null | undefined): string {
  const [y, m, d] = (iso || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}
