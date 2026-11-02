import { Stack } from 'expo-router';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import {
  configureNotificationDisplay,
  showActivityAlert,
  syncCleanupReminders,
} from '../services/localNotificationService';
import { subscribeNewNotifications } from '../services/notificationsService';
import { subscribeUserPreferences } from '../services/userPreferencesService';

configureNotificationDisplay();

function syncReminders(enabled: boolean) {
  syncCleanupReminders(enabled).catch((error) =>
    console.error('Could not update cleanup reminders.', error),
  );
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [activityAlerts, setActivityAlerts] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setIsAuthResolved(true);
      }),
    [],
  );

  // Keep this device's local notifications in line with the saved preferences.
  useEffect(() => {
    if (!user) {
      setActivityAlerts(false);
      if (isAuthResolved) syncReminders(false);
      return;
    }
    return subscribeUserPreferences(
      user.uid,
      (preferences) => {
        setActivityAlerts(preferences.activityAlerts);
        syncReminders(preferences.cleanupReminders);
      },
      (error) => console.error('Could not load preferences.', error),
    );
  }, [isAuthResolved, user]);

  // Show new report and pledge updates as local notifications while the app runs.
  useEffect(() => {
    if (!user || !activityAlerts) return;
    return subscribeNewNotifications(user.uid, (title) => {
      showActivityAlert(title).catch((error) =>
        console.error('Could not show notification.', error),
      );
    });
  }, [activityAlerts, user]);

  // Wait for the persisted session to load so signed-in users don't flash the login screen.
  if (!isAuthResolved) return null;

  const isSignedIn = user !== null;

  // Denied users are sent to the first available screen: home when signed in, index otherwise.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="home" />
        <Stack.Screen name="community" />
        <Stack.Screen name="editprofile" />
        <Stack.Screen name="location" />
        <Stack.Screen name="myactivity" />
        <Stack.Screen name="news" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="paymentmethods" />
        <Stack.Screen name="previewcampaign" />
        <Stack.Screen name="privacysecurity" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="reportdumping" />
        <Stack.Screen name="saveditems" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="sites" />
        <Stack.Screen name="viewcampaign" />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" />
      </Stack.Protected>
    </Stack>
  );
}
