import * as Linking from "expo-linking";
import { Alert, Share } from "react-native";

export async function shareFeaturedCampaign(): Promise<void> {
  const campaignUrl = Linking.createURL("/previewcampaign");
  try {
    await Share.share({
      title: "Musgrave Rd Cleanup",
      message: `Help clean up Musgrave Rd near the Botanic Gardens. Support the campaign on CleanMyStreet: ${campaignUrl}`,
    });
  } catch (error) {
    Alert.alert(
      "Could not share",
      error instanceof Error ? error.message : "Please try again.",
    );
  }
}
