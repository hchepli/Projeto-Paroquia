import { useQuery } from '@tanstack/react-query';
import { throwApiError } from '@/lib/errors';
import { Announcement } from '@/types/announcements/announcement';

async function fetchAnnouncement(id: number): Promise<Announcement> {
  const res = await fetch(`/api/announcements/${id}`);
  if (!res.ok) await throwApiError(res, 'Não foi possível abrir o aviso.');
  return res.json();
}

export function useAnnouncement(id: number | null, enabled = true) {
  return useQuery({
    queryKey: ['announcements', 'detail', id],
    queryFn: () => fetchAnnouncement(id as number),
    enabled: enabled && id !== null,
  });
}