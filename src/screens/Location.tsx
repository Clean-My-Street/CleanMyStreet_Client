import {
  faHome,
  faNewspaper,
  faUser,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ExpoLocation from "expo-location";
import { JSX, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, type MapPressEvent, type Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../services/api";
import {
  submitDumpingReport,
  type WasteType,
} from "../services/reportService";

const DEFAULT_MAP_REGION: Region = {
  latitude: -29.8587,
  longitude: 31.0218,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function Location(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri?: string }>();
  const photoUri = typeof params.photoUri === "string" ? params.photoUri : "";
  const mapRef = useRef<MapView | null>(null);
  const hasManuallySelectedLocation = useRef(false);
  const [wasteType, setWasteType] = useState<WasteType>("Illegal Dumping");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const moveMapTo = (latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  };

  const getCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    hasManuallySelectedLocation.current = false;
    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setHasLocationPermission(false);
        throw new Error("Location permission is required to submit a report.");
      }
      setHasLocationPermission(true);

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      if (!hasManuallySelectedLocation.current) {
        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(nextCoordinates);
        moveMapTo(nextCoordinates.latitude, nextCoordinates.longitude);
      }
    } catch (error) {
      setCoordinates(null);
      setLocationError(
        error instanceof Error
          ? error.message
          : "Could not retrieve your current location.",
      );
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  useEffect(() => {
    void getCurrentLocation();
  }, [getCurrentLocation]);

  const selectMapLocation = ({ nativeEvent }: MapPressEvent) => {
    hasManuallySelectedLocation.current = true;
    setCoordinates(nativeEvent.coordinate);
    setLocationError(null);
  };

  const moveSelectedMarker = ({
    nativeEvent,
  }: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    hasManuallySelectedLocation.current = true;
    setCoordinates(nativeEvent.coordinate);
    setLocationError(null);
  };

  const submitReport = async () => {
    const reportDescription = description.trim();
    if (!reportDescription) {
      Alert.alert("Description required", "Please describe the dumping site.");
      return;
    }
    if (!photoUri) {
      Alert.alert(
        "Photo required",
        "Return to the previous screen and take a photo of the dumping site.",
      );
      return;
    }
    if (!coordinates) {
      Alert.alert(
        "Location required",
        "Allow location access and retrieve your GPS location before submitting.",
      );
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitDumpingReport({
        description: reportDescription,
        wasteType,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        photoUri,
      });
      Alert.alert(
        "Report submitted",
        "Your dumping-site report has been saved for review.",
        [{ text: "OK", onPress: () => router.replace("/sites") }],
      );
    } catch (error) {
      Alert.alert(
        "Report not submitted",
        getApiErrorMessage(error, "Please try again."),
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

          {/* MAP */}
          <View style={styles.mapBox}>
            {Platform.OS === "web" ? (
              <View style={styles.mapFallback}>
                <Text style={styles.mapText}>Map is available in the mobile app</Text>
                <Text style={styles.mapSubText}>
                  {coordinates
                    ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
                    : locationError ?? "Use your device location to set the report location."}
                </Text>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={DEFAULT_MAP_REGION}
                onPress={selectMapLocation}
                showsUserLocation={hasLocationPermission}
                showsMyLocationButton={false}
                toolbarEnabled
                accessibilityLabel="Select dumping site location on map"
              >
                {coordinates && (
                  <Marker
                    coordinate={coordinates}
                    title="Dumping site location"
                    description="Drag the marker or tap the map to adjust."
                    draggable
                    onDragEnd={moveSelectedMarker}
                  />
                )}
              </MapView>
            )}
            <View pointerEvents="none" style={styles.mapInstruction}>
              <Text style={styles.mapInstructionText}>
                {coordinates
                  ? "Tap map or drag pin to adjust location"
                  : isGettingLocation
                    ? "Finding your location..."
                    : "Tap map to select the dumping site"}
              </Text>
            </View>
            <View style={styles.coordinatesCard}>
              <Text style={styles.mapText}>
                {coordinates
                  ? "Report location"
                  : isGettingLocation
                    ? "Getting location..."
                    : "Location needed"}
              </Text>
              <Text style={styles.mapSubText}>
                {coordinates
                  ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
                  : locationError ?? "Your GPS location is required."}
              </Text>
            </View>
            <Pressable
              style={styles.locationButton}
              onPress={() => void getCurrentLocation()}
              disabled={isGettingLocation}
              accessibilityRole="button"
            >
              <Text style={styles.locationButtonText}>
                {isGettingLocation
                  ? "Getting location..."
                  : coordinates
                    ? "Refresh GPS location"
                    : "Get my location"}
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
            style={styles.submitButton}
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
              {" "}
              <FontAwesomeIcon
                icon={faNewspaper}
                size={20}
                color="#124A2A"
              />{" "}
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
          >
            <FontAwesomeIcon icon={faUser} size={20} color="#124A2A" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* SCREEN */
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

  /* HEADER */
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

  logo: { width: 52, height: 52, resizeMode: "contain" },

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

  /* SECTION TITLES */
  sectionTitle: {
    color: "#17201A",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 5,
  },

  /* MAP */
  mapBox: {
    width: "100%",
    height: 300,
    backgroundColor: "#E5E5E5",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 24,
  },

  map: {
    ...StyleSheet.absoluteFill,
  },

  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  mapInstruction: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    backgroundColor: "#FFFFFFE8",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },

  mapInstructionText: {
    color: "#17201A",
    fontSize: 11,
    fontWeight: "600",
  },

  coordinatesCard: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 56,
    backgroundColor: "#FFFFFFE8",
    borderRadius: 8,
    padding: 9,
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
    paddingHorizontal: 12,
  },

  locationButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    marginTop: 12,
    backgroundColor: "#1F7A3F",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  locationButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  /* DESCRIPTION */
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

  /* WASTE TYPE */
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

  /* SUBMIT */
  submitButton: {
    width: "100%",
    height: 46,
    backgroundColor: "#1F7A3F",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  /* NOTIFICATION */
  notificationText: {
    color: "#68706A",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  /* BOTTOM NAVIGATION */
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

  navItem: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  navIcon: {
    color: "#68706A",
    fontSize: 8,
    fontWeight: "800",
    marginBottom: 5,
  },

  navLabel: {
    color: "#68706A",
    fontSize: 9,
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
});
