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
  description: string;
  wasteType: WasteType;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  status: string;
  createdAt: Date;
};

export type SubmitDumpingReportInput = {
  description: string;
  wasteType: WasteType;
  latitude: number;
  longitude: number;
  photoUri: string;
};

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
      const data = report.data();
      const location = data.location;
      const status =
        typeof data.status === "string" ? data.status.trim() : "reported";
      if (
        ownReportIds.has(report.id) ||
        status.toLowerCase().startsWith("pending")
      ) {
        return [];
      }

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
        return [];
      }

      return [
        {
          id: report.id,
          description: data.description,
          wasteType: data.wasteType as WasteType,
          latitude: location.latitude,
          longitude: location.longitude,
          imageUrl:
            typeof data.imageUrl === "string" && data.imageUrl.trim()
              ? data.imageUrl
              : null,
          status,
          createdAt: data.createdAt.toDate(),
        },
      ];
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
    const reportInput: CreateReportInput = {
      reportId,
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
