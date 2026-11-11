import {
  faComments,
  faHome,
  faNewspaper,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import * as ExpoLocation from "expo-location";
import { JSX, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileNavButton } from "../components/ProfileNavButton";
import {
  fetchRelevantNews,
  type GdeltLocationContext,
  NEWS_CATEGORIES,
  subscribeNewsArticles,
  type NewsArticle,
  type NewsCategory,
} from "../services/newsService";
import {
  subscribeRecentReportedSites,
  type ReportedSite,
} from "../services/reportService";
import { formatRelativeTime } from "../utils/formatRelativeTime";

type Filter = "All" | "Local News" | "Nearby Dumping Sites" | NewsCategory;

type NewsFeedItem =
  | {
      kind: "news";
      id: string;
      title: string;
      story: string;
      imageUrl: string | null;
      publishedAt: Date;
      category: NewsCategory;
      article: NewsArticle;
    }
  | {
      kind: "site";
      id: string;
      title: string;
      story: string;
      imageUrl: string | null;
      publishedAt: Date;
      category: string;
      site: ReportedSite;
      distanceKm: number | null;
    };

const filters: Filter[] = [
  "All",
  "Local News",
  "Nearby Dumping Sites",
  ...NEWS_CATEGORIES,
];
const nearbyRadiusKm = 25;

export default function News(): JSX.Element {
  const router = useRouter();
  const listRef = useRef<ScrollView>(null);

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [gdeltArticles, setGdeltArticles] = useState<NewsArticle[]>([]);
  const [sites, setSites] = useState<ReportedSite[]>([]);
  const [isArticlesLoading, setIsArticlesLoading] = useState(true);
  const [isGdeltLoading, setIsGdeltLoading] = useState(true);
  const [areSitesLoading, setAreSitesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [gdeltError, setGdeltError] = useState<string | null>(null);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    "Getting your location...",
  );
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [isLocationResolved, setIsLocationResolved] = useState(false);
  const [gdeltLocation, setGdeltLocation] =
    useState<GdeltLocationContext | null>(null);

  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null,
  );

  useEffect(() => {
    const unsubscribeArticles = subscribeNewsArticles(
      (nextArticles) => {
        setArticles(nextArticles);
        setIsArticlesLoading(false);
      },
      (error) => {
        setArticlesError(error.message);
        setIsArticlesLoading(false);
      },
    );
    const unsubscribeSites = subscribeRecentReportedSites(
      (nextSites) => {
        setSites(nextSites);
        setAreSitesLoading(false);
      },
      (error) => {
        setSitesError(error.message);
        setAreSitesLoading(false);
      },
    );
    return () => {
      unsubscribeArticles();
      unsubscribeSites();
    };
  }, [retryCount]);

  const getUserLocation = useCallback(async () => {
    try {
      let permission = await ExpoLocation.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        permission = await ExpoLocation.requestForegroundPermissionsAsync();
      }
      if (permission.status !== "granted") {
        setUserLocation(null);
        setGdeltLocation(null);
        setLocationMessage(
          "Location permission was not granted. Showing topical news and recent reported sites without distance.",
        );
        setIsLocationResolved(true);
        return;
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      let context: GdeltLocationContext | null = null;
      try {
        const [place] = await ExpoLocation.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        context = {
          city: place?.city ?? place?.district ?? undefined,
          region: place?.region ?? place?.subregion ?? undefined,
          country: place?.country ?? undefined,
        };
        if (!context.city && !context.region && !context.country) {
          context = null;
        }
      } catch (error) {
        console.warn(
          "Could not determine the user's area for local news search.",
          error,
        );
      }
      setGdeltLocation(context);
      setLocationMessage(
        context?.city || context?.region
          ? `Showing environmental news for ${context.city ?? context.region} and reported sites within ${nearbyRadiusKm} km.`
          : `Location found. Searching general environmental news and showing reported sites within ${nearbyRadiusKm} km.`,
      );
      setIsLocationResolved(true);
    } catch (error) {
      setUserLocation(null);
      setGdeltLocation(null);
      setLocationMessage(
        error instanceof Error
          ? `Location unavailable: ${error.message} Showing topical news and recent reported sites without distance.`
          : "Location unavailable. Showing topical news and recent reported sites without distance.",
      );
      setIsLocationResolved(true);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  useEffect(() => {
    // Location state updates follow asynchronous permission and GPS responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    if (!isLocationResolved) return;
    const controller = new AbortController();
    void fetchRelevantNews(gdeltLocation, controller.signal)
      .then((nextArticles) => {
        setGdeltArticles(nextArticles);
        setGdeltError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setGdeltError(
          error instanceof Error
            ? error.message
            : "Could not load environmental news from GDELT.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsGdeltLoading(false);
      });

    return () => controller.abort();
  }, [gdeltLocation, isLocationResolved, retryCount]);

  const retryFeeds = () => {
    setIsArticlesLoading(true);
    setIsGdeltLoading(true);
    setAreSitesLoading(true);
    setArticlesError(null);
    setGdeltError(null);
    setSitesError(null);
    setRetryCount((count) => count + 1);
  };

  const retryLocation = () => {
    setIsGettingLocation(true);
    setIsLocationResolved(false);
    setIsGdeltLoading(true);
    setGdeltError(null);
    setLocationMessage("Getting your location...");
    void getUserLocation();
  };

  const openOriginalArticle = async (url: string | undefined) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        "Could not open article",
        error instanceof Error
          ? error.message
          : "Please try opening the source again.",
      );
    }
  };

  const siteItems: NewsFeedItem[] = sites
    .map((site) => {
      const distanceKm = userLocation
        ? calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            site.latitude,
            site.longitude,
          )
        : null;
      return {
        kind: "site" as const,
        id: site.id,
        title: `${site.wasteType} dumping site`,
        story: site.description,
        imageUrl: site.imageUrl,
        publishedAt: site.createdAt,
        category: `Reported site · ${formatReportStatus(site.status)}`,
        site,
        distanceKm,
      };
    })
    .filter(
      (item) =>
        item.distanceKm === null || item.distanceKm <= nearbyRadiusKm,
    )
    .sort((first, second) => {
      if (first.distanceKm !== null && second.distanceKm !== null) {
        return first.distanceKm - second.distanceKm;
      }
      return second.publishedAt.getTime() - first.publishedAt.getTime();
    });

  const newsItems: NewsFeedItem[] = [...articles, ...gdeltArticles].map(
    (article) => ({
      kind: "news",
      id: article.id,
      title: article.title,
      story: article.story,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt,
      category: article.category,
      article,
    }),
  );

  const allItems = [...newsItems, ...siteItems].sort(
    (first, second) =>
      second.publishedAt.getTime() - first.publishedAt.getTime(),
  );
  const filteredItems =
    activeFilter === "All"
      ? allItems
      : activeFilter === "Local News"
        ? newsItems
        : activeFilter === "Nearby Dumping Sites"
          ? siteItems
          : activeFilter === "Sites"
            ? [
                ...newsItems.filter((item) => item.category === "Sites"),
                ...siteItems,
              ]
            : newsItems.filter((item) => item.category === activeFilter);

  const showAllNews = () => {
    setActiveFilter("All");
    listRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (selectedArticle) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={styles.articleContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Article Header */}
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

              <Text style={styles.brandName}>News And Sites</Text>
            </View>

            {/* Article */}
            <View style={styles.fullArticle}>
              <View style={styles.articleImageLarge}>
                <Image
                  source={
                    selectedArticle.imageUrl
                      ? { uri: selectedArticle.imageUrl }
                      : require("../../assets/images/10.jpeg")
                  }
                  style={styles.articleImage}
                />
              </View>

              <Text style={styles.fullArticleTitle}>
                {selectedArticle.title}
              </Text>

              <Text style={styles.fullArticleTime}>
                Posted {formatRelativeTime(selectedArticle.publishedAt)}
              </Text>

              <View style={styles.articleDivider} />

              <Text style={styles.storyText}>{selectedArticle.story}</Text>

              {selectedArticle.sourceUrl ? (
                <View style={styles.sourceDetails}>
                  <Text style={styles.sourceText}>
                    Indexed by GDELT
                    {selectedArticle.domain
                      ? ` · ${selectedArticle.domain}`
                      : ""}
                    {selectedArticle.sourceCountry
                      ? ` · ${selectedArticle.sourceCountry}`
                      : ""}
                    {selectedArticle.sourceLanguage
                      ? ` · ${selectedArticle.sourceLanguage}`
                      : ""}
                  </Text>
                  <Pressable
                    onPress={() => {
                      void openOriginalArticle(selectedArticle.sourceUrl);
                    }}
                    accessibilityRole="link"
                    style={styles.sourceButton}
                  >
                    <Text style={styles.sourceButtonText}>
                      Read original article
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.storyText}>
                  CleanMyStreet encourages residents to stay involved in their
                  communities and report areas that need attention. Working
                  together can help keep public spaces cleaner and safer.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            <Pressable
              onPress={() => router.push("/home")}
              accessibilityLabel="Go to Home"
            >
              <FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
            </Pressable>

            <Pressable
              onPress={() => setSelectedArticle(null)}
              accessibilityLabel="View News"
            >
              <FontAwesomeIcon icon={faNewspaper} size={20} color="#36B86B" />
            </Pressable>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/reportdumping")}
              accessibilityLabel="Report dumping site"
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/community")}
              accessibilityLabel="Open community messages"
            >
              <FontAwesomeIcon icon={faComments} size={20} color="#124A2A" />
            </Pressable>

            <ProfileNavButton />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          ref={listRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
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

            <Text style={styles.brandName}>News And Sites</Text>
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filters.map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilterButton,
                ]}
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

          {/* News heading */}
          <Text style={styles.latestTitle}>
            {activeFilter === "All" ? "News And Sites" : activeFilter}
          </Text>

          {(activeFilter === "All" ||
            activeFilter === "Local News" ||
            activeFilter === "Nearby Dumping Sites" ||
            activeFilter === "Recent News" ||
            activeFilter === "Sites" ||
            activeFilter === "Recycling") && (
            <View style={styles.locationNotice}>
              <Text style={styles.locationNoticeText}>
                {locationMessage}
                {gdeltError ? ` Live GDELT news unavailable: ${gdeltError}` : ""}
              </Text>
              {!userLocation && !isGettingLocation && (
                <Pressable
                  onPress={retryLocation}
                  accessibilityRole="button"
                  accessibilityLabel="Enable location for local news and nearby sites"
                  style={styles.locationAction}
                >
                  <Text style={styles.retryText}>Try location</Text>
                </Pressable>
              )}
              {gdeltError && (
                <Pressable
                  onPress={retryFeeds}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading live news"
                  style={styles.locationAction}
                >
                  <Text style={styles.retryText}>Retry news</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* News and reported-site cards */}
          <View style={styles.newsList}>
            {filteredItems.map((item) =>
              item.kind === "news" ? (
                <Pressable
                  key={`news-${item.id}`}
                  style={styles.newsCard}
                  onPress={() => setSelectedArticle(item.article)}
                  accessibilityRole="button"
                >
                  <View style={styles.newsCardText}>
                    <Text style={styles.newsTitle} numberOfLines={3}>
                      {item.title}
                    </Text>
                    <Text style={styles.newsTime}>
                      {formatRelativeTime(item.publishedAt)}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {item.article.sourceUrl ? "GDELT" : "News article"} ·{" "}
                        {item.category}
                      </Text>
                    </View>
                    {item.article.domain && (
                      <Text style={styles.articleSource} numberOfLines={1}>
                        {item.article.domain}
                        {item.article.sourceCountry
                          ? ` · ${item.article.sourceCountry}`
                          : ""}
                      </Text>
                    )}
                  </View>
                  <View style={styles.newsImage}>
                    <Image
                      source={
                        item.imageUrl
                          ? { uri: item.imageUrl }
                          : require("../../assets/images/13.jpeg")
                      }
                      style={styles.articleImage}
                    />
                  </View>
                </Pressable>
              ) : (
                <View key={`site-${item.id}`} style={styles.newsCard}>
                  <View style={styles.newsCardText}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.newsTime}>
                      {formatRelativeTime(item.publishedAt)}
                    </Text>
                    <Text style={styles.siteDistance}>
                      {item.distanceKm === null
                        ? "Distance unavailable"
                        : `${item.distanceKm.toFixed(1)} km away`}
                    </Text>
                    <View style={styles.siteCategoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    <Text style={styles.siteDescription} numberOfLines={3}>
                      {item.story}
                    </Text>
                  </View>
                  <View style={styles.newsImage}>
                    <Image
                      source={
                        item.imageUrl
                          ? { uri: item.imageUrl }
                          : require("../../assets/images/dumpingsite.jpeg")
                      }
                      style={styles.articleImage}
                    />
                  </View>
                </View>
              ),
            )}
          </View>

          {isArticlesLoading || isGdeltLoading || areSitesLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color="#36B86B" />
            </View>
          ) : articlesError || gdeltError || sitesError ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {[articlesError, gdeltError, sitesError]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
              <Pressable
                onPress={retryFeeds}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            filteredItems.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeFilter === "Nearby Dumping Sites" ||
                  activeFilter === "Sites"
                    ? userLocation
                      ? "No reported dumping sites found nearby."
                      : "No recent reported dumping sites are available."
                    : activeFilter === "All"
                      ? "No local news articles or reported sites are available yet."
                      : "No local news available for this category."}
                </Text>
              </View>
            )
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <Pressable
            onPress={() => router.push("/home")}
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
          </Pressable>

          <Pressable
            onPress={showAllNews}
            accessibilityLabel="View News And Sites"
          >
            <FontAwesomeIcon icon={faNewspaper} size={20} color="#36B86B" />
          </Pressable>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/reportdumping")}
            accessibilityLabel="Report dumping site"
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

function calculateDistanceKm(
  latitude: number,
  longitude: number,
  targetLatitude: number,
  targetLongitude: number,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(targetLatitude - latitude);
  const longitudeDifference = radians(targetLongitude - longitude);
  const calculation =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(latitude)) *
      Math.cos(radians(targetLatitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
}

function formatReportStatus(status: string): string {
  if (status === "pending_verification") return "pending verification";
  return status.replace(/_/g, " ");
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
  },

  articleContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logo: { width: 38, height: 38, resizeMode: "contain" },
  backIcon: {
    color: "#17201A",
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  brandName: {
    flexShrink: 1,
    fontSize: 19,
    fontWeight: "700",
    color: "#17201A",
  },

  /* Filters */
  filterRow: {
    gap: 8,
    paddingBottom: 18,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#E8EDE9",
  },

  activeFilterButton: {
    backgroundColor: "#36B86B",
  },

  filterText: {
    fontSize: 13,
    color: "#4D554F",
    fontWeight: "600",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  latestTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#17201A",
    marginBottom: 14,
  },
  locationNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  locationNoticeText: {
    flex: 1,
    color: "#68706A",
    fontSize: 12,
    lineHeight: 17,
  },
  locationAction: { paddingVertical: 4, paddingLeft: 8 },

  /* News cards */
  newsList: {
    gap: 12,
  },

  newsCard: {
    minHeight: 135,
    borderRadius: 18,
    backgroundColor: "#e6e6e6",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    overflow: "hidden",
  },

  newsCardText: {
    flex: 1,
    paddingRight: 12,
  },

  newsTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#17201A",
    marginBottom: 9,
  },

  newsTime: {
    fontSize: 12,
    color: "#68706A",
    marginBottom: 10,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#36B86B",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  articleSource: {
    color: "#68706A",
    fontSize: 10,
    marginTop: 7,
  },
  siteCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#3E6475",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 8,
  },
  siteDistance: {
    color: "#4D554F",
    fontSize: 12,
    marginBottom: 8,
  },
  siteDescription: {
    color: "#4D554F",
    fontSize: 12,
    lineHeight: 17,
  },

  categoryText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  newsImage: {
    width: 105,
    height: 105,
    borderRadius: 14,
    backgroundColor: "#B9C8BD",
    alignItems: "center",
    justifyContent: "center",
  },

  articleImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },

  imagePlaceholder: {
    color: "#FFFFFF",
    fontSize: 12,
  },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },

  emptyText: {
    color: "#68706A",
    fontSize: 14,
  },

  retryText: {
    color: "#36B86B",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },

  /* Full article */
  fullArticle: {
    backgroundColor: "#DDF5E6",
    borderRadius: 20,
    padding: 18,
  },

  articleImageLarge: {
    height: 190,
    width: "100%",
    borderRadius: 15,
    backgroundColor: "#B9C8BD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  fullArticleTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "800",
    color: "#17201A",
    marginBottom: 8,
  },

  fullArticleTime: {
    fontSize: 12,
    color: "#68706A",
    marginBottom: 18,
  },

  articleDivider: {
    height: 1,
    backgroundColor: "#B8D7C2",
    marginBottom: 18,
  },

  storyText: {
    fontSize: 15,
    lineHeight: 25,
    color: "#27332B",
    marginBottom: 18,
  },
  sourceDetails: {
    borderTopWidth: 1,
    borderTopColor: "#B8D7C2",
    paddingTop: 14,
    marginBottom: 16,
  },
  sourceText: {
    color: "#68706A",
    fontSize: 12,
    lineHeight: 18,
  },
  sourceButton: {
    alignSelf: "flex-start",
    backgroundColor: "#36B86B",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  sourceButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  /* Bottom navigation */
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E6E3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },

  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "400",
    marginTop: -2,
  },
});
