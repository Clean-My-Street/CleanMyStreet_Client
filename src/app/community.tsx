import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import CommunityGroups from "../screens/CommunityGroups";
import Community from '../screens/Community';
import {
  getCommunityGroup,
  getJoinedCommunityGroupIds,
  joinCommunityGroup,
  type CommunityGroup,
} from "../services/communityGroupService";
import { auth } from "../services/firebase";

export default function CommunityRoute() {
  const userId = auth.currentUser?.uid ?? null;
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[] | null>(
    () => (userId ? null : []),
  );
  const [activeGroup, setActiveGroup] = useState<CommunityGroup | null>(null);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [membershipRetry, setMembershipRetry] = useState(0);

  useEffect(() => {
    let isActive = true;
    if (!userId) {
      return () => {
        isActive = false;
      };
    }

    getJoinedCommunityGroupIds(userId)
      .then((groupIds) => {
        if (!isActive) return;
        setJoinedGroupIds(groupIds);
        if (groupIds.length > 0) {
          setActiveGroup(getCommunityGroup(groupIds[0]));
        }
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setJoinedGroupIds([]);
        setMembershipError(
          error instanceof Error
            ? error.message
            : "Could not load your saved community memberships.",
        );
      });

    return () => {
      isActive = false;
    };
  }, [membershipRetry, userId]);

  const retryMembershipLoad = () => {
    setMembershipError(null);
    setMembershipRetry((current) => current + 1);
  };

  const selectGroup = async (group: CommunityGroup) => {
    if (!userId || joiningGroupId) return;
    setMembershipError(null);
    if (joinedGroupIds?.includes(group.id)) {
      setActiveGroup(group);
      setShowDiscovery(false);
      return;
    }

    setJoiningGroupId(group.id);
    try {
      const updatedGroupIds = await joinCommunityGroup(userId, group.id);
      setJoinedGroupIds(updatedGroupIds);
      setActiveGroup(group);
      setShowDiscovery(false);
    } catch (error) {
      setMembershipError(
        error instanceof Error
          ? error.message
          : "Could not join this community group. Please try again.",
      );
    } finally {
      setJoiningGroupId(null);
    }
  };

  if (joinedGroupIds === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#36B86B" />
        <Text style={styles.loadingText}>Loading community groups...</Text>
      </View>
    );
  }

  if (joinedGroupIds.length === 0 || showDiscovery) {
    return (
      <CommunityGroups
        joinedGroupIds={joinedGroupIds}
        joiningGroupId={joiningGroupId}
        membershipError={membershipError}
        onJoin={(group) => void selectGroup(group)}
        onOpen={(group) => void selectGroup(group)}
        onRetryMembership={retryMembershipLoad}
      />
    );
  }

  return (
    <Community
      communityGroup={activeGroup ?? getCommunityGroup(joinedGroupIds[0])}
      onChangeGroup={() => setShowDiscovery(true)}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  loadingText: { color: "#68706A", fontSize: 13 },
});
