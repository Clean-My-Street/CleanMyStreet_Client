import { Stack } from 'expo-router';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  configureNotificationDisplay,
  syncCleanupReminders,
} from '../services/cleanupReminderService';
import { auth } from '../services/firebase';
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

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setIsAuthResolved(true);
      }),
    [],
  );

  // Keep this device's reminder schedule in line with the saved preference.
  useEffect(() => {
    if (!user) {
      if (isAuthResolved) syncReminders(false);
      return;
    }
    return subscribeUserPreferences(
      user.uid,
      (preferences) => syncReminders(preferences.cleanupReminders),
      (error) => console.error('Could not load preferences.', error),
    );
  }, [isAuthResolved, user]);

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
