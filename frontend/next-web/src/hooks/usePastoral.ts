import { useCallback } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getPastoralDetail } from "@/services/pastoralService";

export function usePastoral(slug: string) {
  const fetcher = useCallback(() => getPastoralDetail(slug), [slug]);
  return useAsyncData(fetcher);
}
