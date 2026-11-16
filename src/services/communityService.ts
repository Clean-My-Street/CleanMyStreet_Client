import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import type { CommunityPostCategory } from "./api";
import { db } from "./firebase";

export type FeedPost = {
  id: string;
  body: string;
  category: CommunityPostCategory;
  authorId: string;
  authorName: string;
  likes: number;
  commentCount: number;
  createdAt: Date;
};

export type FeedComment = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
};

const FEED_SIZE = 50;
const CATEGORIES: CommunityPostCategory[] = ["Cleanup", "Tips", "Question"];

function nonNegativeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

// The newest community posts, kept up to date as people post, like and comment.
export function subscribeCommunityPosts(
  onPosts: (posts: FeedPost[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "communityPosts"),
      orderBy("createdAt", "desc"),
      limit(FEED_SIZE),
    ),
    (snapshot) => {
      onPosts(
        snapshot.docs.flatMap((post) => {
          const data = post.data();
          if (
            typeof data.body !== "string" ||
            !CATEGORIES.includes(data.category) ||
            typeof data.createdAt?.toDate !== "function"
          ) {
            return [];
          }
          return [
            {
              id: post.id,
              body: data.body,
              category: data.category as CommunityPostCategory,
              authorId: typeof data.authorId === "string" ? data.authorId : "",
              authorName:
                typeof data.authorName === "string" && data.authorName.trim()
                  ? data.authorName.trim()
                  : "Community member",
              likes: nonNegativeCount(data.likes),
              commentCount: nonNegativeCount(data.commentCount),
              createdAt: data.createdAt.toDate(),
            },
          ];
        }),
      );
    },
    onError,
  );
}

// IDs of the posts the user has liked.
export function subscribeLikedPostIds(
  userId: string,
  onLikedPostIds: (postIds: Set<string>) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "users", userId, "likedPosts"),
    (snapshot) => onLikedPostIds(new Set(snapshot.docs.map((like) => like.id))),
    onError,
  );
}

// A post's comments, oldest first.
export function subscribePostComments(
  postId: string,
  onComments: (comments: FeedComment[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "communityPosts", postId, "comments"),
      orderBy("createdAt", "asc"),
      limit(100),
    ),
    (snapshot) => {
      onComments(
        snapshot.docs.flatMap((comment) => {
          const data = comment.data();
          if (
            typeof data.body !== "string" ||
            typeof data.createdAt?.toDate !== "function"
          ) {
            return [];
          }
          return [
            {
              id: comment.id,
              body: data.body,
              authorId: typeof data.authorId === "string" ? data.authorId : "",
              authorName:
                typeof data.authorName === "string" && data.authorName.trim()
                  ? data.authorName.trim()
                  : "Community member",
              createdAt: data.createdAt.toDate(),
            },
          ];
        }),
      );
    },
    onError,
  );
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CM"
  );
}
