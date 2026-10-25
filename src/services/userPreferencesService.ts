import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export type UserPreferences = {
  pushNotifications: boolean;
  cleanupReminders: boolean;
  locationServices: boolean;
  publicProfile: boolean;
  activitySharing: boolean;
  twoStepVerification: boolean;
};

export type UserPreferenceKey = keyof UserPreferences;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  pushNotifications: true,
  cleanupReminders: true,
  locationServices: false,
  publicProfile: true,
  activitySharing: false,
  twoStepVerification: false,
};

export function subscribeUserPreferences(
  userId: string,
  onPreferences: (preferences: UserPreferences) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "users", userId),
    (snapshot) => {
      const stored = snapshot.data()?.preferences;
      const preferences = { ...DEFAULT_USER_PREFERENCES };

      if (typeof stored === "object" && stored !== null) {
        for (const key of Object.keys(DEFAULT_USER_PREFERENCES) as UserPreferenceKey[]) {
          if (typeof stored[key] === "boolean") {
            preferences[key] = stored[key];
          }
        }
      }

      onPreferences(preferences);
    },
    (error) => onError(error),
  );
}

export async function saveUserPreference(
  userId: string,
  key: UserPreferenceKey,
  value: boolean,
): Promise<void> {
  await setDoc(
    doc(db, "users", userId),
    {
      uid: userId,
      preferences: { [key]: value },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
