import { JSX } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faArrowLeft, 
  faBell, 
  faCamera, 
  faClock, 
  faBookmark, 
  faCreditCard, 
  faCog, 
  faShieldAlt, 
  faSignOutAlt, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';

export default function Profile(): JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" />
          </TouchableOpacity>
          <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesomeIcon icon={faBell} size={20} color="#1A202C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80'}} 
              style={styles.avatarImage} 
            />
            <TouchableOpacity style={styles.cameraBadge}>
              <FontAwesomeIcon icon={faCamera} size={10} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Mikasi inc</Text>
            <Text style={styles.profileEmail}>mikasi@gmail.com</Text>
          </View>

          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={faClock} title="My Activity" />
            <View style={styles.divider} />
            <MenuItem icon={faBookmark} title="Saved Items" />
            <View style={styles.divider} />
            <MenuItem icon={faCreditCard} title="Payment Methods" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={faCog} title="Settings" />
            <View style={styles.divider} />
            <MenuItem icon={faShieldAlt} title="Privacy & Security" />
            <View style={styles.divider} />
            <MenuItem icon={faSignOutAlt} title="Log out" onPress={() => router.push('/')} hideChevron />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, title, onPress, hideChevron = false }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <FontAwesomeIcon icon={icon} size={16} color="#1A202C" />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      {!hideChevron && <FontAwesomeIcon icon={faChevronRight} size={14} color="#A0AEC0" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#F7FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
  },
  headerLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginRight: 10,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: '#1a202c',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#38A169',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#38A169',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7FAFC',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#718096',
  },
  editButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A202C',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
    marginLeft: 5,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 67,
  },
});
