import { JSX, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

type NotificationType = {
  id: string;
  text: string;
  time: string;
  imageUrl: string;
  unread: boolean;
};

const notificationsData: NotificationType[] = [
  {
    id: '1',
    text: 'Your campaign for Musgrave Rd reached 65% funding',
    time: '2 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100&q=80',
    unread: true,
  },
  {
    id: '2',
    text: 'James N. contributed R250 to your campaign',
    time: '5 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    unread: true,
  },
  {
    id: '3',
    text: 'Cleanup for Sydenham Rd is scheduled – Aug 10, 9:00 AM',
    time: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100&q=80',
    unread: false,
  },
  {
    id: '4',
    text: 'GreenSweep Crew confirmed your booking',
    time: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100&q=80',
    unread: false,
  },
  {
    id: '5',
    text: 'GreenSweep Crew confirmed your booking',
    time: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100&q=80',
    unread: false,
  },
  {
    id: '6',
    text: 'GreenSweep Crew confirmed your booking',
    time: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100&q=80',
    unread: false,
  },
];

export default function Notifications(): JSX.Element {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" />
        </TouchableOpacity>
        <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} />
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.markReadButton}>
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {['All', 'Unread', 'Cleanups', 'Campaigns'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter ? styles.filterChipActive : styles.filterChipInactive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter ? styles.filterTextActive : styles.filterTextInactive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {notificationsData.map((notif) => (
          <View key={notif.id} style={styles.notificationCard}>
            {notif.unread && <View style={styles.unreadDot} />}
            <Image source={{ uri: notif.imageUrl }} style={styles.notificationImage} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationText}>{notif.text}</Text>
              <Text style={styles.notificationTime}>{notif.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: '#1a202c',
    fontWeight: '500',
  },
  actionsContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  markReadButton: {
    backgroundColor: '#278B45',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markReadText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: 15,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#000',
  },
  filterChipInactive: {
    backgroundColor: '#278B45',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterTextInactive: {
    color: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  notificationCard: {
    backgroundColor: '#38A169',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22543D',
    position: 'absolute',
    left: 8,
    top: 25,
  },
  notificationImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    marginLeft: 5,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    color: '#1A202C',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    color: '#EEF5EE',
    fontSize: 12,
  },
});
