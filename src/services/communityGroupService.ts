import AsyncStorage from "@react-native-async-storage/async-storage";

export type CommunityGroup = {
  id: string;
  name: string;
  area: string;
  description: string;
};

const groupDefinitions = [
  {
    id: "street-care-circle",
    name: "Street Care Circle",
    description:
      "Neighbours sharing street clean-up plans and local waste-care tips.",
  },
  {
    id: "green-spaces-network",
    name: "Green Spaces Network",
    description:
      "A community for caring for parks, verges, and other shared green spaces.",
  },
] as const;

function storageKey(userId: string): string {
  return `community-groups:${userId}`;
}

export function createCommunityGroups(area: string): CommunityGroup[] {
  return groupDefinitions.map((group) => ({
    ...group,
    name: `${area} ${group.name}`,
    area,
  }));
}

export function getCommunityGroup(
  groupId: string,
  area = "Your area",
): CommunityGroup | null {
  return (
    createCommunityGroups(area).find((group) => group.id === groupId) ?? null
  );
}

export async function getJoinedCommunityGroupIds(
  userId: string,
): Promise<string[]> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (groupId) =>
        typeof groupId !== "string" ||
        !groupDefinitions.some((group) => group.id === groupId),
    )
  ) {
    throw new Error("Saved community memberships could not be read.");
  }
  return [...new Set(parsed)];
}

export async function joinCommunityGroup(
  userId: string,
  groupId: string,
): Promise<string[]> {
  if (!groupDefinitions.some((group) => group.id === groupId)) {
    throw new Error("This community group is unavailable.");
  }

  const currentGroupIds = await getJoinedCommunityGroupIds(userId);
  if (currentGroupIds.includes(groupId)) return currentGroupIds;

  const joinedGroupIds = [...currentGroupIds, groupId];
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(joinedGroupIds));
  return joinedGroupIds;
}
