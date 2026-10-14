import { fundraisingCampaignMock } from "@/data/institutional/fundraisingCampaign";
import { FundraisingCampaign } from "@/types/institutional/fundraisingCampaign";

const DELAY_MS = 300;

// TODO: quando o backend existir, trocar o corpo por:
// const response = await fetch("/api/campanhas/ativa");
// return response.json();
export async function getActiveFundraisingCampaign(): Promise<FundraisingCampaign | null> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  return fundraisingCampaignMock.find((campaign) => campaign.active) ?? null;
}
