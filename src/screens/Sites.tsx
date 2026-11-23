
import {
  faHome,
  faNewspaper,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { doc, onSnapshot } from "firebase/firestore";
import { JSX, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebMap from "../components/WebMap";
import { getApiErrorMessage, getReports, Report } from "../services/api";
import { auth, db } from "../services/firebase";

type ViewMode = "Map" | "List";
type Status = "Reported" | "Funding" | "Scheduled" | "Cleaned";

const filters: Status[] = [
  "Reported",
  "Funding",
  "Scheduled",
  "Cleaned",
];

function getDisplayStatus(status: string): Status {
  switch (status.toLowerCase()) {
    case "funding":
      return "Funding";
    case "scheduled":
      return "Scheduled";
    case "cleaned":
      return "Cleaned";
    default:
      return "Reported";
  }
}

export default function Sites(): JSX.Element {
  const router = useRouter();
  const user = auth.currentUser;

  const [viewMode, setViewMode] = useState<ViewMode>("Map");
  const [activeFilter, setActiveFilter] = useState<Status | "All">("All");
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setErrorMessage("");
      const savedReports = await getReports();

console.log(
  "REPORT MEDIA DEBUG:",
  savedReports.map((report) => ({
    id: report.id,
    imageUrl: report.imageUrl,
    imageUrls: report.imageUrls,
    imageCount: report.imageUrls?.length,
    videoUrl: report.videoUrl,
  }))
);

setReports(savedReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      setErrorMessage(
        getApiErrorMessage(error, "Could not load dumping-site reports.")
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Load the user's profile picture.
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
              : null
          );
        } else {
          setProfilePictureUrl(null);
        }
      },
      (error) => {
        console.error("Error loading profile picture:", error);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const refreshReports = () => {
    setIsRefreshing(true);
    loadReports();
  };

  const filteredReports =
    activeFilter === "All"
      ? reports
      : reports.filter(
          (report) => getDisplayStatus(report.status) === activeFilter
        );

  // Only keep a selection that is still visible under the active filter.
  const visibleSelectedReport =
    selectedReport &&
    filteredReports.some((report) => report.id === selectedReport.id)
      ? selectedReport
      : null;

  // Support new multiple-image reports and older single-image reports.
  const selectedImages = useMemo(() => {
    if (!visibleSelectedReport) return [];

    const images =
      Array.isArray(visibleSelectedReport.imageUrls) &&
      visibleSelectedReport.imageUrls.length > 0
        ? visibleSelectedReport.imageUrls
        : visibleSelectedReport.imageUrl
          ? [visibleSelectedReport.imageUrl]
          : [];

    return [...new Set(images.filter((url) => typeof url === "string" && url.trim()))]
      .slice(0, 10);
  }, [visibleSelectedReport]);

  const selectedVideoUrl = visibleSelectedReport?.videoUrl || null;

  // The player is created through the Expo Video hook.
  const videoPlayer = useVideoPlayer(selectedVideoUrl, (player) => {
    player.loop = false;
  });

  const selectReport = (report: Report) => {
    setSelectedReport(report);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
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

          <Text style={styles.headerTitle}>Map & Nearby Sites</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshReports}
            />
          }
        >
          {/* MAP / LIST TOGGLE */}
          <View style={styles.viewToggle}>
            <Pressable
              style={[
                styles.viewButton,
                viewMode === "Map" && styles.activeViewButton,
              ]}
              onPress={() => setViewMode("Map")}
            >
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === "Map" && styles.activeViewText,
                ]}
              >
                Map
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.viewButton,
                viewMode === "List" && styles.activeViewButton,
              ]}
              onPress={() => setViewMode("List")}
            >
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === "List" && styles.activeViewText,
                ]}
              >
                List
              </Text>
            </Pressable>
          </View>

          {/* STATUS FILTER */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              style={[
                styles.filterButton,
                activeFilter === "All" && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter("All")}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === "All" && styles.activeFilterText,
                ]}
              >
                All
              </Text>
            </Pressable>

            {filters.map((filter) => (
              <Pressable
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.activeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* MAP OR LIST */}
          {viewMode === "Map" ? (
            <WebMap
              reports={filteredReports}
              selectedReport={visibleSelectedReport}
              onMarkerPress={selectReport}
            />
          ) : (
            <View style={styles.mapBox}>
              <Text style={styles.mapIcon}>⌖</Text>
              <Text style={styles.mapTitle}>
                {filteredReports.length} Reported Sites
              </Text>
              <Text style={styles.mapSubtitle}>
                Select a site below to view its photos and video.
              </Text>
            </View>
          )}

          {/* SELECTED REPORT DETAILS AND MEDIA */}
          {visibleSelectedReport && (
            <View style={styles.selectedReportCard}>
              <View style={styles.selectedHeader}>
                <View style={styles.selectedReportInfo}>
                  <Text style={styles.siteName}>
                    {visibleSelectedReport.wasteType || "Dumping Site"}
                  </Text>

                  <Text style={styles.description}>
                    {visibleSelectedReport.description}
                  </Text>

                  <Text style={styles.distance}>
                    Status: {getDisplayStatus(visibleSelectedReport.status)}
                  </Text>

                  {visibleSelectedReport.latitude !== null &&
                    visibleSelectedReport.longitude !== null && (
                      <Text style={styles.distance}>
                        GPS: {visibleSelectedReport.latitude.toFixed(5)},{" "}
                        {visibleSelectedReport.longitude.toFixed(5)}
                      </Text>
                    )}
                </View>

                <Pressable
                  onPress={() => setSelectedReport(null)}
                  accessibilityLabel="Close selected report"
                >
                  <Text style={styles.closeSelectedReport}>✕</Text>
                </Pressable>
              </View>

              {/* PHOTO GALLERY */}
              <Text style={styles.mediaHeading}>
                Photos ({selectedImages.length}/10)
              </Text>

              {selectedImages.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mediaGallery}
                >
                  {selectedImages.map((url, index) => (
                    <Image
                      key={`${url}-${index}`}
                      source={{ uri: url }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noMedia}>
                  <Text style={styles.imageText}>No photos attached</Text>
                </View>
              )}

              {/* VIDEO PLAYER */}
              {selectedVideoUrl ? (
                <View style={styles.videoSection}>
                  <Text style={styles.mediaHeading}>Recorded video</Text>

                  <VideoView
                    player={videoPlayer}
                    style={styles.videoPlayer}
                    nativeControls
                    contentFit="contain"
                  />
                </View>
              ) : (
                <Text style={styles.noVideoText}>No video attached</Text>
              )}
            </View>
          )}

          {/* NEARBY SITES PANEL */}
          <View style={styles.nearbyPanel}>
            <Text style={styles.nearbyTitle}>
              {filteredReports.length} Sites
            </Text>

            <Text style={styles.panelSubtitle}>
              Reports retrieved from the CleanMyStreet database
            </Text>

            {isLoading ? (
              <View style={styles.messageContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.messageText}>Loading reports...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{errorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={loadReports}>
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : filteredReports.length === 0 ? (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>No reports found.</Text>
                <Text style={styles.emptySubText}>
                  Submitted dumping-site reports will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.siteList}>
                {filteredReports.map((report) => {
                  const status = getDisplayStatus(report.status);
                  const thumbnail =
                    report.imageUrls?.[0] || report.imageUrl || null;
                  const isSelected =
                    visibleSelectedReport?.id === report.id;

                  return (
                    <Pressable
                      key={report.id}
                      style={[
                        styles.siteCard,
                        isSelected && styles.selectedSiteCard,
                      ]}
                      onPress={() => selectReport(report)}
                    >
                      {thumbnail ? (
                        <Image
                          source={{ uri: thumbnail }}
                          style={styles.siteImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.siteImage}>
                          <Text style={styles.imageText}>No image</Text>
                        </View>
                      )}

                      <View style={styles.siteInfo}>
                        <Text style={styles.siteName}>
                          {report.wasteType || "Dumping Site"}
                        </Text>

                        <Text style={styles.distance}>
                          {report.latitude !== null &&
                          report.longitude !== null
                            ? `GPS: ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`
                            : "GPS coordinates unavailable"}
                        </Text>

                        <Text style={styles.description}>
                          {report.description}
                        </Text>

                        <View
                          style={[
                            styles.statusBadge,
                            getStatusStyle(status),
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              getStatusTextStyle(status),
                            ]}
                          >
                            {status}
                          </Text>
                        </View>

                        {report.createdAt && (
                          <Text style={styles.dateText}>
                            Submitted:{" "}
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Text>
                        )}

                        <Text style={styles.selectSiteText}>
                          {isSelected ? "Selected" : "Tap to view media"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
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
            <FontAwesomeIcon icon={faNewspaper} size={20} color="#124A2A" />
          </Pressable>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/reportdumping")}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/community")}
            accessibilityLabel="Open community messages"
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
                onError={() => setProfilePictureUrl(null)}
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

// STATUS BACKGROUND COLORS
function getStatusStyle(status: Status) {
  switch (status) {
    case "Funding":
      return { backgroundColor: "#DDF4E5" };
    case "Scheduled":
      return { backgroundColor: "#FFF0D2" };
    case "Reported":
      return { backgroundColor: "#E5E5E5" };
    case "Cleaned":
      return { backgroundColor: "#DDE9FF" };
  }
}

// STATUS TEXT COLORS
function getStatusTextStyle(status: Status) {
  switch (status) {
    case "Funding":
      return { color: "#1F7A3F" };
    case "Scheduled":
      return { color: "#A66A00" };
    case "Reported":
      return { color: "#555555" };
    case "Cleaned":
      return { color: "#315C9B" };
  }
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  header: {
    height: 55,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1F7A3F",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 13,
  },
  backIcon: {
    color: "#17201A",
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },
  logo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  headerTitle: {
    color: "#17201A",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 9,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#EDEDED",
    borderRadius: 12,
    padding: 3,
    marginTop: 8,
    marginBottom: 12,
  },
  viewButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  activeViewButton: {
    backgroundColor: "#1F7A3F",
  },
  viewButtonText: {
    color: "#17201A",
    fontSize: 12,
    fontWeight: "600",
  },
  activeViewText: {
    color: "#FFFFFF",
  },
  filterContainer: {
    gap: 7,
    paddingBottom: 12,
  },
  filterButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilterButton: {
    backgroundColor: "#17201A",
  },
  filterText: {
    color: "#17201A",
    fontSize: 10,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  mapBox: {
    height: 245,
    backgroundColor: "#E3E3E3",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mapIcon: {
    color: "#1F7A3F",
    fontSize: 45,
    marginBottom: 5,
  },
  mapTitle: {
    color: "#17201A",
    fontSize: 15,
    fontWeight: "700",
  },
  mapSubtitle: {
    color: "#68706A",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  nearbyPanel: {
    backgroundColor: "#1F7A3F",
    borderRadius: 18,
    marginTop: 12,
    padding: 16,
    paddingBottom: 22,
    minHeight: 300,
  },
  nearbyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  panelSubtitle: {
    color: "#D9F1E1",
    fontSize: 10,
    marginTop: 4,
    marginBottom: 14,
  },
  messageContainer: {
    alignItems: "center",
    paddingVertical: 25,
    gap: 10,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
  },
  emptySubText: {
    color: "#D9F1E1",
    fontSize: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: "#1F7A3F",
    fontSize: 11,
    fontWeight: "700",
  },
  siteList: {
    gap: 10,
  },
  siteCard: {
    minHeight: 100,
    backgroundColor: "#E5E8E5",
    borderRadius: 12,
    padding: 9,
    flexDirection: "row",
  },
  selectedSiteCard: {
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  siteImage: {
    width: 78,
    height: 78,
    borderRadius: 9,
    backgroundColor: "#C7CBC7",
    alignItems: "center",
    justifyContent: "center",
  },
  imageText: {
    color: "#777D78",
    fontSize: 9,
  },
  siteInfo: {
    flex: 1,
    marginLeft: 11,
    justifyContent: "center",
  },
  siteName: {
    color: "#17201A",
    fontSize: 13,
    fontWeight: "700",
  },
  distance: {
    color: "#68706A",
    fontSize: 9,
    marginTop: 4,
  },
  description: {
    color: "#17201A",
    fontSize: 10,
    marginTop: 5,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 7,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "700",
  },
  dateText: {
    color: "#68706A",
    fontSize: 9,
    marginTop: 5,
  },
  selectSiteText: {
    color: "#1F7A3F",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 6,
  },
  selectedReportCard: {
    backgroundColor: "#E5E8E5",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  selectedReportInfo: {
    flex: 1,
  },
  closeSelectedReport: {
    color: "#17201A",
    fontSize: 18,
    fontWeight: "700",
    padding: 5,
  },
  mediaHeading: {
    color: "#17201A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  mediaGallery: {
    gap: 9,
    paddingBottom: 4,
  },
  galleryImage: {
    width: 170,
    height: 130,
    borderRadius: 9,
    backgroundColor: "#C7CBC7",
  },
  noMedia: {
    height: 90,
    backgroundColor: "#D5D9D5",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  videoSection: {
    marginTop: 8,
  },
  videoPlayer: {
    width: "100%",
    height: 220,
    backgroundColor: "#17201A",
    borderRadius: 9,
  },
  noVideoText: {
    color: "#68706A",
    fontSize: 10,
    marginTop: 12,
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
