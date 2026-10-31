import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CalendarItem } from '@/types/calendar/calendar-item';
import { throwApiError } from '@/lib/errors';

async function fetchCalendar(start: string, end: string): Promise<CalendarItem[]> {
  const params = new URLSearchParams({ start, end });
  const res = await fetch(`/api/calendar?${params.toString()}`);
  if (!res.ok) await throwApiError(res, 'Erro ao carregar o calendário.');
  return res.json();
}

export function useCalendar(start: string, end: string) {
  return useQuery({
    queryKey: ['calendar', start, end],
    queryFn: () => fetchCalendar(start, end),
    enabled: Boolean(start && end),
    // Trocar de mês mantém a grade anterior até chegar a nova (sem piscar "Carregando...").
    placeholderData: keepPreviousData,
  });
}