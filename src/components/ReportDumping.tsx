import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { JSX, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportDumping(): JSX.Element {
  const router=useRouter();
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
            <Text style={styles.backIcon}>‹</Text>

            <View style={styles.logoMark}>
              <Text style={styles.logoText}>CM</Text>
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
                <Text style={styles.cameraIcon}>⌾</Text>

                <Text style={styles.cameraText}>
                  Open Camera
                </Text>
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

          <NavItem
            icon="HOME"
            label="Home"
          />

          <NavItem
            icon="SITES"
            label="Sites"
          />

          <Pressable
            style={styles.addButton}
            onPress={() => {}}
          >
            <Text style={styles.addButtonText}>
              +
            </Text>
          </Pressable>

          <NavItem
            icon="ALERT"
            label="Alerts"
          />

          <NavItem
            icon="YOU"
            label="Profile"
          />

        </View>

      </View>
    </SafeAreaView>
  );
}

/* NAVIGATION ITEM */
function NavItem({
  icon,
  label,
}: {
  icon: string;
  label: string;
}): JSX.Element {
  return (
    <Pressable
      style={styles.navItem}
      onPress={() => {}}
    >
      <Text style={styles.navIcon}>
        {icon}
      </Text>

      <Text style={styles.navLabel}>
        {label}
      </Text>
    </Pressable>
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

  content: {
    padding: 16,
    paddingBottom: 100,
  },

  /* HEADER */
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  backIcon: {
    color: '#17201A',
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },

  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1F7A3F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  brandName: {
    color: '#17201A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 9,
  },

  /* INTRODUCTION */
  introduction: {
    marginBottom: 28,
  },

  heading: {
    color: '#17201A',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 7,
  },

  description: {
    color: '#68706A',
    fontSize: 12,
  },

  /* UPLOAD */
  uploadTitle: {
    color: '#17201A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },

  /* IMAGE BOX */
  imageBox: {
    width: '100%',
    height: 330,
    backgroundColor: '#E5E5E5',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    height: 45,
    backgroundColor: '#1F7A3F',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* NOTIFICATION */
  notificationText: {
    color: '#68706A',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 15,
  },

  /* BOTTOM NAVIGATION */
  bottomNav: {
    minHeight: 68,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
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