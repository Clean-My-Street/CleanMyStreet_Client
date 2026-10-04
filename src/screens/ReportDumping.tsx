import { faBell, faHome, faNewspaper, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { JSX, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

export default function ReportDumping(): JSX.Element {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          'Camera Permission',
          'Camera permission is required to take a photo of the dumping site.'
        );
        return;
      }
    }

    setCameraOpen(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER */}
          <View style={styles.header}>
            
            <Pressable onPress={() => router.back()}>
                         <Text style={styles.backIcon}>‹</Text>
            </Pressable> 
            <View style={styles.logoMark}>
              <Image source={require('../../assets/images/cleanmystreet.png')} style={styles.logo} />
            </View>

            <Text style={styles.brandName}>
              Report a Dumping Site
            </Text>
          </View>

          {/* INTRODUCTION */}
          <View style={styles.introduction}>
            <Text style={styles.heading}>
              Tell us what you found
            </Text>

            <Text style={styles.description}>
              Your report helps us verify and fund cleanup
            </Text>
          </View>

          {/* UPLOAD IMAGE */}
          <Text style={styles.uploadTitle}>
            Upload an Image
          </Text>

          {/* IMAGE / CAMERA AREA */}
          <View style={styles.imageBox}>

            {cameraOpen ? (
              <View style={styles.cameraContainer}>
                <CameraView style={styles.camera} />

                <Pressable
                  style={styles.closeCameraButton}
                  onPress={() => setCameraOpen(false)}
                >
                  <Text style={styles.closeCameraText}>
                    Close Camera
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.cameraButton}
                onPress={openCamera}
              >
                <Svg width={150} height={140} viewBox="0 0 150 140" accessibilityLabel="Camera">
                  <Path d="M20 48c0-8 6-14 14-14h13l13-18h45l13 18h13c8 0 14 6 14 14v62c0 8-6 14-14 14H34c-8 0-14-6-14-14V48Z" fill="none" stroke="#929292" strokeWidth={1.2} />
                  <Circle cx={75} cy={77} r={29} fill="none" stroke="#929292" strokeWidth={1.2} />
                </Svg>
              </Pressable>
            )}

          </View>

          <Pressable
            style={styles.nextButton}
            onPress={() => router.push('/location')}
          >
            <Text style={styles.nextButtonText}>
              Next
            </Text>
          </Pressable>

          {/* INFORMATION */}
          <Text style={styles.notificationText}>
            You'll be notified as your report is reviewed and cleanup
            campaigns is created
          </Text>

        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home">
            <FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
          </Pressable>
          <Pressable  onPress={()=> router.push('/news')} accessibilityLabel="View News" >
            <FontAwesomeIcon icon={faNewspaper} size={20} color="#124A2A" />
          </Pressable>

          <Pressable style={styles.addButton} onPress={() => { }}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
          <Pressable>
            <FontAwesomeIcon icon={faBell} size={20} color="#124A2A" />
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} accessibilityLabel="View profile">
            <FontAwesomeIcon icon={faUser} size={20} color="#124A2A" />
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  /* SCREEN */
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: { flexGrow: 1, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },

  /* HEADER */
  header: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  backIcon: {
    color: '#17201A',
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },

  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 16,
    backgroundColor: '#1F7A3F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: { width: 52,
    height: 52, 
    resizeMode: 'contain' 
  },

  brandName: {
    color: '#17201A',
    fontSize: 9,
    fontWeight: '500',
    marginLeft: 6,
  },

  /* INTRODUCTION */
  introduction: {
    marginBottom: 6,
  },

  heading: {
    color: '#17201A',
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 2,
  },

  description: {
    color: '#68706A',
    fontSize: 8,
  },

  /* UPLOAD */
  uploadTitle: {
    color: '#17201A',
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 5,
  },

  /* IMAGE BOX */
  imageBox: {
    width: '100%',
    height: undefined,
    aspectRatio: 0.94,
    backgroundColor: '#D9D9D9',
    borderRadius: 7,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },

  cameraButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraIcon: {
    color: '#17201A',
    fontSize: 48,
    marginBottom: 8,
  },

  cameraText: {
    color: '#17201A',
    fontSize: 13,
    fontWeight: '600',
  },

  /* CAMERA */
  cameraContainer: {
    width: '100%',
    height: '100%',
  },

  camera: {
    width: '100%',
    height: '100%',
  },

  closeCameraButton: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    backgroundColor: '#17201A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 7,
  },

  closeCameraText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* NEXT BUTTON */
  nextButton: {
    width: '100%',
    height: 36,
    backgroundColor: '#94D9AE',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '400',
  },

  /* NOTIFICATION */
  notificationText: {
    color: '#68706A',
    fontSize: 7,
    lineHeight: 10,
    textAlign: 'left',
    paddingHorizontal: 0,
  },

  /* BOTTOM NAVIGATION */
  bottomNav: {
    minHeight: 51,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  navItem: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIcon: {
    color: '#68706A',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 5,
  },

  navLabel: {
    color: '#68706A',
    fontSize: 9,
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#68706A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#17201A',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },

});
