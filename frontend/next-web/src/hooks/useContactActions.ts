import { useAsyncData } from "@/hooks/useAsyncData";
import { getContactActions } from "@/services/contactActionService";

export function useContactActions() {
  return useAsyncData(getContactActions);
}