import { AuditLog, AuditAction } from '@/types/audit-logs/audit-logs';

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Criação',
  UPDATE: 'Edição',
  DELETE: 'Remoção',
};

export function mapAuditLogToRow(log: AuditLog) {
  return {
    data: new Date(log.createdAt).toLocaleDateString('pt-BR'),
    descricao: `${ACTION_LABEL[log.action]} em ${log.entity} (#${log.entityId})`,
    tipo: ACTION_LABEL[log.action],
    usuario: log.user?.nome ?? 'Sistema',
  };
}