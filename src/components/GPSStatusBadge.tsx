import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Navigation, Wifi, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import CYANIDE_THEME from '../constants/colors';
import { GPSQuality } from '../context/TripContext';

interface GPSStatusBadgeProps {
  status: GPSQuality;
  accuracy: number;
  simulated?: boolean;
}

export const GPSStatusBadge: React.FC<GPSStatusBadgeProps> = ({ status, accuracy, simulated = false }) => {
  let color = CYANIDE_THEME.success;
  let text = 'GPS LOCKED';
  let icon = <ShieldCheck size={14} color={CYANIDE_THEME.success} />;

  if (simulated) {
    color = CYANIDE_THEME.primary;
    text = 'SIMULATED GPS';
    icon = <Navigation size={14} color={CYANIDE_THEME.primary} />;
  } else if (status === 'weak') {
    color = CYANIDE_THEME.warning;
    text = 'WEAK SIGNAL';
    icon = <Wifi size={14} color={CYANIDE_THEME.warning} />;
  } else if (status === 'searching') {
    color = CYANIDE_THEME.warning;
    text = 'SEARCHING SATELLITES...';
    icon = <Wifi size={14} color={CYANIDE_THEME.warning} />;
  } else if (status === 'disabled') {
    color = CYANIDE_THEME.danger;
    text = 'GPS NO SIGNAL';
    icon = <AlertTriangle size={14} color={CYANIDE_THEME.danger} />;
  }

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={styles.left}>
        {icon}
        <Text style={[styles.statusText, { color }]}>{text}</Text>
      </View>
      <Text style={styles.accuracyText}>±{accuracy}m</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CYANIDE_THEME.card,
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
    color: CYANIDE_THEME.textMuted,
  },
});
