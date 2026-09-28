import { faBell, faHome, faMap, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { JSX, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Location(): JSX.Element {
  const router = useRouter();
  const [wasteType, setWasteType] = useState('Illegal Dumping');

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

          {/* LOCATION */}
          <Text style={styles.sectionTitle}>
            Location (GPS)
          </Text>

          {/* MAP PLACEHOLDER */}
          <View style={styles.mapBox}>
            <Text style={styles.mapIcon}>⌖</Text>
            <Text style={styles.mapText}>
              Map
            </Text>
            <Text style={styles.mapSubText}>
              Live location will appear here
            </Text>
          </View>

          {/* DESCRIPTION */}
          <Text style={styles.sectionTitle}>
            Description
          </Text>

          <TextInput
            style={styles.descriptionBox}
            placeholder="Describe the size of the dumping site, type of waste and any hazards"
            placeholderTextColor="#7A817C"
            multiline
            textAlignVertical="top"
          />

          {/* WASTE TYPE */}
          <Text style={styles.sectionTitle}>
            Waste Type
          </Text>

          <View style={styles.wasteTypeContainer}>

            <Pressable
              style={[
                styles.wasteOption,
                wasteType === 'Household' && styles.selectedWaste,
              ]}
              onPress={() => setWasteType('Household')}
            >
              <Text
                style={[
                  styles.wasteText,
                  wasteType === 'Household' && styles.selectedWasteText,
                ]}
              >
                Household
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.wasteOption,
                wasteType === 'Construction' && styles.selectedWaste,
              ]}
              onPress={() => setWasteType('Construction')}
            >
              <Text
                style={[
                  styles.wasteText,
                  wasteType === 'Construction' && styles.selectedWasteText,
                ]}
              >
                Construction
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.wasteOption,
                wasteType === 'Illegal Dumping' && styles.selectedWaste,
              ]}
              onPress={() => router.push('/previewcampaign')}
            >
              <Text
                style={[
                  styles.wasteText,
                  wasteType === 'Illegal Dumping' &&
                  styles.selectedWasteText,
                ]}
              >
                Illegal Dumping
              </Text>
            </Pressable>

          </View>

          {/* SUBMIT BUTTON */}
          <Pressable
            style={styles.submitButton}
            onPress={() => router.push('/sites')}
          >
            <Text style={styles.submitButtonText}>
              Submit Report
            </Text>
          </Pressable>

          {/* NOTIFICATION */}
          <Text style={styles.notificationText}>
            You'll be notified as your report is reviewed and cleanup
            campaign created
          </Text>

        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <Pressable onPress={() => router.push('/home')} accessibilityLabel="Go to Home">
            <FontAwesomeIcon icon={faHome} size={20} color="#124A2A" />
          </Pressable>
          <Pressable>
            <FontAwesomeIcon icon={faMap} size={20} color="#124A2A" />
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

  /* SECTION TITLES */
  sectionTitle: {
    color: '#17201A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 5,
  },

  /* MAP */
  mapBox: {
    width: '100%',
    height: 240,
    backgroundColor: '#E5E5E5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  mapIcon: {
    color: '#1F7A3F',
    fontSize: 46,
    marginBottom: 6,
  },

  mapText: {
    color: '#17201A',
    fontSize: 15,
    fontWeight: '700',
  },

  mapSubText: {
    color: '#68706A',
    fontSize: 11,
    marginTop: 4,
  },

  /* DESCRIPTION */
  descriptionBox: {
    width: '100%',
    height: 170,
    backgroundColor: '#E5E5E5',
    borderRadius: 10,
    padding: 14,
    color: '#17201A',
    fontSize: 12,
    marginBottom: 24,
  },

  /* WASTE TYPE */
  wasteTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },

  wasteOption: {
    flex: 1,
    minHeight: 42,
    backgroundColor: '#E5E5E5',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  wasteText: {
    color: '#17201A',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  selectedWaste: {
    backgroundColor: '#1F7A3F',
  },

  selectedWasteText: {
    color: '#FFFFFF',
  },

  /* SUBMIT */
  submitButton: {
    width: '100%',
    height: 46,
    backgroundColor: '#1F7A3F',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  submitButtonText: {
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
    marginBottom: 10,
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