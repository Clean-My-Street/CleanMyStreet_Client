import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export type NotificationCategory = "Cleanups" | "Campaigns";

export type UserNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  initials: string;
  read: boolean;
  createdAt: Date;
};

// Notifications are written by the Cloud Function API; the app can only
// read them and change their read status.
function getNotificationsCollection(userId: string) {
  return collection(db, "users", userId, "notifications");
}

export function subscribeNotifications(
  userId: string,
  onNotifications: (notifications: UserNotification[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const notificationsQuery = query(
    getNotificationsCollection(userId),
    orderBy("createdAt", "desc"),
    limit(100),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.flatMap((notification) => {
        const data = notification.data();
        if (
          (data.category !== "Cleanups" && data.category !== "Campaigns") ||
          typeof data.title !== "string" ||
          typeof data.read !== "boolean"
        ) {
          return [];
        }

        return [{
          id: notification.id,
          category: data.category,
          title: data.title,
          initials: typeof data.initials === "string" ? data.initials : "CM",
          read: data.read,
          // createdAt is briefly null while a server timestamp is pending.
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        }];
      });
      onNotifications(notifications);
    },
    (error) => onError(error),
  );
}

// Calls onNew for each notification created after subscribing, so the app
// can show it as a local notification. Existing ones are skipped.
export function subscribeNewNotifications(
  userId: string,
  onNew: (title: string) => void,
): Unsubscribe {
  const latestQuery = query(
    getNotificationsCollection(userId),
    orderBy("createdAt", "desc"),
    limit(10),
  );
  // Snapshots up to the first one confirmed by the server are the baseline.
  let hasBaseline = false;

  return onSnapshot(
    latestQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!hasBaseline) {
        hasBaseline = !snapshot.metadata.fromCache;
        return;
      }
      for (const change of snapshot.docChanges()) {
        const data = change.doc.data();
        if (change.type === "added" && !data.read && typeof data.title === "string") {
          onNew(data.title);
        }
      }
    },
    (error) => console.error("Could not watch for new notifications.", error),
  );
}

export async function setNotificationRead(
  userId: string,
  notificationId: string,
  read: boolean,
): Promise<void> {
  await updateDoc(doc(getNotificationsCollection(userId), notificationId), {
    read,
  });
}

export async function markNotificationsRead(
  userId: string,
  notificationIds: string[],
): Promise<void> {
  // A Firestore batch holds at most 500 writes.
  for (let start = 0; start < notificationIds.length; start += 500) {
    const batch = writeBatch(db);
    for (const notificationId of notificationIds.slice(start, start + 500)) {
      batch.update(doc(getNotificationsCollection(userId), notificationId), {
        read: true,
      });
    }
    await batch.commit();
  }
}
