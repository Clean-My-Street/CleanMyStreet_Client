import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { getAppCheck } from "firebase-admin/app-check";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { runWith } from "firebase-functions/v1";
import {
  amountsMatch,
  buildPaymentRequest,
  checkoutPage,
  fetchTransactionByReference,
  fieldOf,
  getOzowConfig,
  isValidNotificationHash,
  ozowApiKey,
  ozowPrivateKey,
  paymentStatusOf,
  type OzowConfig,
  type PaymentStatus,
} from "./ozow";

initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const app = express();

// Set ENFORCE_APP_CHECK=true (for example in functions/.env) once the app sends
// App Check tokens. Until then, tokens are verified when present but not required.
const ENFORCE_APP_CHECK = process.env.ENFORCE_APP_CHECK === "true";

const HOUR = 60 * 60 * 1000;
const MAX_REPORT_IMAGE_BYTES = 10 * 1024 * 1024;
// Pledges are promises to pay, not payments; this cap stops absurd totals.
const MAX_PLEDGE_AMOUNT = 50_000;
// Funding goal for the campaign created with each new report. Moderators can
// change it on the campaign document.
const DEFAULT_CAMPAIGN_GOAL = 5_000;

app.use(cors({ origin: true, methods: ["POST", "OPTIONS"] }));
app.use(express.json({ limit: "1mb" }));
// Ozow posts its notifications and redirects as HTML form data.
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface AuthenticatedRequest extends Request {
  authUser?: DecodedIdToken;
}

function getAuthenticatedUser(request: Request): DecodedIdToken {
  const user = (request as AuthenticatedRequest).authUser;
  if (!user) {
    throw new HttpError(401, "Authentication is required.");
  }
  return user;
}

const authenticate: RequestHandler = (request, response, next) => {
  const authorization = request.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    response.status(401).json({ error: "Authentication is required." });
    return;
  }

  void getAuth()
    .verifyIdToken(token)
    .then((user) => {
      (request as AuthenticatedRequest).authUser = user;
      next();
    })
    .catch((error: unknown) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string" &&
        error.code.startsWith("auth/")
      ) {
        response
          .status(401)
          .json({ error: "The authentication token is invalid or expired." });
        return;
      }
      next(error);
    });
};

const verifyAppCheck: RequestHandler = (request, response, next) => {
  const token = request.get("x-firebase-appcheck");
  if (!token) {
    if (ENFORCE_APP_CHECK) {
      response.status(401).json({ error: "This app version is not supported." });
      return;
    }
    next();
    return;
  }

  getAppCheck()
    .verifyToken(token)
    .then(() => next())
    .catch(() => {
      response.status(401).json({ error: "This app version is not supported." });
    });
};

// Fixed-window limit per user and action, stored in Firestore so it holds
// across function instances. Clients cannot read or write rateLimits.
function rateLimit(action: string, limit: number, windowMs: number): RequestHandler {
  return (request, response, next) => {
    const user = getAuthenticatedUser(request);
    const reference = db.collection("rateLimits").doc(`${action}_${user.uid}`);

    db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const now = Date.now();
      const windowStart = snapshot.get("windowStart");
      const count = snapshot.get("count");

      if (
        typeof windowStart === "number" &&
        typeof count === "number" &&
        now - windowStart < windowMs
      ) {
        if (count >= limit) {
          throw new HttpError(
            429,
            "You are doing that too often. Please try again later.",
          );
        }
        transaction.update(reference, { count: count + 1 });
        return;
      }

      transaction.set(reference, {
        windowStart: now,
        count: 1,
        expiresAt: Timestamp.fromMillis(now + windowMs),
      });
    })
      .then(() => next())
      .catch(next);
  };
}

function asyncHandler(
  handler: (request: Request, response: Response) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > maxLength
  ) {
    throw new HttpError(
      400,
      `${field} must be a non-empty string of at most ${maxLength} characters.`,
    );
  }
  return value.trim();
}

function optionalString(
  value: unknown,
  field: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new HttpError(
      400,
      `${field} must be a string of at most ${maxLength} characters.`,
    );
  }
  return value.trim() || undefined;
}

// Firestore document IDs from the URL: no slashes and not "." or "..".
function requireDocumentId(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 128 ||
    value.includes("/") ||
    value === "." ||
    value === ".."
  ) {
    throw new HttpError(400, `${field} is invalid.`);
  }
  return value;
}

