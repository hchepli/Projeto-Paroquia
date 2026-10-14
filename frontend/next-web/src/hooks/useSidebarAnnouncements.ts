import { useCallback } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getSidebarAnnouncements } from "@/services/announcementService";

export function useSidebarAnnouncements(limit?: number) {
  const fetcher = useCallback(() => getSidebarAnnouncements(limit), [limit]);
  return useAsyncData(fetcher);
}
