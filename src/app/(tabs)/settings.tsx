import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gauge, Shield, Bell, Database, Download, RotateCcw, Smartphone, Palette } from 'lucide-react-native';
import CYANIDE_THEME from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';
import { dbService } from '../../database/db';
import { ExportService } from '../../services/exportService';

import { Stack } from 'expo-router';

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const [speedLimitText, setSpeedLimitText] = useState(settings.speedLimitKmh.toString());

  const handleSpeedLimitChange = (text: string) => {
    setSpeedLimitText(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      updateSettings({ speedLimitKmh: num });
    }
  };

  const handleFullBackup = async () => {
    const trips = await dbService.getTrips();
    const fuelLogs = await dbService.getFuelLogs();
    const maintenance = await dbService.getMaintenanceLogs();
    await ExportService.exportFullJSONBackup({ trips, fuelLogs, maintenance });
  };

  const handleResetData = async () => {
    Alert.alert(
      'Reset All Ride Meter Data?',
      'This action will reset your database and clear custom logs. Initial mock data will be re-seeded.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            await dbService.clearAllData();
            Alert.alert('Reset Complete', 'Database has been restored to default state.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'SETTINGS',
          headerShown: true,
          headerStyle: { backgroundColor: CYANIDE_THEME.card },
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontWeight: '900',
            color: CYANIDE_THEME.textPrimary,
            fontSize: 16,
          },
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Section 1: Theme & Display */}
        <Text style={styles.sectionTitle}>THEME & DISPLAY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Palette size={18} color={CYANIDE_THEME.primary} />
              <Text style={styles.rowLabel}>THEME MODE</Text>
            </View>

            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segmentBtn, settings.themeMode === 'dark' && styles.segmentActive]}
                onPress={() => updateSettings({ themeMode: 'dark' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.themeMode === 'dark' && styles.segmentTextActive,
                  ]}
                >
                  DARK
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, settings.themeMode === 'light' && styles.segmentActive]}
                onPress={() => updateSettings({ themeMode: 'light' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.themeMode === 'light' && styles.segmentTextActive,
                  ]}
                >
                  LIGHT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, settings.themeMode === 'system' && styles.segmentActive]}
                onPress={() => updateSettings({ themeMode: 'system' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.themeMode === 'system' && styles.segmentTextActive,
                  ]}
                >
                  SYSTEM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.row, styles.borderTop]}>
            <View style={styles.rowLeft}>
              <Gauge size={18} color={CYANIDE_THEME.primary} />
              <Text style={styles.rowLabel}>SPEED & DISTANCE UNITS</Text>
            </View>

            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[styles.segmentBtn, settings.speedUnit === 'kmh' && styles.segmentActive]}
                onPress={() => updateSettings({ speedUnit: 'kmh', distanceUnit: 'km' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.speedUnit === 'kmh' && styles.segmentTextActive,
                  ]}
                >
                  KM/H
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, settings.speedUnit === 'mph' && styles.segmentActive]}
                onPress={() => updateSettings({ speedUnit: 'mph', distanceUnit: 'mi' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    settings.speedUnit === 'mph' && styles.segmentTextActive,
                  ]}
                >
                  MPH
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 2: Speed Alert Limits */}
        <Text style={styles.sectionTitle}>SPEED ALERTS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell size={18} color={CYANIDE_THEME.warning} />
              <Text style={styles.rowLabel}>ENABLE SPEED ALERT</Text>
            </View>
            <Switch
              value={settings.speedAlertEnabled}
              onValueChange={(val) => updateSettings({ speedAlertEnabled: val })}
              trackColor={{ false: '#26262c', true: CYANIDE_THEME.primary }}
              thumbColor={CYANIDE_THEME.textPrimary}
            />
          </View>

          {settings.speedAlertEnabled && (
            <View style={[styles.row, styles.borderTop]}>
              <Text style={styles.rowLabel}>ALERT LIMIT ({settings.speedUnit.toUpperCase()})</Text>
              <TextInput
                style={styles.limitInput}
                keyboardType="numeric"
                value={speedLimitText}
                onChangeText={handleSpeedLimitChange}
              />
            </View>
          )}
        </View>

        {/* Section 3: GPS & Auto Pause */}
        <Text style={styles.sectionTitle}>GPS & TRACKING</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Shield size={18} color={CYANIDE_THEME.primary} />
              <Text style={styles.rowLabel}>AUTO-PAUSE WHEN STOPPED</Text>
            </View>
            <Switch
              value={settings.autoPauseEnabled}
              onValueChange={(val) => updateSettings({ autoPauseEnabled: val })}
              trackColor={{ false: '#26262c', true: CYANIDE_THEME.primary }}
              thumbColor={CYANIDE_THEME.textPrimary}
            />
          </View>

          <View style={[styles.row, styles.borderTop]}>
            <View style={styles.rowLeft}>
              <Smartphone size={18} color={CYANIDE_THEME.primaryGlow} />
              <Text style={styles.rowLabel}>DEMO SIMULATION MODE</Text>
            </View>
            <Switch
              value={settings.simulatedRideMode}
              onValueChange={(val) => updateSettings({ simulatedRideMode: val })}
              trackColor={{ false: '#26262c', true: CYANIDE_THEME.primary }}
              thumbColor={CYANIDE_THEME.textPrimary}
            />
          </View>
        </View>

        {/* Section 4: Data Export & Ownership */}
        <Text style={styles.sectionTitle}>OFFLINE DATA PORTABILITY</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleFullBackup}>
            <View style={styles.rowLeft}>
              <Download size={18} color={CYANIDE_THEME.primary} />
              <Text style={styles.rowLabel}>EXPORT FULL JSON BACKUP</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.borderTop]} onPress={handleResetData}>
            <View style={styles.rowLeft}>
              <RotateCcw size={18} color={CYANIDE_THEME.danger} />
              <Text style={[styles.rowLabel, { color: CYANIDE_THEME.danger }]}>
                RESET DATABASE & RE-SEED
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.appInfo}>
          <Text style={styles.appTitle}>RideMeter v1.0.0 (Cyanide Edition)</Text>
          <Text style={styles.appDesc}>Strictly Offline-First • SQLite Storage • Phone GPS Engine</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CYANIDE_THEME.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    marginBottom: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: CYANIDE_THEME.cardBorder,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: CYANIDE_THEME.textPrimary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#26262c',
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: CYANIDE_THEME.primary,
  },
  segmentText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.textMuted,
  },
  segmentTextActive: {
    color: CYANIDE_THEME.bg,
  },
  limitInput: {
    width: 60,
    backgroundColor: '#26262c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
    color: CYANIDE_THEME.primary,
    textAlign: 'center',
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 4,
  },
  appTitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: CYANIDE_THEME.textMuted,
  },
  appDesc: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: CYANIDE_THEME.textMuted,
  },
});
