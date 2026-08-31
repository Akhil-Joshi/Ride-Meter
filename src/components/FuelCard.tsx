import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fuel, DollarSign, Gauge } from 'lucide-react-native';
import { FuelLog } from '../utils/mockData';
import { formatDate } from '../utils/formatting';
import { useSettings } from '../context/SettingsContext';

interface FuelCardProps {
  log: FuelLog;
}

export const FuelCard: React.FC<FuelCardProps> = ({ log }) => {
  const { theme } = useSettings();

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Fuel size={18} color={theme.primary} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>{log.liters.toFixed(1)} Liters</Text>
        </View>
        <Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(log.filled_at)}</Text>
      </View>

      <View style={[styles.detailsRow, { backgroundColor: theme.cardHover }]}>
        <View style={styles.detail}>
          <Text style={[styles.label, { color: theme.textMuted }]}>COST</Text>
          <Text style={[styles.value, { color: theme.textSecondary }]}>${log.cost.toFixed(2)}</Text>
        </View>

        <View style={styles.detail}>
          <Text style={[styles.label, { color: theme.textMuted }]}>PRICE/L</Text>
          <Text style={[styles.value, { color: theme.textSecondary }]}>${log.price_per_liter.toFixed(2)}</Text>
        </View>

        <View style={styles.detail}>
          <Text style={[styles.label, { color: theme.textMuted }]}>ODOMETER</Text>
          <Text style={[styles.value, { color: theme.textSecondary }]}>{log.odometer_km.toLocaleString()} km</Text>
        </View>
      </View>

      {log.notes ? <Text style={[styles.notes, { color: theme.textMuted }]}>"{log.notes}"</Text> : null}
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
    marginBottom: 10,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
  },
  date: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
  },
  detail: {
    gap: 2,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
  },
  notes: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
