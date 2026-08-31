import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, MapPin, Gauge, Clock, ChevronRight } from 'lucide-react-native';
import { Trip } from '../utils/mockData';
import { formatDuration, formatDate, formatDistance, formatSpeed } from '../utils/formatting';
import { useSettings } from '../context/SettingsContext';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  onToggleFavorite: (id: number) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onPress, onToggleFavorite }) => {
  const { settings, theme } = useSettings();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: theme.primary }]}>
            <Text style={[styles.typeText, { color: theme.primary }]}>{trip.trip_type || 'Personal'}</Text>
          </View>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>{formatDate(trip.started_at)}</Text>
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
            color={trip.is_favorite ? theme.warning : theme.textMuted}
            fill={trip.is_favorite ? theme.warning : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.distanceBlock}>
          <Text style={[styles.distanceValue, { color: theme.textPrimary }]}>
            {formatDistance(trip.distance_km, settings.distanceUnit)}
          </Text>
          <Text style={[styles.distanceLabel, { color: theme.textMuted }]}>TOTAL DISTANCE</Text>
        </View>

        <ChevronRight size={20} color={theme.textMuted} />
      </View>

      <View style={[styles.statsFooter, { borderTopColor: theme.cardBorder }]}>
        <View style={styles.statItem}>
          <Gauge size={13} color={theme.primary} />
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>AVG:</Text>
          <Text style={[styles.statVal, { color: theme.textSecondary }]}>
            {formatSpeed(trip.average_speed_kmh, settings.speedUnit)} {settings.speedUnit.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Gauge size={13} color={theme.primaryGlow} />
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>MAX:</Text>
          <Text style={[styles.statVal, { color: theme.textSecondary }]}>
            {formatSpeed(trip.max_speed_kmh, settings.speedUnit)} {settings.speedUnit.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Clock size={13} color={theme.textMuted} />
          <Text style={[styles.statVal, { color: theme.textSecondary }]}>{formatDuration(trip.duration_seconds)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
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
    letterSpacing: -0.5,
  },
  distanceLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  statVal: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
});
