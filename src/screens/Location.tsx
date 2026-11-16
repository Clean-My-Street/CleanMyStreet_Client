
import {
  faHome,
  faNewspaper,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { JSX, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createReport, getApiErrorMessage } from "../services/api";
import { auth, db, storage } from "../services/firebase";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function LocationScreen(): JSX.Element {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{
    photoUri?: string | string[];
  }>();

  const capturedPhotoUri = Array.isArray(photoUri)
    ? photoUri[0]
    : photoUri;

  const user = auth.currentUser;

  const [profilePictureUrl, setProfilePictureUrl] =
    useState<string | null>(null);

  const [wasteType, setWasteType] = useState("Illegal Dumping");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState("");

  // GET DEVICE GPS LOCATION
  const getDeviceLocation = async () => {
    try {
      setIsGettingLocation(true);
      setLocationError("");

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setCoordinates(null);
        setLocationError(
          "Location permission denied. Please allow location access.",
        );
        return;
      }

      const currentPosition =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      setCoordinates({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });
    } catch (error) {
      console.error("Error retrieving GPS location:", error);
      setCoordinates(null);
      setLocationError("Could not retrieve your location. Please try again.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  // GET LOCATION WHEN SCREEN OPENS
  useEffect(() => {
    getDeviceLocation();
  }, []);

  // LOAD USER PROFILE PICTURE
  useEffect(() => {
    if (!user) {
      setProfilePictureUrl(null);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const savedUrl = snapshot.data().profilePictureUrl;

          setProfilePictureUrl(
            typeof savedUrl === "string" && savedUrl.trim() !== ""
              ? savedUrl
              : null,
          );
        } else {
          setProfilePictureUrl(null);
        }
      },
      (error) => {
        console.error("Error loading profile picture:", error);
      },
    );

    return unsubscribe;
  }, [user?.uid]);

  // UPLOAD PHOTO TO FIREBASE STORAGE
  const uploadReportPhoto = async (uri: string): Promise<string> => {
    if (!user) {
      throw new Error("You must be signed in to upload a report.");
    }

    const response = await fetch(uri);
    const photoBlob = await response.blob();

    const filePath = `reports/${user.uid}/${Date.now()}.jpg`;
    const fileReference = storageRef(storage, filePath);

    await uploadBytes(fileReference, photoBlob, {
      contentType: "image/jpeg",
    });

    return await getDownloadURL(fileReference);
  };

  // SUBMIT REPORT
  const submitReport = async () => {
    const reportDescription = description.trim();

    if (!reportDescription) {
      Alert.alert(
        "Description required",
        "Please describe the dumping site.",
      );
      return;
    }

    if (!capturedPhotoUri) {
      Alert.alert(
        "Photo required",
        "Please go back and capture a photo of the dumping site.",
      );
      return;
    }

    if (!user) {
      Alert.alert(
        "Sign in required",
        "Please sign in before submitting a report.",
      );
      return;
    }

    if (isSubmitting) return;

    // Make sure GPS coordinates are available.
    let reportCoordinates = coordinates;

    if (!reportCoordinates) {
      await getDeviceLocation();
      Alert.alert(
        "Location required",
        "Please check that your GPS is enabled and try submitting again.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // First upload the captured photo.
      const imageUrl = await uploadReportPhoto(capturedPhotoUri);

      // Then save the report through the backend API.
      await createReport({
        description: reportDescription,
        wasteType,
        latitude: reportCoordinates.latitude,
        longitude: reportCoordinates.longitude,
        imageUrl,
      });

      Alert.alert(
        "Report submitted",
        "Your dumping-site report has been saved for review.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/sites"),
          },
        ],
      );
    } catch (error) {
      console.error("Error submitting report:", error);

      Alert.alert(
        "Report not submitted",
        getApiErrorMessage(
          error,
          "Something went wrong while submitting your report. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View style={styles.logoMark}>
              <Image
                source={require("../../assets/images/cleanmystreet.png")}
                style={styles.logo}
              />
            </View>

            <Text style={styles.brandName}>Report a Dumping Site</Text>
          </View>

          {/* LOCATION */}
          <Text style={styles.sectionTitle}>Location (GPS)</Text>

          <View style={styles.mapBox}>
            <Text style={styles.mapIcon}>⌖</Text>
            <Text style={styles.mapText}>
              {isGettingLocation
                ? "Getting your location..."
                : coordinates
                  ? "Location captured"
                  : "Location unavailable"}
            </Text>

            {coordinates ? (
              <>
                <Text style={styles.mapSubText}>
                  Latitude: {coordinates.latitude.toFixed(6)}
                </Text>
                <Text style={styles.mapSubText}>
                  Longitude: {coordinates.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <Text style={styles.mapSubText}>
                {locationError || "Waiting for GPS location"}
              </Text>
            )}

            <Pressable
              onPress={getDeviceLocation}
              disabled={isGettingLocation}
              style={styles.locationButton}
            >
              <Text style={styles.locationButtonText}>
                {isGettingLocation ? "Getting location..." : "Refresh location"}
              </Text>
            </Pressable>
          </View>

          {/* DESCRIPTION */}
          <Text style={styles.sectionTitle}>Description</Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            style={styles.descriptionBox}
            placeholder="Describe the size of the dumping site, type of waste and any hazards"
            placeholderTextColor="#7A817C"
            multiline
            textAlignVertical="top"
          />

          {/* WASTE TYPE */}
          <Text style={styles.sectionTitle}>Waste Type</Text>

          <View style={styles.wasteTypeContainer}>
            <Pressable
              style={[
                styles.wasteOption,
                wasteType === "Household" && styles.selectedWaste,
              ]}
              onPress={() => setWasteType("Household")}
            >
              <Text
                style={[
                  styles.wasteText,
                  wasteType === "Household" && styles.selectedWasteText,
                ]}
              >
                Household
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.wasteOption,
                wasteType === "Construction" && styles.selectedWaste,
              ]}
              onPress={() => setWasteType("Construction")}
            >
              <Text
                style={[
                  styles.wasteText,
                  wasteType === "Construction" && styles.selectedWasteText,
                ]}
              >
                Construction
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.wasteOption,
                wasteType === "Illegal Dumping" && styles.selectedWaste,
              ]}
              onPress={() => setWasteType("Illegal Dumping")}
            >
              <Text
                style={[
                  styles.wasteText,
                  wasteType === "Illegal Dumping" && styles.selectedWasteText,
                ]}
              >
                Illegal Dumping
              </Text>
            </Pressable>
          </View>

          {/* SUBMIT BUTTON */}
          <Pressable
            style={[
              styles.submitButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={submitReport}
            disabled={isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Text>
          </Pressable>

          {/* NOTIFICATION */}
          <Text style={styles.notificationText}>
            You'll be notified as your report is reviewed and cleanup campaign
            created
          </Text>
        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <Pressable
            onPress={() => router.push("/home")}
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/news")}
            accessibilityLabel="View News"
          >
            <FontAwesomeIcon
              icon={faNewspaper}
              size={20}
              color="#124A2A"
            />
          </Pressable>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/reportdumping")}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/notifications")}
            accessibilityLabel="View notifications"
          >
            <FontAwesomeIcon icon={faUsers} size={20} color="#124A2A" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile")}
            accessibilityLabel="View profile"
            style={styles.profileNavButton}
          >
            {profilePictureUrl ? (
              <Image
                source={{ uri: profilePictureUrl }}
                style={styles.profileNavImage}
                onError={() => {
                  console.error("Failed to load profile picture image.");
                  setProfilePictureUrl(null);
                }}
              />
            ) : (
              <FontAwesomeIcon icon={faUser} size={20} color="#124A2A" />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    padding: 16,
    paddingBottom: 100,
  },

  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  backIcon: {
    color: "#17201A",
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },

  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F7A3F",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 52,
    height: 52,
    resizeMode: "contain",
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  brandName: {
    color: "#17201A",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 9,
  },

  sectionTitle: {
    color: "#17201A",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 5,
  },

  mapBox: {
    width: "100%",
    minHeight: 240,
    backgroundColor: "#E5E5E5",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    padding: 12,
  },

  mapIcon: {
    color: "#1F7A3F",
    fontSize: 46,
    marginBottom: 6,
  },

  mapText: {
    color: "#17201A",
    fontSize: 15,
    fontWeight: "700",
  },

  mapSubText: {
    color: "#68706A",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },

  locationButton: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: "#1F7A3F",
    borderRadius: 7,
  },

  locationButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  descriptionBox: {
    width: "100%",
    height: 170,
    backgroundColor: "#E5E5E5",
    borderRadius: 10,
    padding: 14,
    color: "#17201A",
    fontSize: 12,
    marginBottom: 24,
  },

  wasteTypeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },

  wasteOption: {
    flex: 1,
    minHeight: 42,
    backgroundColor: "#E5E5E5",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  wasteText: {
    color: "#17201A",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  selectedWaste: {
    backgroundColor: "#1F7A3F",
  },

  selectedWasteText: {
    color: "#FFFFFF",
  },

  submitButton: {
    width: "100%",
    height: 46,
    backgroundColor: "#1F7A3F",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  notificationText: {
    color: "#68706A",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  bottomNav: {
    minHeight: 68,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#68706A",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#17201A",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
  },

  profileNavButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  profileNavImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#36B86B",
  },
});
