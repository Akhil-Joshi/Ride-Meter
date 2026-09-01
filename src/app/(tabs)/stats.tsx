import { router, Stack, useFocusEffect } from 'expo-router';
import { Award, ChartBar, Clock, Compass, Flame, Gauge } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { CardSkeleton } from '../../components/SkeletonLoader';
import { StatCard } from '../../components/StatCard';
import { useSettings } from '../../context/SettingsContext';
import { dbService } from '../../database/db';
import { formatDistance, formatDuration, formatSpeed } from '../../utils/formatting';
import { Trip } from '../../utils/mockData';

export default function StatisticsScreen() {
  const { settings, theme } = useSettings();
  const [period, setPeriod] = useState<'lifetime' | 'monthly' | 'weekly'>('lifetime');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await dbService.getTrips();
      setTrips(data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          title: 'Analytics',
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

        {/* Period Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {(['lifetime', 'monthly', 'weekly'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.tabBtn, period === p && { backgroundColor: theme.primary }]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: theme.textMuted },
                  period === p && { color: theme.bg },
                ]}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <CardSkeleton count={3} />
        ) : totalTrips === 0 ? (
          <EmptyState
            icon={<ChartBar size={24} color={theme.primary} />}
            title="NO ANALYTICS DATA YET"
            description="Record motorcycle rides to view detailed speed trends, distance stats, and category breakdowns."
            actionLabel="START YOUR FIRST RIDE"
            onAction={() => router.push('/')}
          />
        ) : (
          <>
            {/* Primary Key Metric Banner */}
            <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Compass size={24} color={theme.primary} />
              <Text style={[styles.heroVal, { color: theme.textPrimary }]}>
                {formatDistance(totalDistanceKm, settings.distanceUnit)}
              </Text>
              <Text style={[styles.heroLabel, { color: theme.primary }]}>TOTAL DISTANCE COVERED</Text>
            </View>

            {/* 2x2 Primary Grid */}
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatCard
                  label="TOTAL TRIPS"
                  value={totalTrips}
                  icon={<Award size={14} color={theme.primary} />}
                />
                <StatCard
                  label="RIDING TIME"
                  value={formatDuration(totalDurationSec)}
                  icon={<Clock size={14} color={theme.primaryGlow} />}
                />
              </View>

              <View style={styles.gridRow}>
                <StatCard
                  label="AVG SPEED"
                  value={formatSpeed(overallAvgSpeedKmh, settings.speedUnit)}
                  unit={settings.speedUnit.toUpperCase()}
                  icon={<Gauge size={14} color={theme.primary} />}
                />
                <StatCard
                  label="TOP MAX SPEED"
                  value={formatSpeed(topMaxSpeedKmh, settings.speedUnit)}
                  unit={settings.speedUnit.toUpperCase()}
                  icon={<Flame size={14} color={theme.danger} />}
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
            <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>RIDE CATEGORY BREAKDOWN</Text>
            <View style={[styles.breakdownCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {['Personal', 'Commute', 'Tour'].map((cat) => {
                const count = filteredTrips.filter((t) => t.trip_type === cat).length;
                const pct = totalTrips > 0 ? Math.round((count / totalTrips) * 100) : 0;
                return (
                  <View key={cat} style={styles.breakdownRow}>
                    <View style={styles.catLeft}>
                      <Text style={[styles.catName, { color: theme.textPrimary }]}>{cat}</Text>
                      <Text style={[styles.catCount, { color: theme.textMuted }]}>{count} rides</Text>
                    </View>

                    <View style={styles.barContainer}>
                      <View style={[styles.barBg, { backgroundColor: theme.gaugeArcBg }]}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
                      </View>
                      <Text style={[styles.pctText, { color: theme.textSecondary }]}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  heroVal: {
    fontFamily: 'monospace',
    fontSize: 38,
    fontWeight: '900',
    marginVertical: 4,
    letterSpacing: -1,
  },
  heroLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
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
    letterSpacing: 1,
    marginBottom: 10,
  },
  breakdownCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
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
  },
  catCount: {
    fontFamily: 'monospace',
    fontSize: 10,
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
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  pctText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    width: 40,
    textAlign: 'right',
  },
});
