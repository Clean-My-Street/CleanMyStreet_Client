import {
  faComments,
  faHome,
  faNewspaper,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { JSX, useEffect, useRef, useState } from "react";
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
import {
  NEWS_CATEGORIES,
  subscribeNewsArticles,
  type NewsArticle,
  type NewsCategory,
} from "../services/newsService";
import { formatRelativeTime } from "../utils/formatRelativeTime";

type Filter = "All" | NewsCategory;

const filters: Filter[] = ["All", ...NEWS_CATEGORIES];

export default function News(): JSX.Element {
  const router = useRouter();
  const listRef = useRef<ScrollView>(null);

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
    null,
  );

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    return subscribeNewsArticles(
      (nextArticles) => {
        setArticles(nextArticles);
        setIsLoading(false);
      },
      (error) => {
        setLoadError(error.message);
        setIsLoading(false);
      },
    );
  }, [retryCount]);

  const filteredArticles =
    activeFilter === "All"
      ? articles
      : articles.filter((article) => article.category === activeFilter);

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

              <Text style={styles.brandName}>News</Text>
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

              <Text style={styles.storyText}>
                CleanMyStreet encourages residents to stay involved in their
                communities and report areas that need attention. Working
                together can help keep public spaces cleaner and safer.
              </Text>
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

            <Text style={styles.brandName}>News</Text>
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
            {activeFilter === "All" ? "Latest News" : activeFilter}
          </Text>

          {/* News Cards */}
          <View style={styles.newsList}>
            {filteredArticles.map((article) => (
              <Pressable
                key={article.id}
                style={styles.newsCard}
                onPress={() => setSelectedArticle(article)}
              >
                <View style={styles.newsCardText}>
                  <Text style={styles.newsTitle} numberOfLines={3}>
                    {article.title}
                  </Text>

                  <Text style={styles.newsTime}>
                    {formatRelativeTime(article.publishedAt)}
                  </Text>

                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{article.category}</Text>
                  </View>
                </View>

                <View style={styles.newsImage}>
                  <Image
                    source={
                      article.imageUrl
                        ? { uri: article.imageUrl }
                        : require("../../assets/images/13.jpeg")
                    }
                    style={styles.articleImage}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color="#36B86B" />
            </View>
          ) : loadError ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{loadError}</Text>
              <Pressable
                onPress={() => setRetryCount((count) => count + 1)}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            filteredArticles.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No news available for this category.
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

          <Pressable onPress={showAllNews} accessibilityLabel="View News">
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
    fontSize: 22,
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
