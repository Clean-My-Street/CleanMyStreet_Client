import { faArrowLeft, faBell, faCheck, faHome, faMap, faShareNodes, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router } from 'expo-router';
import { JSX } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ViewCampaign(): JSX.Element {
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.screen}>
				<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
					<View style={styles.header}>
						<Pressable onPress={() => router.back()} accessibilityLabel="Go back">
							<FontAwesomeIcon icon={faArrowLeft} size={16} color="#17201A" />
						</Pressable>
						<View style={styles.logoMark}>
							<Text style={styles.logoText}>CM</Text>
						</View>
						<Text style={styles.headerTitle}>Musgrave Rd Cleanup Campaign</Text>
					</View>

					<View style={styles.photoPlaceholder}>
						<View style={styles.sky} />
						<View style={styles.fence} />
						<View style={styles.ground} />
						<View style={styles.path} />
						<Text style={styles.photoTitle}>Campaign site photo placeholder</Text>
						<Text style={styles.photoCaption}>Replace with a verified cleanup-site image</Text>
					</View>

					<View style={styles.fundingPanel}>
						<Text style={styles.fundingSummary}>R6,500 raised of R10,000 goal - 65%</Text>
						<Text style={styles.fundingMeta}>23 backers - 4 days left</Text>
						<View style={styles.progressTrack}>
							<View style={styles.progressFill} />
						</View>

						<Text style={styles.sectionLabel}>Choose an amount</Text>
						<Text style={styles.amountLabel}>Own amount</Text>
						<View style={styles.amountRow}>
							{['R50', 'R100', 'R250'].map((amount) => (
								<Pressable key={amount} style={styles.amountChip} onPress={() => {}}>
									<Text style={styles.amountText}>{amount}</Text>
								</Pressable>
							))}
						</View>
						<Pressable style={styles.contributeButton} onPress={() => {}}>
							<Text style={styles.contributeText}>Contribute</Text>
						</Pressable>
						<Pressable style={styles.lightAction} onPress={() => {}}>
							<Text style={styles.lightActionText}>Book a cleaning team when funding is complete</Text>
						</Pressable>
						<Pressable style={styles.lightAction} onPress={() => {}}>
							<FontAwesomeIcon icon={faShareNodes} size={13} color="#17201A" />
							<Text style={styles.lightActionText}>Share this campaign</Text>
						</Pressable>
					</View>

					<View style={styles.detailPanel}>
						<Text style={styles.campaignTitle}>Musgrave Rd Cleanup</Text>
						<Text style={styles.description}>
							Help us clear a large illegal dumping site near the Botanic Gardens entrance. Volunteers will remove litter, sort recyclable waste, and restore the pavement edge for nearby residents.
						</Text>
						<Text style={styles.sectionLabel}>Recent Contributors</Text>
						<Contributor name="Sipho N." amount="R250 - 3 hours ago" />
						<Contributor name="Amina K." amount="R100 - yesterday" />
						<Contributor name="Thando M." amount="R50 - yesterday" />
					</View>
				</ScrollView>

				<View style={styles.bottomNav}>
					<Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home">
						<FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
					</Pressable>
					<Pressable accessibilityLabel="View sites">
						<FontAwesomeIcon icon={faMap} size={20} color="#124A2A" />
					</Pressable>
					<Pressable style={styles.addButton} onPress={() => {}} accessibilityLabel="Create report">
						<Text style={styles.addButtonText}>+</Text>
					</Pressable>
					<Pressable accessibilityLabel="View alerts">
						<FontAwesomeIcon icon={faBell} size={20} color="#124A2A" />
					</Pressable>
                    <Pressable onPress={() => router.push('/profile')} accessibilityLabel="View profile">
						<FontAwesomeIcon icon={faUser} size={20} color="#124A2A" />
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

function Contributor({ name, amount }: { name: string; amount: string }): JSX.Element {
	return (
		<View style={styles.contributorRow}>
			<View style={styles.checkCircle}>
				<FontAwesomeIcon icon={faCheck} size={8} color="#FFFFFF" />
			</View>
			<View>
				<Text style={styles.contributorName}>{name}</Text>
				<Text style={styles.contributorAmount}>{amount}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
	screen: { flex: 1, backgroundColor: '#FFFFFF' },
	content: { paddingBottom: 24 },
	header: { height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
	logoMark: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center' },
	logoText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
	headerTitle: { flex: 1, color: '#17201A', fontSize: 11, marginLeft: 2 },
	photoPlaceholder: { height: 245, backgroundColor: '#73816C', position: 'relative', overflow: 'hidden', justifyContent: 'flex-end', padding: 14 },
	sky: { position: 'absolute', top: 0, left: 0, right: 0, height: 96, backgroundColor: '#B7C4B5' },
	fence: { position: 'absolute', top: 76, left: 20, right: -10, height: 25, backgroundColor: '#596356', transform: [{ rotate: '-3deg' }] },
	ground: { position: 'absolute', bottom: -30, left: -20, right: -20, height: 185, backgroundColor: '#646B58', transform: [{ rotate: '-5deg' }] },
	path: { position: 'absolute', right: -18, top: 70, width: 145, height: 250, backgroundColor: '#9B866A', transform: [{ rotate: '22deg' }] },
	photoTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', zIndex: 1 },
	photoCaption: { color: '#EEF5EE', fontSize: 9, marginTop: 3, zIndex: 1 },
	fundingPanel: { backgroundColor: '#F3F4F3', padding: 14, borderBottomWidth: 1, borderBottomColor: '#E2E5E2' },
	fundingSummary: { color: '#17201A', fontSize: 11, fontWeight: '600' },
	fundingMeta: { color: '#68706A', fontSize: 9, marginTop: 4 },
	progressTrack: { height: 6, backgroundColor: '#D5D8D5', borderRadius: 3, overflow: 'hidden', marginVertical: 12 },
	progressFill: { width: '65%', height: '100%', backgroundColor: '#36B86B', borderRadius: 3 },
	sectionLabel: { color: '#17201A', fontSize: 11, fontWeight: '600', marginTop: 10, marginBottom: 6 },
	amountLabel: { color: '#68706A', fontSize: 9, marginBottom: 5 },
	amountRow: { flexDirection: 'row', gap: 7, marginBottom: 9 },
	amountChip: { backgroundColor: '#DFF2E6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
	amountText: { color: '#176A39', fontSize: 10, fontWeight: '600' },
	contributeButton: { height: 34, borderRadius: 6, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
	contributeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
	lightAction: { minHeight: 34, borderRadius: 6, backgroundColor: '#E5E8E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, marginTop: 6 },
	lightActionText: { color: '#17201A', fontSize: 9, marginLeft: 5 },
	detailPanel: { backgroundColor: '#F3F4F3', padding: 14, marginTop: 10 },
	campaignTitle: { color: '#17201A', fontSize: 16, fontWeight: '700', marginBottom: 8 },
	description: { color: '#39433C', fontSize: 10, lineHeight: 15 },
	contributorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
	checkCircle: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
	contributorName: { color: '#17201A', fontSize: 10 },
	contributorAmount: { color: '#68706A', fontSize: 9, marginTop: 2 },
	bottomNav: { minHeight: 68, borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
	addButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#68706A', alignItems: 'center', justifyContent: 'center' },
	addButtonText: { color: '#17201A', fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
