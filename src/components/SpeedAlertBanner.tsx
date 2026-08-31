import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';

interface SpeedAlertBannerProps {
  currentSpeed: number;
  speedLimit: number;
  unit: string;
}

export const SpeedAlertBanner: React.FC<SpeedAlertBannerProps> = ({ currentSpeed, speedLimit, unit }) => {
  const { theme } = useSettings();

  return (
    <View style={[styles.banner, { backgroundColor: theme.danger }]}>
      <AlertTriangle size={20} color="#ffffff" />
      <Text style={styles.alertText}>
        SPEED ALERT! {Math.round(currentSpeed)} {unit} (LIMIT: {speedLimit} {unit})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  alertText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
