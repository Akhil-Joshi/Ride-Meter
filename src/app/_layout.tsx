import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { TripProvider } from '../context/TripContext';
import { dbService } from '../database/db';

function RootAppContent() {
  const { theme } = useSettings();

  return (
    <>
      <StatusBar
        barStyle={theme.bg === '#0a0a0d' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <Stack
        screenOptions={{
          headerShown: false,
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="history/[id]" options={{ title: 'TRIP LOG DETAILS', headerShown: true }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    dbService
      .initDatabase()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('DB init failed:', err);
        setIsDbReady(true);
      });
  }, []);

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <TripProvider>
          <RootAppContent />
        </TripProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
