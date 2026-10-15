// src/mass-templates/mass-occurrences.util.spec.ts
import { computeOccurrences } from './mass-occurrences.util';

const iso = (ds: Date[]) => ds.map((d) => d.toISOString());

describe('computeOccurrences', () => {
  it('segunda 19:00 BRT => 22:00Z, semanalmente', () => {
    const r = computeOccurrences(
      { dayOfWeek: 1, time: '19:00' },
      new Date('2026-10-14T12:00:00Z'),
      new Date('2026-11-02T00:00:00Z'),
    );
    expect(iso(r)).toEqual(['2026-10-19T22:00:00.000Z', '2026-10-26T22:00:00.000Z']);
  });

  it('usa o dia da semana LOCAL (domingo 23:30 BRT já é segunda em UTC)', () => {
    const r = computeOccurrences(
      { dayOfWeek: 0, time: '23:30' },
      new Date('2026-10-12T02:00:00Z'), // domingo 23:00 BRT
      new Date('2026-10-13T00:00:00Z'),
    );
    expect(iso(r)).toEqual(['2026-10-12T02:30:00.000Z']);
  });

  it('não gera horário que já passou hoje', () => {
    const r = computeOccurrences(
      { dayOfWeek: 3, time: '08:00' },
      new Date('2026-10-14T23:00:00Z'), // quarta 20:00 BRT
      new Date('2026-10-22T00:00:00Z'),
    );
    expect(iso(r)).toEqual(['2026-10-21T11:00:00.000Z']);
  });
});