import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";
const GDELT_MAX_RECORDS = 50;
const GDELT_TIMEOUT_MS = 15_000;
const environmentalTopics = [
  '"illegal dumping"',
  '"waste management"',
  "waste",
  "recycling",
  "landfill",
  "litter",
  "garbage",
  "pollution",
  "cleanup",
];

export const NEWS_CATEGORIES = [
  "Most Popular",
  "Recent News",
  "Recycling",
  "Sites",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type NewsArticle = {
  id: string;
  title: string;
  category: NewsCategory;
  story: string;
  imageUrl: string | null;
  publishedAt: Date;
  sourceUrl?: string;
  domain?: string;
  sourceCountry?: string;
  sourceLanguage?: string;
};

export type GdeltLocationContext = {
  city?: string;
  region?: string;
  country?: string;
};

type GdeltArticleRecord = {
  url?: unknown;
  title?: unknown;
  seendate?: unknown;
  socialimage?: unknown;
  domain?: unknown;
  language?: unknown;
  sourcecountry?: unknown;
};

function isNewsCategory(value: unknown): value is NewsCategory {
  return NEWS_CATEGORIES.includes(value as NewsCategory);
}

function getCategory(title: string): NewsCategory {
  if (
    /\b(dump(?:ing|ed)?|landfill|litter|garbage|rubbish|pollution)\b/i.test(
      title,
    )
  ) {
    return "Sites";
  }
  if (/\b(recycl(?:e|ing))\b/i.test(title)) return "Recycling";
  return "Recent News";
}

function quoteLocation(value: string | undefined): string | null {
  const cleaned = value?.replace(/["\\]/g, "").trim();
  return cleaned ? `"${cleaned.slice(0, 80)}"` : null;
}

function parseGdeltDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (!match) return null;

  const date = new Date(
    `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function toGdeltNewsArticle(
  record: GdeltArticleRecord,
): NewsArticle | null {
  if (
    typeof record.title !== "string" ||
    !record.title.trim() ||
    !isHttpUrl(record.url)
  ) {
    return null;
  }

  const publishedAt = parseGdeltDate(record.seendate);
  if (!publishedAt) return null;

  let domain: string;
  try {
    domain =
      typeof record.domain === "string" && record.domain.trim()
        ? record.domain.trim()
        : new URL(record.url).hostname;
  } catch {
    return null;
  }

  return {
    id: `gdelt:${record.url}`,
    title: record.title.trim(),
    category: getCategory(record.title),
    story: `This article is indexed by GDELT. Open the source article from ${domain} to read its full coverage.`,
    imageUrl:
      isHttpUrl(record.socialimage) && record.socialimage.trim()
        ? record.socialimage
        : null,
    publishedAt,
    sourceUrl: record.url,
    domain,
    sourceCountry:
      typeof record.sourcecountry === "string" ? record.sourcecountry : undefined,
    sourceLanguage:
      typeof record.language === "string" ? record.language : undefined,
  };
}

export async function fetchRelevantNews(
  location: GdeltLocationContext | null,
  signal?: AbortSignal,
): Promise<NewsArticle[]> {
  const cityAndRegion = [
    quoteLocation(location?.city),
    quoteLocation(location?.region),
  ].filter((term): term is string => term !== null);
  const locationTerms =
    cityAndRegion.length > 0
      ? cityAndRegion
      : [quoteLocation(location?.country)].filter(
          (term): term is string => term !== null,
        );
  const topicQuery = `(${environmentalTopics.join(" OR ")})`;
  const queryText = [
    locationTerms.length > 1
      ? `(${locationTerms.join(" OR ")})`
      : locationTerms[0],
    topicQuery,
  ]
    .filter(Boolean)
    .join(" ");

  const params = new URLSearchParams({
    query: queryText,
    mode: "ArtList",
    format: "json",
    maxrecords: String(GDELT_MAX_RECORDS),
    sort: "DateDesc",
    timespan: "3months",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GDELT_TIMEOUT_MS);
  const abortRequest = () => controller.abort();
  signal?.addEventListener("abort", abortRequest, { once: true });

  try {
    const response = await fetch(`${GDELT_DOC_API}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(
        `GDELT news search failed (${response.status}). Please try again later.`,
      );
    }

    const payload: unknown = await response.json();
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("articles" in payload) ||
      !Array.isArray(payload.articles)
    ) {
      throw new Error("GDELT returned an unexpected news response.");
    }

    const uniqueArticles = new Map<string, NewsArticle>();
    for (const candidate of payload.articles) {
      if (typeof candidate !== "object" || candidate === null) continue;
      const article = toGdeltNewsArticle(candidate as GdeltArticleRecord);
      if (article) uniqueArticles.set(article.sourceUrl ?? article.id, article);
    }
    return [...uniqueArticles.values()];
  } catch (error) {
    if (signal?.aborted) throw error;
    if (controller.signal.aborted) {
      throw new Error("GDELT news search timed out. Please try again.");
    }
    throw error instanceof Error
      ? error
      : new Error("Could not load environmental news from GDELT.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
  }
}

export function subscribeNewsArticles(
  onArticles: (articles: NewsArticle[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const articlesQuery = query(
    collection(db, "newsArticles"),
    orderBy("publishedAt", "desc"),
    limit(50),
  );

  return onSnapshot(
    articlesQuery,
    (snapshot) => {
      const articles = snapshot.docs.flatMap((article) => {
        const data = article.data();
        if (
          typeof data.title !== "string" ||
          typeof data.story !== "string" ||
          !isNewsCategory(data.category) ||
          typeof data.publishedAt?.toDate !== "function"
        ) {
          return [];
        }

        return [{
          id: article.id,
          title: data.title,
          category: data.category,
          story: data.story,
          imageUrl:
            typeof data.imageUrl === "string" && data.imageUrl.trim()
              ? data.imageUrl
              : null,
          publishedAt: data.publishedAt.toDate(),
        }];
      });
      onArticles(articles);
    },
    (error) => onError(error),
  );
}
