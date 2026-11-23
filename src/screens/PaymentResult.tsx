import {
  faCircleCheck,
  faCircleXmark,
  faClock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { router, useLocalSearchParams } from "expo-router";
import { JSX, useCallback, useEffect, useRef, useState } from "react";
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
import { getApiErrorMessage, verifyPayment } from "../services/api";
import {
  paymentStatusLabel,
  subscribePayment,
  type Payment,
} from "../services/paymentService";

function formatRand(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}

const copy = {
  pending: {
    title: "Confirming your payment",
    text: "We're waiting for Ozow to confirm your payment. This usually takes a few seconds. You can leave this screen; we'll notify you when it's done.",
  },
  complete: {
    title: "Payment received",
    text: "Thank you! Your contribution has been added to the campaign.",
  },
  cancelled: {
    title: "Payment cancelled",
    text: "No money was taken. You can try again whenever you're ready.",
  },
  failed: {
    title: "Payment didn't go through",
    text: "Ozow couldn't complete this payment. No money was taken. Please try again or use a different bank.",
  },
} as const;

export default function PaymentResult(): JSX.Element {
  const params = useLocalSearchParams<{ paymentId?: string; outcome?: string }>();
  const paymentId = typeof params.paymentId === "string" ? params.paymentId : "";
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(paymentId));
  const [error, setError] = useState<string | null>(
    paymentId ? null : "This payment link is missing its reference.",
  );
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const hasAutoChecked = useRef(false);

  useEffect(() => {
    if (!paymentId) return;
    return subscribePayment(
      paymentId,
      (nextPayment) => {
        setPayment(nextPayment);
        setIsLoading(false);
        if (!nextPayment) setError("We couldn't find this payment.");
      },
      (loadError) => {
        setError(loadError.message);
        setIsLoading(false);
      },
    );
  }, [paymentId]);

  const checkStatus = useCallback(async () => {
    if (!paymentId || isChecking) return;
    setIsChecking(true);
    setCheckError(null);
    try {
      await verifyPayment(paymentId);
    } catch (verifyError) {
      setCheckError(
        getApiErrorMessage(verifyError, "Could not check the payment status."),
      );
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, paymentId]);

  // Returning from Ozow while still pending: ask the server to check once.
  useEffect(() => {
    if (payment?.status === "pending" && !hasAutoChecked.current) {
      hasAutoChecked.current = true;
      void checkStatus();
    }
  }, [checkStatus, payment?.status]);

  const status = payment?.status ?? "pending";
  const statusCopy = copy[status];
  const isDone = status === "complete";
  const canRetry = status === "cancelled" || status === "failed";

  const goToCampaign = () => {
    if (!payment) return;
    router.replace({
      pathname: "/viewcampaign",
      params: { campaignId: payment.campaignId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/cleanmystreet.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Payment</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {isLoading ? (
            <View style={styles.card}>
              <ActivityIndicator color={colors.green} />
              <Text style={styles.text}>Loading your payment…</Text>
            </View>
          ) : error || !payment ? (
            <View style={styles.card}>
              <FontAwesomeIcon icon={faCircleXmark} size={44} color={colors.red} />
              <Text style={styles.title}>Payment not found</Text>
              <Text style={styles.text}>{error ?? "Please try again."}</Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.replace("/home")}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Go home</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              {status === "pending" ? (
                <View style={styles.pendingIcon}>
                  <FontAwesomeIcon icon={faClock} size={26} color={colors.amber} />
                </View>
              ) : (
                <FontAwesomeIcon
                  icon={isDone ? faCircleCheck : faCircleXmark}
                  size={52}
                  color={isDone ? colors.teal : colors.red}
                />
              )}
              <Text style={styles.title} accessibilityRole="header">
                {statusCopy.title}
              </Text>
              <Text style={styles.text}>{statusCopy.text}</Text>

              <View style={styles.summary}>
                <SummaryRow label="Amount" value={formatRand(payment.amount)} />
                <SummaryRow label="Campaign" value={payment.campaignTitle} />
                <SummaryRow label="Method" value="Ozow instant EFT" />
                <SummaryRow label="Status" value={paymentStatusLabel(status)} />
                <SummaryRow label="Reference" value={payment.id} mono />
              </View>

              {payment.isTest && (
                <Text style={styles.testBadge}>
                  Test payment · no real money moved
                </Text>
              )}

              {status === "pending" && (
                <>
                  <Pressable
                    style={[styles.secondaryButton, isChecking && styles.disabled]}
                    onPress={() => void checkStatus()}
                    disabled={isChecking}
                    accessibilityRole="button"
                  >
                    {isChecking ? (
                      <ActivityIndicator color={colors.green} />
                    ) : (
                      <Text style={styles.secondaryButtonText}>Check status</Text>
                    )}
                  </Pressable>
                  {checkError && <Text style={styles.errorText}>{checkError}</Text>}
                </>
              )}

              {canRetry && (
                <Pressable
                  style={styles.primaryButton}
                  onPress={goToCampaign}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Try again</Text>
                </Pressable>
              )}
              {isDone && (
                <Pressable
                  style={styles.primaryButton}
                  onPress={goToCampaign}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Back to campaign</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.linkButton}
                onPress={() => router.replace("/home")}
                accessibilityRole="button"
              >
                <Text style={styles.linkButtonText}>Done</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.secureNote}>
            <FontAwesomeIcon icon={faShieldHalved} size={14} color={colors.green} />
            <Text style={styles.secureText}>
              Payments are processed by Ozow. CleanMyStreet never sees your bank
              login details.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): JSX.Element {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[styles.summaryValue, mono && styles.mono]}
        numberOfLines={1}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

const colors = {
  green: "#124A2A",
  teal: "#36B86B",
  ink: "#17201A",
  muted: "#68706A",
  border: "#E1E9E2",
  background: "#F5F8F5",
  paleGreen: "#EAF5ED",
  red: "#C2412D",
  amber: "#B7791F",
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 9,
  },
  logo: { width: 27, height: 27, resizeMode: "contain" },
  headerTitle: { color: colors.green, fontSize: 15, fontWeight: "700", flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    alignItems: "center",
    gap: 10,
  },
  pendingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDF3E1",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.green,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },
  text: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  summary: {
    alignSelf: "stretch",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: colors.muted, fontSize: 11 },
  summaryValue: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  mono: { fontFamily: "monospace", fontWeight: "500", fontSize: 10 },
  testBadge: {
    color: "#7A4D0B",
    backgroundColor: "#FDF3E1",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  primaryButton: {
    alignSelf: "stretch",
    minHeight: 44,
    borderRadius: 9,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  secondaryButton: {
    alignSelf: "stretch",
    minHeight: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  secondaryButtonText: { color: colors.green, fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  errorText: { color: colors.red, fontSize: 11, textAlign: "center" },
  linkButton: { paddingVertical: 8, paddingHorizontal: 16 },
  linkButtonText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.paleGreen,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  secureText: { color: colors.green, fontSize: 10, lineHeight: 15, flex: 1 },
});
