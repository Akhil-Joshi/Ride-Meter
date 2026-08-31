import { router, Stack } from 'expo-router';
import { Bike, Clock, Flame, Gauge, Navigation, Pause, Play, RefreshCw, Square } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GPSStatusBadge } from '../../components/GPSStatusBadge';
import { SpeedAlertBanner } from '../../components/SpeedAlertBanner';
import { SpeedometerGauge } from '../../components/SpeedometerGauge';
import { StatCard } from '../../components/StatCard';
import CYANIDE_THEME from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';
import { useTrip } from '../../context/TripContext';
import { dbService } from '../../database/db';
import { formatDistance, formatDuration, formatSpeed } from '../../utils/formatting';
import { Bike as BikeType } from '../../utils/mockData';

export default function RideDashboardScreen() {
  const {
    tripStatus,
    currentSpeed,
    averageSpeed,
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
  } = useTrip();

  const { settings, updateSettings } = useSettings();
  const [activeBike, setActiveBike] = useState<BikeType | null>(null);

  useEffect(() => {
    dbService.getBikes().then((bikes) => {
      if (bikes.length > 0) setActiveBike(bikes[0]);
    });
  }, [tripStatus]);

  const handleEndRide = async () => {
    const tripId = await endRide();
    if (tripId) {
      router.push(`/history/${tripId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'DASHBOARD',
          headerShown: true,
          headerStyle: { backgroundColor: CYANIDE_THEME.card },
          headerTitleStyle: {
            fontFamily: 'monospace',
            fontWeight: '900',
            color: CYANIDE_THEME.textPrimary,
            fontSize: 16,
          },
          headerRight: () => (
            <GPSStatusBadge
              status={gpsQuality}
              accuracy={gpsAccuracy}
              simulated={settings.simulatedRideMode}
            />
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bike Status Pill */}
        <View style={styles.headerBar}>
          <View style={styles.bikeBadge}>
            <Bike size={14} color={CYANIDE_THEME.primary} />
            <Text style={styles.bikeText}>
              {activeBike ? `${activeBike.name} • ODO ${activeBike.current_odometer.toLocaleString()} km` : 'RideMeter'}
            </Text>
          </View>
        </View>

        {/* Crash Recovery Notification Banner */}
        {hasRecoverableTrip && (
          <View style={styles.recoveryBanner}>
            <View style={styles.recoveryTextRow}>
              <RefreshCw size={16} color={CYANIDE_THEME.warning} />
              <Text style={styles.recoveryTitle}>Unfinished Ride Detected</Text>
            </View>
            <Text style={styles.recoverySub}>
              {recoverableTripData?.distanceKm?.toFixed(1)} km recorded • {formatDuration(recoverableTripData?.durationSeconds || 0)}
            </Text>
            <View style={styles.recoveryActionRow}>
              <TouchableOpacity style={styles.recoverBtn} onPress={recoverRide}>
                <Text style={styles.recoverBtnText}>RECOVER RIDE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardBtn} onPress={discardRecoveredRide}>
                <Text style={styles.discardBtnText}>DISCARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Speed Alert Overlay */}
        {isSpeedAlertActive && (
          <SpeedAlertBanner
            currentSpeed={currentSpeed}
            speedLimit={settings.speedLimitKmh}
            unit={settings.speedUnit.toUpperCase()}
          />
        )}

        {/* Demo Simulation Toggle Pill */}
        <View style={styles.simRow}>
          <TouchableOpacity
            style={[styles.simToggle, settings.simulatedRideMode && styles.simToggleActive]}
            onPress={() => updateSettings({ simulatedRideMode: !settings.simulatedRideMode })}
          >
            <Navigation size={12} color={settings.simulatedRideMode ? CYANIDE_THEME.textPrimary : CYANIDE_THEME.textMuted} />
            <Text style={[styles.simText, settings.simulatedRideMode && styles.simTextActive]}>
              {settings.simulatedRideMode ? 'SIMULATED GPS ON' : 'ENABLE DEMO GPS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Core Speedometer Gauge */}
        <SpeedometerGauge
          speed={currentSpeed}
          isAlert={isSpeedAlertActive}
          unitLabel={settings.speedUnit.toUpperCase()}
        />

        {/* Primary Ride Distance & Status Banner */}
        <View style={styles.primaryDistanceCard}>
          <Text style={styles.primaryDistanceVal}>
            {formatDistance(distanceKm, settings.distanceUnit)}
          </Text>
          <Text style={styles.primaryDistanceLabel}>
            {tripStatus === 'active'
              ? 'LIVE TRIP DISTANCE'
              : tripStatus === 'paused'
                ? 'TRIP PAUSED'
                : 'READY TO RIDE'}
          </Text>
        </View>

        {/* Real-time Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.gridRow}>
            <StatCard
              label="AVG SPEED"
              value={formatSpeed(averageSpeed, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Gauge size={14} color={CYANIDE_THEME.primary} />}
            />
            <StatCard
              label="MAX SPEED"
              value={formatSpeed(maxSpeed, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Flame size={14} color={CYANIDE_THEME.warning} />}
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="DURATION"
              value={formatDuration(durationSeconds)}
              icon={<Clock size={14} color={CYANIDE_THEME.textMuted} />}
            />
            <StatCard
              label="MOVING"
              value={formatDuration(movingSeconds)}
              icon={<Clock size={14} color={CYANIDE_THEME.primary} />}
            />
            <StatCard
              label="STOPPED"
              value={formatDuration(stoppedSeconds)}
              icon={<Clock size={14} color={CYANIDE_THEME.danger} />}
            />
          </View>
        </View>

        {/* Large Ergonomic Control Buttons */}
        <View style={styles.controlsContainer}>
          {tripStatus === 'idle' && (
            <TouchableOpacity style={styles.startBtn} onPress={startRide} activeOpacity={0.8}>
              <Play size={26} color={CYANIDE_THEME.bg} fill={CYANIDE_THEME.bg} />
              <Text style={styles.startBtnText}>START RIDE</Text>
            </TouchableOpacity>
          )}

          {tripStatus === 'active' && (
            <View style={styles.activeBtnGroup}>
              <TouchableOpacity style={styles.pauseBtn} onPress={pauseRide} activeOpacity={0.8}>
                <Pause size={22} color={CYANIDE_THEME.textPrimary} />
                <Text style={styles.pauseBtnText}>PAUSE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.endBtn} onPress={handleEndRide} activeOpacity={0.8}>
                <Square size={22} color={CYANIDE_THEME.textPrimary} fill={CYANIDE_THEME.textPrimary} />
                <Text style={styles.endBtnText}>END RIDE</Text>
              </TouchableOpacity>
            </View>
          )}

          {tripStatus === 'paused' && (
            <View style={styles.activeBtnGroup}>
              <TouchableOpacity style={styles.resumeBtn} onPress={resumeRide} activeOpacity={0.8}>
                <Play size={22} color={CYANIDE_THEME.bg} fill={CYANIDE_THEME.bg} />
                <Text style={styles.resumeBtnText}>RESUME</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.endBtn} onPress={handleEndRide} activeOpacity={0.8}>
                <Square size={22} color={CYANIDE_THEME.textPrimary} fill={CYANIDE_THEME.textPrimary} />
                <Text style={styles.endBtnText}>END RIDE</Text>
              </TouchableOpacity>
            </View>
          )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CYANIDE_THEME.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  bikeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    color: CYANIDE_THEME.textSecondary,
  },
  simRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  simToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  simToggleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: CYANIDE_THEME.primary,
  },
  simText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
  },
  simTextActive: {
    color: CYANIDE_THEME.primary,
  },
  recoveryBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: CYANIDE_THEME.warning,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  recoveryTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recoveryTitle: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    color: CYANIDE_THEME.warning,
  },
  recoverySub: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textSecondary,
    marginVertical: 4,
  },
  recoveryActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  recoverBtn: {
    flex: 1,
    backgroundColor: CYANIDE_THEME.warning,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  recoverBtnText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '900',
    color: CYANIDE_THEME.bg,
  },
  discardBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    alignItems: 'center',
  },
  discardBtnText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: CYANIDE_THEME.textMuted,
  },
  primaryDistanceCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  primaryDistanceVal: {
    fontFamily: 'monospace',
    fontSize: 34,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
    letterSpacing: -1,
  },
  primaryDistanceLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.primary,
    letterSpacing: 2,
    marginTop: 2,
  },
  metricsGrid: {
    gap: 10,
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  controlsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYANIDE_THEME.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: CYANIDE_THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnText: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
    color: CYANIDE_THEME.bg,
    letterSpacing: 1.5,
  },
  activeBtnGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYANIDE_THEME.card,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  pauseBtnText: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '800',
    color: CYANIDE_THEME.textPrimary,
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYANIDE_THEME.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  resumeBtnText: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '900',
    color: CYANIDE_THEME.bg,
  },
  endBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYANIDE_THEME.danger,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  endBtnText: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
  },
});
