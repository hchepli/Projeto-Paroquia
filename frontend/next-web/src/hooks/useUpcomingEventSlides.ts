import { useAsyncData } from "@/hooks/useAsyncData";
import { getUpcomingEventSlides } from "@/services/eventService";

export function useUpcomingEventSlides() {
  return useAsyncData(getUpcomingEventSlides);
}