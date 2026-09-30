import {
	faArrowLeft,
	faBell,
	faCheck,
	faHome,
	faMap,
	faPlus,
	faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router } from 'expo-router';
import { JSX, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Category = 'All' | 'Unread' | 'Cleanups' | 'Campaigns';
type NotificationCategory = Exclude<Category, 'All' | 'Unread'>;

type NotificationItem = {
	id: string;
	category: NotificationCategory;
	title: string;
	time: string;
	initials: string;
	read: boolean;
};

const categories: Category[] = ['All', 'Unread', 'Cleanups', 'Campaigns'];

const initialNotifications: NotificationItem[] = [
	{
		id: 'campaign-funded',
		category: 'Campaigns',
		title: 'Your campaign for Musgrave Rd reached 65% funding',
		time: '2 hours ago',
		initials: 'CM',
		read: false,
	},
	{
		id: 'contribution',
		category: 'Campaigns',
		title: 'James N. contributed R250 to your campaign',
		time: '5 hours ago',
		initials: 'JN',
		read: false,
	},
	{
		id: 'cleanup-scheduled',
		category: 'Cleanups',
		title: 'Cleanup for Sydenham Rd is scheduled for Aug 10, 9:00 AM',
		time: '2 days ago',
		initials: 'SC',
		read: true,
	},
	{
		id: 'booking-one',
		category: 'Cleanups',
		title: 'GreenSweep Crew confirmed your booking',
		time: '2 days ago',
		initials: 'GS',
		read: true,
	},
	{
		id: 'booking-two',
		category: 'Cleanups',
		title: 'GreenSweep Crew is preparing for your cleanup',
		time: '3 days ago',
		initials: 'GS',
		read: true,
	},
	{
		id: 'campaign-update',
		category: 'Campaigns',
		title: 'Your Musgrave Rd campaign received a new update',
		time: '4 days ago',
		initials: 'CM',
		read: true,
	},
];

export default function Notifications(): JSX.Element {
	const [activeCategory, setActiveCategory] = useState<Category>('All');
	const [notifications, setNotifications] = useState(initialNotifications);
	const visibleNotifications = useMemo(
		() =>
			notifications.filter((notification) => {
				if (activeCategory === 'Unread') return !notification.read;
				if (activeCategory === 'All') return true;
				return notification.category === activeCategory;
			}),
		[activeCategory, notifications],
	);

	const markAllAsRead = () => {
		setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
	};

	const toggleRead = (id: string) => {
		setNotifications((current) =>
			current.map((notification) =>
				notification.id === id ? { ...notification, read: !notification.read } : notification,
			),
		);
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.screen}>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()} accessibilityLabel="Go back" hitSlop={8}>
						<FontAwesomeIcon icon={faArrowLeft} size={17} color={colors.ink} />
					</Pressable>
					<Image source={require('../../assets/images/cleanmystreet.png')} style={styles.logo} />
					<Text style={styles.headerTitle}>Notifications</Text>
				</View>

				<View style={styles.actionsRow}>
					<View style={styles.unreadCount}>
						<Text style={styles.unreadCountText}>
							{notifications.filter((notification) => !notification.read).length} new
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
								style={[styles.filterChip, selected && styles.filterChipSelected]}
								onPress={() => setActiveCategory(category)}
								accessibilityRole="button"
								accessibilityState={{ selected }}
							>
								<Text style={[styles.filterText, selected && styles.filterTextSelected]}>{category}</Text>
							</Pressable>
						);
					})}
				</View>

				<ScrollView contentContainerStyle={styles.notificationList} showsVerticalScrollIndicator={false}>
					{visibleNotifications.length > 0 ? (
						visibleNotifications.map((notification) => (
							<Pressable
								key={notification.id}
								style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
								onPress={() => toggleRead(notification.id)}
								accessibilityRole="button"
								accessibilityLabel={`${notification.title}, ${notification.time}, ${notification.read ? 'read' : 'unread'}. Tap to change read status.`}
							>
								<View style={styles.avatar}>
									<Text style={styles.avatarText}>{notification.initials}</Text>
								</View>
								<View style={styles.notificationCopy}>
									<Text style={styles.notificationTitle}>{notification.title}</Text>
									<Text style={styles.notificationTime}>{notification.time}</Text>
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
							<Text style={styles.emptyText}>There are no notifications in this filter.</Text>
						</View>
					)}
				</ScrollView>

				<View style={styles.bottomNav}>
					<Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home">
						<FontAwesomeIcon icon={faHome} size={20} color={colors.muted} />
					</Pressable>
					<Pressable onPress={() => router.push('/location')} accessibilityLabel="View sites">
						<FontAwesomeIcon icon={faMap} size={20} color={colors.muted} />
					</Pressable>
					<Pressable
						style={styles.addButton}
						onPress={() => router.push('/reportdumping')}
						accessibilityLabel="Create report"
					>
						<FontAwesomeIcon icon={faPlus} size={18} color={colors.ink} />
					</Pressable>
					<Pressable accessibilityLabel="Notifications" accessibilityState={{ selected: true }}>
						<FontAwesomeIcon icon={faBell} size={20} color={colors.teal} />
					</Pressable>
					<Pressable onPress={() => router.push('/profile')} accessibilityLabel="View profile">
						<FontAwesomeIcon icon={faUser} size={20} color={colors.muted} />
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const colors = {
	ink: '#18323B',
	muted: '#6B7D84',
	teal: '#168A8A',
	tealDark: '#116D73',
	tealPale: '#E5F4F2',
	border: '#DCE7E7',
	background: '#F5F8F8',
};

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
	screen: { flex: 1, backgroundColor: colors.background },
	header: {
		height: 56,
		paddingHorizontal: 18,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		gap: 12,
	},
	logo: { width: 26, height: 26, resizeMode: 'contain' },
	headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
	actionsRow: {
		minHeight: 46,
		paddingHorizontal: 18,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	unreadCount: { backgroundColor: colors.tealPale, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
	unreadCountText: { color: colors.tealDark, fontSize: 11, fontWeight: '700' },
	markAllText: { color: colors.tealDark, fontSize: 12, fontWeight: '700' },
	filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 13 },
	filterChip: {
		flex: 1,
		minHeight: 34,
		paddingHorizontal: 8,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	filterChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
	filterText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
	filterTextSelected: { color: '#FFFFFF' },
	notificationList: { paddingHorizontal: 16, paddingBottom: 18, flexGrow: 1 },
	notificationCard: {
		minHeight: 74,
		marginBottom: 12,
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: '#FFFFFF',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		shadowColor: '#23424A',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 5,
		elevation: 2,
	},
	notificationUnread: { backgroundColor: colors.tealPale, borderColor: '#C6E7E3' },
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.teal,
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
	notificationCopy: { flex: 1, gap: 5 },
	notificationTitle: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '600' },
	notificationTime: { color: colors.muted, fontSize: 10 },
	unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal },
	emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
	emptyIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.tealPale,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
	emptyText: { color: colors.muted, fontSize: 12, marginTop: 5, textAlign: 'center' },
	bottomNav: {
		minHeight: 68,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: '#FFFFFF',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		paddingHorizontal: 10,
	},
	addButton: {
		width: 42,
		height: 42,
		borderRadius: 21,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
