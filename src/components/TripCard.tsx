import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, MapPin, Gauge, Clock, ChevronRight } from 'lucide-react-native';
import CYANIDE_THEME from '../constants/colors';
import { Trip } from '../utils/mockData';
import { formatDuration, formatDate, formatDistance, formatSpeed } from '../utils/formatting';
import { useSettings } from '../context/SettingsContext';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  onToggleFavorite: (id: number) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onPress, onToggleFavorite }) => {
  const { settings } = useSettings();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{trip.trip_type || 'Personal'}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(trip.started_at)}</Text>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(trip.id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star
            size={18}
            color={trip.is_favorite ? CYANIDE_THEME.warning : CYANIDE_THEME.textMuted}
            fill={trip.is_favorite ? CYANIDE_THEME.warning : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.distanceBlock}>
          <Text style={styles.distanceValue}>
            {formatDistance(trip.distance_km, settings.distanceUnit)}
          </Text>
          <Text style={styles.distanceLabel}>TOTAL DISTANCE</Text>
        </View>

        <ChevronRight size={20} color={CYANIDE_THEME.textMuted} />
      </View>

      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Gauge size={13} color={CYANIDE_THEME.primary} />
          <Text style={styles.statLabel}>AVG:</Text>
          <Text style={styles.statVal}>
            {formatSpeed(trip.average_speed_kmh, settings.speedUnit)} {settings.speedUnit.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Gauge size={13} color={CYANIDE_THEME.primaryGlow} />
          <Text style={styles.statLabel}>MAX:</Text>
          <Text style={styles.statVal}>
            {formatSpeed(trip.max_speed_kmh, settings.speedUnit)} {settings.speedUnit.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Clock size={13} color={CYANIDE_THEME.textMuted} />
          <Text style={styles.statVal}>{formatDuration(trip.duration_seconds)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  distanceBlock: {
    gap: 2,
  },
  distanceValue: {
    fontFamily: 'monospace',
    fontSize: 26,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
    letterSpacing: -0.5,
  },
  distanceLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
    letterSpacing: 1,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: CYANIDE_THEME.cardBorder,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: CYANIDE_THEME.textMuted,
  },
  statVal: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: CYANIDE_THEME.textSecondary,
  },
});
