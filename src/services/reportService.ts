import { collection, doc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { auth, db, storage } from "./firebase";
import { createReport, type CreateReportInput } from "./api";

export type WasteType = "Household" | "Construction" | "Illegal Dumping";

export type SubmitDumpingReportInput = {
  description: string;
  wasteType: WasteType;
  latitude: number;
  longitude: number;
  photoUri: string;
};

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
    const response = await fetch(input.photoUri);
    if (!response.ok && response.status !== 0) {
      throw new Error("The selected photo could not be read.");
    }
    const imageBlob = await response.blob();
    if (imageBlob.size === 0) {
      throw new Error("The selected photo could not be read.");
    }

    await uploadBytes(imageReference, imageBlob, {
      contentType: "image/jpeg",
    });
    imageUploaded = true;

    const imageUrl = await getDownloadURL(imageReference);
    const reportInput: CreateReportInput = {
      reportId,
      description: input.description.trim(),
      wasteType: input.wasteType,
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrl,
      imagePath: imageReference.fullPath,
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
