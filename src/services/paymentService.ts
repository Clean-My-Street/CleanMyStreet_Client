import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  doc,
  collection,
  limit,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { Platform } from "react-native";
import { createOzowPayment } from "./api";
import { db } from "./firebase";

export type PaymentStatus = "pending" | "complete" | "cancelled" | "failed";

export type Payment = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  status: PaymentStatus;
  isTest: boolean;
  statusMessage: string | null;
  createdAt: Date | null;
  paidAt: Date | null;
};

const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "complete",
  "cancelled",
  "failed",
];

function dateOf(value: unknown): Date | null {
  return typeof (value as { toDate?: unknown })?.toDate === "function"
    ? (value as { toDate: () => Date }).toDate()
    : null;
}

function toPayment(id: string, data: DocumentData): Payment {
  return {
    id,
    campaignId: typeof data.campaignId === "string" ? data.campaignId : "",
    campaignTitle:
      typeof data.campaignTitle === "string" ? data.campaignTitle : "Campaign",
    amount: typeof data.amount === "number" ? data.amount : 0,
    status: PAYMENT_STATUSES.includes(data.status) ? data.status : "pending",
    isTest: data.isTest === true,
    statusMessage:
      typeof data.statusMessage === "string" ? data.statusMessage : null,
    createdAt: dateOf(data.createdAt),
    paidAt: dateOf(data.paidAt),
  };
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "complete":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Failed";
    default:
      return "Processing";
  }
}

export function subscribePayment(
  paymentId: string,
  onPayment: (payment: Payment | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "payments", paymentId),
    (snapshot) =>
      onPayment(snapshot.exists() ? toPayment(snapshot.id, snapshot.data()) : null),
    onError,
  );
}

// The user's latest Ozow payments, newest first. Sorted here so the query
// needs no composite index.
export function subscribeRecentPayments(
  userId: string,
  onPayments: (payments: Payment[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "payments"), where("userId", "==", userId), limit(50)),
    (snapshot) => {
      const payments = snapshot.docs
        .map((payment) => toPayment(payment.id, payment.data()))
        .sort(
          (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
        )
        .slice(0, 10);
      onPayments(payments);
    },
    onError,
  );
}

export type OzowCheckoutResult =
  // Web: the page is navigating to Ozow and will come back to /paymentresult.
  | { kind: "redirecting"; paymentId: string }
  // Native: the in-app browser closed (paid, cancelled or dismissed).
  | { kind: "returned"; paymentId: string };

// Creates an Ozow payment and sends the user to Ozow to pay it.
export async function startOzowCheckout(
  campaignId: string,
  amount: number,
): Promise<OzowCheckoutResult> {
  const returnUrl = Linking.createURL("paymentresult");
  const session = await createOzowPayment(campaignId, amount, returnUrl);

  if (Platform.OS === "web") {
    // A full-page redirect avoids popup blockers on mobile browsers.
    window.location.assign(session.checkoutUrl);
    return { kind: "redirecting", paymentId: session.id };
  }

  await WebBrowser.openAuthSessionAsync(session.checkoutUrl, returnUrl);
  return { kind: "returned", paymentId: session.id };
}
