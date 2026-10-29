export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

// Item da LISTA (resumido, sem JSONs). O backend retorna user.name (não "nome").
export interface AuditLog {
  id: string; // UUID
  userId: string;
  user: { name: string } | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  createdAt: string; // ISO 8601
}

// Detalhe (somente Admin Geral).
export interface AuditLogDetail extends AuditLog {
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | unknown[] | null;
}

export interface AuditLogsPage {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}