function authorNameOf(user: DecodedIdToken): string {
  return (
    (typeof user.name === "string" && user.name.trim()) ||
    user.email?.split("@")[0] ||
    "Community member"
  );
}

function optionalCoordinate(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new HttpError(
      400,
      `${field} must be a number between ${minimum} and ${maximum}.`,
    );
  }
  return value;
}

type NotificationCategory = "Cleanups" | "Campaigns";

function notificationReference(userId: string) {
  return db.collection("users").doc(userId).collection("notifications").doc();
}

function notificationData(
  category: NotificationCategory,
  title: string,
  createdAt: Timestamp,
) {
  return { category, title, initials: "CM", read: false, createdAt };
}

// The same link format Firebase Storage's getDownloadURL returns. The token
// is created by the server, so the reporter never knows the public link's token.
function downloadUrl(path: string, token: string): string {
  const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  const origin = emulatorHost
    ? `http://${emulatorHost}`
    : "https://firebasestorage.googleapis.com";
  return `${origin}/v0/b/${bucket.name}/o/${encodeURIComponent(
    path,
  )}?alt=media&token=${token}`;
}

function responseCreatedAt(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

app.post(
  "/reports",
  verifyAppCheck,
  authenticate,
  rateLimit("reports", 10, HOUR),
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const body: unknown = request.body;
    if (!isRecord(body)) {
      throw new HttpError(400, "A JSON request body is required.");
    }

    // The client's upload ID only names the private upload. The public report
    // gets a server-generated ID so it cannot collide with another report.
    const uploadId = requireString(body.reportId, "reportId", 128);
    if (!/^[A-Za-z0-9_-]+$/.test(uploadId)) {
      throw new HttpError(400, "reportId contains invalid characters.");
    }

    const description = requireString(body.description, "description", 2000);
    const latitude = optionalCoordinate(body.latitude, "latitude", -90, 90);
    const longitude = optionalCoordinate(body.longitude, "longitude", -180, 180);
    if (latitude === undefined || longitude === undefined) {
      throw new HttpError(400, "A GPS latitude and longitude are required.");
    }

    const wasteType = requireString(body.wasteType, "wasteType", 80);
    if (!["Household", "Construction", "Illegal Dumping"].includes(wasteType)) {
      throw new HttpError(400, "wasteType is invalid.");
    }
    // A short public name for the site, such as a street or landmark.
    const siteName = optionalString(body.siteName, "siteName", 100);

    // Check the photo the user actually uploaded instead of trusting a URL
    // from the request.
    const upload = bucket.file(`reports/${user.uid}/${uploadId}.jpg`);
    const [uploadExists] = await upload.exists();
    if (!uploadExists) {
      throw new HttpError(400, "The report photo was not uploaded.");
    }
    const [uploadMetadata] = await upload.getMetadata();
    const uploadSize = Number(uploadMetadata.size);
    if (
      uploadMetadata.contentType !== "image/jpeg" ||
      !Number.isFinite(uploadSize) ||
      uploadSize <= 0 ||
      uploadSize > MAX_REPORT_IMAGE_BYTES
    ) {
      throw new HttpError(400, "The report photo must be a JPEG of at most 10 MB.");
    }

    const reference = db.collection("reports").doc();
    // The public copy's path does not contain the reporter's user ID.
    const imagePath = `reportImages/${reference.id}.jpg`;
    const publicImage = bucket.file(imagePath);
    const downloadToken = randomUUID();
    await upload.copy(publicImage, {
      contentType: "image/jpeg",
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    });

    const createdAt = Timestamp.now();
    const report = {
      description,
      location: { latitude, longitude },
      imageUrl: downloadUrl(imagePath, downloadToken),
      imagePath,
      wasteType,
      ...(siteName ? { siteName } : {}),
      status: "pending_verification",
      createdAt,
      updatedAt: createdAt,
    };

    try {
      const batch = db.batch();
      batch.create(reference, { ...report, campaignId: reference.id });
      // Every reported site gets a cleanup campaign that is open for pledges
      // straight away. It shares the report's ID and public photo.
      batch.create(db.collection("campaigns").doc(reference.id), {
        title: siteName ? `${siteName} Cleanup` : `${wasteType} Site Cleanup`,
        description,
        location: siteName ?? null,
        latitude,
        longitude,
        imageUrl: report.imageUrl,
        siteId: reference.id,
        wasteType,
        goalAmount: DEFAULT_CAMPAIGN_GOAL,
        pledgedAmount: 0,
        pledgeCount: 0,
        currency: "ZAR",
        status: "funding",
        createdAt,
        updatedAt: createdAt,
      });
      // Who reported what is private: only the server and the reporter can see it.
      batch.create(db.collection("reportOwners").doc(reference.id), {
        reportId: reference.id,
        reporterId: user.uid,
        createdAt,
      });
      batch.create(
        db.collection("users").doc(user.uid).collection("reports").doc(reference.id),
        {
          reportId: reference.id,
          wasteType,
          ...(siteName ? { siteName } : {}),
          createdAt,
        },
      );
      batch.create(
        notificationReference(user.uid),
        notificationData(
          "Cleanups",
          "Your dumping report was received and is awaiting verification",
          createdAt,
        ),
      );
      await batch.commit();
    } catch (error) {
      await publicImage.delete({ ignoreNotFound: true }).catch((cleanupError) => {
        console.error("Could not remove an unused report image", cleanupError);
      });
      throw error;
    }

    await upload.delete({ ignoreNotFound: true }).catch((cleanupError) => {
      console.error("Could not remove the private report upload", cleanupError);
    });

    response.status(201).json({
      id: reference.id,
      campaignId: reference.id,
      ...report,
      createdAt: responseCreatedAt(createdAt),
    });
  }),
);

