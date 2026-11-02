import {
	faCheck,
	faHome,
	faNewspaper,
	faUser,
	faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { router } from "expo-router";
import { JSX, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../services/firebase";
import {
  markNotificationsRead,
  setNotificationRead,
  subscribeNotifications,
  type UserNotification,
} from "../services/notificationsService";
import { formatRelativeTime } from "../utils/formatRelativeTime";

type Category = "All" | "Unread" | "Cleanups" | "Campaigns";

const categories: Category[] = ["All", "Unread", "Cleanups", "Campaigns"];

export default function Notifications(): JSX.Element {
  const userId = auth.currentUser?.uid;
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      setLoadError("Sign in to see your notifications.");
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    return subscribeNotifications(
      userId,
      (nextNotifications) => {
        setNotifications(nextNotifications);
        setIsLoading(false);
      },
      (error) => {
        setLoadError(error.message);
        setIsLoading(false);
      },
    );
  }, [retryCount, userId]);

  const visibleNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (activeCategory === "Unread") return !notification.read;
        if (activeCategory === "All") return true;
        return notification.category === activeCategory;
      }),
    [activeCategory, notifications],
  );
  const unreadIds = notifications
    .filter((notification) => !notification.read)
    .map((notification) => notification.id);

  const markAllAsRead = async () => {
    if (!userId || unreadIds.length === 0) return;
    try {
      await markNotificationsRead(userId, unreadIds);
    } catch (error) {
      Alert.alert(
        "Could not update notifications",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const toggleRead = async (notification: UserNotification) => {
    if (!userId) return;
    try {
      await setNotificationRead(userId, notification.id, !notification.read);
    } catch (error) {
      Alert.alert(
        "Could not update notification",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Image
            source={require("../../assets/images/cleanmystreet.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.unreadCount}>
            <Text style={styles.unreadCountText}>
              {unreadIds.length} new
            </Text>
          </View>
          <Pressable onPress={markAllAsRead} accessibilityRole="button">
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {categories.map((category) => {
            const selected = category === activeCategory;
            return (
              <Pressable
                key={category}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipSelected,
                ]}
                onPress={() => setActiveCategory(category)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.notificationList}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.teal} />
              <Text style={styles.emptyText}>Loading notifications...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Notifications unavailable</Text>
              <Text style={styles.emptyText}>{loadError}</Text>
              <Pressable
                onPress={() => setRetryCount((count) => count + 1)}
                accessibilityRole="button"
              >
                <Text style={styles.markAllText}>Try again</Text>
              </Pressable>
            </View>
          ) : visibleNotifications.length > 0 ? (
            visibleNotifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => toggleRead(notification)}
                accessibilityRole="button"
                accessibilityLabel={`${notification.title}, ${formatRelativeTime(notification.createdAt)}, ${notification.read ? "read" : "unread"}. Tap to change read status.`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{notification.initials}</Text>
                </View>
                <View style={styles.notificationCopy}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatRelativeTime(notification.createdAt)}
                  </Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <FontAwesomeIcon icon={faCheck} size={20} color={colors.teal} />
              </View>
              <Text style={styles.emptyTitle}>You’re all caught up</Text>
              <Text style={styles.emptyText}>
                There are no notifications in this filter.
              </Text>
            </View>
          )}
        </ScrollView>
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
          >
            <FontAwesomeIcon icon={faUser} size={20} color="#124A2A" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const colors = {
  green: "#124A2A",
  teal: "#36B86B",
  tealDark: "#124A2A",
  tealPale: "#eeeeee",
  border: "#dce7dc",
  background: "#f5f8f5",
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  logo: { width: 26, height: 26, resizeMode: "contain" },
  headerTitle: { color: colors.green, fontSize: 16, fontWeight: "700" },
  actionsRow: {
    minHeight: 46,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backIcon: {
    color: "#17201A",
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },
  unreadCount: {
    backgroundColor: colors.tealPale,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  unreadCountText: { color: colors.tealDark, fontSize: 11, fontWeight: "700" },
  markAllText: { color: colors.tealDark, fontSize: 12, fontWeight: "700" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 13,
  },
  filterChip: {
    flex: 1,
    minHeight: 34,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterText: { color: colors.green, fontSize: 11, fontWeight: "600" },
  filterTextSelected: { color: "#FFFFFF" },
  notificationList: { paddingHorizontal: 16, paddingBottom: 18, flexGrow: 1 },
  notificationCard: {
    minHeight: 74,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#23424A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  notificationUnread: {
    backgroundColor: colors.tealPale,
    borderColor: "#C6E7E3",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  notificationCopy: { flex: 1, gap: 5 },
  notificationTitle: {
    color: colors.green,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  notificationTime: { color: colors.green, fontSize: 10 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tealPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { color: colors.green, fontSize: 15, fontWeight: "700" },
  emptyText: {
    color: colors.green,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
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
});
