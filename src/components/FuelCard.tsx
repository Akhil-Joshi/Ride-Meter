import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fuel, DollarSign, Gauge } from 'lucide-react-native';
import CYANIDE_THEME from '../constants/colors';
import { FuelLog } from '../utils/mockData';
import { formatDate } from '../utils/formatting';

interface FuelCardProps {
  log: FuelLog;
}

export const FuelCard: React.FC<FuelCardProps> = ({ log }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Fuel size={18} color={CYANIDE_THEME.primary} />
          <Text style={styles.title}>{log.liters.toFixed(1)} Liters</Text>
        </View>
        <Text style={styles.date}>{formatDate(log.filled_at)}</Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          <Text style={styles.label}>COST</Text>
          <Text style={styles.value}>${log.cost.toFixed(2)}</Text>
        </View>

        <View style={styles.detail}>
          <Text style={styles.label}>PRICE/L</Text>
          <Text style={styles.value}>${log.price_per_liter.toFixed(2)}</Text>
        </View>

        <View style={styles.detail}>
          <Text style={styles.label}>ODOMETER</Text>
          <Text style={styles.value}>{log.odometer_km.toLocaleString()} km</Text>
        </View>
      </View>

      {log.notes ? <Text style={styles.notes}>"{log.notes}"</Text> : null}
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
    color: CYANIDE_THEME.textPrimary,
  },
  date: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textMuted,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
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
    color: CYANIDE_THEME.textMuted,
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: CYANIDE_THEME.textSecondary,
  },
  notes: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontStyle: 'italic',
    color: CYANIDE_THEME.textMuted,
    marginTop: 8,
  },
});
