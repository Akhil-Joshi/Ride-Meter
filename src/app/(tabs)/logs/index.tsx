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
import { EmptyState } from '../../../components/EmptyState';
import { CardSkeleton } from '../../../components/SkeletonLoader';
import { TripCard } from '../../../components/TripCard';
import { useSettings } from '../../../context/SettingsContext';
import { dbService } from '../../../database/db';
import { ExportService } from '../../../services/exportService';
import { Trip } from '../../../utils/mockData';

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
      (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.trip_type || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'Favorites') return t.is_favorite === 1;
    if (selectedFilter === 'Commute') return t.trip_type === 'Commute';
    if (selectedFilter === 'Tour') return t.trip_type === 'Tour';
    if (selectedFilter === 'Personal') return t.trip_type === 'Personal';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          title: 'Logs',
          headerRight: () => (
            <TouchableOpacity style={styles.exportHeaderBtn} onPress={handleExportCSV}>
              <Download size={18} color={theme.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.mainContent}>
        {/* Search Bar */}
        <View style={[styles.searchCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search logs by category or notes..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Badges */}
        <View style={styles.filterRowContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {(['All', 'Favorites', 'Personal', 'Commute', 'Tour'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterBadge,
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
                onAction={() => router.push('/(tabs)/dashboard')}
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
    paddingTop: 8,
  },
  exportHeaderBtn: {
    padding: 6,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  filterRowContainer: {
    marginBottom: 12,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
