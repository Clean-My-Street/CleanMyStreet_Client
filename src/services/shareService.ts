import * as Linking from "expo-linking";
import { Alert, Share } from "react-native";

export async function shareCampaign(campaign: {
  id: string;
  title: string;
  location?: string | null;
}): Promise<void> {
  const campaignUrl = Linking.createURL("/previewcampaign", {
    queryParams: { campaignId: campaign.id },
  });
  const place = campaign.location ? ` at ${campaign.location}` : "";
  try {
    await Share.share({
      title: campaign.title,
      message: `Help clean up${place}. Support the ${campaign.title} campaign on CleanMyStreet: ${campaignUrl}`,
    });
  } catch (error) {
    Alert.alert(
      "Could not share",
      error instanceof Error ? error.message : "Please try again.",
    );
  }
}
