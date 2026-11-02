import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { JSX, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { auth, db } from "../services/firebase";

// The profile tab of the bottom nav: the user's profile picture, kept live
// from their Firestore profile, or a person icon when they have none.
export function ProfileNavButton({
  iconColor = "#124A2A",
}: {
  iconColor?: string;
}): JSX.Element {
  const router = useRouter();
  const userId = auth.currentUser?.uid;
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!userId) {
      setProfilePictureUrl(null);
      return;
    }

    return onSnapshot(
      doc(db, "users", userId),
      (snapshot) => {
        const savedUrl = snapshot.data()?.profilePictureUrl;
        setProfilePictureUrl(
          typeof savedUrl === "string" && savedUrl.trim() !== ""
            ? savedUrl
            : null,
        );
      },
      (error) => console.error("Error loading profile picture:", error),
    );
  }, [userId]);

  return (
    <Pressable
      onPress={() => router.push("/profile")}
      accessibilityRole="button"
      accessibilityLabel="View profile"
      style={styles.button}
    >
      {profilePictureUrl ? (
        <Image
          source={{ uri: profilePictureUrl }}
          style={styles.image}
          onError={() => setProfilePictureUrl(null)}
        />
      ) : (
        <FontAwesomeIcon icon={faUser} size={20} color={iconColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#36B86B",
  },
});
