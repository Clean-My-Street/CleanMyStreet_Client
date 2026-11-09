import { faBell, faHome, faNewspaper, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { JSX } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileNavButton } from '../components/ProfileNavButton';
import { shareFeaturedCampaign } from '../services/shareService';

const campaigns = [
  {
    id: 'musgrave-road-cleanup',
    title: 'Musgrave Rd Cleanup',
    description: 'Help remove household waste near the Botanic Gardens entrance.',
    image: require('../../assets/images/dumpingsite.jpeg'),
    raised: 6500,
    goal: 10000,
    status: 'Funding open',
    isFeatured: true,
  },
  {
    id: 'riverbank-restoration-example',
    title: 'Riverbank Restoration',
    description: 'A sample campaign to clear litter from a local riverbank.',
    image: require('../../assets/images/17.jpeg'),
    raised: 3200,
    goal: 8000,
    status: 'Funding open',
    isFeatured: false,
  },
  {
    id: 'glenwood-park-cleanup-example',
    title: 'Glenwood Park Cleanup',
    description: 'A sample update showing a completed park clean-up.',
    image: require('../../assets/images/20.jpeg'),
    raised: 5000,
    goal: 5000,
    status: 'Cleaned',
    isFeatured: false,
  },
];

export default function Home(): JSX.Element {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <View style={styles.logoMark}>
                <Image
                  source={require("../../assets/images/cleanmystreet.png")}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.brandName}>CleanMyStreetZA</Text>
            </View>

            <View>
              <Pressable
                onPress={() => router.push("/notifications")}
                accessibilityLabel="Open notifications"
              >
                <FontAwesomeIcon icon={faBell} size={20} color="#36B86B" />
              </Pressable>
            </View>
          </View>

          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>
              Reshaping communities, Restoring Value
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Nearby Dumping Sites</Text>
          <View style={styles.sectionCard}>
            <View style={styles.artworkPlaceholder}>
              <Image
                source={require("../../assets/images/dumpingsite.jpeg")}
                style={styles.dumpingSiteImage}
              />
            </View>
            <SiteRow name="Musgrave Rd" distance="0.8 km" />
            <SiteRow name="Sydenham Rd" distance="1.4 km" />
          </View>

          <Text style={styles.sectionTitle}>Active Campaigns</Text>
          {campaigns.map((campaign, index) => (
            <View key={campaign.id}>
              <View style={styles.sectionCard}>
                <Image source={campaign.image} style={styles.campaignImage} />
                <View style={styles.campaignHeading}>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{campaign.status}</Text>
                  </View>
                </View>
                <Text style={styles.campaignDescription} numberOfLines={2}>
                  {campaign.description}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.round((campaign.raised / campaign.goal) * 100),
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.campaignMeta}>
                  <Text style={styles.metaText}>
                    R{campaign.raised.toLocaleString('en-ZA')} of R
                    {campaign.goal.toLocaleString('en-ZA')}
                  </Text>
                  <Text style={styles.metaText}>
                    {Math.round((campaign.raised / campaign.goal) * 100)}%
                  </Text>
                </View>
                {campaign.isFeatured ? (
                  <View style={styles.campaignActions}>
                    <Pressable
                      style={[styles.campaignButton, styles.primaryButton]}
                      onPress={() => router.push("/previewcampaign")}
                    >
                      <Text style={styles.primaryButtonText}>Contribute</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.campaignButton, styles.shareButton]}
                      onPress={shareFeaturedCampaign}
                    >
                      <Text style={styles.secondaryButtonText}>Share</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.sampleCampaignNote}>
                    Example campaign · preview only
                  </Text>
                )}
              </View>
              {index < 2 && <Advertisement />}
            </View>
          ))}
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
          <ProfileNavButton />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SiteRow({
  name,
  distance,
}: {
  name: string;
  distance: string;
}): JSX.Element {
  return (
    <View style={styles.siteRow}>
      <Text style={styles.siteName}>{name}</Text>
      <Text style={styles.siteDistance}>{distance}</Text>
    </View>
  );
}

function Advertisement(): JSX.Element {
  return (
    <View style={styles.advertisementCard}>
      <View style={styles.advertisementBrand}>
        <Text style={styles.advertisementBrandName}>CleanMyStreetZA</Text>
        <Text style={styles.advertisementTitle}>Advertise Here</Text>
        <Text style={styles.advertisementEmail}>
          Email: Ads@cleanmystreet.com
        </Text>
      </View>
      <View style={styles.advertisementLogo}>
        <Image
          source={require('../../assets/images/cleanmystreet.png')}
          style={styles.advertisementLogoImage}
          accessibilityLabel="CleanMyStreet logo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 16, paddingBottom: 24 },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' },
  backIcon: { color: '#17201A', fontSize: 32, lineHeight: 32, marginRight: 8 },
  logoMark: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 28, height: 28, resizeMode: 'contain' },
  brandName: { color: '#17201A', fontSize: 13, fontWeight: '600', marginLeft: 7 },
  welcomeCard: { backgroundColor: '#F1F1F1', borderRadius: 8, padding: 16, marginBottom: 12 },
  welcomeText: { color: '#17201A', fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionButton: { minHeight: 38, borderRadius: 7, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: '#36B86B' },
  secondaryButton: { flex: 1, backgroundColor: '#F1F1F1' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  secondaryButtonText: { color: '#17201A', fontSize: 11, fontWeight: '600' },
  sectionTitle: { color: '#17201A', fontSize: 13, marginBottom: 8 },
  sectionCard: { backgroundColor: '#F1F1F1', borderRadius: 9, padding: 10, marginBottom: 18 },
  advertisementCard: { backgroundColor: '#F1F1F1', borderRadius: 9, padding: 12, marginBottom: 18, minHeight: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  advertisementBrand: { flex: 1, minWidth: 0 },
  advertisementLogo: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  advertisementLogoImage: { width: 46, height: 46, resizeMode: 'contain' },
  advertisementBrandName: { color: '#17201A', fontSize: 10, fontWeight: '600', marginBottom: 8 },
  advertisementTitle: { color: '#17201A', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  advertisementEmail: { color: '#17201A', fontSize: 11, flexWrap: 'wrap' },
  artworkPlaceholder: { height: 128, borderRadius: 6, backgroundColor: '#B7C6B9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dumpingSiteImage: { width: '100%', height: '100%', borderRadius: 6, resizeMode: 'cover' },
  siteRow: { backgroundColor: '#FFFFFF', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  siteName: { color: '#17201A', fontSize: 11 },
  siteDistance: { color: '#17201A', fontSize: 11 },
  campaignImage: { width: '100%', height: 122, borderRadius: 6, resizeMode: 'cover', marginBottom: 10 },
  campaignHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  campaignTitle: { flex: 1, color: '#17201A', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  statusBadge: { backgroundColor: '#E1F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { color: '#267B49', fontSize: 9, fontWeight: '700' },
  campaignDescription: { color: '#4D554F', fontSize: 10, lineHeight: 14, marginBottom: 9 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: '#D5D8D5', overflow: 'hidden' },
  progressFill: { width: '65%', height: '100%', backgroundColor: '#36B86B', borderRadius: 3 },
  campaignMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  metaText: { color: '#17201A', fontSize: 10 },
  campaignActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  sampleCampaignNote: { color: '#68706A', fontSize: 9, marginTop: 10 },
  campaignButton: { flex: 1, minHeight: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  shareButton: { backgroundColor: '#FFFFFF' },
  bottomNav: { minHeight: 68, borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
  addButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#68706A', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#17201A', fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
