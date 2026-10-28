import { buildSchedulesCsv, escapeCsvValue } from './schedules-csv.util';
import {
  formatDateBR,
  formatTimeBR,
  flattenRows,
} from './schedule-export.util';
import { normalizeRole } from './schedule-rules.util';

describe('normalizeRole', () => {
  it.each([
    [' Leitor ', 'leitor'],
    ['Ministro   Eucaristia', 'ministro eucaristia'],
    ['coroinha', 'coroinha'],
  ])('%j -> %j', (i, o) => {
    expect(normalizeRole(i)).toBe(o);
  });
});

describe('datas no fuso America/Sao_Paulo', () => {
  // 2026-10-17T01:00Z = 16/10 22:00 em Brasília (o toISOString antigo jogava para 17/10)
  const d = new Date('2026-10-17T01:00:00.000Z');
  it('mantém o dia e a hora locais', () => {
    expect(formatDateBR(d)).toBe('16/10/2026');
    expect(formatTimeBR(d)).toBe('22:00');
  });
});

describe('CSV', () => {
  const row = (title: string, volunteer = 'Ana') => ({
    mass: { title, dateTime: new Date('2026-10-17T01:00:00.000Z') },
    event: null,
    pastoralGroup: { name: 'Liturgia' },
    assignments: [{ role: 'leitor', volunteer: { name: volunteer } }],
  });

  it('neutraliza fórmulas (CSV injection)', () => {
    for (const v of ['=1+1', '+SUM(A1)', '-2', '@cmd'])
      expect(escapeCsvValue(v)).toBe(`'${v}`);
    expect(escapeCsvValue('Missa de domingo')).toBe('Missa de domingo');
  });

  it('escapa ; aspas e quebra de linha', () => {
    expect(escapeCsvValue('a;b')).toBe('"a;b"');
    expect(escapeCsvValue('diz "oi"')).toBe('"diz ""oi"""');
  });

  it('BOM, separador ; e datas locais', () => {
    const csv = buildSchedulesCsv([row('Missa')]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('data;hora;tipo;titulo;pastoral;voluntario;funcao');
    expect(csv).toContain('16/10/2026;22:00;Missa;Missa;Liturgia;Ana;leitor');
  });

  it('escala sem atribuição ainda aparece (1 linha vazia)', () => {
    const rows = flattenRows([{ ...row('M'), assignments: [] }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].voluntario).toBe('');
  });
});
