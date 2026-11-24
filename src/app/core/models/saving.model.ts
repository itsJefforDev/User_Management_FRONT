/**
 * Modelo de Metas de Ahorro alineado con el backend Spring Boot.
 *
 * Backend DTOs de referencia (SavingDTOs.java):
 *   - SavingGoalResponse         -> SavingGoal
 *   - CreateSavingGoalRequest    -> CreateSavingGoalRequest
 *   - UpdateSavingGoalRequest    -> UpdateSavingGoalRequest
 *   - CreateContributionRequest  -> CreateContributionRequest
 *   - SavingContributionResponse -> SavingContribution
 *
 * Estados de la meta (SavingGoal.java): IN_PROGRESS, COMPLETED, CANCELLED
 */

export type SavingStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface SavingGoal {
  id: number;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null; // yyyy-MM-dd
  status: SavingStatus | string;
  userId: number;
  progressPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSavingGoalRequest {
  name: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  userId: number;
}

export interface UpdateSavingGoalRequest {
  name: string;
  description?: string;
  targetAmount: number;
  targetDate?: string | null;
  status?: string;
}

export interface SavingContribution {
  id: number;
  amount: number;
  date: string;
  notes?: string;
  savingGoalId: number;
  accountName?: string;
  createdAt?: string;
}

export interface CreateContributionRequest {
  amount: number;
  date: string;
  notes?: string;
  savingGoalId: number;
  accountId?: number | null;
}

export function getSavingStatusLabel(status: string): string {
  switch ((status || '').toUpperCase()) {
    case 'IN_PROGRESS':
      return 'En progreso';
    case 'COMPLETED':
      return 'Completada';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return status || 'Otro';
  }
}

export function getSavingStatusBadgeVariant(status: string): 'info' | 'success' | 'neutral' {
  switch ((status || '').toUpperCase()) {
    case 'IN_PROGRESS':
      return 'info';
    case 'COMPLETED':
      return 'success';
    default:
      return 'neutral';
  }
}

/** Porcentaje de avance (0-100) = monto actual / monto objetivo (HU-26). */
export function getSavingProgress(goal: SavingGoal): number {
  const target = Number(goal.targetAmount) || 0;
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, ((Number(goal.currentAmount) || 0) / target) * 100));
}

/** Monto pendiente por ahorrar (nunca negativo). */
export function getSavingPending(goal: SavingGoal): number {
  return Math.max(0, (Number(goal.targetAmount) || 0) - (Number(goal.currentAmount) || 0));
}

/** Días que faltan hasta la fecha objetivo (negativo si ya venció). null si no hay fecha. */
export function daysUntil(iso: string | null | undefined): number | null {
  const [y, m, d] = (iso || '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// Helpers de fecha compartidos con los módulos de gastos e ingresos
export { formatDate, todayISO } from './expense.model';
