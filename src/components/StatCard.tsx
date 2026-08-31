import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, highlight = false }) => {
  const { theme } = useSettings();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        highlight && { borderColor: theme.primary, backgroundColor: theme.cardHover },
      ]}
    >
      <View style={styles.header}>
        {icon}
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            { color: theme.textPrimary },
            highlight && { color: theme.primary },
          ]}
        >
          {value}
        </Text>
        {unit && <Text style={[styles.unit, { color: theme.textSecondary }]}>{unit}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
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
  },
  unit: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
  },
});
