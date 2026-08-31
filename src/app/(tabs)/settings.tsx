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
import { Gauge, Shield, Bell, Download, RotateCcw, Smartphone, Palette } from 'lucide-react-native';
import { useSettings } from '../../context/SettingsContext';
import { dbService } from '../../database/db';
import { ExportService } from '../../services/exportService';
import { Stack } from 'expo-router';

export default function SettingsScreen() {
  const { settings, updateSettings, theme } = useSettings();
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          title: 'SETTINGS',
          headerShown: true,
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontWeight: '900',
            color: theme.textPrimary,
            fontSize: 16,
          },
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Section 1: Theme & Display */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>THEME & DISPLAY</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Palette size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>THEME MODE</Text>
            </View>

            <View style={[styles.segmentedControl, { backgroundColor: theme.cardHover }]}>
              <TouchableOpacity
                style={[styles.segmentBtn, settings.themeMode === 'dark' && { backgroundColor: theme.primary }]}
                onPress={() => updateSettings({ themeMode: 'dark' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textMuted },
                    settings.themeMode === 'dark' && { color: theme.bg },
                  ]}
                >
                  DARK
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, settings.themeMode === 'light' && { backgroundColor: theme.primary }]}
                onPress={() => updateSettings({ themeMode: 'light' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textMuted },
                    settings.themeMode === 'light' && { color: theme.bg },
                  ]}
                >
                  LIGHT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, settings.themeMode === 'system' && { backgroundColor: theme.primary }]}
                onPress={() => updateSettings({ themeMode: 'system' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textMuted },
                    settings.themeMode === 'system' && { color: theme.bg },
                  ]}
                >
                  SYSTEM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]}>
            <View style={styles.rowLeft}>
              <Gauge size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>SPEED & DISTANCE UNITS</Text>
            </View>

            <View style={[styles.segmentedControl, { backgroundColor: theme.cardHover }]}>
              <TouchableOpacity
                style={[styles.segmentBtn, settings.speedUnit === 'kmh' && { backgroundColor: theme.primary }]}
                onPress={() => updateSettings({ speedUnit: 'kmh', distanceUnit: 'km' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textMuted },
                    settings.speedUnit === 'kmh' && { color: theme.bg },
                  ]}
                >
                  KM/H
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, settings.speedUnit === 'mph' && { backgroundColor: theme.primary }]}
                onPress={() => updateSettings({ speedUnit: 'mph', distanceUnit: 'mi' })}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: theme.textMuted },
                    settings.speedUnit === 'mph' && { color: theme.bg },
                  ]}
                >
                  MPH
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 2: Speed Alert Limits */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SPEED ALERTS</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Bell size={18} color={theme.warning} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>ENABLE SPEED ALERT</Text>
            </View>
            <Switch
              value={settings.speedAlertEnabled}
              onValueChange={(val) => updateSettings({ speedAlertEnabled: val })}
              trackColor={{ false: theme.cardHover, true: theme.primary }}
              thumbColor={theme.textPrimary}
            />
          </View>

          {settings.speedAlertEnabled && (
            <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>ALERT LIMIT ({settings.speedUnit.toUpperCase()})</Text>
              <TextInput
                style={[styles.limitInput, { backgroundColor: theme.cardHover, color: theme.primary }]}
                keyboardType="numeric"
                value={speedLimitText}
                onChangeText={handleSpeedLimitChange}
              />
            </View>
          )}
        </View>

        {/* Section 3: GPS & Auto Pause */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>GPS & TRACKING</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Shield size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>AUTO-PAUSE WHEN STOPPED</Text>
            </View>
            <Switch
              value={settings.autoPauseEnabled}
              onValueChange={(val) => updateSettings({ autoPauseEnabled: val })}
              trackColor={{ false: theme.cardHover, true: theme.primary }}
              thumbColor={theme.textPrimary}
            />
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]}>
            <View style={styles.rowLeft}>
              <Smartphone size={18} color={theme.primaryGlow} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>DEMO SIMULATION MODE</Text>
            </View>
            <Switch
              value={settings.simulatedRideMode}
              onValueChange={(val) => updateSettings({ simulatedRideMode: val })}
              trackColor={{ false: theme.cardHover, true: theme.primary }}
              thumbColor={theme.textPrimary}
            />
          </View>
        </View>

        {/* Section 4: Data Export & Ownership */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>OFFLINE DATA PORTABILITY</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.row} onPress={handleFullBackup}>
            <View style={styles.rowLeft}>
              <Download size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>EXPORT FULL JSON BACKUP</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]}
            onPress={handleResetData}
          >
            <View style={styles.rowLeft}>
              <RotateCcw size={18} color={theme.danger} />
              <Text style={[styles.rowLabel, { color: theme.danger }]}>
                RESET DATABASE & RE-SEED
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.appInfo}>
          <Text style={[styles.appTitle, { color: theme.textMuted }]}>RideMeter v1.0.0 (Cyanide Edition)</Text>
          <Text style={[styles.appDesc, { color: theme.textMuted }]}>Strictly Offline-First • SQLite Storage • Phone GPS Engine</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
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
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  segmentText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  limitInput: {
    width: 60,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
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
  },
  appDesc: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
});
