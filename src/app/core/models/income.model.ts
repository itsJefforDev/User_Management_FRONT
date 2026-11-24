/**
 * Modelo de Ingreso alineado con el backend Spring Boot.
 *
 * Backend DTOs de referencia (IncomeDTOs.java):
 *   - IncomeResponse      -> Income
 *   - CreateIncomeRequest -> CreateIncomeRequest
 *   - UpdateIncomeRequest -> UpdateIncomeRequest
 *
 * Nota: IncomeResponse solo expone categoryName y accountName (no los ids).
 */

export type IncomeType = 'SALARY' | 'FREELANCE' | 'INVESTMENT' | 'EXTRA';

export interface Income {
  id: number;
  amount: number;
  description: string;
  date: string; // yyyy-MM-dd (LocalDate)
  categoryName: string;
  accountName: string;
  incomeType: IncomeType | string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIncomeRequest {
  amount: number;
  description: string;
  date: string;
  categoryId: number;
  accountId: number;
  incomeType: string;
  observations?: string;
}

export type UpdateIncomeRequest = CreateIncomeRequest;

export const INCOME_TYPES: { value: IncomeType; label: string }[] = [
  { value: 'SALARY', label: 'Salario' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INVESTMENT', label: 'Inversión' },
  { value: 'EXTRA', label: 'Extra' },
];

export function getIncomeTypeLabel(type: string): string {
  const found = INCOME_TYPES.find((t) => t.value === (type || '').toUpperCase());
  return found ? found.label : type || 'Otro';
}

export function getIncomeTypeBadgeVariant(type: string): 'info' | 'success' | 'warning' | 'neutral' {
  switch ((type || '').toUpperCase()) {
    case 'SALARY':
      return 'info';
    case 'FREELANCE':
      return 'success';
    case 'INVESTMENT':
      return 'warning';
    default:
      return 'neutral';
  }
}

// Helpers de fecha compartidos con el módulo de gastos
export { formatDate, todayISO } from './expense.model';
