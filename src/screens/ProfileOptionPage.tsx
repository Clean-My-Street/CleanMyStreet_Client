import {
    faBell,
    faBookmark,
    faCheck,
    faCreditCard,
    faHeart,
    faHome,
    faLeaf,
    faNewspaper,
    faShieldHalved,
    faUser,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { JSX, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ProfileOption = 'activity' | 'saved' | 'payments' | 'settings' | 'privacy';

type ProfileOptionPageProps = {
	option: ProfileOption;
};

const optionTitles: Record<ProfileOption, string> = {
	activity: 'My Activity',
	saved: 'Saved Items',
	payments: 'Payment Methods',
	settings: 'Settings',
	privacy: 'Privacy & Security',
};

export default function ProfileOptionPage({ option }: ProfileOptionPageProps): JSX.Element {
	const router = useRouter();
	const [savedItems, setSavedItems] = useState(['musgrave', 'campaign']);
	const [defaultPayment, setDefaultPayment] = useState('card');
	const [preferences, setPreferences] = useState({
		pushNotifications: true,
		cleanupReminders: true,
		locationServices: false,
		publicProfile: true,
		activitySharing: false,
		twoStepVerification: false,
	});

	const updatePreference = (key: keyof typeof preferences, value: boolean) => {
		setPreferences((current) => ({ ...current, [key]: value }));
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.screen}>
				<View style={styles.header}>
					<Pressable
						style={styles.backButton}
						onPress={() => router.back()}
						accessibilityRole="button"
						accessibilityLabel="Back to profile"
					>
						<Text style={styles.backIcon}>‹</Text>
					</Pressable>
					<Image source={require('../../assets/images/cleanmystreet.png')} style={styles.logo} />
					<Text style={styles.headerTitle}>{optionTitles[option]}</Text>
					<Pressable
						style={styles.headerAction}
						onPress={() => router.push('/notifications')}
						accessibilityRole="button"
						accessibilityLabel="View notifications"
					>
						<FontAwesomeIcon icon={faBell} size={17} color={colors.ink} />
					</Pressable>
				</View>

				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{option === 'activity' && <ActivityContent />}
					{option === 'saved' && (
						<SavedContent
							items={savedItems}
							removeItem={(id) => setSavedItems((current) => current.filter((item) => item !== id))}
						/>
					)}
					{option === 'payments' && (
						<PaymentContent
							selected={defaultPayment}
							select={setDefaultPayment}
						/>
					)}
					{option === 'settings' && (
						<SettingsContent preferences={preferences} updatePreference={updatePreference} />
					)}
					{option === 'privacy' && (
						<PrivacyContent preferences={preferences} updatePreference={updatePreference} />
					)}
				</ScrollView>

				<BottomNavigation />
			</View>
		</SafeAreaView>
	);
}

function ActivityContent(): JSX.Element {
	return (
		<>
			<IntroCard
				icon={faLeaf}
				title="Your community impact"
				text="A record of the cleanups and campaigns you’ve taken part in."
			/>
			<View style={styles.statsRow}>
				<StatCard value="8" label="Reports made" />
				<StatCard value="5" label="Cleanups joined" />
				<StatCard value="R750" label="Contributed" />
			</View>
			<Text style={styles.sectionTitle}>Recent activity</Text>
			<ActivityRow title="Reported illegal dumping" detail="Musgrave Road · Report reviewed" date="Today" status="Reviewed" />
			<ActivityRow title="Joined a community cleanup" detail="Sydenham Road · Cleanup completed" date="12 Aug" status="Completed" />
			<ActivityRow title="Contributed to a campaign" detail="Musgrave Rd Cleanup · R250" date="8 Aug" status="Complete" />
		</>
	);
}

function SavedContent({
	items,
	removeItem,
}: {
	items: string[];
	removeItem: (id: string) => void;
}): JSX.Element {
	return (
		<>
			<IntroCard
				icon={faBookmark}
				title="Your saved items"
				text="Keep useful cleanup sites and campaigns close at hand."
			/>
			<Text style={styles.sectionTitle}>Saved for later</Text>
			{items.includes('musgrave') && (
				<SavedCard
					title="Musgrave Road dumping site"
					detail="0.8 km away · Reported recently"
					tag="Cleanup site"
					remove={() => removeItem('musgrave')}
				/>
			)}
			{items.includes('campaign') && (
				<SavedCard
					title="Musgrave Rd Cleanup"
					detail="Community campaign · 65% funded"
					tag="Campaign"
					remove={() => removeItem('campaign')}
				/>
			)}
			{items.length === 0 && (
				<EmptyState title="Nothing saved yet" text="Save a cleanup site or campaign and it will appear here." />
			)}
		</>
	);
}

function PaymentContent({
	selected,
	select,
}: {
	selected: string;
	select: (id: string) => void;
}): JSX.Element {
	return (
		<>
			<IntroCard
				icon={faCreditCard}
				title="Payment methods"
				text="Choose a preferred method for supporting community campaigns."
			/>
			<Text style={styles.sectionTitle}>Your methods</Text>
			<PaymentCard title="Visa ending in 4242" detail="Expires 08/28" selected={selected === 'card'} onPress={() => select('card')} />
			<PaymentCard title="Bank account ending in 1024" detail="South African bank account" selected={selected === 'bank'} onPress={() => select('bank')} />
			<Pressable
				style={styles.outlineButton}
				onPress={() => Alert.alert('Payment methods', 'Secure payment setup will be available when payments are connected to your account.')}
				accessibilityRole="button"
			>
				<Text style={styles.outlineButtonText}>＋  Add payment method</Text>
			</Pressable>
			<Text style={styles.helperText}>Your payment details are protected and are never shown in full.</Text>
		</>
	);
}

function SettingsContent({
	preferences,
	updatePreference,
}: {
	preferences: Record<string, boolean>;
	updatePreference: (key: 'pushNotifications' | 'cleanupReminders' | 'locationServices', value: boolean) => void;
}): JSX.Element {
	return (
		<>
			<IntroCard
				icon={faHeart}
				title="Make the app work for you"
				text="Manage how CleanMyStreet keeps you informed and supports your community work."
			/>
			<Text style={styles.sectionTitle}>Notifications</Text>
			<PreferenceRow title="Push notifications" detail="Updates about reports and campaigns" value={preferences.pushNotifications} onChange={(value) => updatePreference('pushNotifications', value)} />
			<PreferenceRow title="Cleanup reminders" detail="Reminders for upcoming community events" value={preferences.cleanupReminders} onChange={(value) => updatePreference('cleanupReminders', value)} />
			<Text style={styles.sectionTitle}>App preferences</Text>
			<PreferenceRow title="Location services" detail="Use your location to show nearby cleanup sites" value={preferences.locationServices} onChange={(value) => updatePreference('locationServices', value)} />
			<Pressable style={styles.preferenceRow} onPress={() => Alert.alert('Language', 'The app currently uses English.') } accessibilityRole="button">
				<View style={styles.preferenceCopy}>
					<Text style={styles.preferenceTitle}>Language</Text>
					<Text style={styles.preferenceDetail}>English</Text>
				</View>
				<Text style={styles.chevron}>›</Text>
			</Pressable>
		</>
	);
}

function PrivacyContent({
	preferences,
	updatePreference,
}: {
	preferences: Record<string, boolean>;
	updatePreference: (key: 'publicProfile' | 'activitySharing' | 'twoStepVerification', value: boolean) => void;
}): JSX.Element {
	return (
		<>
			<IntroCard
				icon={faShieldHalved}
				title="You’re in control"
				text="Choose what you share and strengthen the security of your account."
			/>
			<Text style={styles.sectionTitle}>Privacy</Text>
			<PreferenceRow title="Public profile" detail="Allow community members to find your profile" value={preferences.publicProfile} onChange={(value) => updatePreference('publicProfile', value)} />
			<PreferenceRow title="Share activity" detail="Show your cleanup activity on your profile" value={preferences.activitySharing} onChange={(value) => updatePreference('activitySharing', value)} />
			<Text style={styles.sectionTitle}>Account security</Text>
			<PreferenceRow title="Two-step verification" detail="Add an extra step when signing in" value={preferences.twoStepVerification} onChange={(value) => updatePreference('twoStepVerification', value)} />
			<View style={styles.securityTip}>
				<View style={styles.securityIcon}>
					<FontAwesomeIcon icon={faShieldHalved} size={16} color={colors.green} />
				</View>
				<View style={styles.securityCopy}>
					<Text style={styles.preferenceTitle}>Keep your account secure</Text>
					<Text style={styles.preferenceDetail}>Use a unique password and never share your sign-in details.</Text>
				</View>
			</View>
		</>
	);
}

function IntroCard({
	icon,
	title,
	text,
}: {
	icon: typeof faLeaf;
	title: string;
	text: string;
}): JSX.Element {
	return (
		<View style={styles.introCard}>
			<View style={styles.introIcon}>
				<FontAwesomeIcon icon={icon} size={20} color={colors.green} />
			</View>
			<View style={styles.introCopy}>
				<Text style={styles.introTitle}>{title}</Text>
				<Text style={styles.introText}>{text}</Text>
			</View>
		</View>
	);
}

function StatCard({ value, label }: { value: string; label: string }): JSX.Element {
	return (
		<View style={styles.statCard}>
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);
}

function ActivityRow({
	title,
	detail,
	date,
	status,
}: {
	title: string;
	detail: string;
	date: string;
	status: string;
}): JSX.Element {
	return (
		<View style={styles.listCard}>
			<View style={styles.activityIcon}>
				<FontAwesomeIcon icon={faCheck} size={14} color={colors.green} />
			</View>
			<View style={styles.listCopy}>
				<View style={styles.titleDateRow}>
					<Text style={styles.cardTitle}>{title}</Text>
					<Text style={styles.dateText}>{date}</Text>
				</View>
				<Text style={styles.cardDetail}>{detail}</Text>
				<Text style={styles.statusText}>{status}</Text>
			</View>
		</View>
	);
}

function SavedCard({
	title,
	detail,
	tag,
	remove,
}: {
	title: string;
	detail: string;
	tag: string;
	remove: () => void;
}): JSX.Element {
	return (
		<View style={styles.savedCard}>
			<View style={styles.savedCardTop}>
				<View style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
				<Pressable onPress={remove} accessibilityRole="button" accessibilityLabel={`Remove ${title} from saved items`}>
					<FontAwesomeIcon icon={faXmark} size={16} color={colors.muted} />
				</Pressable>
			</View>
			<Text style={styles.cardTitle}>{title}</Text>
			<Text style={styles.cardDetail}>{detail}</Text>
		</View>
	);
}

function PaymentCard({
	title,
	detail,
	selected,
	onPress,
}: {
	title: string;
	detail: string;
	selected: boolean;
	onPress: () => void;
}): JSX.Element {
	return (
		<Pressable
			style={[styles.paymentCard, selected && styles.paymentCardSelected]}
		onPress={onPress}
		accessibilityRole="radio"
		accessibilityState={{ selected }}
		accessibilityLabel={`${title}${selected ? ', default payment method' : ''}`}
		>
			<View style={styles.paymentIcon}><FontAwesomeIcon icon={faCreditCard} size={18} color={colors.green} /></View>
			<View style={styles.listCopy}>
				<Text style={styles.cardTitle}>{title}</Text>
				<Text style={styles.cardDetail}>{detail}</Text>
			</View>
			<View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
				{selected && <View style={styles.radioInner} />}
			</View>
		</Pressable>
	);
}

function PreferenceRow({
	title,
	detail,
	value,
	onChange,
}: {
	title: string;
	detail: string;
	value: boolean;
	onChange: (value: boolean) => void;
}): JSX.Element {
	return (
		<View style={styles.preferenceRow}>
			<View style={styles.preferenceCopy}>
				<Text style={styles.preferenceTitle}>{title}</Text>
				<Text style={styles.preferenceDetail}>{detail}</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onChange}
				trackColor={{ false: '#D7DDD8', true: '#9BD8B1' }}
				thumbColor={value ? colors.green : '#FFFFFF'}
				accessibilityLabel={title}
			/>
		</View>
	);
}

