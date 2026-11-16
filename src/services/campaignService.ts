import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  goalAmount: number;
  pledgedAmount: number;
  pledgeCount: number;
  // "funding" is the only status that accepts pledges.
  status: string;
  createdAt: Date | null;
};

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toCampaign(id: string, data: DocumentData): Campaign | null {
  const title = optionalText(data.title);
  if (!title) return null;
  return {
    id,
    title,
    description: optionalText(data.description) ?? "",
    location: optionalText(data.location),
    latitude: optionalNumber(data.latitude),
    longitude: optionalNumber(data.longitude),
    imageUrl: optionalText(data.imageUrl),
    goalAmount: nonNegativeNumber(data.goalAmount),
    pledgedAmount: nonNegativeNumber(data.pledgedAmount),
    pledgeCount: nonNegativeNumber(data.pledgeCount),
    status: optionalText(data.status)?.toLowerCase() ?? "funding",
    createdAt:
      typeof data.createdAt?.toDate === "function"
        ? data.createdAt.toDate()
        : null,
  };
}

export function campaignStatusLabel(status: string): string {
  switch (status) {
    case "funding":
      return "Funding open";
    case "funded":
      return "Fully funded";
    case "scheduled":
      return "Cleanup scheduled";
    case "cleaned":
    case "completed":
      return "Cleaned";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function fundedPercent(campaign: {
  goalAmount: number;
  pledgedAmount: number;
}): number {
  return campaign.goalAmount > 0
    ? Math.min(
        100,
        Math.round((campaign.pledgedAmount / campaign.goalAmount) * 100),
      )
    : 0;
}

// All campaigns: open ones first, then newest first.
export function subscribeCampaigns(
  onCampaigns: (campaigns: Campaign[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, "campaigns"), limit(50)),
    (snapshot) => {
      const campaigns = snapshot.docs.flatMap((campaign) => {
        const parsed = toCampaign(campaign.id, campaign.data());
        return parsed ? [parsed] : [];
      });
      campaigns.sort((first, second) => {
        const openOrder =
          Number(second.status === "funding") -
          Number(first.status === "funding");
        if (openOrder !== 0) return openOrder;
        return (
          (second.createdAt?.getTime() ?? 0) - (first.createdAt?.getTime() ?? 0)
        );
      });
      onCampaigns(campaigns);
    },
    onError,
  );
}

// One campaign, or null if it doesn't exist.
export function subscribeCampaign(
  campaignId: string,
  onCampaign: (campaign: Campaign | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "campaigns", campaignId),
    (snapshot) =>
      onCampaign(
        snapshot.exists() ? toCampaign(snapshot.id, snapshot.data()) : null,
      ),
    onError,
  );
}

export type CampaignFunding = {
  goalAmount: number;
  pledgedAmount: number;
  pledgeCount: number;
};

function nonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

// Live pledge totals, which the API keeps up to date on the campaign document.
export function subscribeCampaignFunding(
  campaignId: string,
  onFunding: (funding: CampaignFunding | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "campaigns", campaignId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onFunding(null);
        return;
      }
      const data = snapshot.data();
      onFunding({
        goalAmount: nonNegativeNumber(data.goalAmount),
        pledgedAmount: nonNegativeNumber(data.pledgedAmount),
        pledgeCount: nonNegativeNumber(data.pledgeCount),
      });
    },
    onError,
  );
}
