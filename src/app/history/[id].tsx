import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { ChevronLeft, Download, Trash2, Star, Clock, Gauge, Flame, MapPin, Save } from 'lucide-react-native';
import CYANIDE_THEME from '../../constants/colors';
import { dbService } from '../../database/db';
import { Trip } from '../../utils/mockData';
import { formatDistance, formatDuration, formatSpeed, formatDate } from '../../utils/formatting';
import { useSettings } from '../../context/SettingsContext';
import { StatCard } from '../../components/StatCard';
import { ExportService } from '../../services/exportService';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useSettings();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    if (id) {
      dbService.getTripById(parseInt(id, 10)).then((data) => {
        if (data) {
          setTrip(data);
          setNotes(data.notes || '');
        }
      });
    }
  }, [id]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Trip log not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveNotes = async () => {
    await dbService.saveTrip({ id: trip.id, notes });
    setTrip({ ...trip, notes });
    setIsEditingNotes(false);
  };

  const handleExportGPX = async () => {
    await ExportService.exportTripGPX(trip);
  };

  const handleDelete = async () => {
    Alert.alert('Delete Trip Log?', 'Are you sure you want to remove this ride permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dbService.deleteTrip(trip.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'TRIP LOG DETAILS',
          headerShown: true,
          headerStyle: { backgroundColor: CYANIDE_THEME.card },
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontWeight: '900',
            color: CYANIDE_THEME.textPrimary,
            fontSize: 16,
          },
          headerRight: () => (
            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleExportGPX}>
                <Download size={16} color={CYANIDE_THEME.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                <Trash2 size={16} color={CYANIDE_THEME.danger} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Trip Title & Date */}
        <View style={styles.titleSection}>
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{trip.trip_type || 'Personal'}</Text>
            </View>
            <Text style={styles.dateText}>{formatDate(trip.started_at)}</Text>
          </View>
          <Text style={styles.mainTitle}>
            {formatDistance(trip.distance_km, settings.distanceUnit)} Ride
          </Text>
        </View>

        {/* Primary Metrics Grid */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard
              label="TOTAL DISTANCE"
              value={formatDistance(trip.distance_km, settings.distanceUnit)}
              highlight
            />
            <StatCard label="TOTAL DURATION" value={formatDuration(trip.duration_seconds)} />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="AVG SPEED"
              value={formatSpeed(trip.average_speed_kmh, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Gauge size={14} color={CYANIDE_THEME.primary} />}
            />
            <StatCard
              label="MAX SPEED"
              value={formatSpeed(trip.max_speed_kmh, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Flame size={14} color={CYANIDE_THEME.danger} />}
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="MOVING TIME"
              value={formatDuration(trip.moving_seconds)}
              icon={<Clock size={14} color={CYANIDE_THEME.primary} />}
            />
            <StatCard
              label="STOPPED TIME"
              value={formatDuration(trip.stopped_seconds)}
              icon={<Clock size={14} color={CYANIDE_THEME.danger} />}
            />
          </View>
        </View>

        {/* GPS Coordinates Section */}
        <Text style={styles.sectionHeader}>GPS TRAIL COORDINATES</Text>
        <View style={styles.coordCard}>
          <View style={styles.coordRow}>
            <MapPin size={16} color={CYANIDE_THEME.primary} />
            <Text style={styles.coordLabel}>START:</Text>
            <Text style={styles.coordVal}>
              {trip.start_latitude?.toFixed(4) || '27.7172'}, {trip.start_longitude?.toFixed(4) || '85.3240'}
            </Text>
          </View>
          <View style={[styles.coordRow, styles.borderTop]}>
            <MapPin size={16} color={CYANIDE_THEME.primaryGlow} />
            <Text style={styles.coordLabel}>END:</Text>
            <Text style={styles.coordVal}>
              {trip.end_latitude?.toFixed(4) || '27.6710'}, {trip.end_longitude?.toFixed(4) || '85.3120'}
            </Text>
          </View>
        </View>

        {/* Notes Editor Section */}
        <View style={styles.notesHeaderRow}>
          <Text style={styles.sectionHeader}>RIDE NOTES</Text>
          {isEditingNotes ? (
            <TouchableOpacity style={styles.saveNotesBtn} onPress={handleSaveNotes}>
              <Save size={14} color={CYANIDE_THEME.bg} />
              <Text style={styles.saveNotesText}>SAVE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingNotes(true)}>
              <Text style={styles.editNotesText}>EDIT NOTES</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.notesCard}>
          {isEditingNotes ? (
            <TextInput
              style={styles.notesInput}
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholder="Add details about road conditions, weather, or bike performance..."
              placeholderTextColor={CYANIDE_THEME.textMuted}
            />
          ) : (
            <Text style={styles.notesText}>{trip.notes ? `"${trip.notes}"` : 'No notes added for this ride.'}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CYANIDE_THEME.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: CYANIDE_THEME.textPrimary,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CYANIDE_THEME.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  titleSection: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  typeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    color: CYANIDE_THEME.primary,
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textMuted,
  },
  mainTitle: {
    fontFamily: 'monospace',
    fontSize: 26,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
  },
  grid: {
    gap: 10,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionHeader: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  coordCard: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    marginBottom: 20,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: CYANIDE_THEME.cardBorder,
  },
  coordLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
  },
  coordVal: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: CYANIDE_THEME.textPrimary,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saveNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CYANIDE_THEME.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveNotesText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '900',
    color: CYANIDE_THEME.bg,
  },
  editNotesText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.primary,
  },
  notesCard: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  notesText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: CYANIDE_THEME.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  notesInput: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: CYANIDE_THEME.textPrimary,
    minHeight: 60,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'monospace',
    color: CYANIDE_THEME.textMuted,
  },
});
