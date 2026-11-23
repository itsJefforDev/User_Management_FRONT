/**
 * Modelo de Cuenta Bancaria alineado con el backend Spring Boot.
 *
 * Backend DTOs de referencia (AccountDTOs.java / Account.java):
 *   - AccountResponse      → Account
 *   - CreateAccountRequest → CreateAccountRequest
 *   - UpdateAccountRequest → UpdateAccountRequest
 *
 * Tipos soportados en la entidad Account:
 *   - 'BANK'           (Cuenta de ahorros, corriente, etc.)
 *   - 'DIGITAL_WALLET' (Nequi, Daviplata, billeteras digitales)
 *   - 'CASH'           (Efectivo / Caja menor)
 */

export type AccountType = 'BANK' | 'DIGITAL_WALLET' | 'CASH';

export interface Account {
  id: number;
  name: string;
  type: AccountType | string;
  balance: number;
  active: boolean;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  initialBalance: number;
  userId: number;
}

export interface UpdateAccountRequest {
  name: string;
  type: string;
}

export function getAccountTypeLabel(type: string): string {
  const normalized = (type || '').toUpperCase();
  switch (normalized) {
    case 'BANK':
      return 'Cuenta Bancaria';
    case 'DIGITAL_WALLET':
      return 'Billetera Digital';
    case 'CASH':
      return 'Efectivo / Caja';
    default:
      return type || 'Otro';
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'number' ? amount : Number(amount || 0);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
