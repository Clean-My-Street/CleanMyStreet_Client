import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCamera } from '@fortawesome/free-solid-svg-icons';

export default function ReportStep1(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{marginRight:15}}><FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" /></TouchableOpacity>
        <Image source={require('../../../assets/logo.png')} style={{width:32,height:32,marginRight:10}} />
        <Text style={{fontSize:18,fontWeight:'500'}}>Report a Dumping Site</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Tell us what you found</Text>
        <Text style={styles.subtitle}>Your report helps us verify and fund a cleanup.</Text>
        <Text style={styles.label}>Upload an image:</Text>
        <View style={styles.imageBox}>
          <FontAwesomeIcon icon={faCamera} size={40} color="#A0AEC0" />
        </View>
        <TouchableOpacity style={styles.nextButton} onPress={() => router.push('/report-details')}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  content: { paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  subtitle: { fontSize: 13, color: '#4A5568', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 10 },
  imageBox: { width: '100%', height: 300, backgroundColor: '#E2E8F0', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  nextButton: { backgroundColor: '#38A169', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
