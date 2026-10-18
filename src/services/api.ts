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
  description: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  wasteType?: string;
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
  const response = await api.post<{ id: string; status: 'pending' }>(
    '/reports',
    input,
  );
  return response.data;
}

export async function createCommunityPost(input: {
  body: string;
  category: CommunityPostCategory;
}) {
  const response = await api.post<CommunityPost>('/community/posts', input);
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

export default api;