function EmptyState({ title, text }: { title: string; text: string }): JSX.Element {
	return (
		<View style={styles.emptyState}>
			<FontAwesomeIcon icon={faBookmark} size={24} color={colors.green} />
			<Text style={styles.emptyTitle}>{title}</Text>
			<Text style={styles.emptyText}>{text}</Text>
		</View>
	);
}

function BottomNavigation(): JSX.Element {
	const router = useRouter();
	return (
		<View style={styles.bottomNav}>
			<Pressable onPress={() => router.push('/home')} accessibilityRole="button" accessibilityLabel="Go to Home">
				<FontAwesomeIcon icon={faHome} size={20} color={colors.green} />
			</Pressable>
			<Pressable onPress={() => router.push('/news')} accessibilityRole="button" accessibilityLabel="View News">
				<FontAwesomeIcon icon={faNewspaper} size={20} color={colors.green} />
			</Pressable>
			<Pressable style={styles.addButton} onPress={() => router.push('/reportdumping')} accessibilityRole="button" accessibilityLabel="Report dumping">
				<Text style={styles.addButtonText}>+</Text>
			</Pressable>
			<Pressable onPress={() => router.push('/notifications')} accessibilityRole="button" accessibilityLabel="View notifications">
				<FontAwesomeIcon icon={faBell} size={20} color={colors.green} />
			</Pressable>
			<Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="View profile">
				<FontAwesomeIcon icon={faUser} size={20} color={colors.green} />
			</Pressable>
		</View>
	);
}

