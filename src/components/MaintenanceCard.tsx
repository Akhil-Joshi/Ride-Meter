import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wrench, Calendar, CheckCircle2, AlertCircle } from 'lucide-react-native';
import CYANIDE_THEME from '../constants/colors';
import { Maintenance } from '../utils/mockData';
import { formatDate } from '../utils/formatting';

interface MaintenanceCardProps {
  item: Maintenance;
  currentOdometer: number;
}

export const MaintenanceCard: React.FC<MaintenanceCardProps> = ({ item, currentOdometer }) => {
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
    <View style={[styles.card, isDue && styles.dueCard]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Wrench size={16} color={isDue ? CYANIDE_THEME.danger : CYANIDE_THEME.primary} />
          <Text style={styles.type}>{item.type}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.service_date)}</Text>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>NEXT SERVICE</Text>
          <Text style={[styles.progressStatus, isDue && styles.dueStatusText]}>
            {isDue
              ? `OVERDUE BY ${Math.abs(Math.round(remainingKm))} KM`
              : `${Math.round(remainingKm)} KM REMAINING`}
          </Text>
        </View>

        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
              isDue && styles.progressBarDue,
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Done at: {item.odometer_km.toLocaleString()} km</Text>
        <Text style={styles.footerText}>Target: {item.next_service_km.toLocaleString()} km</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  dueCard: {
    borderColor: CYANIDE_THEME.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
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
    color: CYANIDE_THEME.textPrimary,
  },
  date: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textMuted,
  },
  description: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: CYANIDE_THEME.textSecondary,
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
    color: CYANIDE_THEME.textMuted,
  },
  progressStatus: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    color: CYANIDE_THEME.primary,
  },
  dueStatusText: {
    color: CYANIDE_THEME.danger,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#26262c',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: CYANIDE_THEME.primary,
    borderRadius: 3,
  },
  progressBarDue: {
    backgroundColor: CYANIDE_THEME.danger,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: CYANIDE_THEME.cardBorder,
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textMuted,
  },
});
