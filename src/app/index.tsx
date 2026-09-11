import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FirstPage } from '../components/FirstPage';

export default function HomeScreen() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <FirstPage />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 50,
    
  }
});
