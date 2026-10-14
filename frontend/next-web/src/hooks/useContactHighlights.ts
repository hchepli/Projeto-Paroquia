import { useAsyncData } from "@/hooks/useAsyncData";
import { getContactHighlights } from "@/services/contactHighlightService";

export function useContactHighlights() {
  return useAsyncData(getContactHighlights);
}