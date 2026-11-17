import { AuditLog, AuditAction } from '@/types/audit-logs/audit-logs';

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Criou',
  UPDATE: 'Alterou',
  DELETE: 'Apagou',
};

const ACTION_VERB: Record<AuditAction, string> = {
  CREATE: 'criou',
  UPDATE: 'alterou',
  DELETE: 'apagou',
};

// noun = palavra simples; fem = usa "uma" em vez de "um".
const ENTITY: Record<string, { noun: string; fem: boolean }> = {
  Mass: { noun: 'missa', fem: true },
  MassTemplate: { noun: 'missa que se repete', fem: true },
  Event: { noun: 'evento', fem: false },
  Announcement: { noun: 'aviso', fem: false },
  Schedule: { noun: 'escala', fem: true },
  ScheduleAssignment: { noun: 'pessoa na escala', fem: true },
  User: { noun: 'usuário', fem: false },
  Role: { noun: 'função', fem: true },
  Permission: { noun: 'permissão', fem: true },
  Volunteer: { noun: 'voluntário', fem: false },
  PastoralGroup: { noun: 'pastoral', fem: true },
  Album: { noun: 'álbum', fem: false },
  Photo: { noun: 'foto', fem: true },
  Sacrament: { noun: 'sacramento', fem: false },
  Category: { noun: 'categoria', fem: true },
};

export const ENTITY_FILTER_OPTIONS = Object.entries(ENTITY)
  .filter(([key]) => !['ScheduleAssignment', 'Permission', 'Category'].includes(key))
  .map(([value, { noun }]) => ({ value, label: noun.charAt(0).toUpperCase() + noun.slice(1) }));

export const ACTION_FILTER_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'CREATE', label: 'Criou' },
  { value: 'UPDATE', label: 'Alterou' },
  { value: 'DELETE', label: 'Apagou' },
];

export interface MovimentacaoRow {
  id: string;
  data: string; // curto, usado no card do Painel
  descricao: string; // "Missa"
  tipo: string; // "Criou"
  usuario: string;
  // Usados na página de Últimas alterações:
  frase: string; // "Maria criou uma missa"
  quando: string; // "hoje às 14:30"
  quandoCompleto: string; // para leitor de tela
  iso: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(d, now)) return `hoje às ${time}`;
  if (sameDay(d, yesterday)) return `ontem às ${time}`;
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return d.getFullYear() === now.getFullYear()
    ? `${date} às ${time}`
    : `${date}/${d.getFullYear()} às ${time}`;
}

export function buildAuditSentence(log: AuditLog): string {
  const who = log.user?.name ?? 'O sistema';
  const verb = ACTION_VERB[log.action] ?? 'alterou';
  const entity = ENTITY[log.entity];
  if (!entity) return `${who} ${verb} uma informação`;
  return `${who} ${verb} ${entity.fem ? 'uma' : 'um'} ${entity.noun}`;
}

export function mapAuditLogToRow(log: AuditLog): MovimentacaoRow {
  const entity = ENTITY[log.entity];
  const label = entity ? entity.noun.charAt(0).toUpperCase() + entity.noun.slice(1) : 'Informação';
  return {
    id: log.id,
    data: new Date(log.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    descricao: label,
    tipo: ACTION_LABEL[log.action] ?? 'Alterou',
    usuario: log.user?.name ?? 'Sistema',
    frase: buildAuditSentence(log),
    quando: formatWhen(log.createdAt),
    quandoCompleto: new Date(log.createdAt).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }),
    iso: log.createdAt,
  };
}