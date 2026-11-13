// One-time migration for reports created before reporter IDs became private.
// For each report that still has a reporterId field, it:
//   1. records the owner in reportOwners/{id} and users/{uid}/reports/{id},
//   2. copies the photo to reportImages/{id}.jpg (a path without the user ID),
//   3. points the report at the new photo and removes reporterId,
//   4. deletes the old photo.
// Safe to run more than once: reports without reporterId are skipped.
//
// Usage (from the functions/ folder, with Admin credentials available through
// GOOGLE_APPLICATION_CREDENTIALS or `gcloud auth application-default login`):
//   npm run migrate:report-privacy            (dry run, changes nothing)
//   npm run migrate:report-privacy -- --apply (makes the changes)
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { randomUUID } = require("node:crypto");

const projectId = process.env.GCLOUD_PROJECT ?? "cleanmystreetapp";
initializeApp({
  projectId,
  storageBucket: process.env.STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`,
});

const db = getFirestore();
const bucket = getStorage().bucket();
const apply = process.argv.includes("--apply");

async function migrateReport(report) {
  const data = report.data();
  const reporterId = data.reporterId;
  if (typeof reporterId !== "string" || !reporterId) return false;

  const createdAt = data.createdAt ?? FieldValue.serverTimestamp();
  const update = { reporterId: FieldValue.delete() };
  const oldImagePath = typeof data.imagePath === "string" ? data.imagePath : null;
  const newImagePath = `reportImages/${report.id}.jpg`;
  let oldImage = null;

  if (oldImagePath && oldImagePath !== newImagePath) {
    const candidate = bucket.file(oldImagePath);
    const [exists] = await candidate.exists();
    if (exists) {
      oldImage = candidate;
    } else {
      console.warn(`${report.id}: photo ${oldImagePath} is missing; leaving image fields as they are.`);
    }
  }

  console.log(
    `${report.id}: ${apply ? "migrating" : "would migrate"}` +
      (oldImage ? ` (photo ${oldImagePath} -> ${newImagePath})` : ""),
  );
  if (!apply) return true;

  if (oldImage) {
    // A fresh token, so the old link (which contains the user ID) stops working.
    const token = randomUUID();
    await oldImage.copy(bucket.file(newImagePath), {
      metadata: { firebaseStorageDownloadTokens: token },
    });
    update.imagePath = newImagePath;
    update.imageUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(newImagePath)}?alt=media&token=${token}`;
  }

  const batch = db.batch();
  batch.set(db.collection("reportOwners").doc(report.id), {
    reportId: report.id,
    reporterId,
    createdAt,
  });
  batch.set(
    db.collection("users").doc(reporterId).collection("reports").doc(report.id),
    { reportId: report.id, createdAt },
  );
  batch.update(report.ref, update);
  await batch.commit();

  if (oldImage) {
    await oldImage.delete({ ignoreNotFound: true });
  }
  return true;
}

async function main() {
  const reports = await db.collection("reports").get();
  let count = 0;
  for (const report of reports.docs) {
    if (await migrateReport(report)) count += 1;
  }
  console.log(
    `${count} of ${reports.size} reports ${apply ? "migrated" : "need migrating"}.` +
      (apply ? "" : " Run again with --apply to make the changes."),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
