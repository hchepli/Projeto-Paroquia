import { useAsyncData } from "@/hooks/useAsyncData";
import { getContactInfo } from "@/services/contactInfoService";

export function useContactInfo() {
  return useAsyncData(getContactInfo);
}
