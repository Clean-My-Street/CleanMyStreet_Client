import { faBell, faHome, faNewspaper, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { router } from 'expo-router';
import { JSX } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PreviewCampaign(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Go back">
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
           
           
                       <View style={styles.logoMark}>
                         <Image source={require('../../assets/images/cleanmystreet.png')} style={styles.logo} />
                       </View>


            <Text style={styles.headerTitle}>Musgrave Road, near Botanic Gardens</Text>
          </View>

          <View style={styles.photoPlaceholder}>
            <View style={styles.photoSky} />
            <View style={styles.photoGround} />
            <View style={styles.photoPath} />
            <Text style={styles.photoLabel}>Campaign site photo placeholder</Text>
            <Pressable style={styles.viewCampaignButton} onPress={() => { router.push('/viewcampaign') }} accessibilityLabel="View Campaign">
              <Text style={styles.viewCampaignText}>View Campaign</Text>
              <Text style={styles.coordinates}>GPS: -29.8587° S, 31.0283° E</Text>
            </Pressable>
          </View>

          <View style={styles.details}>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Funding Open</Text>
            </View>

            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>
              Large illegal dumping site along Musgrave Road near the Botanic Gardens entrance. Mostly household waste and some garden refuse, roughly 15 square metres, spilling onto the pavement.
            </Text>

            <Text style={[styles.sectionLabel, styles.updatesHeading]}>Updates</Text>
            <Update text="Report verified by moderator" />
            <Update text="Cleanup campaign created" />
            <Update text="65% of funding goal reached" />
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
                    <Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home">
                        <FontAwesomeIcon icon={faHome} size={20} color="#124A2A"/>
                    </Pressable>
                  <Pressable  onPress={()=> router.push('/news')} accessibilityLabel="View News" ><view> <FontAwesomeIcon icon={faNewspaper} size={20} color="#124A2A" /> </view></Pressable>
                  <Pressable style={styles.addButton} onPress={() => {}}>
                    <Text style={styles.addButtonText}>+</Text>
                  </Pressable>
                  <Pressable>
                    <FontAwesomeIcon icon={faBell} size={20} color="#124A2A"/>
                  </Pressable>
                  <Pressable onPress={() => router.push('/profile')} accessibilityLabel="View profile">
                    <FontAwesomeIcon icon={faUser} size={20} color="#124A2A"/>
                  </Pressable>
                </View>
              </View>
    </SafeAreaView>
  );
}

function Update({ text }: { text: string }): JSX.Element {
  return (
    <View style={styles.updateRow}>
      <View style={styles.updateDot} />
      <Text style={styles.updateText}>{text}</Text>
    </View>
  );
}

function NavItem({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }): JSX.Element {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 20 },
  header: { height: 48, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  backIcon: { color: '#17201A', fontSize: 32, lineHeight: 32, marginRight: 6 },
  logoMark: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
   logo: { width: 52,
    height: 52, 
    resizeMode: 'contain' 
  },
  headerTitle: { flex: 1, color: '#17201A', fontSize: 10, marginLeft: 7 },
  photoPlaceholder: { height: 285, backgroundColor: '#7D927C', position: 'relative', overflow: 'hidden' },
  photoSky: { position: 'absolute', top: 0, left: 0, right: 0, height: 105, backgroundColor: '#A9B8A2' },
  photoGround: { position: 'absolute', left: -25, right: -25, bottom: -30, height: 220, backgroundColor: '#68705C', transform: [{ rotate: '-4deg' }] },
  photoPath: { position: 'absolute', width: 170, height: 340, right: -12, top: 80, backgroundColor: '#9A856A', transform: [{ rotate: '22deg' }] },
  photoLabel: { position: 'absolute', left: 14, bottom: 22, color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  viewCampaignButton: { position: 'absolute', top: 12, right: 8, width: 112, minHeight: 42, padding: 8, borderRadius: 7, backgroundColor: '#36B86B' },
  viewCampaignText: { color: '#17201A', fontSize: 11, fontWeight: '700' },
  coordinates: { color: '#17201A', fontSize: 7, marginTop: 3 },
  details: { paddingHorizontal: 14, paddingTop: 10 },
  statusPill: { alignSelf: 'flex-start', borderRadius: 10, backgroundColor: '#E1F5E9', paddingHorizontal: 9, paddingVertical: 5, marginBottom: 5 },
  statusText: { color: '#36A965', fontSize: 9 },
  sectionLabel: { color: '#17201A', fontSize: 10, marginTop: 2, marginBottom: 4 },
  description: { color: '#17201A', fontSize: 10, lineHeight: 15 },
  updatesHeading: { marginTop: 25 },
  updateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  updateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#36B86B', marginRight: 9 },
  updateText: { color: '#17201A', fontSize: 10 },
  bottomNav: { minHeight: 68, borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
  navItem: { minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  navIcon: { color: '#68706A', fontSize: 8, fontWeight: '800', marginBottom: 5 },
  navLabel: { color: '#68706A', fontSize: 9 },
  addButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#68706A', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#17201A', fontSize: 28, fontWeight: '300', lineHeight: 30 },
}); 