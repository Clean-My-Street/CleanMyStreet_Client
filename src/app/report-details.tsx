import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function ReportStep2(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{marginRight:15}}><FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" /></TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={{width:32,height:32,marginRight:10}} />
        <Text style={{fontSize:18,fontWeight:'500'}}>Report a Dumping Site</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tell us what you found</Text>
        <Text style={styles.subtitle}>Your report helps us verify and fund a cleanup.</Text>
        
        <Text style={styles.label}>Location (GPS):</Text>
        <View style={styles.mapContainer}>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110620.25413349247!2d30.932464!3d-29.816654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ef7aa0001bc61b7%3A0x5c36fc247a32b26c!2sDurban!5e0!3m2!1sen!2sza!4v1700000000000" width="100%" height="150" style={{border:0, borderRadius:8}} />
        </View>

        <Text style={styles.label}>Description:</Text>
        <TextInput style={styles.textArea} multiline placeholder="Describe the size of the dumping site, type of waste, and any hazards..." />

        <Text style={styles.label}>Waste Type:</Text>
        <View style={styles.pillContainer}>
          <Text style={styles.pillInactive}>Household</Text>
          <Text style={styles.pillInactive}>Construction</Text>
          <Text style={styles.pillActive}>Illegal Dumping</Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>It takes 48 hours for your report to be verified and a cleanup campaign to be started.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  subtitle: { fontSize: 13, color: '#4A5568', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 10, marginTop: 10 },
  mapContainer: { width: '100%', height: 150, backgroundColor: '#E2E8F0', borderRadius: 8, marginBottom: 10 },
  textArea: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top' },
  pillContainer: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  pillInactive: { backgroundColor: '#E2E8F0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, fontSize: 12, color: '#4A5568' },
  pillActive: { backgroundColor: '#38A169', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, fontSize: 12, color: '#fff' },
  submitButton: { backgroundColor: '#38A169', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footerText: { fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 15 }
});
