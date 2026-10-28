// src/common/utils/timezone.util.spec.ts
import { zonedTimeToUtc, TEMPLATE_TIMEZONE } from './timezone.util';

describe('zonedTimeToUtc (America/Sao_Paulo)', () => {
  it('19:00 BRT = 22:00Z', () => {
    expect(
      zonedTimeToUtc(2026, 10, 19, 19, 0, TEMPLATE_TIMEZONE).toISOString(),
    ).toBe('2026-10-19T22:00:00.000Z');
  });
  it('23:30 BRT vira o dia em UTC', () => {
    expect(
      zonedTimeToUtc(2026, 10, 11, 23, 30, TEMPLATE_TIMEZONE).toISOString(),
    ).toBe('2026-10-12T02:30:00.000Z');
  });
});
