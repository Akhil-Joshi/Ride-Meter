import { router, Stack, useFocusEffect } from 'expo-router';
import { Award, ChartBar, Clock, Compass, Flame, Gauge } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../../../components/EmptyState';
import { CardSkeleton } from '../../../components/SkeletonLoader';
import { StatCard } from '../../../components/StatCard';
import { useSettings } from '../../../context/SettingsContext';
import { dbService } from '../../../database/db';
import { formatDistance, formatDuration, formatSpeed } from '../../../utils/formatting';
import { Trip } from '../../../utils/mockData';

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
      <Stack.Screen options={{ title: 'Analytics' }} />
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
        ) : filteredTrips.length === 0 ? (
          <EmptyState
            icon={<ChartBar size={24} color={theme.primary} />}
            title="NO ANALYTICS DATA"
            description="Complete your first trip to unlock performance trends, top speed analytics, and riding stats."
            actionLabel="GO TO DASHBOARD"
            onAction={() => router.push('/(tabs)/index')}
          />
        ) : (
          <>
            {/* Primary Stat Grid */}
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <StatCard
                  label="TOTAL DISTANCE"
                  value={formatDistance(totalDistanceKm, settings.distanceUnit)}
                  highlight
                />
                <StatCard label="TOTAL TRIPS" value={totalTrips.toString()} />
              </View>

              <View style={styles.gridRow}>
                <StatCard
                  label="TOTAL TIME"
                  value={formatDuration(totalDurationSec)}
                  icon={<Clock size={14} color={theme.primary} />}
                />
                <StatCard
                  label="AVG TRIP DISTANCE"
                  value={formatDistance(avgTripDistanceKm, settings.distanceUnit)}
                  icon={<Compass size={14} color={theme.primaryGlow} />}
                />
              </View>

              <View style={styles.gridRow}>
                <StatCard
                  label="RECORD TOP SPEED"
                  value={formatSpeed(topMaxSpeedKmh, settings.speedUnit)}
                  unit={settings.speedUnit.toUpperCase()}
                  icon={<Flame size={14} color={theme.warning} />}
                />
                <StatCard
                  label="OVERALL AVG SPEED"
                  value={formatSpeed(overallAvgSpeedKmh, settings.speedUnit)}
                  unit={settings.speedUnit.toUpperCase()}
                  icon={<Gauge size={14} color={theme.primary} />}
                />
              </View>
            </View>

            {/* Performance Highlights Section */}
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PERFORMANCE HIGHLIGHTS</Text>
            <View style={[styles.highlightCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.highlightRow}>
                <Award size={18} color={theme.warning} />
                <View style={styles.highlightTextGroup}>
                  <Text style={[styles.highlightLabel, { color: theme.textMuted }]}>LONGEST SINGLE RIDE</Text>
                  <Text style={[styles.highlightVal, { color: theme.textPrimary }]}>
                    {formatDistance(longestTripKm, settings.distanceUnit)}
                  </Text>
                </View>
              </View>
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
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  grid: {
    gap: 10,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  highlightCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightTextGroup: {
    gap: 2,
  },
  highlightLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  highlightVal: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
  },
});
