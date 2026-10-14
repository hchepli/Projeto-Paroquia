import { useAsyncData } from "@/hooks/useAsyncData";
import { getWeeklyMassSchedule } from "@/services/massService";

export function useWeeklyMassSchedule() {
  return useAsyncData(getWeeklyMassSchedule);
}