/**
 * Modelo de Auditoría alineado con el backend Spring Boot.
 * Backend de referencia: AuditLog.java / AuditDTOs.AuditLogResponse
 * Endpoint: GET /api/v1/audits
 */
export interface AuditLog {
  id: number;
  user: string;
  action: string;
  module: string;
  resource?: string;
  resourceId?: number;
  timestamp: string; // ISO yyyy-MM-ddTHH:mm:ss
  result: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED' | string;
  ipAddress?: string;
  additionalInfo?: string;
}
