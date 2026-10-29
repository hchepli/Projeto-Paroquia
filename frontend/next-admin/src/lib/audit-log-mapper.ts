import { AuditLog, AuditAction } from '@/types/audit-logs/audit-logs';

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Criação',
  UPDATE: 'Edição',
  DELETE: 'Remoção',
};

const ENTITY_LABEL: Record<string, string> = {
  Mass: 'Missa',
  MassTemplate: 'Missa recorrente',
  Event: 'Evento',
  Announcement: 'Comunicado',
  Schedule: 'Escala',
  ScheduleAssignment: 'Atribuição de escala',
  User: 'Usuário',
  Role: 'Cargo',
  Permission: 'Permissão',
  Volunteer: 'Voluntário',
  PastoralGroup: 'Pastoral',
  Album: 'Álbum',
  Photo: 'Foto',
  Sacrament: 'Sacramento',
  Category: 'Categoria',
};

export interface MovimentacaoRow {
  id: string;
  data: string;
  descricao: string;
  tipo: string;
  usuario: string;
}

export function mapAuditLogToRow(log: AuditLog): MovimentacaoRow {
  const entity = ENTITY_LABEL[log.entity] ?? log.entity;
  return {
    id: log.id,
    data: new Date(log.createdAt).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
    descricao: `${ACTION_LABEL[log.action]} de ${entity}`,
    tipo: ACTION_LABEL[log.action],
    usuario: log.user?.name ?? 'Sistema',
  };
}