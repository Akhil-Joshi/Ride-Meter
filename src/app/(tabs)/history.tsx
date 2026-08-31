import { router, Stack, useFocusEffect } from 'expo-router';
import { Download, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TripCard } from '../../components/TripCard';
import CYANIDE_THEME from '../../constants/colors';
import { dbService } from '../../database/db';
import { ExportService } from '../../services/exportService';
import { Trip } from '../../utils/mockData';

export default function HistoryScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
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
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'LOGS',
          headerShown: true,
          headerStyle: { backgroundColor: CYANIDE_THEME.card },
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontWeight: '900',
            color: CYANIDE_THEME.textPrimary,
            fontSize: 16,
          },
          headerRight: () => (
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
              <Download size={14} color={CYANIDE_THEME.primary} />
              <Text style={styles.exportBtnText}>EXPORT CSV</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={16} color={CYANIDE_THEME.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes or categories..."
            placeholderTextColor={CYANIDE_THEME.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        <View style={styles.filterRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedFilter === cat && styles.filterChipActive]}
              onPress={() => setSelectedFilter(cat)}
            >
              <Text style={[styles.filterText, selectedFilter === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trips List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={CYANIDE_THEME.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTrips}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TripCard
                trip={item}
                onPress={() => router.push(`/history/${item.id}`)}
                onToggleFavorite={toggleFavorite}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No rides found in history.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CYANIDE_THEME.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textMuted,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CYANIDE_THEME.card,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  exportBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    color: CYANIDE_THEME.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 13,
    color: CYANIDE_THEME.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: CYANIDE_THEME.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: CYANIDE_THEME.primary,
  },
  filterText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
  },
  filterTextActive: {
    color: CYANIDE_THEME.primary,
  },
  listContent: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: CYANIDE_THEME.textMuted,
  },
});
