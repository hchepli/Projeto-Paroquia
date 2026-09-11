import { useQuery } from '@tanstack/react-query';
import { Announcement, AnnouncementStatus } from '@/types/announcements/announcement';
import { PaginatedResult } from '@/types/pagination';

interface UseAnnouncementsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AnnouncementStatus;
}

async function fetchAnnouncements(
  params: UseAnnouncementsParams,
): Promise<PaginatedResult<Announcement>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('limit', String(params.limit ?? 10));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);

  const res = await fetch(`/api/announcements?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Erro ao buscar comunicados.');
  return res.json();
}

export function useAnnouncements(params: UseAnnouncementsParams = {}) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: () => fetchAnnouncements(params),
  });
}