app.post(
  "/community/posts",
  verifyAppCheck,
  authenticate,
  rateLimit("communityPosts", 20, HOUR),
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const body: unknown = request.body;
    if (!isRecord(body)) {
      throw new HttpError(400, "A JSON request body is required.");
    }

    const text = requireString(body.body, "body", 2000);
    const category = requireString(body.category, "category", 20);
    if (!["Cleanup", "Tips", "Question"].includes(category)) {
      throw new HttpError(400, "category must be Cleanup, Tips, or Question.");
    }

    const authorName = authorNameOf(user);
    const createdAt = Timestamp.now();
    const post = {
      body: text,
      category,
      authorId: user.uid,
      authorName,
      likes: 0,
      commentCount: 0,
      createdAt,
    };
    const reference = await db.collection("communityPosts").add(post);

    response.status(201).json({
      id: reference.id,
      ...post,
      createdAt: responseCreatedAt(createdAt),
    });
  }),
);

// Likes and unlikes a post. Each like is stored once per user, under the post
// and in the user's likedPosts list, and the post keeps the total.
app.post(
  "/community/posts/:postId/likes",
  verifyAppCheck,
  authenticate,
  rateLimit("communityLikes", 120, HOUR),
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const postId = requireDocumentId(request.params.postId, "postId");
    const postReference = db.collection("communityPosts").doc(postId);
    const likeReference = postReference.collection("likes").doc(user.uid);
    const userLikeReference = db
      .collection("users")
      .doc(user.uid)
      .collection("likedPosts")
      .doc(postId);

    const result = await db.runTransaction(async (transaction) => {
      const [post, like] = await Promise.all([
        transaction.get(postReference),
        transaction.get(likeReference),
      ]);
      if (!post.exists) {
        throw new HttpError(404, "Post not found.");
      }
      const currentLikes = post.get("likes");
      const likes = typeof currentLikes === "number" ? currentLikes : 0;

      if (like.exists) {
        transaction.delete(likeReference);
        transaction.delete(userLikeReference);
        transaction.update(postReference, {
          likes: FieldValue.increment(-1),
        });
        return { liked: false, likes: Math.max(0, likes - 1) };
      }

      const createdAt = Timestamp.now();
      transaction.create(likeReference, { userId: user.uid, createdAt });
      transaction.create(userLikeReference, { postId, createdAt });
      transaction.update(postReference, { likes: FieldValue.increment(1) });
      return { liked: true, likes: likes + 1 };
    });

    response.status(200).json({ postId, ...result });
  }),
);

