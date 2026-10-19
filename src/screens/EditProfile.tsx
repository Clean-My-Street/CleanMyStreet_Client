import { faCamera, faComments, faEnvelope, faHome, faNewspaper, faPhone, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { updateEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../services/firebase';

export default function EditProfile() {
  const router = useRouter();
  const user = auth.currentUser;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState('image/jpeg');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setLoadingProfile(false);
        Alert.alert('Not signed in', 'Please sign in to edit your profile.');
        router.replace('/');
        return;
      }

      try {
        const profileRef = doc(db, 'users', user.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!active) return;

        if (profileSnapshot.exists()) {
  // Get the user's saved profile data from Firestore.
  const profileData = profileSnapshot.data();

  // Load the user's full name.
  if (profileData.fullName) {
    setFullName(profileData.fullName);
  } else if (user.displayName) {
    setFullName(user.displayName);
  } else {
    setFullName('');
  }

  // Load the user's phone number.
  if (profileData.phoneNumber) {
    setPhoneNumber(profileData.phoneNumber);
  } else {
    setPhoneNumber('');
  }

  // Load the user's bio.
  if (profileData.bio) {
    setBio(profileData.bio);
  } else {
    setBio('');
  }

  // Load the user's email address.
  if (profileData.email) {
    setEmail(profileData.email);
  } else if (user.email) {
    setEmail(user.email);
  } else {
    setEmail('');
  }

  // Load the saved profile picture URL.
  if (profileData.profilePictureUrl) {
    setProfileImage(profileData.profilePictureUrl);
  } else {
    setProfileImage(null);
  }
} else {
  // No profile document exists yet.
  // Use the information available from Firebase Authentication.
  if (user.displayName) {
    setFullName(user.displayName);
  } else {
    setFullName('');
  }

  if (user.email) {
    setEmail(user.email);
  } else {
    setEmail('');
  }

  // These fields have not been saved yet.
  setPhoneNumber('');
  setBio('');
  setProfileImage(null);
}
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Could not load profile', 'Please check your connection and try again.');
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [user, router]);
const handleAddPhoto = async () => {
  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo-library access to choose a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setProfileImage(asset.uri);

      // Keep the local URI so Save Changes can upload it.
      setSelectedImageUri(asset.uri);
      setSelectedImageMimeType(asset.mimeType ?? 'image/jpeg');
    }
  } catch (error) {
    console.error('Error selecting profile picture:', error);
    Alert.alert('Photo selection failed', 'Please try choosing the picture again.');
  }
};

