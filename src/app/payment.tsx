import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Payment(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{marginRight:15}}><FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" /></TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={{width:32,height:32,marginRight:10}} />
        <Text style={{fontSize:18,fontWeight:'500'}}>Payment</Text>
      </View>
      <View style={styles.content}>
        <TextInput style={styles.input} placeholder="Amount:" placeholderTextColor="#fff" />
        <TouchableOpacity style={styles.payBtn} onPress={() => router.push('/payment-success')}>
          <Text style={styles.payText}>Pay Now:</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  content: { padding: 40, flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  input: { width: '100%', backgroundColor: '#38A169', color: '#fff', borderRadius: 8, paddingVertical: 15, paddingHorizontal: 20, fontSize: 16 },
  payBtn: { width: '100%', backgroundColor: '#38A169', borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  payText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
