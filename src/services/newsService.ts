import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

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
