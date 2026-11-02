import {
  faArrowLeft,
  faComment,
  faHeart,
  faHouse,
  faLocationDot,
  faNewspaper,
  faPaperPlane,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { JSX, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileNavButton } from "../components/ProfileNavButton";
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
    body: "Does anyone know if the Glenwood Park cleanup is still happening this weekend?",
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
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <FontAwesomeIcon icon={faArrowLeft} size={15} color={colors.ink} />
          </Pressable>
          <View style={styles.communityMark}>
            <FontAwesomeIcon icon={faLocationDot} size={15} color="#FFFFFF" />
          </View>
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
              <Avatar initials="MI" color={colors.green} size={31} />
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
                <Avatar
                  initials={post.initials}
                  color={avatarColor(post.initials)}
                  size={34}
                />
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

function Avatar({
  initials,
  color,
  size,
}: {
  initials: string;
  color: string;
  size: number;
}): JSX.Element {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.avatarText, size < 30 && styles.smallAvatarText]}>
        {initials}
      </Text>
    </View>
  );
}

function avatarColor(initials: string): string {
  const colorsByInitial: Record<string, string> = {
    TM: "#C66A19",
    JN: "#3475B9",
    LK: "#9852AF",
    MI: "#21834B",
  };
  return colorsByInitial[initials] ?? "#65766B";
}

const colors = {
  green: "#187A43",
  darkGreen: "#124A2A",
  ink: "#17201A",
  muted: "#818A84",
  border: "#E1E8E2",
  background: "#F3F6F4",
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 25, height: 38, justifyContent: "center" },
  communityMark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#58B878",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  headerTitle: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  filterRow: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 15,
    paddingBottom: 8,
    gap: 7,
  },
  filterChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedFilterChip: { backgroundColor: "#101512", borderColor: "#101512" },
  filterText: { color: colors.ink, fontSize: 9, fontWeight: "500" },
  selectedFilterText: { color: "#FFFFFF" },
  feed: { paddingHorizontal: 15, paddingBottom: 14, gap: 8 },
  composerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
    marginBottom: 0,
  },
  composerTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  smallAvatarText: { fontSize: 7 },
  postInput: {
    flex: 1,
    minHeight: 33,
    maxHeight: 68,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F4F6F5",
    color: colors.ink,
    fontSize: 9,
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 7,
  },
  categoryPicker: { flexDirection: "row", gap: 6, marginTop: 8 },
  categoryOption: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: "#F2F5F3",
  },
  categoryOptionSelected: { backgroundColor: "#E1F2E6" },
  categoryOptionText: { color: colors.ink, fontSize: 9 },
  categoryOptionTextSelected: { color: colors.darkGreen, fontWeight: "700" },
  categoryButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: "#F0F3F1",
  },
  categoryButtonText: { color: colors.ink, fontSize: 9 },
  postButton: {
    minWidth: 40,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.green,
  },
  postButtonDisabled: { opacity: 0.75 },
  postButtonText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  postAuthor: { flex: 1 },
  authorName: { color: colors.ink, fontSize: 10, fontWeight: "700" },
  postTime: { color: "#9AA19C", fontSize: 8, marginTop: 1 },
  postCategory: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#E4F4E9",
  },
  postCategoryText: { color: colors.green, fontSize: 8, fontWeight: "600" },
  postBody: {
    color: colors.ink,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 7,
    marginBottom: 6,
  },
  postDivider: { height: 1, backgroundColor: "#EDF0EE", marginBottom: 5 },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    minHeight: 20,
  },
  postAction: { flexDirection: "row", alignItems: "center", gap: 4 },
  likedAction: { opacity: 1 },
  actionCount: { color: colors.muted, fontSize: 8 },
  commentBubble: {
    backgroundColor: "#F2F5F3",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 5,
  },
  commentText: { color: colors.ink, fontSize: 8 },
  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  replyInput: {
    flex: 1,
    height: 34,
    backgroundColor: "#F4F6F5",
    borderRadius: 9,
    paddingHorizontal: 9,
    fontSize: 9,
    color: colors.ink,
  },
  bottomNav: {
    minHeight: 54,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#68706A",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: "300",
    lineHeight: 28,
  },
});
