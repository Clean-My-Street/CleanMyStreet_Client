import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";
import { https } from "firebase-functions/v1";

initializeApp();

const db = getFirestore();
const app = express();

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

function responseCreatedAt(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

app.post(
  "/reports",
  authenticate,
  asyncHandler(async (request, response) => {
    const user = getAuthenticatedUser(request);
    const body: unknown = request.body;
    if (!isRecord(body)) {
      throw new HttpError(400, "A JSON request body is required.");
    }

    const description = requireString(body.description, "description", 2000);
    const latitude = optionalCoordinate(body.latitude, "latitude", -90, 90);
    const longitude = optionalCoordinate(body.longitude, "longitude", -180, 180);
    if ((latitude === undefined) !== (longitude === undefined)) {
      throw new HttpError(400, "latitude and longitude must be provided together.");
    }

    const imageUrl =
      body.imageUrl === undefined
        ? undefined
        : requireString(body.imageUrl, "imageUrl", 2048);
    const wasteType =
      body.wasteType === undefined
        ? undefined
        : requireString(body.wasteType, "wasteType", 80);
    const createdAt = Timestamp.now();
    const report = {
      description,
      ...(latitude !== undefined && longitude !== undefined
        ? { location: { latitude, longitude } }
        : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(wasteType ? { wasteType } : {}),
      reporterId: user.uid,
      status: "pending",
      createdAt,
    };

    const reference = await db.collection("reports").add(report);
    response.status(201).json({
      id: reference.id,
      ...report,
      createdAt: responseCreatedAt(createdAt),
    });
  }),
);

app.post(
  "/community/posts",
  authenticate,
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
  authenticate,
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
    if (
      typeof body.amount !== "number" ||
      !Number.isSafeInteger(body.amount) ||
      body.amount <= 0
    ) {
      throw new HttpError(400, "amount must be a positive whole number of ZAR.");
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
      transaction.create(contributionReference, {
        campaignId,
        userId: user.uid,
        amount: body.amount,
        currency: "ZAR",
        createdAt,
      });
    });

    response.status(201).json({
      id: contributionReference.id,
      campaignId,
      amount: body.amount,
      currency: "ZAR",
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
