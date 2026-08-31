import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wrench, Calendar, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Maintenance } from '../utils/mockData';
import { formatDate } from '../utils/formatting';
import { useSettings } from '../context/SettingsContext';

interface MaintenanceCardProps {
  item: Maintenance;
  currentOdometer: number;
}

export const MaintenanceCard: React.FC<MaintenanceCardProps> = ({ item, currentOdometer }) => {
  const { theme } = useSettings();
  const remainingKm = item.next_service_km - currentOdometer;
  const isDue = remainingKm <= 0;
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      ((currentOdometer - item.odometer_km) / (item.next_service_km - item.odometer_km)) * 100
    )
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        isDue && { borderColor: theme.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Wrench size={16} color={isDue ? theme.danger : theme.primary} />
          <Text style={[styles.type, { color: theme.textPrimary }]}>{item.type}</Text>
        </View>
        <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(item.service_date)}</Text>
      </View>

      <Text style={[styles.description, { color: theme.textSecondary }]}>{item.description}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>NEXT SERVICE</Text>
          <Text
            style={[
              styles.progressStatus,
              { color: theme.primary },
              isDue && { color: theme.danger },
            ]}
          >
            {isDue
              ? `OVERDUE BY ${Math.abs(Math.round(remainingKm))} KM`
              : `${Math.round(remainingKm)} KM REMAINING`}
          </Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: theme.gaugeArcBg }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%`, backgroundColor: theme.primary },
              isDue && { backgroundColor: theme.danger },
            ]}
          />
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Done at: {item.odometer_km.toLocaleString()} km</Text>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Target: {item.next_service_km.toLocaleString()} km</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  type: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '800',
  },
  date: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  description: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
  },
  progressStatus: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
