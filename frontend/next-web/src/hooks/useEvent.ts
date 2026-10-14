import { useCallback } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getEventDetail } from "@/services/eventService";

export function useEvent(id: string) {
  const fetcher = useCallback(() => getEventDetail(id), [id]);
  return useAsyncData(fetcher);
}
