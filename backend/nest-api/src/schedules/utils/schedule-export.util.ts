export type ScheduleExportRow = {
  mass: { title: string; dateTime: Date } | null;
  event: { name: string; startDate: Date } | null;
  pastoralGroup: { name: string } | null;
  assignments: { role: string; volunteer: { name: string } }[];
};

const TZ = 'America/Sao_Paulo';
const dateFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export const formatDateBR = (d: Date) => dateFmt.format(d);
export const formatTimeBR = (d: Date) => timeFmt.format(d);
export const formatDateTimeBR = (d: Date) => `${formatDateBR(d)} ${formatTimeBR(d)}`;

export interface FlatRow {
  data: string; hora: string; tipo: string; titulo: string; pastoral: string; voluntario: string; funcao: string;
}

/** 1 linha por atribuição (escala sem atribuição gera 1 linha vazia, para não "sumir"). */
export function flattenRows(schedules: ScheduleExportRow[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const s of schedules) {
    const at = s.mass?.dateTime ?? s.event?.startDate ?? null;
    const base = {
      data: at ? formatDateBR(at) : '',
      hora: at ? formatTimeBR(at) : '',
      tipo: s.mass ? 'Missa' : 'Evento',
      titulo: s.mass?.title ?? s.event?.name ?? '',
      pastoral: s.pastoralGroup?.name ?? '',
    };
    if (s.assignments.length === 0) rows.push({ ...base, voluntario: '', funcao: '' });
    else for (const a of s.assignments) rows.push({ ...base, voluntario: a.volunteer.name, funcao: a.role });
  }
  return rows;
}
