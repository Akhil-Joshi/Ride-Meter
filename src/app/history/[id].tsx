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
import { Download, Trash2, Clock, Gauge, Flame, MapPin, Save, Edit3 } from 'lucide-react-native';
import { dbService } from '../../database/db';
import { Trip } from '../../utils/mockData';
import { formatDistance, formatDuration, formatSpeed, formatDate } from '../../utils/formatting';
import { useSettings } from '../../context/SettingsContext';
import { StatCard } from '../../components/StatCard';
import { ExportService } from '../../services/exportService';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings, theme } = useSettings();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [notes, setNotes] = useState('');
  const [tripType, setTripType] = useState<string>('Personal');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      dbService.getTripById(parseInt(id, 10)).then((data) => {
        if (data) {
          setTrip(data);
          setNotes(data.notes || '');
          setTripType(data.trip_type || 'Personal');
        }
      });
    }
  }, [id]);

  if (!trip) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Trip log not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveDetails = async () => {
    await dbService.saveTrip({
      id: trip.id,
      notes,
      trip_type: tripType,
    });
    setTrip({ ...trip, notes, trip_type: tripType });
    setIsEditing(false);
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
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          title: 'TRIP LOG DETAILS',
          headerShown: true,
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontWeight: '900',
            color: theme.textPrimary,
            fontSize: 16,
          },
          headerRight: () => (
            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleExportGPX}
              >
                <Download size={16} color={theme.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleDelete}
              >
                <Trash2 size={16} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Trip Title & Category Badge */}
        <View style={styles.titleSection}>
          <View style={styles.badgeRow}>
            {(trip.status === 'active' || trip.status === 'paused') && (
              <View style={[styles.ongoingBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: theme.warning }]}>
                <Text style={[styles.ongoingText, { color: theme.warning }]}>ONGOING RIDE</Text>
              </View>
            )}

            <View style={[styles.typeBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: theme.primary }]}>
              <Text style={[styles.typeText, { color: theme.primary }]}>{trip.trip_type || 'Personal'}</Text>
            </View>

            <Text style={[styles.dateText, { color: theme.textMuted }]}>{formatDate(trip.started_at)}</Text>
          </View>

          <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>
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
              icon={<Gauge size={14} color={theme.primary} />}
            />
            <StatCard
              label="MAX SPEED"
              value={formatSpeed(trip.max_speed_kmh, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Flame size={14} color={theme.danger} />}
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="MOVING TIME"
              value={formatDuration(trip.moving_seconds)}
              icon={<Clock size={14} color={theme.primary} />}
            />
            <StatCard
              label="STOPPED TIME"
              value={formatDuration(trip.stopped_seconds)}
              icon={<Clock size={14} color={theme.danger} />}
            />
          </View>
        </View>

        {/* GPS Coordinates Section */}
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>GPS TRAIL COORDINATES</Text>
        <View style={[styles.coordCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.coordRow}>
            <MapPin size={16} color={theme.primary} />
            <Text style={[styles.coordLabel, { color: theme.textMuted }]}>START:</Text>
            <Text style={[styles.coordVal, { color: theme.textPrimary }]}>
              {trip.start_latitude?.toFixed(4) || '27.7172'}, {trip.start_longitude?.toFixed(4) || '85.3240'}
            </Text>
          </View>
          <View style={[styles.coordRow, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]}>
            <MapPin size={16} color={theme.primaryGlow} />
            <Text style={[styles.coordLabel, { color: theme.textMuted }]}>END:</Text>
            <Text style={[styles.coordVal, { color: theme.textPrimary }]}>
              {trip.end_latitude?.toFixed(4) || '27.6710'}, {trip.end_longitude?.toFixed(4) || '85.3120'}
            </Text>
          </View>
        </View>

        {/* Category & Notes Editor Section */}
        <View style={styles.notesHeaderRow}>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>CATEGORY & RIDE NOTES</Text>
          {isEditing ? (
            <TouchableOpacity style={[styles.saveNotesBtn, { backgroundColor: theme.primary }]} onPress={handleSaveDetails}>
              <Save size={14} color={theme.bg} />
              <Text style={[styles.saveNotesText, { color: theme.bg }]}>SAVE CHANGES</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={[styles.editNotesText, { color: theme.primary }]}>EDIT DETAILS</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.notesCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {isEditing ? (
            <View style={styles.editSection}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>RIDE CATEGORY</Text>
              <View style={styles.catPickerRow}>
                {(['Personal', 'Commute', 'Tour'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      { backgroundColor: theme.cardHover, borderColor: theme.cardBorder },
                      tripType === cat && { borderColor: theme.primary, backgroundColor: theme.cardHover },
                    ]}
                    onPress={() => setTripType(cat)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        { color: theme.textMuted },
                        tripType === cat && { color: theme.primary },
                      ]}
                    >
                      {cat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>RIDE NOTES</Text>
              <TextInput
                style={[styles.notesInput, { color: theme.textPrimary, borderColor: theme.cardBorder, backgroundColor: theme.cardHover }]}
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder="Add details about road conditions, weather, or bike performance..."
                placeholderTextColor={theme.textMuted}
              />
            </View>
          ) : (
            <View>
              <Text style={[styles.notesText, { color: theme.textSecondary }]}>
                {trip.notes ? `"${trip.notes}"` : 'No notes added for this ride.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  ongoingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  ongoingText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  mainTitle: {
    fontFamily: 'monospace',
    fontSize: 26,
    fontWeight: '900',
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
    letterSpacing: 1,
    marginBottom: 8,
  },
  coordCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  coordLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  coordVal: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveNotesText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '900',
  },
  editNotesText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  notesCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  notesText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  editSection: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  catPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  catChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  catChipText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
  },
  notesInput: {
    fontFamily: 'monospace',
    fontSize: 13,
    minHeight: 60,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'monospace',
  },
});
