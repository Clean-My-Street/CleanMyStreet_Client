import {
	faArrowLeft,
	faBell,
	faBookmark,
	faClock,
	faCreditCard,
	faGear,
	faHome,
	faMap,
	faPlus,
	faRightFromBracket,
	faShieldHalved,
	faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import { JSX } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ProfileRowProps = {
  icon: typeof faClock;
  label: string;
  onPress?: () => void;
};

export default function Profile(): JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <FontAwesomeIcon icon={faArrowLeft} size={16} color="#17201A" />
            </Pressable>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>CM</Text>
            </View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable
              style={styles.headerAction}
              accessibilityLabel="View notifications"
            >
              <FontAwesomeIcon icon={faBell} size={15} color="#17201A" />
            </Pressable>
          </View>

          <View style={styles.profileSummary}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MI</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>Mikasi Inc</Text>
              <Text style={styles.profileEmail}>mikasi@gmail.com</Text>
            </View>
            <Pressable
              style={styles.editButton}
              onPress={() => router.push("/editprofile")}
              accessibilityLabel="Edit profile"
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          </View>

          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓</Text>
          </View>

          <ProfileSection title="Account">
            <ProfileRow icon={faClock} label="My Activity" onPress={() => {}} />
            <ProfileRow
              icon={faBookmark}
              label="Saved Items"
              onPress={() => {}}
            />
            <ProfileRow
              icon={faCreditCard}
              label="Payment Methods"
              onPress={() => {}}
            />
          </ProfileSection>

          <ProfileSection title="Settings">
            <ProfileRow icon={faGear} label="Settings" onPress={() => {}} />
            <ProfileRow
              icon={faShieldHalved}
              label="Privacy & Security"
              onPress={() => {}}
            />
          </ProfileSection>

          <ProfileRow
            icon={faRightFromBracket}
            label="Log out"
            onPress={() => {}}
          />
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable
            onPress={() => router.push("/home")}
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon icon={faHome} size={19} color="#68706A" />
          </Pressable>
          <Pressable accessibilityLabel="View sites">
            <FontAwesomeIcon icon={faMap} size={19} color="#68706A" />
          </Pressable>
          <Pressable
            style={styles.addButton}
            accessibilityLabel="Create report"
          >
            <FontAwesomeIcon icon={faPlus} size={20} color="#17201A" />
          </Pressable>
          <Pressable accessibilityLabel="View alerts">
            <FontAwesomeIcon icon={faBell} size={19} color="#68706A" />
          </Pressable>
          <Pressable accessibilityLabel="View profile">
            <FontAwesomeIcon icon={faUser} size={19} color="#1F9A55" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: JSX.Element[];
}): JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.rowGroup}>{children}</View>
    </View>
  );
}

function ProfileRow({ icon, label, onPress }: ProfileRowProps): JSX.Element {
  return (
    <Pressable
      style={styles.profileRow}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.rowIcon}>
        <FontAwesomeIcon icon={icon} size={13} color="#17201A" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { height: 52, flexDirection: "row", alignItems: "center" },
  logoMark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 13,
  },
  logoText: { color: "#FFFFFF", fontSize: 8, fontWeight: "800" },
  headerTitle: { color: "#17201A", fontSize: 12, marginLeft: 7 },
  headerAction: { marginLeft: "auto", padding: 8 },
  profileSummary: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D8E9DC",
    borderWidth: 1,
    borderColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#176A39", fontSize: 13, fontWeight: "700" },
  profileDetails: { marginLeft: 12, flex: 1 },
  profileName: { color: "#17201A", fontSize: 13, fontWeight: "600" },
  profileEmail: { color: "#68706A", fontSize: 8, marginTop: 3 },
  editButton: {
    backgroundColor: "#F0F1F0",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  editButtonText: { color: "#17201A", fontSize: 8, fontWeight: "600" },
  verifiedBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#36B86B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 34,
    marginTop: -5,
  },
  verifiedBadgeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "800" },
  section: { marginTop: 25 },
  sectionTitle: { color: "#17201A", fontSize: 12, marginBottom: 8 },
  rowGroup: { borderTopWidth: 1, borderTopColor: "#F0F1F0" },
  profileRow: {
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F0",
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#17201A",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowLabel: { color: "#39433C", fontSize: 11, marginLeft: 12 },
  chevron: {
    color: "#17201A",
    fontSize: 22,
    fontWeight: "300",
    marginLeft: "auto",
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
});
