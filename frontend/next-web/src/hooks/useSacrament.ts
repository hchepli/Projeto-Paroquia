import { useCallback } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getSacramentDetail } from "@/services/sacramentService";

export function useSacrament(slug: string) {
  const fetcher = useCallback(() => getSacramentDetail(slug), [slug]);
  return useAsyncData(fetcher);
}
