import { JSX, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const newsData = [
  { id: '1', text: 'South Africa moves toward prioritising organic waste management', time: '3 hours ago', img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=200&q=80' },
  { id: '2', text: 'Western Cape prepares for a 100% organic-waste-to-landfill ban', time: '2 hours ago', img: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=200&q=80' },
  { id: '3', text: 'Cape Town faces growing landfill pressure', time: '5 hours ago', img: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=200&q=80' },
  { id: '4', text: 'Food waste in South African landfills contributes to climate change', time: '3 hours ago', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' },
  { id: '5', text: 'Langa turns food waste into compost', time: '7 hours ago', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80' },
  { id: '6', text: 'Organic waste could free significant landfill capacity', time: '9 hours ago', img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=200&q=80' },
  { id: '7', text: 'Indonesia begins shutting down open dumping sites', time: '3 hours ago', img: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=200&q=80' },
  { id: '8', text: 'Illegal dumping becomes a major issue in Australia', time: '3 hours ago', img: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=200&q=80' },
];

export default function News(): JSX.Element {
  const [activeFilter, setActiveFilter] = useState('All');
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#1A202C" />
        </TouchableOpacity>
        <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} />
        <Text style={styles.headerTitle}>News</Text>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {['All', 'Most Popular', 'Recent News', 'Recycling Sites'].map((filter) => (
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
        {newsData.map((item) => (
          <TouchableOpacity key={item.id} style={styles.newsCard} activeOpacity={0.9}>
            <Image source={{ uri: item.img }} style={styles.newsImage} />
            <View style={styles.newsContent}>
              <Text style={styles.newsText} numberOfLines={2}>{item.text}</Text>
              <Text style={styles.newsTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
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
    padding: 5,
  },
  headerLogo: { 
    width: 32, 
    height: 32, 
    resizeMode: 'contain',
    marginRight: 10,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600',
    color: '#1A202C',
  },
  filtersContainer: { 
    marginBottom: 15,
  },
  filtersScroll: { 
    paddingHorizontal: 20, 
    gap: 10,
    paddingBottom: 5,
  },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipActive: { 
    backgroundColor: '#000',
  },
  filterChipInactive: { 
    backgroundColor: '#278B45',
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '500',
  },
  filterTextActive: { 
    color: '#FFFFFF',
  },
  filterTextInactive: { 
    color: '#1A202C',
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 30,
    gap: 12,
  },
  newsCard: { 
    backgroundColor: '#38A169', 
    borderRadius: 14, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  newsImage: { 
    width: 65, 
    height: 65, 
    borderRadius: 8, 
    marginRight: 15,
    backgroundColor: '#2F855A',
  },
  newsContent: { 
    flex: 1, 
    justifyContent: 'center',
  },
  newsText: { 
    color: '#1A202C', 
    fontSize: 14, 
    fontWeight: '500', 
    marginBottom: 6,
    lineHeight: 20,
  },
  newsTime: { 
    color: '#1A202C', 
    fontSize: 11,
    opacity: 0.8,
  },
});