const colors = {
	green: '#124A2A',
	teal: '#36B86B',
	ink: '#17201A',
	muted: '#68706A',
	border: '#E1E9E2',
	background: '#F5F8F5',
	paleGreen: '#EAF5ED',
};

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
	screen: { flex: 1, backgroundColor: colors.background },
	header: {
		height: 56,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		gap: 9,
	},
	backButton: { minWidth: 27, justifyContent: 'center' },
	backIcon: { color: colors.ink, fontSize: 32, lineHeight: 34 },
	logo: { width: 27, height: 27, resizeMode: 'contain' },
	headerTitle: { color: colors.green, fontSize: 15, fontWeight: '700', flex: 1 },
	headerAction: { padding: 8 },
	content: { padding: 16, paddingBottom: 24, flexGrow: 1 },
	introCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 15,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: colors.border,
	},
	introIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
	introCopy: { flex: 1, gap: 4 },
	introTitle: { color: colors.green, fontSize: 14, fontWeight: '700' },
	introText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
	sectionTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 10 },
	statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
	statCard: { flex: 1, minHeight: 68, backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 7, borderWidth: 1, borderColor: colors.border },
	statValue: { color: colors.green, fontSize: 16, fontWeight: '800' },
	statLabel: { color: colors.muted, fontSize: 9, textAlign: 'center', marginTop: 4 },
	listCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 9, gap: 10 },
	activityIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
	listCopy: { flex: 1 },
	titleDateRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
	cardTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', flexShrink: 1 },
	dateText: { color: colors.muted, fontSize: 10 },
	cardDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
	statusText: { color: colors.green, fontSize: 10, fontWeight: '600', marginTop: 6 },
	savedCard: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
	savedCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
	tag: { alignSelf: 'flex-start', backgroundColor: colors.paleGreen, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
	tagText: { color: colors.green, fontSize: 9, fontWeight: '700' },
	emptyState: { flex: 1, minHeight: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 22, borderWidth: 1, borderColor: colors.border },
	emptyTitle: { color: colors.green, fontSize: 14, fontWeight: '700', marginTop: 12 },
	emptyText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
	paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 13, marginBottom: 10, gap: 11 },
	paymentCardSelected: { borderColor: colors.teal, backgroundColor: '#FBFEFC' },
	paymentIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
	radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#AAB4AC', alignItems: 'center', justifyContent: 'center' },
	radioOuterSelected: { borderColor: colors.green },
	radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
	outlineButton: { minHeight: 46, borderRadius: 9, borderWidth: 1, borderColor: colors.green, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 5 },
	outlineButtonText: { color: colors.green, fontSize: 12, fontWeight: '700' },
	helperText: { color: colors.muted, fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 12 },
	preferenceRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, gap: 12 },
	preferenceCopy: { flex: 1 },
	preferenceTitle: { color: colors.ink, fontSize: 12, fontWeight: '600' },
	preferenceDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
	chevron: { color: colors.ink, fontSize: 23, fontWeight: '300' },
	securityTip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paleGreen, borderRadius: 10, padding: 13, marginTop: 18, gap: 11 },
	securityIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
	securityCopy: { flex: 1 },
	bottomNav: { minHeight: 68, borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
	addButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
	addButtonText: { color: colors.ink, fontSize: 28, fontWeight: '300', lineHeight: 30 },
});