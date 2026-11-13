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
import { randomUUID } from "node:crypto";
import { https } from "firebase-functions/v1";

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

app.use(cors({ origin: true, methods: ["POST", "OPTIONS"] }));
app.use(express.json({ limit: "1mb" }));

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
      status: "pending_verification",
      createdAt,
      updatedAt: createdAt,
    };

    try {
      const batch = db.batch();
      batch.create(reference, report);
      // Who reported what is private: only the server and the reporter can see it.
      batch.create(db.collection("reportOwners").doc(reference.id), {
        reportId: reference.id,
        reporterId: user.uid,
        createdAt,
      });
      batch.create(
        db.collection("users").doc(user.uid).collection("reports").doc(reference.id),
        { reportId: reference.id, createdAt },
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

    const authorName =
      (typeof user.name === "string" && user.name.trim()) ||
      user.email?.split("@")[0] ||
      "Community member";
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

export const api = https.onRequest(app);