app.post(
  "/community/posts/:postId/comments",
  verifyAppCheck,
  authenticate,
  rateLimit("communityComments", 60, HOUR),
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const postId = requireDocumentId(request.params.postId, "postId");
    const body: unknown = request.body;
    if (!isRecord(body)) {
      throw new HttpError(400, "A JSON request body is required.");
    }
    const text = requireString(body.body, "body", 1000);

    const postReference = db.collection("communityPosts").doc(postId);
    const commentReference = postReference.collection("comments").doc();
    const createdAt = Timestamp.now();
    const comment = {
      body: text,
      authorId: user.uid,
      authorName: authorNameOf(user),
      createdAt,
    };

    await db.runTransaction(async (transaction) => {
      const post = await transaction.get(postReference);
      if (!post.exists) {
        throw new HttpError(404, "Post not found.");
      }
      transaction.create(commentReference, comment);
      transaction.update(postReference, {
        commentCount: FieldValue.increment(1),
      });
    });

    response.status(201).json({
      id: commentReference.id,
      postId,
      ...comment,
      createdAt: responseCreatedAt(createdAt),
    });
  }),
);

app.post(
  "/campaigns/:campaignId/contributions",
  verifyAppCheck,
  authenticate,
  rateLimit("contributions", 20, HOUR),
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const campaignId =
      typeof request.params.campaignId === "string"
        ? request.params.campaignId
        : "";
    if (!campaignId || campaignId.includes("/")) {
      throw new HttpError(400, "campaignId is invalid.");
    }

    const body: unknown = request.body;
    if (!isRecord(body)) {
      throw new HttpError(400, "A JSON request body is required.");
    }
    const amount = body.amount;
    if (
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > MAX_PLEDGE_AMOUNT
    ) {
      throw new HttpError(
        400,
        `amount must be a whole number of ZAR from 1 to ${MAX_PLEDGE_AMOUNT}.`,
      );
    }

    const campaignReference = db.collection("campaigns").doc(campaignId);
    const contributionReference = campaignReference
      .collection("contributions")
      .doc();
    const createdAt = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const campaign = await transaction.get(campaignReference);
      if (!campaign.exists) {
        throw new HttpError(404, "Campaign not found.");
      }
      if (campaign.get("status") !== "funding") {
        throw new HttpError(409, "This campaign is no longer accepting pledges.");
      }
      transaction.create(contributionReference, {
        campaignId,
        userId: user.uid,
        amount,
        currency: "ZAR",
        status: "pledged",
        createdAt,
      });
      transaction.update(campaignReference, {
        pledgedAmount: FieldValue.increment(amount),
        pledgeCount: FieldValue.increment(1),
        updatedAt: createdAt,
      });
      const campaignTitle = campaign.get("title");
      // The pledger's own copy, so My Activity can list their pledges.
      transaction.create(
        db
          .collection("users")
          .doc(user.uid)
          .collection("contributions")
          .doc(contributionReference.id),
        {
          campaignId,
          campaignTitle:
            typeof campaignTitle === "string" ? campaignTitle : "Campaign",
          amount,
          currency: "ZAR",
          status: "pledged",
          createdAt,
        },
      );
      transaction.create(
        notificationReference(user.uid),
        notificationData(
          "Campaigns",
          `Your R${amount} pledge to ${
            typeof campaignTitle === "string" ? campaignTitle : "the campaign"
          } was recorded`,
          createdAt,
        ),
      );
    });

    response.status(201).json({
      id: contributionReference.id,
      campaignId,
      amount,
      currency: "ZAR",
      status: "pledged",
      createdAt: responseCreatedAt(createdAt),
    });
  }),
);

// ---------------------------------------------------------------------------
// Ozow payments
//
// 1. The app creates a payment (POST /campaigns/:id/payments) and opens the
//    returned checkoutUrl in a browser.
// 2. The checkout page posts the signed request to Ozow.
// 3. Ozow sends the customer back through /payments/ozow/return, which checks
//    the status with Ozow and redirects to the app's returnUrl.
// 4. Ozow also posts /payments/ozow/notify. Either path settles the payment;
//    a completed payment is counted towards the campaign exactly once.
// ---------------------------------------------------------------------------

const MAX_PAYMENT_AMOUNT = MAX_PLEDGE_AMOUNT;
const CHECKOUT_LINK_LIFETIME = 30 * 60 * 1000;

