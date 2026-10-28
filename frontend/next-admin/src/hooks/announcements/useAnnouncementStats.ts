import { useQuery } from '@tanstack/react-query';

export interface AnnouncementStats {
  total: number;
  published: number;
  draft: number;
  thisMonth: number;
}

async function fetchStats(): Promise<AnnouncementStats> {
  const res = await fetch('/api/announcements/stats');
  if (!res.ok) throw new Error('Erro ao buscar estatísticas.');
  return res.json();
}

// queryKey começa com 'announcements', então invalidateQueries({queryKey:['announcements']})
// também atualiza os cards.
export function useAnnouncementStats() {
  return useQuery({ queryKey: ['announcements', 'stats'], queryFn: fetchStats });
}