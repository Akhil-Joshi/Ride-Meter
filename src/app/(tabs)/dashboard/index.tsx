import { useFocusEffect, router, Stack } from 'expo-router';
import { Bike, Clock, Flame, Gauge, Pause, Play, RefreshCw, RotateCcw, Square } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GPSStatusBadge } from '../../../components/GPSStatusBadge';
import { SpeedAlertBanner } from '../../../components/SpeedAlertBanner';
import { SpeedometerGauge } from '../../../components/SpeedometerGauge';
import { StatCard } from '../../../components/StatCard';
import { useSettings } from '../../../context/SettingsContext';
import { useTrip } from '../../../context/TripContext';
import { dbService } from '../../../database/db';
import { formatDistance, formatDuration, formatSpeed } from '../../../utils/formatting';
import { Bike as BikeType } from '../../../utils/mockData';

export default function RideDashboardScreen() {
  const {
    tripStatus,
    currentSpeed,
    maxSpeed,
    distanceKm,
    durationSeconds,
    movingSeconds,
    stoppedSeconds,
    gpsQuality,
    gpsAccuracy,
    isSpeedAlertActive,
    hasRecoverableTrip,
    recoverableTripData,
    startRide,
    pauseRide,
    resumeRide,
    endRide,
    recoverRide,
    discardRecoveredRide,
    resetRide,
  } = useTrip();

  const { settings, updateSettings, theme } = useSettings();
  const [activeBike, setActiveBike] = useState<BikeType | null>(null);
  const [selectedTripType, setSelectedTripType] = useState<'Personal' | 'Commute' | 'Tour'>('Personal');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = React.useCallback(() => {
    dbService.getBikes().then((bikes) => {
      if (bikes.length > 0) setActiveBike(bikes[0]);
      else setActiveBike(null);
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const handleEndRide = async () => {
    const tripId = await endRide();
    if (tripId) {
      router.push(`/history/${tripId}`);
    }
  };

  const handleResetRide = () => {
    Alert.alert(
      'Reset Trip Meter?',
      'Are you sure you want to reset current trip distance, duration, and max speed back to zero?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            await resetRide();
          },
        },
      ]
    );
  };

  const displaySpeed =
    settings.speedUnit === 'mph' ? currentSpeed * 0.621371 : currentSpeed;
  const displayMaxSpeed =
    settings.speedUnit === 'mph' ? maxSpeed * 0.621371 : maxSpeed;
  const displaySpeedLimit =
    settings.speedUnit === 'mph' ? settings.speedLimitKmh * 0.621371 : settings.speedLimitKmh;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerRight: () => (
            <GPSStatusBadge
              status={gpsQuality}
              accuracy={gpsAccuracy}
              simulated={settings.simulatedRideMode}
            />
          ),
        }}
      />
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

        {/* Bike Selector & Edit Link Pill */}
        <View style={styles.bikeRow}>
          <TouchableOpacity
            style={[
              styles.bikePill,
              { backgroundColor: theme.card, borderColor: activeBike ? theme.cardBorder : theme.warning },
            ]}
            onPress={() => router.push('/garage')}
            activeOpacity={0.7}
          >
            <Bike size={14} color={activeBike ? theme.primary : theme.warning} />
            <Text style={[styles.bikeText, { color: activeBike ? theme.textSecondary : theme.warning }]}>
              {activeBike ? `${activeBike.name} (${activeBike.make} ${activeBike.model})` : 'SETUP YOUR MOTORCYCLE PROFILE'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Crash Recovery Notification Banner */}
        {hasRecoverableTrip && tripStatus === 'idle' && (
          <View style={[styles.recoveryBanner, { backgroundColor: theme.card, borderColor: theme.warning }]}>
            <View style={styles.recoveryHeader}>
              <RefreshCw size={16} color={theme.warning} />
              <Text style={[styles.recoveryTitle, { color: theme.warning }]}>UNSAVED RIDE RECOVERED</Text>
            </View>
            <Text style={[styles.recoveryText, { color: theme.textSecondary }]}>
              Distance: {(recoverableTripData?.distanceKm ?? recoverableTripData?.distance_km ?? 0).toFixed(1)} km • Duration:{' '}
              {formatDuration(recoverableTripData?.durationSeconds ?? recoverableTripData?.duration_seconds ?? 0)}
            </Text>
            <View style={styles.recoveryActions}>
              <TouchableOpacity
                style={[styles.recoveryBtnRestore, { backgroundColor: theme.warning }]}
                onPress={recoverRide}
              >
                <Text style={[styles.recoveryBtnRestoreText, { color: theme.bg }]}>RESTORE RIDE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recoveryBtnDiscard, { borderColor: theme.cardBorder }]}
                onPress={discardRecoveredRide}
              >
                <Text style={[styles.recoveryBtnDiscardText, { color: theme.textMuted }]}>DISCARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Speed Alert Active Banner */}
        {isSpeedAlertActive && (
          <SpeedAlertBanner
            currentSpeed={displaySpeed}
            speedLimit={Math.round(displaySpeedLimit)}
            unit={settings.speedUnit.toUpperCase()}
          />
        )}

        {/* Main High-Resolution SVG Gauge */}
        <SpeedometerGauge
          speed={displaySpeed}
          maxRange={settings.speedUnit === 'mph' ? 140 : 200}
          isAlert={isSpeedAlertActive}
          unitLabel={settings.speedUnit.toUpperCase()}
        />

        {/* Live Distance Hero Display */}
        <View style={styles.distanceContainer}>
          <Text style={[styles.distanceMain, { color: theme.textPrimary }]}>
            {formatDistance(distanceKm, settings.distanceUnit)}
          </Text>
          <Text style={[styles.distanceLabel, { color: theme.primary }]}>
            {tripStatus === 'active'
              ? 'LIVE TRIP DISTANCE'
              : tripStatus === 'paused'
                ? 'TRIP PAUSED'
                : tripStatus === 'completed'
                  ? 'RIDE ENDED & SAVED'
                  : 'READY TO RIDE'}
          </Text>
        </View>

        {/* 2x2 Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <StatCard
              label="AVERAGE SPEED"
              value={formatSpeed(
                movingSeconds > 0 ? (distanceKm / (movingSeconds / 3600)) : 0,
                settings.speedUnit
              )}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Gauge size={14} color={theme.primary} />}
            />
            <StatCard
              label="TOP MAX SPEED"
              value={formatSpeed(displayMaxSpeed, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Flame size={14} color={theme.warning} />}
            />
          </View>

          <View style={styles.metricsRow}>
            <StatCard
              label="TRIP DURATION"
              value={formatDuration(durationSeconds)}
              icon={<Clock size={14} color={theme.textMuted} />}
            />
            <StatCard
              label="MOVING TIME"
              value={formatDuration(movingSeconds)}
              icon={<Clock size={14} color={theme.primary} />}
            />
          </View>
        </View>

        {/* Primary Ride Control Action Bar */}
        <View style={styles.controlsContainer}>
          {(tripStatus === 'idle' || tripStatus === 'completed') && (
            <View style={styles.idleBlock}>
              <Text style={[styles.categoryLabel, { color: theme.textMuted }]}>SELECT RIDE TYPE</Text>
              <View style={styles.categoryRow}>
                {(['Personal', 'Commute', 'Tour'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: theme.card, borderColor: theme.cardBorder },
                      selectedTripType === cat && { borderColor: theme.primary, backgroundColor: theme.cardHover },
                    ]}
                    onPress={() => setSelectedTripType(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: theme.textMuted },
                        selectedTripType === cat && { color: theme.primary },
                      ]}
                    >
                      {cat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.mainStartBtn, { flex: 1, backgroundColor: theme.primary }]}
                  onPress={() => startRide(selectedTripType)}
                >
                  <Play size={22} color={theme.bg} fill={theme.bg} />
                  <Text style={[styles.mainStartBtnText, { color: theme.bg }]}>
                    START {selectedTripType.toUpperCase()} RIDE
                  </Text>
                </TouchableOpacity>

                {(distanceKm > 0 || durationSeconds > 0 || maxSpeed > 0) && (
                  <TouchableOpacity
                    style={[styles.resetBtn, { backgroundColor: theme.card, borderColor: theme.warning }]}
                    onPress={handleResetRide}
                  >
                    <RotateCcw size={18} color={theme.warning} />
                    <Text style={[styles.resetBtnText, { color: theme.warning }]}>RESET</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {tripStatus === 'active' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtnSecondary, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={pauseRide}
              >
                <Pause size={20} color={theme.textPrimary} />
                <Text style={[styles.actionBtnSecondaryText, { color: theme.textPrimary }]}>PAUSE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnStop, { backgroundColor: theme.danger }]}
                onPress={handleEndRide}
              >
                <Square size={20} color="#ffffff" fill="#ffffff" />
                <Text style={styles.actionBtnStopText}>END</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetBtnCompact, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleResetRide}
              >
                <RotateCcw size={18} color={theme.warning} />
              </TouchableOpacity>
            </View>
          )}

          {tripStatus === 'paused' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.mainStartBtn, { flex: 1, backgroundColor: theme.primary }]}
                onPress={resumeRide}
              >
                <Play size={20} color={theme.bg} fill={theme.bg} />
                <Text style={[styles.mainStartBtnText, { color: theme.bg }]}>RESUME</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnStop, { backgroundColor: theme.danger }]}
                onPress={handleEndRide}
              >
                <Square size={20} color="#ffffff" fill="#ffffff" />
                <Text style={styles.actionBtnStopText}>END</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resetBtnCompact, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleResetRide}
              >
                <RotateCcw size={18} color={theme.warning} />
              </TouchableOpacity>
            </View>
          )}
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  bikeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  bikePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  bikeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  recoveryBanner: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  recoveryTitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  recoveryText: {
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 10,
  },
  recoveryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  recoveryBtnRestore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recoveryBtnRestoreText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
  },
  recoveryBtnDiscard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  recoveryBtnDiscardText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  distanceContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  distanceMain: {
    fontFamily: 'monospace',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  distanceLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -2,
  },
  metricsGrid: {
    gap: 10,
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  controlsContainer: {
    marginTop: 10,
  },
  idleBlock: {
    gap: 8,
  },
  categoryLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryChipText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  mainStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  mainStartBtnText: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnStop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnStopText: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  resetBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
  },
  resetBtnCompact: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
