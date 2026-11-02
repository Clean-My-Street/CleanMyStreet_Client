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
