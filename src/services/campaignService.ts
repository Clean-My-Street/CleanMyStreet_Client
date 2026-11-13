import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";

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
