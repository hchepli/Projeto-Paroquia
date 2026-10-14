import { useAsyncData } from "@/hooks/useAsyncData";
import { getFeaturedAnnouncement } from "@/services/announcementService";

export function useFeaturedAnnouncement() {
  return useAsyncData(getFeaturedAnnouncement);
}
