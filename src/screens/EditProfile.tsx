import {
  faCamera,
  faComments,
  faEnvelope,
  faHome,
  faNewspaper,
  faPhone,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { JSX, useState } from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfile(): JSX.Element {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();
const handleAddPhoto = async () => {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    alert('Permission to access your photos is required.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled) {
    setProfileImage(result.assets[0].uri);
  }
};
  const handleSave = () => {
    //To be connnected on the backend
    console.log('Save profile');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            
          >
          <Text style={styles.backIcon}>‹</Text>
          </Pressable>

                  
          <View style={styles.logoMark}>
               <Image source={require('../../assets/images/cleanmystreet.png')} style={styles.logo} />
          </View>

          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Centered Main Box */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.mainBox}>

            {/* Profile Picture */}
            <View style={styles.profilePictureSection}>

              <Pressable
  style={styles.profilePicture}
  onPress={handleAddPhoto}
  accessibilityLabel="Add profile picture"
>
  {profileImage ? (
    <Image
      source={{ uri: profileImage }}
      style={styles.profileImage}
    />
  ) : (
    <FontAwesomeIcon
      icon={faUser}
      size={38}
      color="#68706A"
    />
  )}

  <View style={styles.cameraButton}>
    <FontAwesomeIcon
      icon={faCamera}
      size={12}
      color="#FFFFFF"
    />
  </View>
</Pressable>
                  
              <Pressable onPress={handleAddPhoto}>
                <Text style={styles.addPhotoText}>
                  Add Profile Picture
                </Text>
              </Pressable>

            </View>

            {/* Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Name</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter crew name"
                  placeholderTextColor="#999999"
                />

                <FontAwesomeIcon
                  icon={faUser}
                  size={16}
                  color="#17201A"
                />
              </View>
            </View>

            {/* Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Number</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact number"
                  placeholderTextColor="#999999"
                  keyboardType="phone-pad"
                />

                <FontAwesomeIcon
                  icon={faPhone}
                  size={16}
                  color="#17201A"
                />
              </View>
            </View>

            {/* Bio */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Bio</Text>

              <View style={styles.bioContainer}>
                <TextInput
                  style={styles.bioInput}
                  placeholder=" "
                  placeholderTextColor="#999999"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email Address</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999999"
                  keyboardType="email-address"
                  autoCapitalize="none" 
                />

                <FontAwesomeIcon
                  icon={faEnvelope}
                  size={16}
                  color="#17201A"
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            </Pressable>

          </View>
        </ScrollView>

        {/* Bottom Navigation */}
              <View style={styles.bottomNav}>
                    <Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home">
                        <FontAwesomeIcon icon={faHome} size={20} color="#124A2A"/>
                    </Pressable>
                   <Pressable  onPress={()=> router.push('/news')} accessibilityLabel="View News" ><view> <FontAwesomeIcon icon={faNewspaper} size={20} color="#124A2A" /> </view></Pressable>
        
        
                  <Pressable style={styles.addButton} onPress={() => router.push('/reportdumping')}>
                    <Text style={styles.addButtonText}>+</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push('/community')} accessibilityLabel="Open community messages">
                    <FontAwesomeIcon icon={faComments} size={20} color="#124A2A"/>
                  </Pressable>
                  <Pressable onPress={() => router.push('/profile')} accessibilityLabel="View profile">
                    <FontAwesomeIcon icon={faUser} size={20} color="#124A2A"/>
                  </Pressable>
                </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Header */
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  logoMark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#36B86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 13,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  logo: { width: 25,
   height: 25, 
    resizeMode: 'contain' 
  },

    backIcon: {
    color: '#17201A',
    fontSize: 32,
    lineHeight: 32,
    marginRight: 8,
  },
  headerTitle: {
    color: '#17201A',
    fontSize: 12,
    marginLeft: 7,
  },

  /* Scroll */
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    paddingBottom: 30,
  },

  /* Main centered box */
  mainBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7E5',
    paddingHorizontal: 20,
    paddingVertical: 24,

    shadowColor: '#17201A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  /* Profile Picture */
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 25,
  },

  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D8E9DC',
    borderWidth: 2,
    borderColor: '#36B86B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
   profileImage: {
   width: '100%',
   height: '100%',
   borderRadius: 50,
},
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 3,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#36B86B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  addPhotoText: {
    marginTop: 9,
    color: '#1F9A55',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Fields */
  fieldContainer: {
    width: '100%',
    marginBottom: 18,
  },

  label: {
    color: '#17201A',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
  },

  inputContainer: {
    width: '100%',
    height: 48,
    backgroundColor: '#F1F2F1',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    color: '#17201A',
    fontSize: 12,
    marginRight: 10,
  },

  /* Bio */
  bioContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F1F2F1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  bioInput: {
    flex: 1,
    color: '#17201A',
    fontSize: 12,
  },

  /* Save */
  saveButton: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: '#36B86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Bottom navigation */
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