function requireOzowConfig(): OzowConfig {
  const config = getOzowConfig();
  if (!config) {
    throw new HttpError(503, "Ozow payments are not available right now.");
  }
  return config;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function requireWholeRandAmount(value: unknown, maximum: number): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > maximum
  ) {
    throw new HttpError(
      400,
      `amount must be a whole number of ZAR from 1 to ${maximum}.`,
    );
  }
  return value;
}

// Only app deep links, local development and configured web origins may be
// used, so the return redirect cannot send people to another site.
function requireReturnUrl(value: unknown): string {
  const raw = requireString(value, "returnUrl", 500);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(400, "returnUrl must be a valid URL.");
  }
  if (["cleanmystreet:", "exp:", "exps:"].includes(url.protocol)) {
    return url.toString();
  }
  if (url.protocol === "https:" || url.protocol === "http:") {
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const allowedOrigins = (process.env.ALLOWED_RETURN_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean);
    if (isLocal || allowedOrigins.includes(url.origin)) {
      return url.toString();
    }
  }
  throw new HttpError(400, "returnUrl is not an allowed app address.");
}

function messagePage(title: string, text: string): string {
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title></head>
<body style="font-family:system-ui,sans-serif;background:#F5F8F5;color:#17201A;display:grid;place-items:center;min-height:100vh;margin:0">
<main style="text-align:center;padding:24px"><h1 style="color:#124A2A;font-size:18px">${escape(
    title,
  )}</h1><p style="color:#68706A;font-size:14px">${escape(text)}</p></main></body></html>`;
}

type SettleInput = {
  status: PaymentStatus;
  amount: number;
  transactionId: string;
  statusMessage: string;
  source: "notification" | "status_api";
};

// Applies an Ozow status to a payment. Safe to call repeatedly: once complete,
// a payment never changes again, and the contribution is written once.
async function settlePayment(
  paymentId: string,
  input: SettleInput,
): Promise<PaymentStatus | null> {
  const paymentReference = db.collection("payments").doc(paymentId);

  return db.runTransaction(async (transaction) => {
    const payment = await transaction.get(paymentReference);
    if (!payment.exists) return null;

    const current = payment.get("status") as PaymentStatus;
    if (current === "complete") return current;

    const now = Timestamp.now();
    const common = {
      ozowTransactionId: input.transactionId || payment.get("ozowTransactionId") || null,
      statusMessage: input.statusMessage || null,
      lastCheckedBy: input.source,
      updatedAt: now,
    };

    if (input.status !== "complete") {
      // Keep a cancelled or failed payment from going back to pending.
      const status = input.status === "pending" ? current : input.status;
      transaction.update(paymentReference, { ...common, status });
      return status;
    }

    const amount = payment.get("amount");
    if (typeof amount !== "number" || !amountsMatch(amount, input.amount)) {
      console.error("Ozow amount mismatch", {
        paymentId,
        expected: amount,
        received: input.amount,
      });
      transaction.update(paymentReference, { ...common, needsReview: true });
      return current;
    }

    const userId = payment.get("userId") as string;
    const campaignId = payment.get("campaignId") as string;
    const campaignTitle = payment.get("campaignTitle") as string;
    const campaignReference = db.collection("campaigns").doc(campaignId);
    const campaign = await transaction.get(campaignReference);

    const contribution = {
      campaignId,
      amount,
      currency: "ZAR",
      status: "paid",
      provider: "ozow",
      paymentId,
      createdAt: now,
    };
    if (campaign.exists) {
      transaction.set(
        campaignReference.collection("contributions").doc(paymentId),
        { ...contribution, userId },
      );
      transaction.update(campaignReference, {
        pledgedAmount: FieldValue.increment(amount),
        pledgeCount: FieldValue.increment(1),
        paidAmount: FieldValue.increment(amount),
        updatedAt: now,
      });
    }
    transaction.set(
      db.collection("users").doc(userId).collection("contributions").doc(paymentId),
      { ...contribution, campaignTitle },
    );
    transaction.create(
      notificationReference(userId),
      notificationData(
        "Campaigns",
        `Your R${amount} Ozow payment to ${campaignTitle} was received. Thank you!`,
        now,
      ),
    );
    transaction.update(paymentReference, {
      ...common,
      status: "complete",
      paidAt: now,
    });
    return "complete";
  });
}

// Asks Ozow for the payment's status and applies it.
async function refreshPaymentFromOzow(
  config: OzowConfig,
  paymentId: string,
): Promise<PaymentStatus | null> {
  const ozowTransaction = await fetchTransactionByReference(config, paymentId);
  if (!ozowTransaction) return null;
  return settlePayment(paymentId, {
    status: ozowTransaction.status,
    amount: ozowTransaction.amount,
    transactionId: ozowTransaction.transactionId,
    statusMessage: ozowTransaction.statusMessage,
    source: "status_api",
  });
}

app.post(
  "/campaigns/:campaignId/payments",
  verifyAppCheck,
  authenticate,
  rateLimit("payments", 20, HOUR),
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const config = requireOzowConfig();
    const campaignId = requireDocumentId(request.params.campaignId, "campaignId");

    const body: unknown = request.body;
    if (!isRecord(body)) {
      throw new HttpError(400, "A JSON request body is required.");
    }
    const amount = requireWholeRandAmount(body.amount, MAX_PAYMENT_AMOUNT);
    const returnUrl = requireReturnUrl(body.returnUrl);

    const campaign = await db.collection("campaigns").doc(campaignId).get();
    if (!campaign.exists) {
      throw new HttpError(404, "Campaign not found.");
    }
    if (campaign.get("status") !== "funding") {
      throw new HttpError(409, "This campaign is no longer accepting payments.");
    }
    const campaignTitle = campaign.get("title");

    const paymentReference = db.collection("payments").doc();
    const checkoutToken = randomBytes(24).toString("base64url");
    const createdAt = Timestamp.now();
    await paymentReference.create({
      userId: user.uid,
      campaignId,
      campaignTitle:
        typeof campaignTitle === "string" ? campaignTitle : "Campaign",
      amount,
      currency: "ZAR",
      provider: "ozow",
      status: "pending",
      isTest: config.isTest,
      returnUrl,
      checkoutTokenHash: sha256(checkoutToken),
      checkoutExpiresAt: Timestamp.fromMillis(
        createdAt.toMillis() + CHECKOUT_LINK_LIFETIME,
      ),
      ozowTransactionId: null,
      statusMessage: null,
      createdAt,
      updatedAt: createdAt,
    });

    response.status(201).json({
      id: paymentReference.id,
      campaignId,
      amount,
      currency: "ZAR",
      status: "pending",
      isTest: config.isTest,
      checkoutUrl: `${config.publicApiUrl}/payments/ozow/${encodeURIComponent(
        paymentReference.id,
      )}/checkout?token=${checkoutToken}`,
      createdAt: responseCreatedAt(createdAt),
    });
  }),
);

// Opened in the browser, so it is authorised by the one-time checkout token
// instead of a Firebase ID token.
app.get(
  "/payments/ozow/:paymentId/checkout",
  asyncHandler(async (request, response) => {
    response.set("Cache-Control", "no-store");
    response.type("html");
    const config = getOzowConfig();
    if (!config) {
      response
        .status(503)
        .send(messagePage("Payments unavailable", "Please try again later."));
      return;
    }
    const paymentId = requireDocumentId(request.params.paymentId, "paymentId");
    const token = typeof request.query.token === "string" ? request.query.token : "";
    const payment = await db.collection("payments").doc(paymentId).get();
    const expiresAt = payment.get("checkoutExpiresAt");

    if (
      !payment.exists ||
      !token ||
      payment.get("checkoutTokenHash") !== sha256(token)
    ) {
      response
        .status(404)
        .send(messagePage("Payment not found", "Start the payment again from the app."));
      return;
    }
    if (payment.get("status") !== "pending") {
      response
        .status(409)
        .send(messagePage("Payment already finished", "You can close this page and return to CleanMyStreet."));
      return;
    }
    if (!(expiresAt instanceof Timestamp) || expiresAt.toMillis() < Date.now()) {
      response
        .status(410)
        .send(messagePage("Payment link expired", "Start the payment again from the app."));
      return;
    }

    const paymentRequest = buildPaymentRequest(config, {
      paymentId,
      amount: payment.get("amount") as number,
      bankReference: "CleanMyStreet",
      campaignId: payment.get("campaignId") as string,
    });
    response.status(200).send(checkoutPage(paymentRequest));
  }),
);

// Ozow sends the customer here after paying, cancelling or failing. The
// redirect itself proves nothing, so the status is fetched from Ozow.
const handleOzowReturn = asyncHandler(async (request, response) => {
  response.set("Cache-Control", "no-store");
  const fields = {
    ...(isRecord(request.body) ? request.body : {}),
    ...(request.query as Record<string, unknown>),
  };
  const paymentId =
    fieldOf(fields, "paymentId") || fieldOf(fields, "TransactionReference");
  const outcome = ["success", "cancel", "error"].includes(fieldOf(fields, "outcome"))
    ? fieldOf(fields, "outcome")
    : "unknown";

  let payment;
  try {
    payment = await db.collection("payments").doc(requireDocumentId(paymentId, "paymentId")).get();
  } catch {
    payment = null;
  }
  if (!payment?.exists) {
    response
      .status(404)
      .type("html")
      .send(messagePage("Payment not found", "You can close this page and return to CleanMyStreet."));
    return;
  }

  const config = getOzowConfig();
  if (config) {
    try {
      await refreshPaymentFromOzow(config, payment.id);
    } catch (error) {
      // The app keeps listening and can ask again; notifications also settle it.
      console.warn("Could not check the Ozow status on return.", error);
    }
  }

  const returnUrl = new URL(payment.get("returnUrl") as string);
  returnUrl.searchParams.set("paymentId", payment.id);
  returnUrl.searchParams.set("outcome", outcome);
  response.redirect(303, returnUrl.toString());
});
app.get("/payments/ozow/return", handleOzowReturn);
app.post("/payments/ozow/return", handleOzowReturn);

// Server-to-server notification from Ozow, signed with the private key.
app.post(
  "/payments/ozow/notify",
  asyncHandler(async (request, response) => {
    const config = requireOzowConfig();
    const body: unknown = request.body;
    if (!isRecord(body) || !isValidNotificationHash(body, config.privateKey)) {
      throw new HttpError(400, "The notification could not be verified.");
    }
    if (fieldOf(body, "SiteCode").toLowerCase() !== config.siteCode.toLowerCase()) {
      throw new HttpError(400, "The notification is for another site.");
    }
    const isTestNotification = fieldOf(body, "IsTest").toLowerCase() === "true";
    if (isTestNotification && !config.isTest) {
      // A test notification must never complete a live payment.
      response.status(200).send("OK");
      return;
    }

    const paymentId = fieldOf(body, "TransactionReference");
    if (!paymentId || paymentId.includes("/")) {
      throw new HttpError(400, "TransactionReference is invalid.");
    }
    const status = await settlePayment(paymentId, {
      status: paymentStatusOf(fieldOf(body, "Status")),
      amount: Number(fieldOf(body, "Amount")),
      transactionId: fieldOf(body, "TransactionId").slice(0, 100),
      statusMessage: fieldOf(body, "StatusMessage").slice(0, 300),
      source: "notification",
    });
    if (status === null) {
      console.warn("Ozow notification for an unknown payment", { paymentId });
    }
    response.status(200).send("OK");
  }),
);

// Lets the app ask for a fresh status, for example while a payment is pending.
app.post(
  "/payments/:paymentId/verify",
  verifyAppCheck,
  authenticate,
  rateLimit("paymentChecks", 60, HOUR),
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const paymentId = requireDocumentId(request.params.paymentId, "paymentId");
    const reference = db.collection("payments").doc(paymentId);
    const payment = await reference.get();
    if (!payment.exists || payment.get("userId") !== user.uid) {
      throw new HttpError(404, "Payment not found.");
    }

    let status = payment.get("status") as PaymentStatus;
    if (status === "pending") {
      const config = requireOzowConfig();
      try {
        status = (await refreshPaymentFromOzow(config, paymentId)) ?? status;
      } catch (error) {
        console.warn("Could not check the Ozow status.", error);
        throw new HttpError(502, "Could not reach Ozow. Please try again shortly.");
      }
    }
    response.status(200).json({ id: paymentId, status });
  }),
);

app.use((_request, response) => {
  response.status(404).json({ error: "Endpoint not found." });
});

const handleError: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    response.status(400).json({ error: "Request body must be valid JSON." });
    return;
  }

  console.error("Unhandled API error", error);
  response.status(500).json({ error: "The request could not be completed." });
};

app.use(handleError);

export const api = runWith({
  secrets: [ozowPrivateKey, ozowApiKey],
}).https.onRequest(app);
