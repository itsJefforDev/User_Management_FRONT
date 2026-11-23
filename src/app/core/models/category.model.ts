/**
 * Modelo de Categoría alineado con el backend Spring Boot.
 *
 * Backend DTOs de referencia:
 *   - CategoryResponse      → Category
 *   - CreateCategoryRequest → CreateCategoryRequest
 *   - UpdateCategoryRequest → UpdateCategoryRequest
 *
 * Tipos soportados en la entidad Category (Category.java):
 *   - 'EXPENSE' (Gastos)
 *   - 'INCOME'  (Ingresos)
 *   - 'BOTH'    (Mixto / Ambos)
 */

export type CategoryType = 'EXPENSE' | 'INCOME' | 'BOTH';

export interface Category {
  id: number;
  name: string;
  description?: string;
  type: CategoryType | string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  type: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  type: string;
  active?: boolean;
}

export function getCategoryTypeLabel(type: string): string {
  const normalized = (type || '').toUpperCase();
  switch (normalized) {
    case 'EXPENSE':
      return 'Gasto';
    case 'INCOME':
      return 'Ingreso';
    case 'BOTH':
      return 'Ambos (Mixto)';
    default:
      return type || 'Otro';
  }
}

export function getCategoryTypeBadgeVariant(
  type: string
): 'danger' | 'success' | 'info' | 'warning' {
  const normalized = (type || '').toUpperCase();
  switch (normalized) {
    case 'EXPENSE':
      return 'danger';
    case 'INCOME':
      return 'success';
    case 'BOTH':
      return 'info';
    default:
      return 'warning';
  }
}
