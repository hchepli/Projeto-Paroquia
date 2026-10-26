import { flattenRows, ScheduleExportRow } from './schedule-export.util';

// Células que começam com estes caracteres viram fórmula no Excel/Sheets (CSV injection, RNF006).
const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeCsvValue(raw: string): string {
  let v = FORMULA_START.test(raw) ? `'${raw}` : raw;
  if (/[;"\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** `;` + BOM UTF-8: abre certo (acentos e colunas) no Excel pt-BR. */
export function buildSchedulesCsv(schedules: ScheduleExportRow[]): string {
  const header = ['data', 'hora', 'tipo', 'titulo', 'pastoral', 'voluntario', 'funcao'];
  const lines = flattenRows(schedules).map((r) =>
    [r.data, r.hora, r.tipo, r.titulo, r.pastoral, r.voluntario, r.funcao].map(escapeCsvValue).join(';'),
  );
  return '\uFEFF' + [header.join(';'), ...lines].join('\r\n') + '\r\n';
}