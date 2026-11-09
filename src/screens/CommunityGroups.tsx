import { faArrowLeft, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as ExpoLocation from "expo-location";
import { useRouter } from "expo-router";
import { JSX, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createCommunityGroups,
  type CommunityGroup,
} from "../services/communityGroupService";

type CommunityGroupsProps = {
  joinedGroupIds: string[];
  joiningGroupId: string | null;
  membershipError: string | null;
  onJoin: (group: CommunityGroup) => void;
  onOpen: (group: CommunityGroup) => void;
  onRetryMembership: () => void;
};

export default function CommunityGroups({
  joinedGroupIds,
  joiningGroupId,
  membershipError,
  onJoin,
  onOpen,
  onRetryMembership,
}: CommunityGroupsProps): JSX.Element {
  const router = useRouter();
  const [area, setArea] = useState("Your area");
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationMessage, setLocationMessage] = useState(
    "Finding community groups near you...",
  );

  const discoverArea = useCallback(async () => {
    try {
      const permission =
        await ExpoLocation.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setArea("Your area");
        setLocationMessage(
          "Location access was not granted. Showing general community groups.",
        );
        return;
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      try {
        const [place] = await ExpoLocation.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const detectedArea =
          place?.district ||
          place?.city ||
          place?.subregion ||
          place?.region ||
          "Your area";
        setArea(detectedArea);
        setLocationMessage(`Showing example groups for ${detectedArea}.`);
      } catch {
        setArea("Your area");
        setLocationMessage(
          "Your location was found, but the area name is unavailable. Showing general community groups.",
        );
      }
    } catch (error) {
      setArea("Your area");
      setLocationMessage(
        error instanceof Error
          ? `Location unavailable: ${error.message}`
          : "Location unavailable. Showing general community groups.",
      );
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  useEffect(() => {
    // Permission and geocoding state updates follow asynchronous native responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void discoverArea();
  }, [discoverArea]);

  const retryLocation = () => {
    setIsGettingLocation(true);
    setLocationMessage("Finding community groups near you...");
    void discoverArea();
  };

  const groups = createCommunityGroups(area);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color="#17201A" />
          </Pressable>
          <Text style={styles.headerTitle}>Find Your Community</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Local groups</Text>
          <Text style={styles.description}>
            Choose a group to continue to the Community page.
          </Text>

          <View style={styles.locationPanel}>
            {isGettingLocation && (
              <ActivityIndicator size="small" color="#36B86B" />
            )}
            <Text style={styles.locationText}>{locationMessage}</Text>
            {!isGettingLocation && area === "Your area" && (
              <Pressable
                onPress={retryLocation}
                accessibilityRole="button"
                style={styles.locationRetry}
              >
                <Text style={styles.retryText}>Try location</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.demoNotice}>
            <Text style={styles.demoNoticeText}>
              Example groups only. Group discovery and membership are saved on
              this device because a community-groups backend is not configured.
            </Text>
          </View>

          {membershipError && (
            <View style={styles.errorPanel}>
              <Text style={styles.errorText}>{membershipError}</Text>
              <Pressable
                onPress={onRetryMembership}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {groups.map((group) => {
            const isJoined = joinedGroupIds.includes(group.id);
            const isJoining = joiningGroupId === group.id;
            return (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupIcon}>
                  <FontAwesomeIcon icon={faUsers} size={18} color="#1F7A3F" />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupArea}>{group.area}</Text>
                  <Text style={styles.groupDescription}>
                    {group.description}
                  </Text>
                  <Text style={styles.memberNote}>Member count unavailable</Text>
                  <Pressable
                    onPress={() =>
                      isJoined ? onOpen(group) : onJoin(group)
                    }
                    disabled={isGettingLocation || isJoining}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: isGettingLocation || isJoining,
                    }}
                    style={[
                      styles.groupButton,
                      isJoined && styles.joinedGroupButton,
                      (isGettingLocation || isJoining) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupButtonText,
                        isJoined && styles.joinedGroupButtonText,
                      ]}
                    >
                      {isGettingLocation
                        ? "Finding groups..."
                        : isJoining
                          ? "Joining..."
                          : isJoined
                            ? "Open community"
                            : "Join group"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#F7F9F7" },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6E3",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#17201A", fontSize: 17, fontWeight: "700" },
  content: { padding: 18, paddingBottom: 30, gap: 12 },
  heading: { color: "#17201A", fontSize: 22, fontWeight: "700" },
  description: { color: "#68706A", fontSize: 13, lineHeight: 19 },
  locationPanel: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: { flex: 1, color: "#68706A", fontSize: 12, lineHeight: 17 },
  locationRetry: { padding: 6 },
  demoNotice: {
    backgroundColor: "#FFF4D8",
    borderRadius: 9,
    padding: 11,
  },
  demoNoticeText: { color: "#63542D", fontSize: 11, lineHeight: 16 },
  errorPanel: {
    backgroundColor: "#FCE8E6",
    borderRadius: 9,
    padding: 11,
    gap: 6,
  },
  errorText: { color: "#7A2520", fontSize: 12, lineHeight: 17 },
  retryText: { color: "#1F7A3F", fontSize: 12, fontWeight: "700" },
  groupCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5EAE6",
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E1F5E9",
  },
  groupInfo: { flex: 1, minWidth: 0 },
  groupName: { color: "#17201A", fontSize: 15, fontWeight: "700" },
  groupArea: { color: "#1F7A3F", fontSize: 11, fontWeight: "600", marginTop: 3 },
  groupDescription: {
    color: "#4D554F",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  memberNote: { color: "#68706A", fontSize: 10, marginTop: 7 },
  groupButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: 14,
    marginTop: 11,
    borderRadius: 8,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
  },
  joinedGroupButton: { backgroundColor: "#E1F5E9" },
  groupButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  joinedGroupButtonText: { color: "#1F7A3F" },
  disabledButton: { opacity: 0.6 },
});
