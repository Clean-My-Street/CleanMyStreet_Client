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
import { JSX, useMemo, useState } from "react";
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
import { ProfileNavButton } from "../components/ProfileNavButton";
import { feedColors as colors } from "../constants/feedColors";
import { createCommunityPost } from "../services/api";

type Category = "Cleanup" | "Tips" | "Question";
type Filter = "All" | Category;
type CommunityPost = {
  id: string;
  name: string;
  initials: string;
  time: string;
  category: Category;
  body: string;
  likes: number;
  comments: string[];
  liked?: boolean;
};

const filters: Filter[] = ["All", "Cleanup", "Tips", "Question"];
const categories: Category[] = ["Cleanup", "Tips", "Question"];

const starterPosts: CommunityPost[] = [
  {
    id: "sydenham-cleanup",
    name: "Thandi M.",
    initials: "TM",
    time: "2h ago",
    category: "Cleanup",
    body: "Who is donating to the Sydenham Rd cleanup, it looks like a good site that we can get done easily.",
    likes: 12,
    comments: ["James N.  Count me in, bringing two friends."],
  },
  {
    id: "recycling-tip",
    name: "James N.",
    initials: "JN",
    time: "5h ago",
    category: "Tips",
    body: "Tip: sorting recyclables at home first makes the drop-off at the Musgrave site so much quicker.",
    likes: 8,
    comments: [],
  },
  {
    id: "park-question",
    name: "Lerato K.",
    initials: "LK",
    time: "1d ago",
    category: "Question",
    body: "Is the Glenwood Park cleanup a good site to contribute to?",
    likes: 5,
    comments: [],
  },
];

export default function Community(): JSX.Element {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [posts, setPosts] = useState(starterPosts);
  const [draft, setDraft] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [postCategory, setPostCategory] = useState<Category>("Cleanup");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

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
      const savedPost = await createCommunityPost({
        body,
        category: postCategory,
      });
      const name = savedPost.authorName;
      const nextPost: CommunityPost = {
        id: savedPost.id,
        name,
        initials: name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        time: "Just now",
        category: savedPost.category,
        body: savedPost.body,
        likes: savedPost.likes,
        comments: [],
      };
      setPosts((current) => [nextPost, ...current]);
      setDraft("");
      setActiveFilter("All");
    } catch (error) {
      Alert.alert(
        "Post not published",
        error instanceof Error
          ? error.message
          : "The post could not be saved. Please try again.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleLike = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      ),
    );
  };

  const publishReply = (postId: string) => {
    const text = replyDraft.trim();
    if (!text) return;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, `Mikasi Inc  ${text}`] }
          : post,
      ),
    );
    setReplyDraft("");
    setReplyTo(null);
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
              <Avatar initials="MI" />
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

          {visiblePosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Avatar initials={post.initials} />
                <View style={styles.postAuthor}>
                  <Text style={styles.authorName}>{post.name}</Text>
                  <Text style={styles.postTime}>{post.time}</Text>
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
                  style={[
                    styles.postAction,
                    post.liked && styles.likedAction,
                  ]}
                  onPress={() => toggleLike(post.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${post.liked ? "Unlike" : "Like"} post, ${post.likes} likes`}
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                    size={11}
                    color={post.liked ? "#E25555" : colors.muted}
                  />
                  <Text style={styles.actionCount}>{post.likes}</Text>
                </Pressable>
                <Pressable
                  style={styles.postAction}
                  onPress={() =>
                    setReplyTo(replyTo === post.id ? null : post.id)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${post.comments.length} comments`}
                >
                  <FontAwesomeIcon
                    icon={faComment}
                    size={11}
                    color={colors.muted}
                  />
                  <Text style={styles.actionCount}>
                    {post.comments.length}
                  </Text>
                </Pressable>
              </View>
              {post.comments.map((comment, index) => (
                <View
                  key={`${post.id}-comment-${index}`}
                  style={styles.commentBubble}
                >
                  <Text style={styles.commentText}>{comment}</Text>
                </View>
              ))}
              {replyTo === post.id && (
                <View style={styles.replyRow}>
                  <TextInput
                    value={replyDraft}
                    onChangeText={setReplyDraft}
                    placeholder="Write a comment..."
                    placeholderTextColor={colors.muted}
                    style={styles.replyInput}
                    accessibilityLabel="Write a comment"
                  />
                  <Pressable
                    onPress={() => publishReply(post.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Send comment"
                  >
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      size={14}
                      color={colors.green}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
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
            <FontAwesomeIcon icon={faUsers} size={20} color={colors.green} />
          </Pressable>
          <ProfileNavButton iconColor={colors.green} />
        </View>
      </View>
    </SafeAreaView>
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
