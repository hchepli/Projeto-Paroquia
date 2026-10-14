import { useAsyncData } from "@/hooks/useAsyncData";
import { getAllEventsWithStatus } from "@/services/eventService";

export function useEvents() {
  return useAsyncData(getAllEventsWithStatus);
}
