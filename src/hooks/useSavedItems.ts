import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { auth } from "../services/firebase";
import {
  saveItem,
  subscribeSavedItems,
  type SavedItem,
  type SavedItemInput,
  unsaveItem,
} from "../services/savedItemsService";

export function useSavedItems() {
  const userId = auth.currentUser?.uid;
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      setError("Sign in to view and save items.");
      return;
    }

    setIsLoading(true);
    setError(null);
    return subscribeSavedItems(
      userId,
      (nextItems) => {
        setItems(nextItems);
        setIsLoading(false);
      },
      (subscriptionError) => {
        setError(subscriptionError.message);
        setIsLoading(false);
      },
    );
  }, [retryCount, userId]);

  const toggleSavedItem = useCallback(
    async (item: SavedItemInput) => {
      if (!userId) {
        Alert.alert("Sign in required", "Sign in to save sites and campaigns.");
        return;
      }
      const documentId = `${item.type}_${item.itemId}`;
      if (pendingItemIds.has(documentId)) return;

      setPendingItemIds((current) => new Set(current).add(documentId));
      const isCurrentlySaved = items.some((savedItem) => savedItem.id === documentId);
      try {
        if (isCurrentlySaved) {
          await unsaveItem(userId, item);
        } else {
          await saveItem(userId, item);
        }
      } catch (saveError) {
        Alert.alert(
          isCurrentlySaved ? "Could not remove saved item" : "Could not save item",
          saveError instanceof Error
            ? saveError.message
            : "Please check your connection and try again.",
        );
      } finally {
        setPendingItemIds((current) => {
          const next = new Set(current);
          next.delete(documentId);
          return next;
        });
      }
    },
    [items, pendingItemIds, userId],
  );

  const isSaved = useCallback(
    (item: Pick<SavedItemInput, "itemId" | "type">) =>
      items.some((savedItem) =>
        savedItem.id === `${item.type}_${item.itemId}`,
      ),
    [items],
  );

  const isPending = useCallback(
    (item: Pick<SavedItemInput, "itemId" | "type">) =>
      pendingItemIds.has(`${item.type}_${item.itemId}`),
    [pendingItemIds],
  );

  return {
    items,
    isLoading,
    error,
    isSaved,
    isPending,
    toggleSavedItem,
    retry: () => setRetryCount((count) => count + 1),
  };
}
