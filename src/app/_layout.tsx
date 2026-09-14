import { Stack } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';

export default function RootLayout() {
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.phoneFrame}>
          <View style={styles.notch} />
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  phoneFrame: {
    width: 390,
    height: 844,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 12,
    borderColor: '#111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    marginVertical: 20,
  },
  notch: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 120,
    height: 35,
    backgroundColor: '#000',
    borderRadius: 20,
    zIndex: 999,
  }
});