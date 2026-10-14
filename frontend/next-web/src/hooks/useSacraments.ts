import { useAsyncData } from "@/hooks/useAsyncData";
import { getAllSacraments } from "@/services/sacramentService";

export function useSacraments() {
  return useAsyncData(getAllSacraments);
}
