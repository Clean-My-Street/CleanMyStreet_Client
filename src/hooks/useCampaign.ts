import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FEATURED_CAMPAIGN_ID } from "../services/api";
import { subscribeCampaign, type Campaign } from "../services/campaignService";

export type CampaignState = {
  campaignId: string;
  campaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
};

// The campaign named by the route's campaignId parameter. Links made before
// campaigns had IDs in the URL open the featured campaign.
export function useCampaign(): CampaignState {
  const params = useLocalSearchParams<{ campaignId?: string }>();
  const campaignId =
    typeof params.campaignId === "string" && params.campaignId
      ? params.campaignId
      : FEATURED_CAMPAIGN_ID;
  const [state, setState] = useState<Omit<CampaignState, "campaignId">>({
    campaign: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    setState({ campaign: null, isLoading: true, error: null });
    return subscribeCampaign(
      campaignId,
      (campaign) => setState({ campaign, isLoading: false, error: null }),
      (error) =>
        setState({ campaign: null, isLoading: false, error: error.message }),
    );
  }, [campaignId]);

  return { campaignId, ...state };
}
