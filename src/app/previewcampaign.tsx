import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function PreviewCampaign(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{marginRight:15}}><FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" /></TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={{width:32,height:32,marginRight:10}} />
        <Text style={{fontSize:18,fontWeight:'500'}}>CleanMyStreetZA</Text>
      </View>
      <ScrollView contentContainerStyle={{paddingBottom:40}}>
        <View style={styles.hero}>
          <Image source={require('../../assets/dumping_site.png')} style={styles.heroImg} />
          <View style={styles.beforeTag}><Text style={{color:'#fff', fontWeight:'bold'}}>Before</Text></View>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Musgrave Rd Cleanup Campaign</Text>
          <View style={styles.statusPill}><Text style={{color:'#fff', fontSize:12, fontWeight:'600'}}>Funding Open</Text></View>
          <Text style={styles.desc}>This site has been verified. We are raising funds to dispatch the GreenSweep Crew.</Text>
          <TouchableOpacity style={styles.btnGreen} onPress={() => router.push('/viewcampaign')}>
            <Text style={styles.btnTextWhite}>Contribute</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Updates</Text>
          <Text style={styles.desc}>Aug 1 - Campaign created.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  hero: { height: 200, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  beforeTag: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  content: { padding: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  statusPill: { backgroundColor: '#38A169', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 15 },
  desc: { fontSize: 14, color: '#4A5568', marginBottom: 20, lineHeight: 20 },
  btnGreen: { backgroundColor: '#38A169', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 25 },
  btnTextWhite: { color: '#fff', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 }
});
