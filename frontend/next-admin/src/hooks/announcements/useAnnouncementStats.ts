import { useQuery } from '@tanstack/react-query';
import { throwApiError } from '@/lib/errors';

export interface AnnouncementStats {
  total: number;
  published: number;
  draft: number;
  thisMonth: number;
}

async function fetchStats(): Promise<AnnouncementStats> {
  const res = await fetch('/api/announcements/stats');
  if (!res.ok) await throwApiError(res, 'Não foi possível carregar os números.');
  return res.json();
}

// queryKey começa com 'announcements': invalidateQueries({ queryKey: ['announcements'] })
// também atualiza os cards.
export function useAnnouncementStats(enabled = true) {
  return useQuery({ queryKey: ['announcements', 'stats'], queryFn: fetchStats, enabled });
}