// src/lib/date/month-range.ts
export interface MonthRange {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
  label: string;
}

export function getCurrentMonthRange(): MonthRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return {
    start,
    end,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    label: now.toLocaleDateString('pt-BR', { month: 'long' }),
  };
}