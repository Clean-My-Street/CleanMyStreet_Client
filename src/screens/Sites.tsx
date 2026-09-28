import {
    faArrowLeft,
    faBell,
    faHome,
    faMap,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useRouter } from 'expo-router';
import { JSX, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ViewMode = 'Map' | 'List';

type Status =
  | 'Reported'
  | 'Funding'
  | 'Scheduled'
  | 'Cleaned';

type Site = {
  name: string;
  distance: string;
  status: Status;
};

const sites: Site[] = [
  {
    name: 'Musgrave Road',
    distance: '0.8 km from you',
    status: 'Funding',
  },
  {
    name: 'Botanic Gardens',
    distance: '1.2 km from you',
    status: 'Scheduled',
  },
  {
    name: 'Umbilo Road',
    distance: '2.1 km from you',
    status: 'Reported',
  },
  {
    name: 'Glenwood Park',
    distance: '2.8 km from you',
    status: 'Cleaned',
  },
  {
    name: 'Berea Road',
    distance: '3.4 km from you',
    status: 'Funding',
  },
];

const filters: Status[] = [
  'Reported',
  'Funding',
  'Scheduled',
  'Cleaned',
];

export default function Sites(): JSX.Element {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('Map');
  const [activeFilter, setActiveFilter] = useState<Status | 'All'>('All');

  const filteredSites =
    activeFilter === 'All'
      ? sites
      : sites.filter((site) => site.status === activeFilter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>

        {/* HEADER */}
        <View style={styles.header}>

          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={17}
              color="#17201A"
            />
          </Pressable>

          <View style={styles.logoMark}>
            <Text style={styles.logoText}>CM</Text>
          </View>

          <Text style={styles.headerTitle}>
            Map & Nearby Sites
          </Text>

        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* MAP / LIST TOGGLE */}
          <View style={styles.viewToggle}>

            <Pressable
              style={[
                styles.viewButton,
                viewMode === 'Map' && styles.activeViewButton,
              ]}
              onPress={() => setViewMode('Map')}
            >
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === 'Map' && styles.activeViewText,
                ]}
              >
                Map
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.viewButton,
                viewMode === 'List' && styles.activeViewButton,
              ]}
              onPress={() => setViewMode('List')}
            >
              <Text
                style={[
                  styles.viewButtonText,
                  viewMode === 'List' && styles.activeViewText,
                ]}
              >
                List
              </Text>
            </Pressable>

          </View>

          {/* STATUS FILTER */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >

            <Pressable
              style={[
                styles.filterButton,
                activeFilter === 'All' && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter('All')}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'All' && styles.activeFilterText,
                ]}
              >
                All
              </Text>
            </Pressable>

            {filters.map((filter) => (
              <Pressable
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter &&
                    styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === filter &&
                      styles.activeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}

          </ScrollView>

          {/* MAP */}
          <View style={styles.mapBox}>

            <Text style={styles.mapIcon}>⌖</Text>

            <Text style={styles.mapTitle}>
              Map
            </Text>

            <Text style={styles.mapSubtitle}>
              Nearby dumping sites will appear here
            </Text>

          </View>

          {/* NEARBY SITES PANEL */}
          <View style={styles.nearbyPanel}>

            <Text style={styles.nearbyTitle}>
              {filteredSites.length} Sites Nearby
            </Text>

            {viewMode === 'Map' ? (
              <Text style={styles.panelSubtitle}>
                View nearby sites on the map or browse the list below
              </Text>
            ) : (
              <Text style={styles.panelSubtitle}>
                Browse all nearby dumping sites
              </Text>
            )}

            {/* SITE LIST */}
            <View style={styles.siteList}>

              {filteredSites.map((site) => (
                <Pressable
                  key={site.name}
                  style={styles.siteCard}
                >

                  {/* IMAGE PLACEHOLDER */}
                  <View style={styles.siteImage}>
                    <Text style={styles.imageText}>
                      Image
                    </Text>
                  </View>

                  {/* SITE INFORMATION */}
                  <View style={styles.siteInfo}>

                    <Text style={styles.siteName}>
                      {site.name}
                    </Text>

                    <Text style={styles.distance}>
                      {site.distance}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        getStatusStyle(site.status),
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          getStatusTextStyle(site.status),
                        ]}
                      >
                        {site.status}
                      </Text>
                    </View>

                  </View>

                </Pressable>
              ))}

            </View>

          </View>

        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>

          <Pressable
            onPress={() => router.push('/home')}
            accessibilityLabel="Go to Home"
          >
            <FontAwesomeIcon
              icon={faHome}
              size={20}
              color="#68706A"
            />
          </Pressable>

          <Pressable
            onPress={() => router.push('/sites')}
            accessibilityLabel="View sites"
          >
            <FontAwesomeIcon
              icon={faMap}
              size={20}
              color="#1F9A55"
            />
          </Pressable>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/reportdumping')}
            accessibilityLabel="Create report"
          >
            <Text style={styles.addButtonText}>
              +
            </Text>
          </Pressable>

          <Pressable accessibilityLabel="View alerts">
            <FontAwesomeIcon
              icon={faBell}
              size={20}
              color="#68706A"
            />
          </Pressable>

          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityLabel="View profile"
          >
            <FontAwesomeIcon
              icon={faUser}
              size={20}
              color="#68706A"
            />
          </Pressable>

        </View>

      </View>
    </SafeAreaView>
  );
}

