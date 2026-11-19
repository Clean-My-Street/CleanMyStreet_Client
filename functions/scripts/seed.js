// Creates the featured campaign document that the pledge form writes to.
// Safe to run more than once: documents that already exist are left unchanged.
//
// Usage (from the functions/ folder, with Admin credentials available through
// GOOGLE_APPLICATION_CREDENTIALS or `gcloud auth application-default login`):
//   npm run seed
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "cleanmystreetapp" });

const db = getFirestore();

const documents = [
  {
    path: "campaigns/musgrave-road-cleanup",
    data: {
      title: "Musgrave Rd Cleanup",
      location: "Musgrave Road, near Botanic Gardens",
      description:
        "Large illegal dumping site along Musgrave Road near the Botanic Gardens.",
      goalAmount: 10000,
      pledgedAmount: 0,
      pledgeCount: 0,
      currency: "ZAR",
      status: "funding",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  },
];

async function createIfMissing({ path, data }) {
  try {
    await db.doc(path).create(data);
    console.log(`Created ${path}.`);
  } catch (error) {
    // gRPC code 6 is ALREADY_EXISTS.
    if (error.code === 6) {
      console.log(`${path} already exists; nothing changed.`);
      return;
    }
    throw error;
  }
}

async function main() {
  for (const document of documents) {
    await createIfMissing(document);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
