// src/mass-templates/mass-occurrences.util.ts
import { getZonedParts, zonedTimeToUtc, TEMPLATE_TIMEZONE } from '../../common/utils/timezone.util';

/**
 * Ocorrências [from, to] de um template, calculadas em America/Sao_Paulo
 * (independe do fuso do servidor). Não gera ocorrências anteriores a `from`.
 */
export function computeOccurrences(
  template: { dayOfWeek: number; time: string },
  from: Date,
  to: Date,
  tz: string = TEMPLATE_TIMEZONE,
): Date[] {
  const [hours, minutes] = template.time.split(':').map(Number);
  const local = getZonedParts(from, tz);

  // Calendário local representado como UTC-meia-noite, só para somar dias.
  const cursor = new Date(Date.UTC(local.year, local.month - 1, local.day));
  cursor.setUTCDate(cursor.getUTCDate() + ((template.dayOfWeek - cursor.getUTCDay() + 7) % 7));

  const occurrences: Date[] = [];
  for (;;) {
    const occurrence = zonedTimeToUtc(
      cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate(), hours, minutes, tz,
    );
    if (occurrence > to) break;
    if (occurrence >= from) occurrences.push(occurrence);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return occurrences;
}