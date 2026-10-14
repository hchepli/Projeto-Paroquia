import { useAsyncData } from "@/hooks/useAsyncData";
import { getCalendarEntries } from "@/services/calendarService";

export function useCalendarEntries() {
  return useAsyncData(getCalendarEntries);
}
