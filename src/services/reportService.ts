import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./firebase";
import { createReport, type CreateReportInput } from "./api";
import { readLocalImage } from "../utils/readLocalImage";

export type WasteType = "Household" | "Construction" | "Illegal Dumping";

export type ReportedSite = {
  id: string;
  siteName: string | null;
  description: string;
  wasteType: WasteType;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  status: string;
  createdAt: Date;
};

export type SiteStatus = "Reported" | "Funding" | "Scheduled" | "Cleaned";

export type Site = ReportedSite & {
  siteStatus: SiteStatus;
  isPendingReview: boolean;
  isOwn: boolean;
};

export type SubmitDumpingReportInput = {
  siteName?: string;
  description: string;
  wasteType: WasteType;
  latitude: number;
  longitude: number;
  photoUri: string;
};

export function isPendingReviewStatus(status: string): boolean {
  return status.toLowerCase().startsWith("pending");
}

// Groups the report statuses the server uses into the stages users see.
export function siteStatusOf(status: string): SiteStatus {
  const normalized = status.toLowerCase();
  if (normalized.startsWith("funding")) return "Funding";
  if (normalized.startsWith("scheduled")) return "Scheduled";
  if (normalized.startsWith("cleaned") || normalized.startsWith("completed")) {
    return "Cleaned";
  }
  return "Reported";
}

export function siteTitle(site: Pick<ReportedSite, "siteName" | "wasteType">) {
  return site.siteName ?? `${site.wasteType} site`;
}

function toReportedSite(report: QueryDocumentSnapshot): ReportedSite | null {
  const data = report.data();
  const location = data.location;
  if (
    typeof data.description !== "string" ||
    !["Household", "Construction", "Illegal Dumping"].includes(
      data.wasteType,
    ) ||
    typeof location !== "object" ||
    location === null ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number" ||
    typeof data.createdAt?.toDate !== "function"
  ) {
    return null;
  }

  return {
    id: report.id,
    siteName:
      typeof data.siteName === "string" && data.siteName.trim()
        ? data.siteName.trim()
        : null,
    description: data.description,
    wasteType: data.wasteType as WasteType,
    latitude: location.latitude,
    longitude: location.longitude,
    imageUrl:
      typeof data.imageUrl === "string" && data.imageUrl.trim()
        ? data.imageUrl
        : null,
    status: typeof data.status === "string" ? data.status.trim() : "reported",
    createdAt: data.createdAt.toDate(),
  };
}

// Every reported site, newest first, including the user's own reports and
// reports still awaiting review.
export function subscribeSites(
  onSites: (sites: Site[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const reportsQuery = query(
    collection(db, "reports"),
    orderBy("createdAt", "desc"),
    limit(200),
  );
  let ownReportIds = new Set<string>();
  let reportDocs: QueryDocumentSnapshot[] = [];
  const currentUserId = auth.currentUser?.uid;

  const publish = () => {
    onSites(
      reportDocs.flatMap((report) => {
        const site = toReportedSite(report);
        if (!site) return [];
        return [
          {
            ...site,
            siteStatus: siteStatusOf(site.status),
            isPendingReview: isPendingReviewStatus(site.status),
            isOwn: ownReportIds.has(site.id),
          },
        ];
      }),
    );
  };

  const unsubscribeReports = onSnapshot(
    reportsQuery,
    (snapshot) => {
      reportDocs = snapshot.docs;
      publish();
    },
    onError,
  );
  const unsubscribeOwnReports = currentUserId
    ? onSnapshot(
        collection(db, "users", currentUserId, "reports"),
        (snapshot) => {
          ownReportIds = new Set(snapshot.docs.map((report) => report.id));
          publish();
        },
        onError,
      )
    : () => {};

  return () => {
    unsubscribeReports();
    unsubscribeOwnReports();
  };
}

export function subscribeRecentReportedSites(
  onSites: (sites: ReportedSite[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const reportsQuery = query(
    collection(db, "reports"),
    orderBy("createdAt", "desc"),
    limit(100),
  );

  // Reports don't say who made them, so the user's own report IDs come from
  // their private list at users/{uid}/reports.
  let ownReportIds = new Set<string>();
  let reportDocs: QueryDocumentSnapshot[] = [];
  const currentUserId = auth.currentUser?.uid;

  const publish = () => {
    const sites = reportDocs.flatMap((report) => {
      if (ownReportIds.has(report.id)) return [];
      const site = toReportedSite(report);
      return site && !isPendingReviewStatus(site.status) ? [site] : [];
    });
    onSites(sites);
  };

  const unsubscribeReports = onSnapshot(
    reportsQuery,
    (snapshot) => {
      reportDocs = snapshot.docs;
      publish();
    },
    onError,
  );
  const unsubscribeOwnReports = currentUserId
    ? onSnapshot(
        collection(db, "users", currentUserId, "reports"),
        (snapshot) => {
          ownReportIds = new Set(snapshot.docs.map((report) => report.id));
          publish();
        },
        onError,
      )
    : () => {};

  return () => {
    unsubscribeReports();
    unsubscribeOwnReports();
  };
}

export async function submitDumpingReport(
  input: SubmitDumpingReportInput,
): Promise<Awaited<ReturnType<typeof createReport>>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in to submit a report.");
  }
  if (!input.photoUri.trim()) {
    throw new Error("A photo is required to submit a report.");
  }
  if (
    !Number.isFinite(input.latitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    !Number.isFinite(input.longitude) ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new Error("A valid GPS location is required to submit a report.");
  }

  const reportId = doc(collection(db, "reports")).id;
  const imageReference = ref(
    storage,
    `reports/${user.uid}/${reportId}.jpg`,
  );
  let imageUploaded = false;

  try {
    const imageBlob = await readLocalImage(input.photoUri);

    await uploadBytes(imageReference, imageBlob, {
      contentType: "image/jpeg",
    });
    imageUploaded = true;

    // The server checks this upload, publishes a copy and removes the original.
    const siteName = input.siteName?.trim();
    const reportInput: CreateReportInput = {
      reportId,
      ...(siteName ? { siteName } : {}),
      description: input.description.trim(),
      wasteType: input.wasteType,
      latitude: input.latitude,
      longitude: input.longitude,
    };

    return await createReport(reportInput);
  } catch (error) {
    if (imageUploaded) {
      try {
        await deleteObject(imageReference);
      } catch (cleanupError) {
        console.error("Could not remove the uploaded report photo.", cleanupError);
      }
    }
    throw error;
  }
}
