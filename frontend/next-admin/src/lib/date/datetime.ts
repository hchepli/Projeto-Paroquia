// src/lib/date/datetime.ts
// Utilitários compartilhados por Missa e Evento.

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO -> "YYYY-MM-DDTHH:mm" (horário local) para <input type="datetime-local">. */
export function toDateTimeLocalValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/**
 * "YYYY-MM-DDTHH:mm" (datetime-local) -> ISO 8601 com o fuso do navegador
 * (ex: 2026-12-25T19:00:00-03:00). O back exige hora e fuso.
 */
export function toIsoWithOffset(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Data e hora inválidas.');
  }
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  return `${withSeconds}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Compara a data (ISO) com um dia específico, considerando ano e mês. */
export function isSameLocalDay(iso: string, reference: Date, day: number): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === day
  );
}
