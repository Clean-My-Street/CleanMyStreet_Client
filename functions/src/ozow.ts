// Ozow instant EFT helpers: request hashing, notification verification and
// the status API. See https://ozow.com/integrations for the field reference.
import { createHash, timingSafeEqual } from "node:crypto";
import { defineSecret } from "firebase-functions/params";

// Set with `firebase functions:secrets:set OZOW_PRIVATE_KEY` (and OZOW_API_KEY).
// In the emulator they are read from functions/.secret.local.
export const ozowPrivateKey = defineSecret("OZOW_PRIVATE_KEY");
export const ozowApiKey = defineSecret("OZOW_API_KEY");

export const OZOW_PAY_URL = "https://pay.ozow.com";
const OZOW_API_URL = "https://api.ozow.com";

export type OzowConfig = {
  siteCode: string;
  privateKey: string;
  apiKey: string;
  isTest: boolean;
  // Public base URL of this API, used for Ozow's redirect and notify URLs.
  publicApiUrl: string;
};

function secretValue(secret: ReturnType<typeof defineSecret>): string {
  try {
    return secret.value().trim();
  } catch {
    return "";
  }
}

// Returns null when Ozow is not set up, so endpoints can answer 503.
export function getOzowConfig(): OzowConfig | null {
  const siteCode = process.env.OZOW_SITE_CODE?.trim() ?? "";
  const privateKey = secretValue(ozowPrivateKey);
  const apiKey = secretValue(ozowApiKey);
  if (!siteCode || !privateKey || !apiKey) return null;
  return {
    siteCode,
    privateKey,
    apiKey,
    // Test mode unless explicitly switched off, so a missing setting never
    // takes real money.
    isTest: process.env.OZOW_IS_TEST !== "false",
    publicApiUrl: (
      process.env.PUBLIC_API_URL ??
      "https://us-central1-cleanmystreetapp.cloudfunctions.net/api"
    ).replace(/\/+$/, ""),
  };
}

function sha512Lowercase(values: string[], privateKey: string): string {
  return createHash("sha512")
    .update(`${values.join("")}${privateKey}`.toLowerCase(), "utf8")
    .digest("hex");
}

export function formatOzowAmount(amount: number): string {
  return amount.toFixed(2);
}

export type OzowPaymentRequest = {
  SiteCode: string;
  CountryCode: "ZA";
  CurrencyCode: "ZAR";
  Amount: string;
  TransactionReference: string;
  BankReference: string;
  Optional1: string;
  Optional2: string;
  Optional3: string;
  Optional4: string;
  Optional5: string;
  Customer: string;
  CancelUrl: string;
  ErrorUrl: string;
  SuccessUrl: string;
  NotifyUrl: string;
  IsTest: "true" | "false";
  HashCheck: string;
};

// Field order matters: the hash is computed over the values in this order.
const REQUEST_HASH_FIELDS = [
  "SiteCode",
  "CountryCode",
  "CurrencyCode",
  "Amount",
  "TransactionReference",
  "BankReference",
  "Optional1",
  "Optional2",
  "Optional3",
  "Optional4",
  "Optional5",
  "Customer",
  "CancelUrl",
  "ErrorUrl",
  "SuccessUrl",
  "NotifyUrl",
  "IsTest",
] as const;

export function buildPaymentRequest(
  config: OzowConfig,
  input: {
    paymentId: string;
    amount: number;
    bankReference: string;
    campaignId: string;
  },
): OzowPaymentRequest {
  const returnUrl = (outcome: string) =>
    `${config.publicApiUrl}/payments/ozow/return?paymentId=${encodeURIComponent(
      input.paymentId,
    )}&outcome=${outcome}`;

  const fields: Omit<OzowPaymentRequest, "HashCheck"> = {
    SiteCode: config.siteCode,
    CountryCode: "ZA",
    CurrencyCode: "ZAR",
    Amount: formatOzowAmount(input.amount),
    TransactionReference: input.paymentId,
    BankReference: input.bankReference.slice(0, 20),
    Optional1: input.campaignId.slice(0, 50),
    Optional2: "",
    Optional3: "",
    Optional4: "",
    Optional5: "",
    Customer: "",
    CancelUrl: returnUrl("cancel"),
    ErrorUrl: returnUrl("error"),
    SuccessUrl: returnUrl("success"),
    NotifyUrl: `${config.publicApiUrl}/payments/ozow/notify`,
    IsTest: config.isTest ? "true" : "false",
  };
  return {
    ...fields,
    HashCheck: sha512Lowercase(
      REQUEST_HASH_FIELDS.map((field) => fields[field]),
      config.privateKey,
    ),
  };
}

