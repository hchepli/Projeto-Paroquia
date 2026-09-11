export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: string; // UUID
  userId: string;
  user: {
    nome: string;
  };
  action: AuditAction;
  entity: string;
  entityId: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  createdAt: string; // ISO 8601
}