import {
	faArrowLeft,
	faCheck,
	faHome,
	faMap,
	faShareNodes,
	faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { router } from "expo-router";
import { JSX, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Keyboard,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileNavButton } from "../components/ProfileNavButton";
import { useCampaign } from "../hooks/useCampaign";
import {
	createCampaignContribution,
	getApiErrorMessage,
} from "../services/api";
import {
	campaignStatusLabel,
	fundedPercent as fundedPercentOf,
} from "../services/campaignService";
import { shareCampaign } from "../services/shareService";

const MAX_PLEDGE_AMOUNT = 50000;

function formatRand(amount: number): string {
	return `R${amount.toLocaleString("en-ZA")}`;
}

export default function ViewCampaign(): JSX.Element {
	const [contributionAmount, setContributionAmount] = useState("100");
	const [isContributing, setIsContributing] = useState(false);
	const { campaignId, campaign, isLoading, error } = useCampaign();
	const funding = campaign;
	const fundedPercent = campaign ? fundedPercentOf(campaign) : 0;
	const isOpenForPledges = campaign?.status === "funding";

	const submitContribution = async () => {
	  if (!isOpenForPledges) return;
	  const amount = Number(contributionAmount);
	  if (
	    !Number.isSafeInteger(amount) ||
	    amount <= 0 ||
	    amount > MAX_PLEDGE_AMOUNT
	  ) {
	    Alert.alert(
	      "Invalid amount",
	      `Enter a whole-number amount from R1 to ${formatRand(MAX_PLEDGE_AMOUNT)}.`,
	    );
	    return;
	  }
	  if (isContributing) return;

	  Keyboard.dismiss();
	  setIsContributing(true);
	  try {
	    await createCampaignContribution(campaignId, amount);
	    Alert.alert("Pledge recorded", `Your R${amount} pledge has been saved.`);
	  } catch (error) {
	    Alert.alert(
	      "Pledge not recorded",
	      getApiErrorMessage(error, "Please try again."),
	    );
	  } finally {
	    setIsContributing(false);
	  }
	};

	if (!campaign) {
	  return (
	    <SafeAreaView style={styles.safeArea}>
	      <View style={[styles.screen, styles.centered]}>
	        {isLoading ? (
	          <ActivityIndicator color="#1F7A3F" />
	        ) : (
	          <>
	            <Text style={styles.campaignTitle}>
	              {error ? "Could not load campaign" : "Campaign not found"}
	            </Text>
	            <Text style={styles.description}>
	              {error ?? "This campaign may have been removed."}
	            </Text>
	            <Pressable
	              style={styles.contributeButton}
	              onPress={() => router.back()}
	              accessibilityRole="button"
	            >
	              <Text style={styles.contributeText}>Go back</Text>
	            </Pressable>
	          </>
	        )}
	      </View>
	    </SafeAreaView>
	  );
	}

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
              <FontAwesomeIcon icon={faArrowLeft} size={16} color="#17201A" />
            </Pressable>
            <View style={styles.logoMark}>
              <Image
                source={require("../../assets/images/cleanmystreet.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {campaign.title} Campaign
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
          </View>

          <View style={styles.fundingPanel}>
            <Text style={styles.fundingSummary}>
              {funding
                ? `${formatRand(funding.pledgedAmount)} pledged of ${formatRand(
                    funding.goalAmount,
                  )} goal - ${fundedPercent}%`
                : "Loading pledges..."}
            </Text>
            <Text style={styles.fundingMeta}>
              {funding
                ? `${funding.pledgeCount} ${
                    funding.pledgeCount === 1 ? "pledge" : "pledges"
                  }`
                : " "}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${fundedPercent}%` }]}
              />
            </View>

            <Text style={styles.sectionLabel}>Choose an amount</Text>
            <Text style={styles.amountLabel}>Own amount</Text>
            <View style={styles.amountRow}>
              {["50", "100", "250"].map((preset) => (
                <Pressable
                  key={preset}
                  style={[
                    styles.amountChip,
                    contributionAmount === preset && styles.amountChipSelected,
                  ]}
                  onPress={() => setContributionAmount(preset)}
                >
                  <Text style={styles.amountText}>R{preset}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={contributionAmount}
              onChangeText={setContributionAmount}
              placeholder="Enter whole ZAR amount"
              placeholderTextColor="#68706A"
              keyboardType="number-pad"
              style={styles.amountInput}
              accessibilityLabel="Contribution amount in ZAR"
            />
            <Pressable
              style={[
                styles.contributeButton,
                !isOpenForPledges && styles.contributeButtonDisabled,
              ]}
              onPress={submitContribution}
              disabled={isContributing || !isOpenForPledges}
              accessibilityRole="button"
            >
              <Text style={styles.contributeText}>
                {!isOpenForPledges
                  ? campaignStatusLabel(campaign.status)
                  : isContributing
                    ? "Submitting..."
                    : "Contribute"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.lightAction}
              onPress={() =>
                Alert.alert(
                  isOpenForPledges ? "Funding still open" : "Funding closed",
                  isOpenForPledges
                    ? `You can book a cleaning team once this campaign reaches its ${formatRand(
                        campaign.goalAmount,
                      )} goal.`
                    : "This campaign is no longer accepting pledges.",
                )
              }
              accessibilityRole="button"
            >
              <Text style={styles.lightActionText}>
                Book a cleaning team when funding is complete
              </Text>
            </Pressable>
            <Pressable
              style={styles.lightAction}
              onPress={() => void shareCampaign(campaign)}
              accessibilityRole="button"
            >
              <FontAwesomeIcon icon={faShareNodes} size={13} color="#17201A" />
              <Text style={styles.lightActionText}>Share this campaign</Text>
            </Pressable>
          </View>

          <View style={styles.detailPanel}>
            <Text style={styles.campaignTitle}>{campaign.title}</Text>
            {campaign.location && (
              <Text style={styles.description}>{campaign.location}</Text>
            )}
            <Text style={styles.description}>
              {campaign.description || "No description yet."}
            </Text>
            <Text style={styles.sectionLabel}>Contributors</Text>
            {/* Individual pledges are private, so only the totals are shown. */}
            <Contributor
              name={`${campaign.pledgeCount} ${
                campaign.pledgeCount === 1 ? "neighbour has" : "neighbours have"
              } pledged`}
              amount={`${formatRand(campaign.pledgedAmount)} in total`}
            />
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
            onPress={() => router.push("/sites")}
            accessibilityLabel="View sites"
          >
            <FontAwesomeIcon icon={faMap} size={20} color="#124A2A" />
          </Pressable>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/reportdumping")}
            accessibilityLabel="Create report"
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

function Contributor({
  name,
  amount,
}: {
  name: string;
  amount: string;
}): JSX.Element {
  return (
    <View style={styles.contributorRow}>
      <View style={styles.checkCircle}>
        <FontAwesomeIcon icon={faCheck} size={8} color="#FFFFFF" />
      </View>
      <View>
        <Text style={styles.contributorName}>{name}</Text>
        <Text style={styles.contributorAmount}>{amount}</Text>
      </View>
    </View>
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
  contributeButtonDisabled: { opacity: 0.6 },
  content: { paddingBottom: 24 },
  header: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
  headerTitle: { flex: 1, color: "#17201A", fontSize: 11, marginLeft: 2 },
  photoPlaceholder: {
    height: 245,
    backgroundColor: "#73816C",
    position: "relative",
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 0,
  },
  dumpingSiteImage: { width: "100%", height: "100%", resizeMode: "cover" },
  fundingPanel: {
    backgroundColor: "#F3F4F3",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E5E2",
  },
  fundingSummary: { color: "#17201A", fontSize: 11, fontWeight: "600" },
  fundingMeta: { color: "#68706A", fontSize: 9, marginTop: 4 },
  progressTrack: {
    height: 6,
    backgroundColor: "#D5D8D5",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#36B86B",
    borderRadius: 3,
  },
  sectionLabel: {
    color: "#17201A",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  amountLabel: { color: "#68706A", fontSize: 9, marginBottom: 5 },
  amountRow: { flexDirection: "row", gap: 7, marginBottom: 9 },
  amountChip: {
    backgroundColor: "#DFF2E6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  amountChipSelected: {
    backgroundColor: "#36B86B",
  },
  amountText: { color: "#176A39", fontSize: 10, fontWeight: "600" },
  amountInput: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#D5D8D5",
    borderRadius: 6,
    color: "#17201A",
    fontSize: 12,
    paddingHorizontal: 10,
    marginBottom: 9,
  },
  contributeButton: {
    height: 34,
    borderRadius: 6,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  contributeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  lightAction: {
    minHeight: 34,
    borderRadius: 6,
    backgroundColor: "#E5E8E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginTop: 6,
  },
  lightActionText: { color: "#17201A", fontSize: 9, marginLeft: 5 },
  detailPanel: { backgroundColor: "#F3F4F3", padding: 14, marginTop: 10 },
  campaignTitle: {
    color: "#17201A",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: { color: "#39433C", fontSize: 10, lineHeight: 15 },
  contributorRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  checkCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  contributorName: { color: "#17201A", fontSize: 10 },
  contributorAmount: { color: "#68706A", fontSize: 9, marginTop: 2 },
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
