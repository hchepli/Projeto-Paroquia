import { useAsyncData } from "@/hooks/useAsyncData";
import { getCarouselAnnouncements } from "@/services/announcementService";

export function useCarouselAnnouncements() {
  return useAsyncData(getCarouselAnnouncements);
}
