import { faBell, faHome, faMap, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { router } from 'expo-router';
import { JSX } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.backIcon}>‹</Text>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>CM</Text>
            </View>
            <Text style={styles.brandName}>CleanMyStreetZA</Text>
          </View>

          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>Reshaping communities, Restoring Value</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={() => {}}>
              <Text style={styles.primaryButtonText}>Report a Dumping Site</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={() => {}}>
              <Text style={styles.secondaryButtonText}>View Map &amp; List of Sites</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Nearby Dumping Sites</Text>
          <View style={styles.sectionCard}>
            <View style={styles.artworkPlaceholder}>
              <View style={styles.artworkPin}>
                <Text style={styles.artworkPinText}>!</Text>
              </View>
              <Text style={styles.artworkTitle}>Site photo artwork</Text>
              <Text style={styles.artworkCaption}>Dumping site image placeholder</Text>
            </View>
            <SiteRow name="Musgrave Rd" distance="0.8 km" />
            <SiteRow name="Sydenham Rd" distance="1.4 km" />
          </View>

          <Text style={styles.sectionTitle}>Active Campaigns</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.campaignTitle}>Musgrave Rd Cleanup</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.campaignMeta}>
              <Text style={styles.metaText}>R6,500 of R10,000</Text>
              <Text style={styles.metaText}>65%</Text>
            </View>
            <View style={styles.campaignActions}>
              <Pressable style={[styles.campaignButton, styles.primaryButton]} onPress={() => {router.push('/previewcampaign')}}>
                <Text style={styles.primaryButtonText}>Contribute</Text>
              </Pressable>
              <Pressable style={[styles.campaignButton, styles.shareButton]} onPress={() => {}}>
                <Text style={styles.secondaryButtonText}>Share</Text>
              </Pressable>
            </View>
          </View>
          <Advertisement />
          <View style={styles.sectionCard}>
            <Text style={styles.campaignTitle}>Musgrave Rd Cleanup</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.campaignMeta}>
              <Text style={styles.metaText}>R6,500 of R10,000</Text>
              <Text style={styles.metaText}>65%</Text>
            </View>
            <View style={styles.campaignActions}>
              <Pressable style={[styles.campaignButton, styles.primaryButton]} onPress={() => {}}>
                <Text style={styles.primaryButtonText}>Contribute</Text>
              </Pressable>
              <Pressable style={[styles.campaignButton, styles.shareButton]} onPress={() => {}}>
                <Text style={styles.secondaryButtonText}>Share</Text>
              </Pressable>
            </View>
          </View>
          <Advertisement />
          <View style={styles.sectionCard}>
            <Text style={styles.campaignTitle}>Musgrave Rd Cleanup</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <View style={styles.campaignMeta}>
              <Text style={styles.metaText}>R6,500 of R10,000</Text>
              <Text style={styles.metaText}>65%</Text>
            </View>
            <View style={styles.campaignActions}>
              <Pressable style={[styles.campaignButton, styles.primaryButton]} onPress={() => {}}>
                <Text style={styles.primaryButtonText}>Contribute</Text>
              </Pressable>
              <Pressable style={[styles.campaignButton, styles.shareButton]} onPress={() => {}}>
                <Text style={styles.secondaryButtonText}>Share</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
            <Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home">
                <FontAwesomeIcon icon={faHome} size={20} color="#124A2A"/>
            </Pressable>
            <Pressable>
                <FontAwesomeIcon icon={faMap} size={20} color="#124A2A"/>
            </Pressable>
          <Pressable style={styles.addButton} onPress={() => {}}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
          <Pressable>
            <FontAwesomeIcon icon={faBell} size={20} color="#124A2A"/>
          </Pressable>
          <Pressable>
            <FontAwesomeIcon icon={faUser} size={20} color="#124A2A"/>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SiteRow({ name, distance }: { name: string; distance: string }): JSX.Element {
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
        <View style={styles.advertisementLogo}>
          <Text style={styles.advertisementLogoText}>CM</Text>
        </View>
        <Text style={styles.advertisementBrandName}>CleanMyStreetZA</Text>
      </View>
      <Text style={styles.advertisementTitle}>Advertise Here</Text>
      <Text style={styles.advertisementEmail}>Email: Ads@cleanmystreet.com</Text>
    </View>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }): JSX.Element {
  return (
    <Pressable style={styles.navItem} onPress={() => {}}>
      <Text style={[styles.navIcon, active && styles.activeNavText]}>{icon}</Text>
      <Text style={[styles.navLabel, active && styles.activeNavText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 24 },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backIcon: { color: '#17201A', fontSize: 32, lineHeight: 32, marginRight: 8 },
  logoMark: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
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
  advertisementCard: { backgroundColor: '#F1F1F1', borderRadius: 9, padding: 12, marginBottom: 18, minHeight: 96 },
  advertisementBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  advertisementLogo: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center' },
  advertisementLogoText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
  advertisementBrandName: { color: '#17201A', fontSize: 10, marginLeft: 6 },
  advertisementTitle: { color: '#17201A', fontSize: 13, marginBottom: 4 },
  advertisementEmail: { color: '#17201A', fontSize: 11 },
  artworkPlaceholder: { height: 128, borderRadius: 6, backgroundColor: '#B7C6B9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  artworkPin: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  artworkPinText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  artworkTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  artworkCaption: { color: '#EEF5EE', fontSize: 10, marginTop: 3 },
  siteRow: { backgroundColor: '#FFFFFF', borderRadius: 6, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  siteName: { color: '#17201A', fontSize: 11 },
  siteDistance: { color: '#17201A', fontSize: 11 },
  campaignTitle: { color: '#17201A', fontSize: 12, marginBottom: 10 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: '#D5D8D5', overflow: 'hidden' },
  progressFill: { width: '65%', height: '100%', backgroundColor: '#36B86B', borderRadius: 3 },
  campaignMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  metaText: { color: '#17201A', fontSize: 10 },
  campaignActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  campaignButton: { flex: 1, minHeight: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  shareButton: { backgroundColor: '#FFFFFF' },
  bottomNav: { minHeight: 68, borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
  navItem: { minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: '#68706A', fontSize: 8, fontWeight: '800', marginBottom: 5 },
  navLabel: { color: '#68706A', fontSize: 9 },
  activeNavText: { color: '#1F9A55' },
  addButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#68706A', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#17201A', fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
