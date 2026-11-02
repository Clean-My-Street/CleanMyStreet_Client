// Creates the starter Firestore content the app reads: the featured campaign
// that the pledge form writes to, and the first News articles.
// Safe to run more than once: documents that already exist are left unchanged.
//
// Usage (from the functions/ folder, with Admin credentials available through
// GOOGLE_APPLICATION_CREDENTIALS or `gcloud auth application-default login`):
//   npm run seed
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "cleanmystreetapp" });

const db = getFirestore();
const HOUR = 60 * 60 * 1000;

function hoursAgo(hours) {
  return Timestamp.fromMillis(Date.now() - hours * HOUR);
}

const documents = [
  {
    path: "campaigns/musgrave-road-cleanup",
    data: {
      title: "Musgrave Rd Cleanup",
      location: "Musgrave Road, near Botanic Gardens",
      description:
        "Large illegal dumping site along Musgrave Road near the Botanic Gardens.",
      goalAmount: 10000,
      currency: "ZAR",
      status: "funding",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  },
  {
    path: "newsArticles/community-cleanup-removes-dumping-site",
    data: {
      title: "Community cleanup removes illegal dumping site",
      category: "Recent News",
      story:
        "Residents and community volunteers joined a cleanup campaign to remove waste from an illegal dumping site. The cleanup focused on removing household waste, plastic and other materials that had accumulated in the area. Community members were encouraged to continue reporting illegal dumping so that problem areas can be identified and addressed.",
      publishedAt: hoursAgo(2),
    },
  },
  {
    path: "newsArticles/recycling-campaign-cleaner-communities",
    data: {
      title: "New recycling campaign encourages cleaner communities",
      category: "Recycling",
      story:
        "A new recycling campaign is encouraging residents to separate recyclable materials from general waste. The campaign aims to make recycling easier for communities while reducing the amount of waste that ends up in dumping areas. Residents can participate by separating recyclable materials and using available recycling collection points.",
      publishedAt: hoursAgo(5),
    },
  },
  {
    path: "newsArticles/growing-waste-problem-local-site",
    data: {
      title: "Residents report growing waste problem near local site",
      category: "Sites",
      story:
        "Residents have reported an increase in waste around a local dumping site. The reported waste includes household rubbish and other discarded materials. The site has been added to the community monitoring list so that residents can follow its progress and future cleanup activities.",
      publishedAt: hoursAgo(26),
    },
  },
  {
    path: "newsArticles/volunteers-restore-neighbourhood-park",
    data: {
      title: "Volunteers help restore a neighbourhood park",
      category: "Most Popular",
      story:
        "Local volunteers gathered to clean a neighbourhood park and surrounding streets. The group collected rubbish, cleared areas affected by illegal dumping and helped restore the space for community use. Organisers are encouraging residents to take part in future community cleanup campaigns.",
      publishedAt: hoursAgo(30),
    },
  },
  {
    path: "newsArticles/communities-prevent-illegal-dumping",
    data: {
      title: "How communities can help prevent illegal dumping",
      category: "Sites",
      story:
        "Preventing illegal dumping requires participation from the entire community. Residents can help by reporting dumping sites, disposing of household waste correctly and encouraging others to keep public spaces clean. Early reporting can also help communities identify problem areas before they become larger dumping sites.",
      publishedAt: hoursAgo(50),
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
