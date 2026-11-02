import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REMINDER_ID = "weekly-cleanup-reminder";
const CHANNEL_ID = "cleanup-reminders";
// expo-notifications numbers weekdays 1–7 starting on Sunday.
const SATURDAY = 7;

const isSupported = Platform.OS !== "web";

export function configureNotificationDisplay(): void {
  if (!isSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Cleanup reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function scheduleReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Cleanup day",
      body: "See which dumping sites near you need a hand this weekend.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      channelId: CHANNEL_ID,
      weekday: SATURDAY,
      hour: 8,
      minute: 0,
    },
  });
}

// Asks for permission if needed. Returns false when reminders can't be shown.
export async function enableCleanupReminders(): Promise<boolean> {
  if (!isSupported) return false;
  await ensureAndroidChannel();

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && permissions.canAskAgain) {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (!permissions.granted) return false;

  await scheduleReminder();
  return true;
}

export async function disableCleanupReminders(): Promise<void> {
  if (!isSupported) return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}

// Matches this device's schedule to the saved preference without prompting,
// e.g. after signing in on a new device or signing out.
export async function syncCleanupReminders(enabled: boolean): Promise<void> {
  if (!isSupported) return;
  if (!enabled) {
    await disableCleanupReminders();
    return;
  }

  await ensureAndroidChannel();
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) {
    await scheduleReminder();
  } else {
    await disableCleanupReminders();
  }
}
