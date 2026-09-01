import { useFocusEffect, Stack } from 'expo-router';
import { Bell, Download, Gauge, Palette, RotateCcw, Shield, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSettings } from '../../../context/SettingsContext';
import { dbService } from '../../../database/db';
import { ExportService } from '../../../services/exportService';

export default function SettingsScreen() {
  const { settings, updateSettings, theme } = useSettings();
  const [speedLimitText, setSpeedLimitText] = useState(settings.speedLimitKmh.toString());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setSpeedLimitText(settings.speedLimitKmh.toString());
    }, [settings.speedLimitKmh])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setSpeedLimitText(settings.speedLimitKmh.toString());
    setRefreshing(false);
  }, [settings.speedLimitKmh]);

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
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >

        {/* Section 1: Theme & Display */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>THEME & DISPLAY</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Palette size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>COLOR THEME MODE</Text>
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
              thumbColor="#ffffff"
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
              thumbColor="#ffffff"
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
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section 4: Data & Backup */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DATA BACKUP & RESET</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.row} onPress={handleFullBackup}>
            <View style={styles.rowLeft}>
              <Download size={18} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>EXPORT FULL JSON BACKUP</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.cardBorder }]} onPress={handleResetData}>
            <View style={styles.rowLeft}>
              <RotateCcw size={18} color={theme.danger} />
              <Text style={[styles.rowLabel, { color: theme.danger }]}>RESET ALL LOGS & DATA</Text>
            </View>
          </TouchableOpacity>
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
    marginTop: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    fontSize: 10,
    fontWeight: '900',
  },
  limitInput: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    width: 60,
    textAlign: 'center',
    borderRadius: 6,
    paddingVertical: 4,
  },
});
