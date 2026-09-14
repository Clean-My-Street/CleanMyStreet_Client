import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function MapSites(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{marginRight:15}}><FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" /></TouchableOpacity>
        <Text style={{fontSize:18,fontWeight:'500'}}>Map & Nearby Sites</Text>
      </View>
      <View style={styles.mapContainer}>
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110620.25413349247!2d30.932464!3d-29.816654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ef7aa0001bc61b7%3A0x5c36fc247a32b26c!2sDurban!5e0!3m2!1sen!2sza!4v1700000000000" width="100%" height="100%" style={{border:0}} />
      </View>
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>3 sites nearby</Text>
        <ScrollView contentContainerStyle={{gap:10}} showsVerticalScrollIndicator={false}>
          <SiteCard name="Musgrave Rd near Botanic Gardens" distance="0.8 km" status="Pending" />
          <SiteCard name="Sydenham Rd near garage" distance="1.4 km" status="Pending" />
          <SiteCard name="Park rd near hospital" distance="2.1 km" status="Pending" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SiteCard({name, distance, status}:any) {
  return (
    <View style={styles.card}>
      <Image source={{uri: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100'}} style={styles.cardImg} />
      <View style={{flex:1}}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.cardDist}>{distance}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  mapContainer: { flex: 1, backgroundColor: '#E2E8F0' },
  bottomSheet: { backgroundColor: '#278B45', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '40%', marginTop: -20 },
  sheetTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 15 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center' },
  cardImg: { width: 50, height: 50, borderRadius: 6, marginRight: 10 },
  cardTitle: { fontSize: 13, fontWeight: '500', color: '#1A202C' },
  cardDist: { fontSize: 11, color: '#718096', marginTop: 4 }
});
