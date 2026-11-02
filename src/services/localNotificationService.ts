import type * as NotificationsModule from "expo-notifications";
import { Platform } from "react-native";

// The app only uses local notifications, scheduled or shown by this device.
// There are no push tokens and no server-sent notifications.
const REMINDER_ID = "weekly-cleanup-reminder";
const REMINDER_CHANNEL_ID = "cleanup-reminders";
const ACTIVITY_CHANNEL_ID = "activity-alerts";
// expo-notifications numbers weekdays 1–7 starting on Sunday.
const SATURDAY = 7;

let notificationsModule: typeof NotificationsModule | null | undefined;

// expo-notifications is loaded on first use instead of imported at the top:
// some runtimes (web, and Expo Go on Android) lack its native modules, and a
// failed top-level import would crash every screen that imports this file.
function getNotifications(): typeof NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;
  if (Platform.OS === "web") {
    notificationsModule = null;
    return null;
  }
  try {
    notificationsModule = require("expo-notifications") as typeof NotificationsModule;
  } catch (error) {
    console.warn("Local notifications are unavailable in this app build.", error);
    notificationsModule = null;
  }
  return notificationsModule;
}

export function areLocalNotificationsSupported(): boolean {
  return getNotifications() !== null;
}

export function configureNotificationDisplay(): void {
  getNotifications()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannels(
  Notifications: typeof NotificationsModule,
): Promise<void> {
  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Cleanup reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(ACTIVITY_CHANNEL_ID, {
    name: "Report and campaign updates",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Asks for permission if needed. Returns false when notifications can't be shown.
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  await ensureAndroidChannels(Notifications);

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && permissions.canAskAgain) {
    permissions = await Notifications.requestPermissionsAsync();
  }
  return permissions.granted;
}

async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  await ensureAndroidChannels(Notifications);
  return (await Notifications.getPermissionsAsync()).granted;
}

// Shows a notification right away for an update to the user's reports or pledges.
export async function showActivityAlert(title: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || !(await hasNotificationPermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: "CleanMyStreet", body: title },
    trigger: { channelId: ACTIVITY_CHANNEL_ID },
  });
}

async function scheduleReminder(
  Notifications: typeof NotificationsModule,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Cleanup day",
      body: "See which dumping sites near you need a hand this weekend.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      channelId: REMINDER_CHANNEL_ID,
      weekday: SATURDAY,
      hour: 8,
      minute: 0,
    },
  });
}

// Asks for permission if needed. Returns false when reminders can't be shown.
export async function enableCleanupReminders(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications || !(await requestNotificationPermission())) return false;
  await scheduleReminder(Notifications);
  return true;
}

export async function disableCleanupReminders(): Promise<void> {
  await getNotifications()?.cancelScheduledNotificationAsync(REMINDER_ID);
}

// Matches this device's schedule to the saved preference without prompting,
// e.g. after signing in on a new device or signing out.
export async function syncCleanupReminders(enabled: boolean): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  if (enabled && (await hasNotificationPermission())) {
    await scheduleReminder(Notifications);
  } else {
    await disableCleanupReminders();
  }
}
