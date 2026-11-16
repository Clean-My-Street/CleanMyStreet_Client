import { faBell, faHome, faNewspaper, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { JSX, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileNavButton } from '../components/ProfileNavButton';
import { useDeviceLocation } from '../hooks/useDeviceLocation';
import {
  campaignStatusLabel,
  fundedPercent,
  subscribeCampaigns,
  type Campaign,
} from '../services/campaignService';
import { siteTitle, subscribeSites, type Site } from '../services/reportService';
import { shareCampaign } from '../services/shareService';
import { distanceKm, formatDistance } from '../utils/distance';
import { formatRelativeTime } from '../utils/formatRelativeTime';

const NEARBY_SITE_COUNT = 3;

export default function Home(): JSX.Element {
  const router = useRouter();
  const deviceLocation = useDeviceLocation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [areCampaignsLoading, setAreCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [areSitesLoading, setAreSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeCampaigns = subscribeCampaigns(
      (nextCampaigns) => {
        setCampaigns(nextCampaigns);
        setAreCampaignsLoading(false);
      },
      (error) => {
        setCampaignsError(error.message);
        setAreCampaignsLoading(false);
      },
    );
    const unsubscribeSites = subscribeSites(
      (nextSites) => {
        setSites(nextSites);
        setAreSitesLoading(false);
      },
      (error) => {
        setSitesError(error.message);
        setAreSitesLoading(false);
      },
    );
    return () => {
      unsubscribeCampaigns();
      unsubscribeSites();
    };
  }, []);

  // The closest sites when the device location is known, else the newest.
  const nearbySites = useMemo(() => {
    const location = deviceLocation.location;
    const withDistance = sites.map((site) => ({
      site,
      distance: location ? distanceKm(location, site) : null,
    }));
    if (location) {
      withDistance.sort((first, second) => (first.distance ?? 0) - (second.distance ?? 0));
    }
    return withDistance.slice(0, NEARBY_SITE_COUNT);
  }, [deviceLocation.location, sites]);
  const nearestPhoto = nearbySites.find(({ site }) => site.imageUrl)?.site.imageUrl ?? null;

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

          <Pressable
            style={styles.sectionHeading}
            onPress={() => router.push("/sites")}
            accessibilityRole="button"
            accessibilityLabel="See all dumping sites"
          >
            <Text style={styles.sectionTitle}>
              {deviceLocation.location ? 'Nearby Dumping Sites' : 'Recently Reported Sites'}
            </Text>
            <Text style={styles.seeAllText}>See all</Text>
          </Pressable>
          <View style={styles.sectionCard}>
            {nearestPhoto && (
              <View style={styles.artworkPlaceholder}>
                <Image
                  source={{ uri: nearestPhoto }}
                  style={styles.dumpingSiteImage}
                  accessibilityLabel="Photo of a nearby dumping site"
                />
              </View>
            )}
            {areSitesLoading && <ActivityIndicator color="#36B86B" />}
            {!areSitesLoading && sitesError && (
              <Text style={styles.emptyText}>Could not load sites: {sitesError}</Text>
            )}
            {!areSitesLoading && !sitesError && nearbySites.length === 0 && (
              <Text style={styles.emptyText}>
                No dumping sites reported yet. Tap + to report one.
              </Text>
            )}
            {nearbySites.map(({ site, distance }) => (
              <SiteRow
                key={site.id}
                name={siteTitle(site)}
                distance={
                  distance === null
                    ? formatRelativeTime(site.createdAt)
                    : formatDistance(distance)
                }
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Active Campaigns</Text>
          {areCampaignsLoading && (
            <View style={styles.sectionCard}>
              <ActivityIndicator color="#36B86B" />
            </View>
          )}
          {!areCampaignsLoading && campaignsError && (
            <View style={styles.sectionCard}>
              <Text style={styles.emptyText}>
                Could not load campaigns: {campaignsError}
              </Text>
            </View>
          )}
          {!areCampaignsLoading && !campaignsError && campaigns.length === 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.emptyText}>
                No campaigns yet. Campaigns are created for verified dumping sites.
              </Text>
            </View>
          )}
          {campaigns.map((campaign, index) => {
            const percent = fundedPercent(campaign);
            const isOpen = campaign.status === 'funding';
            return (
            <View key={campaign.id}>
              <View style={styles.sectionCard}>
                {campaign.imageUrl && (
                  <Image
                    source={{ uri: campaign.imageUrl }}
                    style={styles.campaignImage}
                    accessibilityLabel={`Photo for ${campaign.title}`}
                  />
                )}
                <View style={styles.campaignHeading}>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {campaignStatusLabel(campaign.status)}
                    </Text>
                  </View>
                </View>
                {campaign.description ? (
                  <Text style={styles.campaignDescription} numberOfLines={2}>
                    {campaign.description}
                  </Text>
                ) : null}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>
                <View style={styles.campaignMeta}>
                  <Text style={styles.metaText}>
                    R{campaign.pledgedAmount.toLocaleString('en-ZA')} of R
                    {campaign.goalAmount.toLocaleString('en-ZA')}
                  </Text>
                  <Text style={styles.metaText}>{percent}%</Text>
                </View>
                <View style={styles.campaignActions}>
                  <Pressable
                    style={[styles.campaignButton, styles.primaryButton]}
                    onPress={() =>
                      router.push({
                        pathname: '/previewcampaign',
                        params: { campaignId: campaign.id },
                      })
                    }
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryButtonText}>
                      {isOpen ? 'Contribute' : 'View campaign'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.campaignButton, styles.shareButton]}
                    onPress={() => void shareCampaign(campaign)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.secondaryButtonText}>Share</Text>
                  </Pressable>
                </View>
              </View>
              {index < 2 && <Advertisement />}
            </View>
            );
          })}
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable
            onPress={() => router.push("/home")}
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon icon={faHome} size={20} color="#36B86B" />
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
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  seeAllText: { color: '#267B49', fontSize: 11, fontWeight: '700' },
  emptyText: { color: '#68706A', fontSize: 11, textAlign: 'center', paddingVertical: 8 },
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
  progressFill: { height: '100%', backgroundColor: '#36B86B', borderRadius: 3 },
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
