import { Stack, useFocusEffect } from 'expo-router';
import { Award, Clock, Compass, Flame, Gauge } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatCard } from '../../components/StatCard';
import CYANIDE_THEME from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';
import { dbService } from '../../database/db';
import { formatDistance, formatDuration, formatSpeed } from '../../utils/formatting';
import { Trip } from '../../utils/mockData';

export default function StatisticsScreen() {
  const { settings } = useSettings();
  const [period, setPeriod] = useState<'lifetime' | 'monthly' | 'weekly'>('lifetime');
  const [trips, setTrips] = useState<Trip[]>([]);

  const loadData = async () => {
    const data = await dbService.getTrips();
    setTrips(data);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  // Filter trips by selected period
  const filteredTrips = trips.filter((t) => {
    if (period === 'lifetime') return true;
    const tripDate = new Date(t.started_at).getTime();
    const now = Date.now();
    if (period === 'weekly') return now - tripDate <= 7 * 86400000;
    if (period === 'monthly') return now - tripDate <= 30 * 86400000;
    return true;
  });

  // Calculate Aggregates
  const totalDistanceKm = filteredTrips.reduce((acc, t) => acc + (t.distance_km || 0), 0);
  const totalTrips = filteredTrips.length;
  const totalDurationSec = filteredTrips.reduce((acc, t) => acc + (t.duration_seconds || 0), 0);
  const avgTripDistanceKm = totalTrips > 0 ? totalDistanceKm / totalTrips : 0;

  const topMaxSpeedKmh = filteredTrips.reduce((acc, t) => Math.max(acc, t.max_speed_kmh || 0), 0);
  const longestTripKm = filteredTrips.reduce((acc, t) => Math.max(acc, t.distance_km || 0), 0);

  const overallMovingSec = filteredTrips.reduce((acc, t) => acc + (t.moving_seconds || 0), 0);
  const overallAvgSpeedKmh =
    overallMovingSec > 0 ? (totalDistanceKm / (overallMovingSec / 3600)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'ANALYTICS',
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

        {/* Period Tabs */}
        <View style={styles.tabContainer}>
          {(['lifetime', 'monthly', 'weekly'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.tabBtn, period === p && styles.tabBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.tabText, period === p && styles.tabTextActive]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Primary Key Metric Banner */}
        <View style={styles.heroCard}>
          <Compass size={24} color={CYANIDE_THEME.primary} />
          <Text style={styles.heroVal}>
            {formatDistance(totalDistanceKm, settings.distanceUnit)}
          </Text>
          <Text style={styles.heroLabel}>TOTAL DISTANCE COVERED</Text>
        </View>

        {/* 2x2 Primary Grid */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard
              label="TOTAL TRIPS"
              value={totalTrips}
              icon={<Award size={14} color={CYANIDE_THEME.primary} />}
            />
            <StatCard
              label="RIDING TIME"
              value={formatDuration(totalDurationSec)}
              icon={<Clock size={14} color={CYANIDE_THEME.primaryGlow} />}
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="AVG SPEED"
              value={formatSpeed(overallAvgSpeedKmh, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Gauge size={14} color={CYANIDE_THEME.primary} />}
            />
            <StatCard
              label="TOP MAX SPEED"
              value={formatSpeed(topMaxSpeedKmh, settings.speedUnit)}
              unit={settings.speedUnit.toUpperCase()}
              icon={<Flame size={14} color={CYANIDE_THEME.danger} />}
              highlight
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              label="AVG TRIP DISTANCE"
              value={formatDistance(avgTripDistanceKm, settings.distanceUnit)}
            />
            <StatCard
              label="LONGEST SINGLE RIDE"
              value={formatDistance(longestTripKm, settings.distanceUnit)}
            />
          </View>
        </View>

        {/* Trip Category Distribution */}
        <Text style={styles.sectionHeader}>RIDE CATEGORY BREAKDOWN</Text>
        <View style={styles.breakdownCard}>
          {['Personal', 'Commute', 'Tour'].map((cat) => {
            const count = filteredTrips.filter((t) => t.trip_type === cat).length;
            const pct = totalTrips > 0 ? Math.round((count / totalTrips) * 100) : 0;
            return (
              <View key={cat} style={styles.breakdownRow}>
                <View style={styles.catLeft}>
                  <Text style={styles.catName}>{cat}</Text>
                  <Text style={styles.catCount}>{count} rides</Text>
                </View>

                <View style={styles.barContainer}>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.pctText}>{pct}%</Text>
                </View>
              </View>
            );
          })}
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
    marginBottom: 14,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: CYANIDE_THEME.primary,
  },
  tabText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.textMuted,
  },
  tabTextActive: {
    color: CYANIDE_THEME.bg,
  },
  heroCard: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    marginBottom: 14,
  },
  heroVal: {
    fontFamily: 'monospace',
    fontSize: 38,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
    marginVertical: 4,
    letterSpacing: -1,
  },
  heroLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.primary,
    letterSpacing: 2,
  },
  grid: {
    gap: 10,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionHeader: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: CYANIDE_THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    gap: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLeft: {
    width: 90,
  },
  catName: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    color: CYANIDE_THEME.textPrimary,
  },
  catCount: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: CYANIDE_THEME.textMuted,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#26262c',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: CYANIDE_THEME.primary,
    borderRadius: 4,
  },
  pctText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    color: CYANIDE_THEME.textSecondary,
    width: 40,
    textAlign: 'right',
  },
});
