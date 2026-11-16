import {
  faComment,
  faHeart,
  faHouse,
  faNewspaper,
  faPaperPlane,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { JSX, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { ProfileNavButton } from "../components/ProfileNavButton";
import { feedColors as colors } from "../constants/feedColors";
import {
  createCommunityComment,
  createCommunityPost,
  getApiErrorMessage,
  toggleCommunityPostLike,
} from "../services/api";
import type { CommunityGroup } from "../services/communityGroupService";
import {
  initialsOf,
  subscribeCommunityPosts,
  subscribeLikedPostIds,
  subscribePostComments,
  type FeedComment,
  type FeedPost,
} from "../services/communityService";
import { auth } from "../services/firebase";
import { formatRelativeTime } from "../utils/formatRelativeTime";

type Category = "Cleanup" | "Tips" | "Question";
type Filter = "All" | Category;

const filters: Filter[] = ["All", "Cleanup", "Tips", "Question"];
const categories: Category[] = ["Cleanup", "Tips", "Question"];

export default function Community({
  communityGroup,
  onChangeGroup,
}: {
  communityGroup?: CommunityGroup | null;
  onChangeGroup?: () => void;
}): JSX.Element {
  const router = useRouter();
  const userId = auth.currentUser?.uid;
  const myInitials = initialsOf(
    auth.currentUser?.displayName ??
      auth.currentUser?.email?.split("@")[0] ??
      "",
  );
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postsRetry, setPostsRetry] = useState(0);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [postCategory, setPostCategory] = useState<Category>("Cleanup");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingPosts(true);
    setPostsError(null);
    return subscribeCommunityPosts(
      (nextPosts) => {
        setPosts(nextPosts);
        setIsLoadingPosts(false);
      },
      (error) => {
        setPostsError(error.message);
        setIsLoadingPosts(false);
      },
    );
  }, [postsRetry]);

  useEffect(() => {
    if (!userId) return;
    return subscribeLikedPostIds(userId, setLikedPostIds, (error) =>
      console.warn("Could not load liked posts.", error),
    );
  }, [userId]);

  const visiblePosts = useMemo(
    () =>
      activeFilter === "All"
        ? posts
        : posts.filter((post) => post.category === activeFilter),
    [activeFilter, posts],
  );

  const publishPost = async () => {
    const body = draft.trim();
    if (!body || isPublishing) return;

    setIsPublishing(true);
    try {
      // The new post reaches the feed through the live subscription.
      await createCommunityPost({ body, category: postCategory });
      setDraft("");
      setActiveFilter("All");
    } catch (error) {
      Alert.alert(
        "Post not published",
        getApiErrorMessage(error, "The post could not be saved. Please try again."),
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (pendingLikes.has(postId)) return;
    setPendingLikes((current) => new Set(current).add(postId));
    try {
      // Like counts and the liked state update through the subscriptions.
      await toggleCommunityPostLike(postId);
    } catch (error) {
      Alert.alert(
        "Could not update like",
        getApiErrorMessage(error, "Please try again."),
      );
    } finally {
      setPendingLikes((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Image
            source={require("../../assets/images/cleanmystreet.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Community</Text>
        </View>

        {communityGroup && (
          <View style={styles.groupBanner}>
            <View style={styles.groupBannerText}>
              <Text style={styles.groupBannerEyebrow}>YOUR COMMUNITY</Text>
              <Text style={styles.groupBannerTitle}>
                {communityGroup.name}
              </Text>
              <Text style={styles.groupBannerArea}>{communityGroup.area}</Text>
              <Text style={styles.groupBannerNote}>
                Demo membership is stored on this device. Posts use the shared
                community feed until group-specific posts are supported.
              </Text>
            </View>
            {onChangeGroup && (
              <Pressable
                onPress={onChangeGroup}
                accessibilityRole="button"
                accessibilityLabel="Find another community group"
                style={styles.changeGroupButton}
              >
                <Text style={styles.changeGroupText}>Groups</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Direct messages are hidden until conversations have a backend. */}
        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const selected = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  selected && styles.selectedFilterChip,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.selectedFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.composerCard}>
            <View style={styles.composerTop}>
              <Avatar initials={myInitials} />
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Share something with your neighbours..."
                placeholderTextColor={colors.muted}
                style={styles.postInput}
                multiline
                accessibilityLabel="Write a community post"
              />
            </View>
            {showCategoryPicker && (
              <View style={styles.categoryPicker}>
                {categories.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => {
                      setPostCategory(category);
                      setShowCategoryPicker(false);
                    }}
                    style={[
                      styles.categoryOption,
                      postCategory === category &&
                        styles.categoryOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        postCategory === category &&
                          styles.categoryOptionTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.composerActions}>
              <Pressable
                style={styles.categoryButton}
                onPress={() => setShowCategoryPicker((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={`Post category: ${postCategory}`}
              >
                <Text style={styles.categoryButtonText}>
                  {postCategory}⌄
                </Text>
              </Pressable>
              <Pressable
                onPress={publishPost}
                disabled={!draft.trim() || isPublishing}
                style={[
                  styles.postButton,
                  (!draft.trim() || isPublishing) &&
                    styles.postButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Publish post"
              >
                <Text style={styles.postButtonText}>Post</Text>
              </Pressable>
            </View>
          </View>

          {isLoadingPosts && (
            <View style={styles.feedStatus}>
              <ActivityIndicator color={colors.green} />
              <Text style={styles.feedStatusText}>Loading posts...</Text>
            </View>
          )}
          {!isLoadingPosts && postsError && (
            <View style={styles.feedStatus}>
              <Text style={styles.feedStatusTitle}>Could not load posts</Text>
              <Text style={styles.feedStatusText}>{postsError}</Text>
              <Pressable
                onPress={() => setPostsRetry((count) => count + 1)}
                style={styles.retryButton}
                accessibilityRole="button"
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          )}
          {!isLoadingPosts && !postsError && visiblePosts.length === 0 && (
            <View style={styles.feedStatus}>
              <Text style={styles.feedStatusTitle}>
                {activeFilter === "All"
                  ? "No posts yet"
                  : `No ${activeFilter} posts yet`}
              </Text>
              <Text style={styles.feedStatusText}>
                Be the first to share something with your neighbours.
              </Text>
            </View>
          )}

          {visiblePosts.map((post) => {
            const liked = likedPostIds.has(post.id);
            const isOpen = openPostId === post.id;
            return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Avatar initials={initialsOf(post.authorName)} />
                <View style={styles.postAuthor}>
                  <Text style={styles.authorName}>{post.authorName}</Text>
                  <Text style={styles.postTime}>
                    {formatRelativeTime(post.createdAt)}
                  </Text>
                </View>
                <View style={styles.postCategory}>
                  <Text style={styles.postCategoryText}>
                    {post.category}
                  </Text>
                </View>
              </View>
              <Text style={styles.postBody}>{post.body}</Text>
              <View style={styles.postDivider} />
              <View style={styles.postActions}>
                <Pressable
                  style={[styles.postAction, liked && styles.likedAction]}
                  onPress={() => void toggleLike(post.id)}
                  disabled={pendingLikes.has(post.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${liked ? "Unlike" : "Like"} post, ${post.likes} likes`}
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                    size={11}
                    color={liked ? "#E25555" : colors.muted}
                  />
                  <Text style={styles.actionCount}>{post.likes}</Text>
                </Pressable>
                <Pressable
                  style={styles.postAction}
                  onPress={() => setOpenPostId(isOpen ? null : post.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${post.commentCount} comments`}
                  accessibilityState={{ expanded: isOpen }}
                >
                  <FontAwesomeIcon
                    icon={faComment}
                    size={11}
                    color={colors.muted}
                  />
                  <Text style={styles.actionCount}>{post.commentCount}</Text>
                </Pressable>
              </View>
              {isOpen && <PostComments postId={post.id} />}
            </View>
            );
          })}
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable
            onPress={() => router.push("/home")}
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon icon={faHouse} size={20} color={colors.green} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/news")}
            accessibilityRole="button"
            accessibilityLabel="View News"
          >
            <FontAwesomeIcon
              icon={faNewspaper}
              size={20}
              color={colors.green}
            />
          </Pressable>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/reportdumping")}
            accessibilityRole="button"
            accessibilityLabel="Report dumping"
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel="Community"
            accessibilityState={{ selected: true }}
          >
            <FontAwesomeIcon icon={faUsers} size={20} color="#36B86B"/>
          </Pressable>
          <ProfileNavButton iconColor={colors.green} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// A post's comments and the box for adding one. Mounted only while the post
// is open, so the feed doesn't keep a listener per post.
function PostComments({ postId }: { postId: string }): JSX.Element {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(
    () =>
      subscribePostComments(
        postId,
        (nextComments) => {
          setComments(nextComments);
          setIsLoading(false);
        },
        (loadError) => {
          setError(loadError.message);
          setIsLoading(false);
        },
      ),
    [postId],
  );

  const sendComment = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      await createCommunityComment(postId, text);
      setDraft("");
    } catch (sendError) {
      Alert.alert(
        "Comment not sent",
        getApiErrorMessage(sendError, "Please try again."),
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isLoading && <Text style={styles.commentStatus}>Loading comments...</Text>}
      {!isLoading && error && (
        <Text style={styles.commentStatus}>Could not load comments: {error}</Text>
      )}
      {!isLoading && !error && comments.length === 0 && (
        <Text style={styles.commentStatus}>No comments yet.</Text>
      )}
      {comments.map((comment) => (
        <View key={comment.id} style={styles.commentBubble}>
          <Text style={styles.commentText}>
            <Text style={styles.commentAuthor}>{comment.authorName}</Text>
            {"  "}
            {comment.body}
          </Text>
        </View>
      ))}
      <View style={styles.replyRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a comment..."
          placeholderTextColor={colors.muted}
          style={styles.replyInput}
          maxLength={1000}
          accessibilityLabel="Write a comment"
        />
        <Pressable
          onPress={() => void sendComment()}
          disabled={!draft.trim() || isSending}
          accessibilityRole="button"
          accessibilityLabel="Send comment"
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} size={14} color={colors.green} />
          )}
        </Pressable>
      </View>
    </>
  );
}

function Avatar({ initials }: { initials: string }): JSX.Element {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

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
  backIcon: {
    color: colors.ink,
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },
  logo: { width: 26, height: 26, resizeMode: "contain" },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  groupBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#EAF5ED",
  },
  groupBannerText: { flex: 1 },
  groupBannerEyebrow: {
    color: colors.green,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  groupBannerTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  groupBannerArea: { color: colors.muted, fontSize: 10, marginTop: 2 },
  groupBannerNote: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 6,
  },
  changeGroupButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  changeGroupText: { color: colors.green, fontSize: 11, fontWeight: "700" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 13,
  },
  filterChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 34,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedFilterChip: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterText: { color: colors.ink, fontSize: 11, fontWeight: "600" },
  selectedFilterText: { color: "#FFFFFF" },
  feed: { paddingHorizontal: 16, paddingBottom: 18, gap: 12 },
  composerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  composerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  postInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 76,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.inputBackground,
    color: colors.ink,
    fontSize: 12,
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  categoryPicker: { flexDirection: "row", gap: 6, marginTop: 8 },
  categoryOption: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: colors.inputBackground,
  },
  categoryOptionSelected: { backgroundColor: colors.accentPale },
  categoryOptionText: { color: colors.ink, fontSize: 11 },
  categoryOptionTextSelected: { color: colors.green, fontWeight: "700" },
  categoryButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: colors.inputBackground,
  },
  categoryButtonText: { color: colors.ink, fontSize: 11 },
  postButton: {
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.green,
  },
  postButtonDisabled: { opacity: 0.75 },
  postButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAuthor: { flex: 1 },
  authorName: { color: colors.ink, fontSize: 12, fontWeight: "600" },
  postTime: { color: colors.muted, fontSize: 10, marginTop: 2 },
  postCategory: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: colors.accentPale,
  },
  postCategoryText: { color: colors.green, fontSize: 11, fontWeight: "700" },
  postBody: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 8,
  },
  postDivider: { height: 1, backgroundColor: colors.border, marginBottom: 6 },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    minHeight: 20,
  },
  postAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  likedAction: { opacity: 1 },
  actionCount: { color: colors.muted, fontSize: 10 },
  commentBubble: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 6,
  },
  commentText: { color: colors.ink, fontSize: 11 },
  commentAuthor: { fontWeight: "700" },
  commentStatus: { color: colors.muted, fontSize: 10, marginTop: 8 },
  feedStatus: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  feedStatusTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  feedStatusText: { color: colors.muted, fontSize: 11, textAlign: "center" },
  retryButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryButtonText: { color: colors.green, fontSize: 11, fontWeight: "700" },
  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  replyInput: {
    flex: 1,
    height: 36,
    backgroundColor: colors.inputBackground,
    borderRadius: 9,
    paddingHorizontal: 9,
    fontSize: 12,
    color: colors.ink,
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
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
  },
});
