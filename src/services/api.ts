import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ??
    'https://us-central1-cleanmystreetapp.cloudfunctions.net/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to submit this request.');
  }

  config.headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  return config;
});

export type CommunityPostCategory = 'Cleanup' | 'Tips' | 'Question';

export type CreateReportInput = {
  reportId: string;
  description: string;
  latitude: number;
  longitude: number;
  wasteType: 'Household' | 'Construction' | 'Illegal Dumping';
  siteName?: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  body: string;
  category: CommunityPostCategory;
  authorId: string;
  authorName: string;
  likes: number;
  commentCount: number;
  createdAt: string;
};

export type Contribution = {
  id: string;
  campaignId: string;
  amount: number;
  currency: 'ZAR';
  status: 'pledged';
  createdAt: string;
};

export type OzowPaymentSession = {
  id: string;
  campaignId: string;
  amount: number;
  currency: 'ZAR';
  status: 'pending';
  isTest: boolean;
  checkoutUrl: string;
  createdAt: string;
};

export const FEATURED_CAMPAIGN_ID = 'musgrave-road-cleanup';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseError = error.response?.data?.error;
    if (typeof responseError === 'string') return responseError;
    if (!error.response) {
      return 'Could not connect to the server. Check your connection and try again.';
    }
  }

  return error instanceof Error ? error.message : fallback;
}

export async function createReport(input: CreateReportInput) {
  const response = await api.post<{
    id: string;
    campaignId: string;
    status: 'pending_verification';
    createdAt: string;
  }>('/reports', input);
  return response.data;
}

export async function createCommunityPost(input: {
  body: string;
  category: CommunityPostCategory;
}) {
  const response = await api.post<CommunityPost>('/community/posts', input);
  return response.data;
}

// Sends an empty JSON body: Cloud Functions rejects a POST without one (411).
export async function toggleCommunityPostLike(postId: string) {
  const response = await api.post<{
    postId: string;
    liked: boolean;
    likes: number;
  }>(`/community/posts/${encodeURIComponent(postId)}/likes`, {});
  return response.data;
}

export async function createCommunityComment(postId: string, body: string) {
  const response = await api.post<CommunityComment>(
    `/community/posts/${encodeURIComponent(postId)}/comments`,
    { body },
  );
  return response.data;
}

export async function createCampaignContribution(
  campaignId: string,
  amount: number,
) {
  const response = await api.post<Contribution>(
    `/campaigns/${encodeURIComponent(campaignId)}/contributions`,
    { amount },
  );
  return response.data;
}

// Starts an Ozow payment. Open checkoutUrl in a browser to pay; Ozow then
// returns the customer to returnUrl with ?paymentId=...&outcome=...
export async function createOzowPayment(
  campaignId: string,
  amount: number,
  returnUrl: string,
) {
  const response = await api.post<OzowPaymentSession>(
    `/campaigns/${encodeURIComponent(campaignId)}/payments`,
    { amount, returnUrl },
  );
  return response.data;
}

// Asks the server to check a pending payment's status with Ozow.
export async function verifyPayment(paymentId: string) {
  const response = await api.post<{ id: string; status: string }>(
    `/payments/${encodeURIComponent(paymentId)}/verify`,
    {},
  );
  return response.data;
}

export default api;