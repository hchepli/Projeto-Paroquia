export interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  currentAmount: number;
  goalAmount: number;
  active: boolean;
}

export type CreateFundraisingCampaignInput = Omit<FundraisingCampaign, "id">;

export type UpdateFundraisingCampaignInput = Partial<CreateFundraisingCampaignInput>;
