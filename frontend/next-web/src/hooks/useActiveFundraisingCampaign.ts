import { useAsyncData } from "@/hooks/useAsyncData";
import { getActiveFundraisingCampaign } from "@/services/fundraisingService";

export function useActiveFundraisingCampaign() {
  return useAsyncData(getActiveFundraisingCampaign);
}
