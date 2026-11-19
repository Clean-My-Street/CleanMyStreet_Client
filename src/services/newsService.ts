import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "./firebase";

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
};

function isNewsCategory(value: unknown): value is NewsCategory {
  return NEWS_CATEGORIES.includes(value as NewsCategory);
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

async function getArticleImageUrl(
  data: Record<string, unknown>,
  imageUrlCache: Map<string, Promise<string | null>>,
): Promise<string | null> {
  const imageUrl =
    typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
  if (imageUrl && isHttpUrl(imageUrl)) return imageUrl;

  const imagePath =
    typeof data.imagePath === "string" && data.imagePath.trim()
      ? data.imagePath.trim()
      : imageUrl;
  if (!imagePath) return null;

  if (isHttpUrl(imagePath)) return imagePath;
  const cachedUrl = imageUrlCache.get(imagePath);
  if (cachedUrl) return cachedUrl;

  try {
    const downloadUrl = getDownloadURL(ref(storage, imagePath)).catch(() => {
      imageUrlCache.delete(imagePath);
      return null;
    });
    imageUrlCache.set(imagePath, downloadUrl);
    return await downloadUrl;
  } catch {
    return null;
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

  let isActive = true;
  let snapshotVersion = 0;
  const imageUrlCache = new Map<string, Promise<string | null>>();
  const unsubscribe = onSnapshot(
    articlesQuery,
    (snapshot) => {
      const version = ++snapshotVersion;
      void Promise.all(
        snapshot.docs.map(async (article) => {
          const data = article.data();
          if (
            typeof data.title !== "string" ||
            typeof data.story !== "string" ||
            !isNewsCategory(data.category) ||
            typeof data.publishedAt?.toDate !== "function"
          ) {
            return null;
          }

          return {
            id: article.id,
            title: data.title,
            category: data.category,
            story: data.story,
            imageUrl: await getArticleImageUrl(data, imageUrlCache),
            publishedAt: data.publishedAt.toDate(),
          } satisfies NewsArticle;
        }),
      )
        .then((results) => {
          if (!isActive || version !== snapshotVersion) return;
          onArticles(
            results.filter(
              (article): article is NewsArticle => article !== null,
            ),
          );
        })
        .catch((error: unknown) => {
          if (!isActive || version !== snapshotVersion) return;
          onError(
            error instanceof Error
              ? error
              : new Error("Could not load news articles."),
          );
        });
    },
    (error) => {
      if (isActive) onError(error);
    },
  );

  return () => {
    isActive = false;
    unsubscribe();
  };
}
