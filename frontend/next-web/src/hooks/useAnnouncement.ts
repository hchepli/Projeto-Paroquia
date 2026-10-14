import { useCallback } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getAnnouncementDetail } from "@/services/announcementService";

export function useAnnouncement(slug: string) {
  const fetcher = useCallback(() => getAnnouncementDetail(slug), [slug]);
  return useAsyncData(fetcher);
}
