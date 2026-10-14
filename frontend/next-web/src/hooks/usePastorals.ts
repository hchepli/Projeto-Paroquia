import { useAsyncData } from "@/hooks/useAsyncData";
import { getAllPastorals } from "@/services/pastoralService";

export function usePastorals() {
  return useAsyncData(getAllPastorals);
}