const NOTIFICATION_HASH_FIELDS = [
  "SiteCode",
  "TransactionId",
  "TransactionReference",
  "Amount",
  "Status",
  "Optional1",
  "Optional2",
  "Optional3",
  "Optional4",
  "Optional5",
  "CurrencyCode",
  "IsTest",
  "StatusMessage",
] as const;

// Reads a field regardless of the casing Ozow uses for it.
export function fieldOf(
  source: Record<string, unknown>,
  name: string,
): string {
  const key = Object.keys(source).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );
  const value = key === undefined ? undefined : source[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

export function isValidNotificationHash(
  body: Record<string, unknown>,
  privateKey: string,
): boolean {
  const received = fieldOf(body, "Hash").toLowerCase();
  if (!/^[0-9a-f]{128}$/.test(received)) return false;
  const expected = sha512Lowercase(
    NOTIFICATION_HASH_FIELDS.map((field) => fieldOf(body, field)),
    privateKey,
  );
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export type PaymentStatus =
  | "pending"
  | "complete"
  | "cancelled"
  | "failed";

export function paymentStatusOf(ozowStatus: string): PaymentStatus {
  switch (ozowStatus.trim().toLowerCase()) {
    case "complete":
      return "complete";
    case "cancelled":
    case "abandoned":
      return "cancelled";
    case "error":
      return "failed";
    default:
      // Pending, PendingInvestigation and anything new stay pending.
      return "pending";
  }
}

export type OzowTransaction = {
  transactionId: string;
  siteCode: string;
  transactionReference: string;
  amount: number;
  status: PaymentStatus;
  statusMessage: string;
};

// Asks Ozow for the transactions with this reference. This is the source of
// truth for redirects (which can be forged) and for test payments (which get
// no notification).
export async function fetchTransactionByReference(
  config: OzowConfig,
  transactionReference: string,
): Promise<OzowTransaction | null> {
  const url = new URL(`${OZOW_API_URL}/GetTransactionByReference`);
  url.searchParams.set("siteCode", config.siteCode);
  url.searchParams.set("transactionReference", transactionReference);
  url.searchParams.set("IsTest", config.isTest ? "true" : "false");

  const response = await fetch(url, {
    headers: { ApiKey: config.apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Ozow status API answered ${response.status}.`);
  }
  const body: unknown = await response.json();
  const rows = (Array.isArray(body) ? body : [body]).filter(
    (row): row is Record<string, unknown> =>
      typeof row === "object" && row !== null,
  );
  const transactions = rows
    .map((row) => ({
      transactionId: fieldOf(row, "TransactionId"),
      siteCode: fieldOf(row, "SiteCode"),
      transactionReference: fieldOf(row, "TransactionReference"),
      amount: Number(fieldOf(row, "Amount")),
      status: paymentStatusOf(fieldOf(row, "Status")),
      statusMessage: fieldOf(row, "StatusMessage").slice(0, 300),
    }))
    .filter(
      (transaction) =>
        transaction.transactionReference === transactionReference &&
        (!transaction.siteCode ||
          transaction.siteCode.toLowerCase() === config.siteCode.toLowerCase()),
    );
  if (transactions.length === 0) return null;
  // References may repeat (a retried payment). A completed one wins.
  return (
    transactions.find((transaction) => transaction.status === "complete") ??
    transactions.find((transaction) => transaction.status === "pending") ??
    transactions[0]
  );
}

export function amountsMatch(expected: number, received: number): boolean {
  return Number.isFinite(received) && Math.abs(expected - received) < 0.005;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// A page that posts the signed request to Ozow straight away. The button is
// there for browsers with JavaScript off.
export function checkoutPage(request: OzowPaymentRequest): string {
  const inputs = Object.entries(request)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(
          value,
        )}">`,
    )
    .join("\n      ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redirecting to Ozow</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center;
        font-family: system-ui, sans-serif; background: #F5F8F5; color: #17201A; }
      main { text-align: center; padding: 24px; }
      h1 { color: #124A2A; font-size: 18px; }
      p { color: #68706A; font-size: 14px; }
      button { margin-top: 12px; padding: 12px 22px; border: 0; border-radius: 8px;
        background: #36B86B; color: #fff; font-weight: 700; font-size: 14px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Taking you to Ozow</h1>
      <p>Pay securely from your bank app. Please don't close this page.</p>
      <form id="ozow" method="POST" action="${OZOW_PAY_URL}">
      ${inputs}
        <button type="submit">Continue to Ozow</button>
      </form>
    </main>
    <script>document.getElementById("ozow").submit();</script>
  </body>
</html>`;
}
