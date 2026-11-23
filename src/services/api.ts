
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

// Attach the Firebase authentication token to API requests.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You must be signed in to submit this request.');
  }

  config.headers.set('Authorization', `Bearer ${await user.getIdToken()}`);

  return config;
});

// ---------------- REPORT TYPES ----------------

export type WasteType =
  | 'Household'
  | 'Construction'
  | 'Illegal Dumping';

export type CreateReportInput = {
  description: string;
  latitude: number;
  longitude: number;
  wasteType: WasteType;

  // Keep imageUrl for compatibility with the existing submission screen.
  imageUrl?: string;

  // New multiple-image support.
  imageUrls?: string[];

  // New video support.
  videoUrl?: string | null;
};

export type Report = {
  id: string;
  description: string;
  latitude: number | null;
  longitude: number | null;

  // Existing single-image field.
  imageUrl: string | null;

  // New media fields.
  imageUrls: string[];
  videoUrl: string | null;

  wasteType: WasteType | string | null;
  reporterId: string;
  status: string;
  createdAt: string | null;
};

// ---------------- COMMUNITY TYPES ----------------

export type CommunityPostCategory = 'Cleanup' | 'Tips' | 'Question';

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

// ---------------- ERROR HANDLING ----------------

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const responseError = error.response?.data?.error;

    if (typeof responseError === 'string') {
      return responseError;
    }

    if (!error.response) {
      return 'Could not connect to the server. Check your connection and try again.';
    }
  }

  return error instanceof Error ? error.message : fallback;
}

// ---------------- REPORT FUNCTIONS ----------------

export async function createReport(input: CreateReportInput) {
  const response = await api.post<{
    id: string;
    status: string;
    createdAt: string;
    imageUrl?: string;
    imageUrls?: string[];
  }>('/reports', input);

  console.log("BACKEND REPORT RESPONSE:", response.data);

  return response.data;
}

export async function getReports(): Promise<Report[]> {
  const response = await api.get<Partial<Report>[]>('/reports');

  return response.data.map((report) => {
    // Older reports only have imageUrl.
    const imageUrls =
      Array.isArray(report.imageUrls) && report.imageUrls.length > 0
        ? report.imageUrls
        : report.imageUrl
          ? [report.imageUrl]
          : [];

    return {
      id: report.id ?? '',
      description: report.description ?? '',
      latitude: report.latitude ?? null,
      longitude: report.longitude ?? null,
      imageUrl: report.imageUrl ?? imageUrls[0] ?? null,
      imageUrls,
      videoUrl: report.videoUrl ?? null,
      wasteType: report.wasteType ?? null,
      reporterId: report.reporterId ?? '',
      status: report.status ?? 'pending',
      createdAt: report.createdAt ?? null,
    };
  });
}

// ---------------- COMMUNITY FUNCTIONS ----------------

export async function createCommunityPost(input: {
  body: string;
  category: CommunityPostCategory;
}) {
  const response = await api.post<CommunityPost>(
    '/community/posts',
    input,
  );

  return response.data;
}

// ---------------- CAMPAIGN FUNCTIONS ----------------

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
