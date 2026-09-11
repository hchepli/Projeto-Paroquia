import { useQuery } from '@tanstack/react-query';
import { CalendarItem } from '@/types/calendar/calendar-item';

async function fetchCalendar(start: string, end: string): Promise<CalendarItem[]> {
  const params = new URLSearchParams({ start, end });
  const response = await fetch(`/api/calendar?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Falha ao buscar itens do calendário');
  }

  return response.json();
}

export function useCalendar(start: string, end: string) {
  return useQuery({
    queryKey: ['calendar', start, end],
    queryFn: () => fetchCalendar(start, end),
    enabled: Boolean(start && end),
  });
}
