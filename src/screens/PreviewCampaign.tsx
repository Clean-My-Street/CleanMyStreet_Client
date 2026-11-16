import {
  faBookmark,
  faHome,
  faNewspaper,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { router } from "expo-router";
import { JSX } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileNavButton } from "../components/ProfileNavButton";
import { useCampaign } from "../hooks/useCampaign";
import { useSavedItems } from "../hooks/useSavedItems";
import {
  campaignStatusLabel,
  fundedPercent,
} from "../services/campaignService";

export default function PreviewCampaign(): JSX.Element {
  const savedItemsState = useSavedItems();
  const { campaignId, campaign, isLoading, error } = useCampaign();

  if (!campaign) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screen, styles.centered]}>
          {isLoading ? (
            <ActivityIndicator color="#1F7A3F" />
          ) : (
            <>
              <Text style={styles.missingTitle}>
                {error ? "Could not load campaign" : "Campaign not found"}
              </Text>
              <Text style={styles.description}>
                {error ?? "This campaign may have been removed."}
              </Text>
              <Pressable
                style={styles.missingButton}
                onPress={() => router.back()}
                accessibilityRole="button"
              >
                <Text style={styles.missingButtonText}>Go back</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = campaignStatusLabel(campaign.status);
  const percent = fundedPercent(campaign);
  const campaignToSave = {
    itemId: campaign.id,
    type: "campaign" as const,
    title: campaign.title,
    detail: `Community campaign · ${statusLabel}`,
  };
  const updates = [
    campaign.createdAt
      ? `Cleanup campaign created on ${campaign.createdAt.toLocaleDateString(
          undefined,
          { day: "numeric", month: "short", year: "numeric" },
        )}`
      : "Cleanup campaign created",
    `${campaign.pledgeCount} ${
      campaign.pledgeCount === 1 ? "pledge" : "pledges"
    } so far`,
    `${percent}% of funding goal reached`,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View style={styles.logoMark}>
              <Image
                source={require("../../assets/images/cleanmystreet.png")}
                style={styles.logo}
              />
            </View>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {campaign.location ?? campaign.title}
            </Text>
          </View>

          <View style={styles.photoPlaceholder}>
            {campaign.imageUrl && (
              <Image
                source={{ uri: campaign.imageUrl }}
                style={styles.dumpingSiteImage}
                accessibilityLabel={`Photo for ${campaign.title}`}
              />
            )}
            <Pressable
              style={styles.viewCampaignButton}
              onPress={() => {
                router.push({
                  pathname: "/viewcampaign",
                  params: { campaignId },
                });
              }}
              accessibilityLabel="View Campaign"
            >
              <Text style={styles.viewCampaignText}>View Campaign</Text>
              {campaign.latitude !== null && campaign.longitude !== null && (
                <Text style={styles.coordinates}>
                  GPS: {campaign.latitude.toFixed(4)},{" "}
                  {campaign.longitude.toFixed(4)}
                </Text>
              )}
            </Pressable>
          </View>

          <View style={styles.details}>
            <View style={styles.statusAndSave}>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
              <Pressable
                style={styles.saveCampaignButton}
                onPress={() =>
                  void savedItemsState.toggleSavedItem(campaignToSave)
                }
                disabled={
                  savedItemsState.isLoading ||
                  savedItemsState.isPending(campaignToSave)
                }
                accessibilityRole="button"
                accessibilityLabel={`${
                  savedItemsState.isSaved(campaignToSave) ? "Remove" : "Save"
                } ${campaign.title} campaign`}
              >
                <FontAwesomeIcon
                  icon={faBookmark}
                  size={14}
                  color={
                    savedItemsState.isSaved(campaignToSave)
                      ? "#1F7A3F"
                      : "#68706A"
                  }
                />
                <Text style={styles.saveCampaignText}>
                  {savedItemsState.isSaved(campaignToSave) ? "Saved" : "Save"}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>
              {campaign.description || "No description yet."}
            </Text>

            <Text style={[styles.sectionLabel, styles.updatesHeading]}>
              Updates
            </Text>
            {updates.map((update) => (
              <Update key={update} text={update} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable
            onPress={() => router.push("/home")}
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/news")}
            accessibilityLabel="View News"
          >
              <FontAwesomeIcon
                icon={faNewspaper}
                size={20}
                color="#124A2A"
              />
          </Pressable>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/reportdumping")}
            accessibilityLabel="Report a dumping site"
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/community")}
            accessibilityLabel="Open community messages"
          >
            <FontAwesomeIcon icon={faUsers} size={20} color="#124A2A" />
          </Pressable>
          <ProfileNavButton />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Update({ text }: { text: string }): JSX.Element {
  return (
    <View style={styles.updateRow}>
      <View style={styles.updateDot} />
      <Text style={styles.updateText}>{text}</Text>
    </View>
  );
}

function NavItem({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
}): JSX.Element {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  missingTitle: { color: "#17201A", fontSize: 15, fontWeight: "700" },
  missingButton: {
    marginTop: 8,
    backgroundColor: "#1F7A3F",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  missingButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  content: { paddingBottom: 20 },
  header: {
    height: 48,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backIcon: { color: "#17201A", fontSize: 32, lineHeight: 32, marginRight: 6 },
  logoMark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#FFFFFF", fontSize: 8, fontWeight: "800" },
  logo: { width: 25, height: 25, resizeMode: "contain" },
  headerTitle: { flex: 1, color: "#17201A", fontSize: 10, marginLeft: 7 },
  photoPlaceholder: {
    height: 285,
    backgroundColor: "#7D927C",
    position: "relative",
    overflow: "hidden",
  },
  dumpingSiteImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    resizeMode: "cover",
  },
  viewCampaignButton: {
    position: "absolute",
    top: 12,
    right: 8,
    width: 112,
    minHeight: 42,
    padding: 8,
    borderRadius: 7,
    backgroundColor: "#36B86B",
  },
  viewCampaignText: { color: "#17201A", fontSize: 11, fontWeight: "700" },
  coordinates: { color: "#17201A", fontSize: 7, marginTop: 3 },
  details: { paddingHorizontal: 14, paddingTop: 10 },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#E1F5E9",
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 5,
  },
  statusAndSave: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saveCampaignButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#EAF5ED",
  },
  saveCampaignText: {
    color: "#1F7A3F",
    fontSize: 10,
    fontWeight: "700",
  },
  statusText: { color: "#36A965", fontSize: 9 },
  sectionLabel: {
    color: "#17201A",
    fontSize: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  description: { color: "#17201A", fontSize: 10, lineHeight: 15 },
  updatesHeading: { marginTop: 25 },
  updateRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#36B86B",
    marginRight: 9,
  },
  updateText: { color: "#17201A", fontSize: 10 },
  bottomNav: {
    minHeight: 68,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  navItem: { minWidth: 48, alignItems: "center", justifyContent: "center" },
  navIcon: {
    color: "#68706A",
    fontSize: 8,
    fontWeight: "800",
    marginBottom: 5,
  },
  navLabel: { color: "#68706A", fontSize: 9 },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#68706A",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#17201A",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
  },
});
