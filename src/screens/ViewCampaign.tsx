import {
	faArrowLeft,
	faBuildingColumns,
	faCheck,
	faHandshake,
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
import { startOzowCheckout } from "../services/paymentService";
import { shareCampaign } from "../services/shareService";

type ContributionMethod = "ozow" | "pledge";

const MAX_PLEDGE_AMOUNT = 50000;

function formatRand(amount: number): string {
	return `R${amount.toLocaleString("en-ZA")}`;
}

// The amount for the button label, or nothing while the input is invalid.
function amountLabel(value: string): string {
	const amount = Number(value);
	return Number.isSafeInteger(amount) && amount > 0 ? formatRand(amount) : "";
}

function MethodOption({
	icon,
	title,
	detail,
	badge,
	selected,
	onPress,
}: {
	icon: typeof faHandshake;
	title: string;
	detail: string;
	badge?: string;
	selected: boolean;
	onPress: () => void;
}): JSX.Element {
	return (
	  <Pressable
	    style={[styles.methodOption, selected && styles.methodOptionSelected]}
	    onPress={onPress}
	    accessibilityRole="radio"
	    accessibilityState={{ checked: selected }}
	    accessibilityLabel={`${title}. ${detail}`}
	  >
	    <View style={styles.methodIcon}>
	      <FontAwesomeIcon icon={icon} size={14} color="#124A2A" />
	    </View>
	    <View style={styles.methodCopy}>
	      <View style={styles.methodTitleRow}>
	        <Text style={styles.methodTitle}>{title}</Text>
	        {badge && <Text style={styles.methodBadge}>{badge}</Text>}
	      </View>
	      <Text style={styles.methodDetail}>{detail}</Text>
	    </View>
	    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
	      {selected && <View style={styles.radioInner} />}
	    </View>
	  </Pressable>
	);
}

export default function ViewCampaign(): JSX.Element {
	const [contributionAmount, setContributionAmount] = useState("100");
	const [isContributing, setIsContributing] = useState(false);
	const [method, setMethod] = useState<ContributionMethod>("ozow");
	const [paymentError, setPaymentError] = useState<string | null>(null);
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
	  if (method === "ozow") {
	    setPaymentError(null);
	    try {
	      const result = await startOzowCheckout(campaignId, amount);
	      // On web the page is already on its way to Ozow.
	      if (result.kind === "returned") {
	        router.push({
	          pathname: "/paymentresult",
	          params: { paymentId: result.paymentId },
	        });
	      }
	    } catch (error) {
	      const message = getApiErrorMessage(error, "Please try again.");
	      // Alerts do nothing on web, so the message is also shown inline.
	      setPaymentError(message);
	      Alert.alert("Couldn't start the payment", message);
	    } finally {
	      setIsContributing(false);
	    }
	    return;
	  }
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
            <Text style={styles.sectionLabel}>How would you like to contribute?</Text>
            <View style={styles.methodList} accessibilityRole="radiogroup">
              <MethodOption
                icon={faBuildingColumns}
                title="Pay now with Ozow"
                detail="Instant EFT from your bank app. No card needed."
                badge="Recommended"
                selected={method === "ozow"}
                onPress={() => setMethod("ozow")}
              />
              <MethodOption
                icon={faHandshake}
                title="Pledge to pay later"
                detail="Promise an amount now and pay when the campaign is funded."
                selected={method === "pledge"}
                onPress={() => setMethod("pledge")}
              />
            </View>
            {paymentError && method === "ozow" && (
              <Text style={styles.paymentError} accessibilityRole="alert">
                {paymentError}
              </Text>
            )}
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
                    ? method === "ozow"
                      ? "Opening Ozow..."
                      : "Submitting..."
                    : method === "ozow"
                      ? `Pay ${amountLabel(contributionAmount)} with Ozow`
                      : `Pledge ${amountLabel(contributionAmount)}`}
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
  paymentError: {
    color: "#C2412D",
    backgroundColor: "#FFF4F2",
    fontSize: 10,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  methodList: { gap: 7, marginBottom: 10 },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5D8D5",
    borderRadius: 8,
    padding: 10,
  },
  methodOptionSelected: { borderColor: "#36B86B", backgroundColor: "#F4FBF6" },
  methodIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#DFF2E6",
    alignItems: "center",
    justifyContent: "center",
  },
  methodCopy: { flex: 1 },
  methodTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  methodTitle: { color: "#17201A", fontSize: 11, fontWeight: "700" },
  methodBadge: {
    color: "#176A39",
    backgroundColor: "#DFF2E6",
    fontSize: 8,
    fontWeight: "700",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  methodDetail: { color: "#68706A", fontSize: 9, lineHeight: 13, marginTop: 2 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#AAB4AC",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: "#124A2A" },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#124A2A" },
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
