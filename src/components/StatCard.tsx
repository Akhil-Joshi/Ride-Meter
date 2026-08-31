import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CYANIDE_THEME from '../constants/colors';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, highlight = false }) => {
  return (
    <View style={[styles.card, highlight && styles.highlightCard]}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, highlight && styles.highlightValue]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  highlightCard: {
    borderColor: CYANIDE_THEME.primary,
    backgroundColor: CYANIDE_THEME.cardHover,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '800',
    color: CYANIDE_THEME.textPrimary,
  },
  highlightValue: {
    color: CYANIDE_THEME.primary,
  },
  unit: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
    color: CYANIDE_THEME.textSecondary,
  },
});
