import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCamera } from '@fortawesome/free-solid-svg-icons';

export default function ViewCampaign(): JSX.Element {
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
          <View style={styles.progressBox}>
            <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:5}}>
              <Text style={styles.meta}>R6,500 of R10,000</Text>
              <Text style={styles.meta}>65%</Text>
            </View>
          </View>
          <TextInput style={styles.amountInput} placeholder="Choose an amount" />
          <TouchableOpacity style={styles.btnGreen} onPress={() => router.push('/payment')}>
            <Text style={styles.btnTextWhite}>Contribute</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Share this campaign</Text>
          <View style={{flexDirection:'row', gap:10}}>
            <TouchableOpacity style={styles.btnOutline}><Text style={styles.btnTextBlack}>WhatsApp</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline}><Text style={styles.btnTextBlack}>Copy Link</Text></TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Recent Contributors</Text>
          <View style={{gap:10}}>
            <Text style={styles.contributor}>James N. contributed R250</Text>
            <Text style={styles.contributor}>Sarah T. contributed R100</Text>
          </View>
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
  title: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  progressBox: { marginBottom: 20 },
  progressTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { width: '65%', height: '100%', backgroundColor: '#38A169' },
  meta: { fontSize: 12, color: '#4A5568' },
  amountInput: { borderWidth: 1, borderColor: '#E2E8F0', padding: 15, borderRadius: 8, marginBottom: 15, backgroundColor: '#F7FAFC' },
  btnGreen: { backgroundColor: '#38A169', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 25 },
  btnTextWhite: { color: '#fff', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  btnOutline: { flex: 1, borderWidth: 1, borderColor: '#CBD5E0', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnTextBlack: { color: '#1A202C', fontWeight: '500' },
  contributor: { fontSize: 13, color: '#4A5568' }
});
