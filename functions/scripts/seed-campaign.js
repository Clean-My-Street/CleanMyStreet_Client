// Creates the featured campaign document that the app's pledge form writes to.
// Safe to run more than once: an existing campaign is left unchanged.
//
// Usage (from the functions/ folder, with Admin credentials available through
// GOOGLE_APPLICATION_CREDENTIALS or `gcloud auth application-default login`):
//   npm run seed
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const CAMPAIGN_ID = "musgrave-road-cleanup";

initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "cleanmystreetapp" });

async function main() {
  const reference = getFirestore().collection("campaigns").doc(CAMPAIGN_ID);
  const now = Timestamp.now();

  try {
    await reference.create({
      title: "Musgrave Rd Cleanup",
      location: "Musgrave Road, near Botanic Gardens",
      description:
        "Large illegal dumping site along Musgrave Road near the Botanic Gardens.",
      goalAmount: 10000,
      currency: "ZAR",
      status: "funding",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created campaigns/${CAMPAIGN_ID}.`);
  } catch (error) {
    // gRPC code 6 is ALREADY_EXISTS.
    if (error.code === 6) {
      console.log(`campaigns/${CAMPAIGN_ID} already exists; nothing changed.`);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
