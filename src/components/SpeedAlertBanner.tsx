import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import CYANIDE_THEME from '../constants/colors';

interface SpeedAlertBannerProps {
  currentSpeed: number;
  speedLimit: number;
  unit: string;
}

export const SpeedAlertBanner: React.FC<SpeedAlertBannerProps> = ({ currentSpeed, speedLimit, unit }) => {
  return (
    <View style={styles.banner}>
      <AlertTriangle size={20} color={CYANIDE_THEME.textPrimary} />
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
    backgroundColor: CYANIDE_THEME.danger,
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
    color: CYANIDE_THEME.textPrimary,
    letterSpacing: 1,
  },
});
