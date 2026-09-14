import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function PaymentSuccess(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{marginRight:15}}><FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" /></TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={{width:32,height:32,marginRight:10}} />
        <Text style={{fontSize:18,fontWeight:'500'}}>Payment</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.successPill}>
          <Text style={styles.successText}>Payment Success</Text>
          <FontAwesomeIcon icon={faCheckCircle} color="#38A169" style={{marginLeft:10}} />
        </View>
        <View style={styles.thankYouBox}>
          <Text style={styles.thankYouText}>Thank you for contributing!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  content: { padding: 40, flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  successPill: { width: '100%', backgroundColor: '#E6F4EA', borderColor: '#38A169', borderWidth: 1, borderRadius: 8, paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  successText: { color: '#38A169', fontSize: 16, fontWeight: '500' },
  thankYouBox: { width: '100%', backgroundColor: '#38A169', borderRadius: 8, paddingVertical: 40, alignItems: 'center' },
  thankYouText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});
