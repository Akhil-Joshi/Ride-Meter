import { router, Stack, useFocusEffect } from 'expo-router';
import { Download, Navigation, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { TripCard } from '../../components/TripCard';
import { useSettings } from '../../context/SettingsContext';
import { dbService } from '../../database/db';
import { ExportService } from '../../services/exportService';
import { Trip } from '../../utils/mockData';

export default function HistoryScreen() {
  const { theme } = useSettings();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await dbService.getTrips();
      setTrips(data);
    } catch (e) {
      console.warn('Load trips error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadTrips();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, []);

  const toggleFavorite = async (id: number) => {
    const target = trips.find((t) => t.id === id);
    if (!target) return;
    const newFav = target.is_favorite ? 0 : 1;
    await dbService.saveTrip({ id, is_favorite: newFav });
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_favorite: newFav } : t))
    );
  };

  const handleExportCSV = async () => {
    await ExportService.exportTripsCSV(trips);
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.trip_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'All') return true;
    if (selectedFilter === '⭐ Favorites') return t.is_favorite === 1;
    return t.trip_type === selectedFilter;
  });

  const categories = ['All', '⭐ Favorites', 'Personal', 'Commute', 'Tour'];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          title: 'Logs',
          headerShown: true,
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontWeight: '900',
            color: theme.textPrimary,
            fontSize: 16,
          },
          headerRight: () => (
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: theme.card, borderColor: theme.primary }]}
              onPress={handleExportCSV}
            >
              <Download size={14} color={theme.primary} />
              <Text style={[styles.exportBtnText, { color: theme.primary }]}>EXPORT CSV</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.mainContent}>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Search size={16} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search notes or categories..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Horizontally Scrollable Category Filter Badges */}
        <View style={styles.filterRowWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  selectedFilter === cat && { borderColor: theme.primary, backgroundColor: theme.cardHover },
                ]}
                onPress={() => setSelectedFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: theme.textMuted },
                    selectedFilter === cat && { color: theme.primary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trips List */}
        {loading ? (
          <CardSkeleton count={4} />
        ) : (
          <FlatList
            data={filteredTrips}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
            renderItem={({ item }) => (
              <TripCard
                trip={item}
                onPress={() => router.push(`/history/${item.id}`)}
                onToggleFavorite={toggleFavorite}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon={<Navigation size={24} color={theme.primary} />}
                title="NO RIDE LOGS YET"
                description="Start your first motorcycle ride from the Dashboard to record speed, duration, and route data."
                actionLabel="GO TO DASHBOARD"
                onAction={() => router.push('/')}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  exportBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  filterRowWrapper: {
    marginBottom: 14,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
});
