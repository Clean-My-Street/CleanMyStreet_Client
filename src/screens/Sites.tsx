import {
  faBookmark,
  faHome,
  faNewspaper,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { JSX, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileNavButton } from "../components/ProfileNavButton";
import { useDeviceLocation } from "../hooks/useDeviceLocation";
import { useSavedItems } from "../hooks/useSavedItems";
import {
  siteTitle,
  subscribeSites,
  type Site,
  type SiteStatus,
} from "../services/reportService";
import { distanceKm, formatDistance } from "../utils/distance";
import { formatRelativeTime } from "../utils/formatRelativeTime";

type ViewMode = "Map" | "List";

type Status = SiteStatus;

type SiteWithDistance = Site & { distanceKm: number | null };

const filters: Status[] = ["Reported", "Funding", "Scheduled", "Cleaned"];

export default function Sites(): JSX.Element {
  const router = useRouter();
  const savedItemsState = useSavedItems();
  const deviceLocation = useDeviceLocation();

  const [viewMode, setViewMode] = useState<ViewMode>("Map");
  const [activeFilter, setActiveFilter] = useState<Status | "All">("All");
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    return subscribeSites(
      (nextSites) => {
        setSites(nextSites);
        setIsLoading(false);
      },
      (loadError) => {
        setError(loadError.message);
        setIsLoading(false);
      },
    );
  }, [retryCount]);

  // Nearest first when the device location is known, otherwise newest first.
  const sitesWithDistance = useMemo<SiteWithDistance[]>(() => {
    const location = deviceLocation.location;
    const withDistance = sites.map((site) => ({
      ...site,
      distanceKm: location ? distanceKm(location, site) : null,
    }));
    if (location) {
      withDistance.sort(
        (first, second) => (first.distanceKm ?? 0) - (second.distanceKm ?? 0),
      );
    }
    return withDistance;
  }, [deviceLocation.location, sites]);

  const filteredSites =
    activeFilter === "All"
      ? sitesWithDistance
      : sitesWithDistance.filter((site) => site.siteStatus === activeFilter);

  const describeDistance = (site: SiteWithDistance) => {
    if (site.distanceKm !== null) {
      return `${formatDistance(site.distanceKm)} from you`;
    }
    const reported = formatRelativeTime(site.createdAt);
    return `Reported ${
      reported === "Just now" || reported === "Yesterday"
        ? reported.toLowerCase()
        : reported
    }`;
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
          <Pressable
            style={styles.reportSiteButton}
            onPress={() => router.push("/reportdumping")}
            accessibilityRole="button"
            accessibilityLabel="Report a new dumping site"
          >
            <Text style={styles.reportSiteButtonText}>+ Report a site</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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

          {/* MAP */}
          <View style={styles.mapBox}>
            <Text style={styles.mapIcon}>⌖</Text>

            <Text style={styles.mapTitle}>Map</Text>

            <Text style={styles.mapSubtitle}>
              Nearby dumping sites will appear here
            </Text>
          </View>

          {/* NEARBY SITES PANEL */}
          <View style={styles.nearbyPanel}>
            <Text style={styles.nearbyTitle}>
              {isLoading
                ? "Loading sites..."
                : `${filteredSites.length} ${
                    filteredSites.length === 1 ? "Site" : "Sites"
                  }${deviceLocation.location ? " Nearby" : ""}`}
            </Text>

            <Text style={styles.panelSubtitle}>
              {deviceLocation.status === "denied"
                ? "Allow location access to sort sites by distance. Showing newest reports first."
                : viewMode === "Map"
                  ? "View nearby sites on the map or browse the list below"
                  : "Browse all reported dumping sites"}
            </Text>

            {isLoading && <ActivityIndicator color="#FFFFFF" />}

            {!isLoading && error && (
              <View style={styles.panelMessage}>
                <Text style={styles.panelMessageTitle}>
                  Could not load sites
                </Text>
                <Text style={styles.panelMessageText}>{error}</Text>
                <Pressable
                  style={styles.panelButton}
                  onPress={() => setRetryCount((count) => count + 1)}
                  accessibilityRole="button"
                >
                  <Text style={styles.panelButtonText}>Try again</Text>
                </Pressable>
              </View>
            )}

            {!isLoading && !error && filteredSites.length === 0 && (
              <View style={styles.panelMessage}>
                <Text style={styles.panelMessageTitle}>
                  {activeFilter === "All"
                    ? "No sites reported yet"
                    : `No ${activeFilter.toLowerCase()} sites`}
                </Text>
                <Text style={styles.panelMessageText}>
                  Seen illegal dumping? Report it and it will appear here.
                </Text>
                <Pressable
                  style={styles.panelButton}
                  onPress={() => router.push("/reportdumping")}
                  accessibilityRole="button"
                >
                  <Text style={styles.panelButtonText}>Report a site</Text>
                </Pressable>
              </View>
            )}

            {/* SITE LIST */}
            <View style={styles.siteList}>
              {filteredSites.map((site) => (
                <View key={site.id} style={styles.siteCard}>
                  <View style={styles.siteImage}>
                    {site.imageUrl ? (
                      <Image
                        source={{ uri: site.imageUrl }}
                        style={styles.siteImagePhoto}
                        accessibilityLabel={`Photo of ${siteTitle(site)}`}
                      />
                    ) : (
                      <Text style={styles.imageText}>No photo</Text>
                    )}
                  </View>

                  {/* SITE INFORMATION */}
                  <View style={styles.siteInfo}>
                    <Text style={styles.siteName} numberOfLines={1}>
                      {siteTitle(site)}
                    </Text>

                    <Text style={styles.distance}>
                      {describeDistance(site)} · {site.wasteType}
                    </Text>

                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          getStatusStyle(site.siteStatus),
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            getStatusTextStyle(site.siteStatus),
                          ]}
                        >
                          {site.isPendingReview
                            ? "Awaiting review"
                            : site.siteStatus}
                        </Text>
                      </View>
                      {site.isOwn && (
                        <View style={[styles.statusBadge, styles.ownBadge]}>
                          <Text style={[styles.statusText, styles.ownBadgeText]}>
                            Your report
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Pressable
                    style={styles.saveButton}
                    onPress={() =>
                      void savedItemsState.toggleSavedItem({
                        itemId: site.id,
                        type: "site",
                        title: siteTitle(site),
                        detail: `${site.wasteType} · ${
                          site.isPendingReview
                            ? "Awaiting review"
                            : site.siteStatus
                        }`,
                      })
                    }
                    disabled={
                      savedItemsState.isLoading ||
                      savedItemsState.isPending({
                        itemId: site.id,
                        type: "site",
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${
                      savedItemsState.isSaved({
                        itemId: site.id,
                        type: "site",
                      })
                        ? "Remove"
                        : "Save"
                    } ${siteTitle(site)}`}
                  >
                    <FontAwesomeIcon
                      icon={faBookmark}
                      size={15}
                      color={
                        savedItemsState.isSaved({
                          itemId: site.id,
                          type: "site",
                        })
                          ? "#1F7A3F"
                          : "#68706A"
                      }
                    />
                    <Text style={styles.saveButtonText}>
                      {savedItemsState.isSaved({
                        itemId: site.id,
                        type: "site",
                      })
                        ? "Saved"
                        : "Save"}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
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
          <ProfileNavButton />
        </View>
      </View>
    </SafeAreaView>
  );
}

/* STATUS BACKGROUND COLORS */

function getStatusStyle(status: Status) {
  switch (status) {
    case "Funding":
      return {
        backgroundColor: "#DDF4E5",
      };

    case "Scheduled":
      return {
        backgroundColor: "#FFF0D2",
      };

    case "Reported":
      return {
        backgroundColor: "#E5E5E5",
      };

    case "Cleaned":
      return {
        backgroundColor: "#DDE9FF",
      };

    default:
      return {
        backgroundColor: "#E5E5E5",
      };
  }
}

/* STATUS TEXT COLORS */

function getStatusTextStyle(status: Status) {
  switch (status) {
    case "Funding":
      return {
        color: "#1F7A3F",
      };

    case "Scheduled":
      return {
        color: "#A66A00",
      };

    case "Reported":
      return {
        color: "#555555",
      };

    case "Cleaned":
      return {
        color: "#315C9B",
      };

    default:
      return {
        color: "#555555",
      };
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

  /* HEADER */

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
  logoText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  logo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },

  headerTitle: {
    flex: 1,
    color: "#17201A",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 9,
  },

  reportSiteButton: {
    backgroundColor: "#1F7A3F",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  reportSiteButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  panelMessage: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },

  panelMessageTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  panelMessageText: {
    color: "#D9F1E1",
    fontSize: 10,
    textAlign: "center",
  },

  panelButton: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  panelButtonText: {
    color: "#1F7A3F",
    fontSize: 11,
    fontWeight: "700",
  },

  siteImagePhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 9,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  ownBadge: {
    backgroundColor: "#FFFFFF",
  },

  ownBadgeText: {
    color: "#1F7A3F",
  },

  /* MAP / LIST */

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

  /* FILTER */

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

  /* MAP */

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
  },

  /* NEARBY PANEL */

  nearbyPanel: {
    backgroundColor: "#1F7A3F",
    borderRadius: 18,
    marginTop: -25,
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

  /* SITE CARD */

  siteList: {
    gap: 10,
  },

  siteCard: {
    minHeight: 88,
    backgroundColor: "#E5E8E5",
    borderRadius: 12,
    padding: 9,
    flexDirection: "row",
  },

  siteImage: {
    width: 68,
    height: 68,
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
  saveButton: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 44,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: "#68706A",
    fontSize: 8,
    fontWeight: "600",
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