/* STATUS BACKGROUND COLORS */

function getStatusStyle(status: Status) {
  switch (status) {
    case 'Funding':
      return {
        backgroundColor: '#DDF4E5',
      };

    case 'Scheduled':
      return {
        backgroundColor: '#FFF0D2',
      };

    case 'Reported':
      return {
        backgroundColor: '#E5E5E5',
      };

    case 'Cleaned':
      return {
        backgroundColor: '#DDE9FF',
      };

    default:
      return {
        backgroundColor: '#E5E5E5',
      };
  }
}

/* STATUS TEXT COLORS */

function getStatusTextStyle(status: Status) {
  switch (status) {
    case 'Funding':
      return {
        color: '#1F7A3F',
      };

    case 'Scheduled':
      return {
        color: '#A66A00',
      };

    case 'Reported':
      return {
        color: '#555555',
      };

    case 'Cleaned':
      return {
        color: '#315C9B',
      };

    default:
      return {
        color: '#555555',
      };
  }
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

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  /* HEADER */

  header: {
    height: 55,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1F7A3F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 13,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  headerTitle: {
    color: '#17201A',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 9,
  },

  /* MAP / LIST */

  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#EDEDED',
    borderRadius: 12,
    padding: 3,
    marginTop: 8,
    marginBottom: 12,
  },

  viewButton: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeViewButton: {
    backgroundColor: '#1F7A3F',
  },

  viewButtonText: {
    color: '#17201A',
    fontSize: 12,
    fontWeight: '600',
  },

  activeViewText: {
    color: '#FFFFFF',
  },

  /* FILTER */

  filterContainer: {
    gap: 7,
    paddingBottom: 12,
  },

  filterButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeFilterButton: {
    backgroundColor: '#17201A',
  },

  filterText: {
    color: '#17201A',
    fontSize: 10,
    fontWeight: '600',
  },

  activeFilterText: {
    color: '#FFFFFF',
  },

  /* MAP */

  mapBox: {
    height: 245,
    backgroundColor: '#E3E3E3',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapIcon: {
    color: '#1F7A3F',
    fontSize: 45,
    marginBottom: 5,
  },

  mapTitle: {
    color: '#17201A',
    fontSize: 15,
    fontWeight: '700',
  },

  mapSubtitle: {
    color: '#68706A',
    fontSize: 10,
    marginTop: 4,
  },

  /* NEARBY PANEL */

  nearbyPanel: {
    backgroundColor: '#1F7A3F',
    borderRadius: 18,
    marginTop: -25,
    padding: 16,
    paddingBottom: 22,
    minHeight: 300,
  },

  nearbyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  panelSubtitle: {
    color: '#D9F1E1',
    fontSize: 10,
    marginTop: 4,
    marginBottom: 14,
  },

  /* SITE CARD */

  siteList: {
    gap: 10,
  },

  siteCard: {
    minHeight: 88,
    backgroundColor: '#E5E8E5',
    borderRadius: 12,
    padding: 9,
    flexDirection: 'row',
  },

  siteImage: {
    width: 68,
    height: 68,
    borderRadius: 9,
    backgroundColor: '#C7CBC7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageText: {
    color: '#777D78',
    fontSize: 9,
  },

  siteInfo: {
    flex: 1,
    marginLeft: 11,
    justifyContent: 'center',
  },

  siteName: {
    color: '#17201A',
    fontSize: 13,
    fontWeight: '700',
  },

  distance: {
    color: '#68706A',
    fontSize: 9,
    marginTop: 4,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 7,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '700',
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