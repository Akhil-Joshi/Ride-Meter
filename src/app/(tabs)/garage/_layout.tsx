import React from 'react';
import { Stack } from 'expo-router';
import { useSettings } from '../../../context/SettingsContext';

export default function GarageLayout() {
  const { theme } = useSettings();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: {
          fontFamily: 'monospace',
          fontWeight: '900',
          fontSize: 18,
          color: theme.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Service' }} />
    </Stack>
  );
}
