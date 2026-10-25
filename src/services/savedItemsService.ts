import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export type SavedItemType = "site" | "campaign";

export type SavedItemInput = {
  itemId: string;
  type: SavedItemType;
  title: string;
  detail: string;
};

export type SavedItem = SavedItemInput & {
  id: string;
};

function getSavedItemsCollection(userId: string) {
  return collection(db, "users", userId, "savedItems");
}

function getSavedItemDocument(userId: string, item: SavedItemInput) {
  return doc(
    getSavedItemsCollection(userId),
    `${item.type}_${item.itemId}`,
  );
}

export function subscribeSavedItems(
  userId: string,
  onItems: (items: SavedItem[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const savedItemsQuery = query(
    getSavedItemsCollection(userId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    savedItemsQuery,
    (snapshot) => {
      const items = snapshot.docs.flatMap((savedItem) => {
        const data = savedItem.data();
        if (
          (data.type !== "site" && data.type !== "campaign") ||
          typeof data.itemId !== "string" ||
          typeof data.title !== "string" ||
          typeof data.detail !== "string"
        ) {
          return [];
        }

        return [{
          id: savedItem.id,
          itemId: data.itemId,
          type: data.type,
          title: data.title,
          detail: data.detail,
        }];
      });
      onItems(items);
    },
    (error) => onError(error),
  );
}

export async function saveItem(
  userId: string,
  item: SavedItemInput,
): Promise<void> {
  await setDoc(getSavedItemDocument(userId, item), {
    ...item,
    createdAt: serverTimestamp(),
  });
}

export async function unsaveItem(
  userId: string,
  item: SavedItemInput,
): Promise<void> {
  await deleteDoc(getSavedItemDocument(userId, item));
}