const handleSave = async () => {
  console.log("1. Save button pressed");

  if (!user) {
    console.error("STOP: No signed-in user found.");
    Alert.alert(
      "Not signed in",
      "Please sign in again before saving your profile."
    );
    return;
  }

  console.log("2. Signed-in UID:", user.uid);

  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    Alert.alert("Name required", "Please enter your name.");
    return;
  }

  if (!trimmedEmail) {
    Alert.alert("Email required", "Please enter your email address.");
    return;
  }

  setSaving(true);

  try {
    console.log("3. Updating authentication details if needed");

    if (trimmedEmail !== (user.email ?? "").toLowerCase()) {
      await updateEmail(user, trimmedEmail);
    }

    if (trimmedName !== (user.displayName ?? "")) {
      await updateProfile(user, { displayName: trimmedName });
    }

    console.log("4. Authentication update completed");

   const profileRef = doc(db, 'users', user.uid);

console.log('Reading existing profile:', user.uid);

const existing = await getDoc(profileRef);
const existingData = existing.exists() ? existing.data() : {};

// Keep the existing URL unless the user selected a new image.
let profilePictureUrl: string | null =
  existingData.profilePictureUrl ?? null;

if (selectedImageUri) {
  console.log('Uploading profile picture to Firebase Storage...');

  // Read the selected local image.
  const response = await fetch(selectedImageUri);

  if (!response.ok) {
    throw new Error('Could not read the selected image.');
  }

  const imageBlob = await response.blob();

  // Use a consistent Storage path for this user's profile picture.
  const imageRef = ref(
    storage,
    `users/${user.uid}/profilePicture`
  );

  // Upload the image and its content type.
  await uploadBytes(imageRef, imageBlob, {
    contentType: selectedImageMimeType,
  });

  // Get the URL that will be saved in Firestore.
  profilePictureUrl = await getDownloadURL(imageRef);

  console.log('Profile picture uploaded successfully.');
  console.log('Download URL obtained.');
}

await setDoc(
  profileRef,
  {
    uid: user.uid,
    fullName: trimmedName,
    email: trimmedEmail,
    phoneNumber: phoneNumber.trim(),
    bio: bio.trim(),
    profilePictureUrl,
    createdAt: existingData.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

console.log('Profile details and picture URL saved to Firestore.');

    console.log("7. Firestore save completed successfully");
    const savedDoc = await getDoc(profileRef);

    console.log(
      '8. SAVED FIRESTORE DATA:',
      savedDoc.exists() ? savedDoc.data() : 'DOCUMENT NOT FOUND'
    );


    Alert.alert(
      "Profile saved",
      "Your profile details have been updated.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  } catch (error: any) {
    console.error("SAVE FAILED:", error);
    console.error("Firebase error code:", error?.code);
    console.error("Firebase error message:", error?.message);

    if (error?.code === "auth/requires-recent-login") {
      Alert.alert(
        "Please sign in again",
        "For security, sign out and sign in again before changing your email address."
      );
    } else if (error?.code === "auth/invalid-email") {
      Alert.alert("Invalid email", "Please enter a valid email address.");
    } else {
      Alert.alert(
        "Save failed",
        error?.message ?? "Could not save your profile. Please try again."
      );
    }
  } finally {
    setSaving(false);
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back">
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.logoMark}>
            <Image source={require('../../assets/images/cleanmystreet.png')} style={styles.logo} />
          </View>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainBox}>
            <View style={styles.profilePictureSection}>
              <Pressable style={styles.profilePicture} onPress={handleAddPhoto} accessibilityLabel="Add profile picture">
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <FontAwesomeIcon icon={faUser} size={38} color="#68706A" />
                )}
                <View style={styles.cameraButton}>
                  <FontAwesomeIcon icon={faCamera} size={12} color="#FFFFFF" />
                </View>
              </Pressable>
              <Pressable onPress={handleAddPhoto}>
                <Text style={styles.addPhotoText}>Add Profile Picture</Text>
              </Pressable>
              <Text style={styles.photoNote}></Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your name" placeholderTextColor="#999999" autoCapitalize="words" />
                <FontAwesomeIcon icon={faUser} size={16} color="#17201A" />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Number</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter contact number" placeholderTextColor="#999999" keyboardType="phone-pad" />
                <FontAwesomeIcon icon={faPhone} size={16} color="#17201A" />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Bio</Text>
              <View style={styles.bioContainer}>
                <TextInput style={styles.bioInput} value={bio} onChangeText={setBio} placeholder="Tell us a little about yourself" placeholderTextColor="#999999" multiline textAlignVertical="top" maxLength={250} />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email" placeholderTextColor="#999999" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                <FontAwesomeIcon icon={faEnvelope} size={16} color="#17201A" />
              </View>
            </View>

            <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving || loadingProfile}>
              <Text style={styles.saveButtonText}>{loadingProfile ? 'Loading Profile...' : saving ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home"><FontAwesomeIcon icon={faHome} size={20} color="#124A2A" /></Pressable>
          <Pressable onPress={() => router.push('/news')} accessibilityLabel="View News"><FontAwesomeIcon icon={faNewspaper} size={20} color="#124A2A" /></Pressable>
          <Pressable style={styles.addButton} onPress={() => router.push('/reportdumping')} accessibilityLabel="Report a dumping site"><Text style={styles.addButtonText}>+</Text></Pressable>
          <Pressable onPress={() => router.push('/community')} accessibilityLabel="Open community messages"><FontAwesomeIcon icon={faComments} size={20} color="#124A2A" /></Pressable>
          <Pressable onPress={() => router.push('/profile')} accessibilityLabel="View profile"><FontAwesomeIcon icon={faUser} size={20} color="#124A2A" /></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  logoMark: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center', marginLeft: 13 },
  logo: { width: 25, height: 25, resizeMode: 'contain' },
  backIcon: { color: '#17201A', fontSize: 32, lineHeight: 32, marginRight: 8 },
  headerTitle: { color: '#17201A', fontSize: 12, marginLeft: 7 },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, paddingBottom: 30 },
  mainBox: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E5E7E5', paddingHorizontal: 20, paddingVertical: 24, shadowColor: '#17201A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  profilePictureSection: { alignItems: 'center', marginBottom: 25 },
  profilePicture: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#D8E9DC', borderWidth: 2, borderColor: '#36B86B', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' },
  profileImage: { width: '100%', height: '100%', borderRadius: 50 },
  cameraButton: { position: 'absolute', right: 0, bottom: 3, width: 30, height: 30, borderRadius: 15, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  addPhotoText: { marginTop: 9, color: '#1F9A55', fontSize: 11, fontWeight: '600' },
  photoNote: { marginTop: 5, color: '#68706A', fontSize: 10, textAlign: 'center' },
  fieldContainer: { width: '100%', marginBottom: 18 },
  label: { color: '#17201A', fontSize: 12, fontWeight: '600', marginBottom: 7 },
  inputContainer: { width: '100%', minHeight: 48, backgroundColor: '#F1F2F1', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, color: '#17201A', fontSize: 12, marginRight: 10, paddingVertical: 12 },
  bioContainer: { width: '100%', height: 100, backgroundColor: '#F1F2F1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  bioInput: { flex: 1, color: '#17201A', fontSize: 12 },
  saveButton: { width: '100%', height: 48, borderRadius: 10, backgroundColor: '#36B86B', alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  bottomNav: { minHeight: 68, borderTopWidth: 1, borderTopColor: '#E8E8E8', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10 },
  addButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#68706A', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#17201A', fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
