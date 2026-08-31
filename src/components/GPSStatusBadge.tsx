import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Navigation, Wifi, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { GPSQuality } from '../context/TripContext';
import { useSettings } from '../context/SettingsContext';

interface GPSStatusBadgeProps {
  status: GPSQuality;
  accuracy: number;
  simulated?: boolean;
}

export const GPSStatusBadge: React.FC<GPSStatusBadgeProps> = ({ status, accuracy, simulated = false }) => {
  const { theme } = useSettings();

  let color = theme.success;
  let text = 'GPS LOCKED';
  let icon = <ShieldCheck size={14} color={theme.success} />;

  if (simulated) {
    color = theme.primary;
    text = 'SIMULATED GPS';
    icon = <Navigation size={14} color={theme.primary} />;
  } else if (status === 'weak') {
    color = theme.warning;
    text = 'WEAK SIGNAL';
    icon = <Wifi size={14} color={theme.warning} />;
  } else if (status === 'searching') {
    color = theme.warning;
    text = 'SEARCHING SATELLITES...';
    icon = <Wifi size={14} color={theme.warning} />;
  } else if (status === 'disabled') {
    color = theme.danger;
    text = 'GPS NO SIGNAL';
    icon = <AlertTriangle size={14} color={theme.danger} />;
  }

  return (
    <View style={[styles.badge, { backgroundColor: theme.card, borderColor: color }]}>
      <View style={styles.left}>
        {icon}
        <Text style={[styles.statusText, { color }]}>{text}</Text>
      </View>
      <Text style={[styles.accuracyText, { color: theme.textMuted }]}>±{accuracy}m</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  accuracyText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
