import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  isPendingReviewStatus,
  siteStatusOf,
  type WasteType,
} from "./reportService";

export type ActivityItem = {
  id: string;
  kind: "report" | "pledge" | "post";
  title: string;
  detail: string;
  status: string;
  date: Date;
};

export type UserActivity = {
  reportCount: number;
  pledgeTotal: number;
  postCount: number;
  items: ActivityItem[];
};

const RECENT_ITEMS = 20;

function dateOf(value: unknown): Date | null {
  return typeof (value as { toDate?: unknown })?.toDate === "function"
    ? (value as { toDate: () => Date }).toDate()
    : null;
}

// The signed-in user's reports, pledges and community posts, newest first.
// Reports come from users/{uid}/reports, with their current status read from
// the public report; pledges from users/{uid}/contributions (written by the API
// since pledges started being recorded there); posts by authorId.
export function subscribeUserActivity(
  userId: string,
  onActivity: (activity: UserActivity) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  let reports: ActivityItem[] = [];
  let pledges: ActivityItem[] = [];
  let pledgeTotal = 0;
  let posts: ActivityItem[] = [];
  let loaded = { reports: false, pledges: false, posts: false };
  let reportsVersion = 0;
  let isActive = true;

  const publish = () => {
    if (!isActive || !loaded.reports || !loaded.pledges || !loaded.posts) {
      return;
    }
    onActivity({
      reportCount: reports.length,
      pledgeTotal,
      postCount: posts.length,
      items: [...reports, ...pledges, ...posts]
        .sort((first, second) => second.date.getTime() - first.date.getTime())
        .slice(0, RECENT_ITEMS),
    });
  };

  const unsubscribeReports = onSnapshot(
    collection(db, "users", userId, "reports"),
    (snapshot) => {
      const version = ++reportsVersion;
      const entries = snapshot.docs.flatMap((entry) => {
        const date = dateOf(entry.get("createdAt"));
        return date ? [{ id: entry.id, data: entry.data(), date }] : [];
      });
      entries.sort((first, second) => second.date.getTime() - first.date.getTime());

      // Look up the current status of the most recent reports only.
      void Promise.all(
        entries.map(async (entry, index) => {
          let status = "reported";
          let siteName =
            typeof entry.data.siteName === "string" ? entry.data.siteName : null;
          let wasteType = entry.data.wasteType as WasteType | undefined;
          if (index < RECENT_ITEMS) {
            try {
              const report = await getDoc(doc(db, "reports", entry.id));
              if (report.exists()) {
                const data = report.data();
                if (typeof data.status === "string") status = data.status;
                if (typeof data.siteName === "string") siteName = data.siteName;
                if (typeof data.wasteType === "string") {
                  wasteType = data.wasteType as WasteType;
                }
              }
            } catch (error) {
              console.warn("Could not load a report's status.", error);
            }
          }
          const item: ActivityItem = {
            id: `report-${entry.id}`,
            kind: "report",
            title: "Reported a dumping site",
            detail: siteName ?? (wasteType ? `${wasteType} site` : "Dumping site"),
            status: isPendingReviewStatus(status)
              ? "Awaiting review"
              : siteStatusOf(status),
            date: entry.date,
          };
          return item;
        }),
      ).then((items) => {
        if (version !== reportsVersion) return;
        reports = items;
        loaded = { ...loaded, reports: true };
        publish();
      });
    },
    onError,
  );

  const unsubscribePledges = onSnapshot(
    collection(db, "users", userId, "contributions"),
    (snapshot) => {
      pledgeTotal = 0;
      pledges = snapshot.docs.flatMap((pledge) => {
        const data = pledge.data();
        const date = dateOf(data.createdAt);
        if (!date || typeof data.amount !== "number") return [];
        pledgeTotal += data.amount;
        return [
          {
            id: `pledge-${pledge.id}`,
            kind: "pledge" as const,
            title: "Pledged to a campaign",
            detail: `${
              typeof data.campaignTitle === "string"
                ? data.campaignTitle
                : "Campaign"
            } · R${data.amount.toLocaleString("en-ZA")}`,
            status: "Pledged",
            date,
          },
        ];
      });
      loaded = { ...loaded, pledges: true };
      publish();
    },
    onError,
  );

  const unsubscribePosts = onSnapshot(
    query(collection(db, "communityPosts"), where("authorId", "==", userId)),
    (snapshot) => {
      posts = snapshot.docs.flatMap((post) => {
        const data = post.data();
        const date = dateOf(data.createdAt);
        if (!date || typeof data.body !== "string") return [];
        return [
          {
            id: `post-${post.id}`,
            kind: "post" as const,
            title: "Posted in Community",
            detail:
              data.body.length > 80 ? `${data.body.slice(0, 77)}...` : data.body,
            status: typeof data.category === "string" ? data.category : "Post",
            date,
          },
        ];
      });
      loaded = { ...loaded, posts: true };
      publish();
    },
    onError,
  );

  return () => {
    isActive = false;
    unsubscribeReports();
    unsubscribePledges();
    unsubscribePosts();
  };
}
