import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bike, Fuel, Wrench, Plus, Gauge, Check } from 'lucide-react-native';
import CYANIDE_THEME from '../../constants/colors';
import { dbService } from '../../database/db';
import { Bike as BikeType, FuelLog, Maintenance } from '../../utils/mockData';
import { FuelCard } from '../../components/FuelCard';
import { MaintenanceCard } from '../../components/MaintenanceCard';
import { useFocusEffect, Stack } from 'expo-router';

export default function GarageScreen() {
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [activeBike, setActiveBike] = useState<BikeType | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [tab, setTab] = useState<'fuel' | 'maintenance'>('fuel');

  // Modals state
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);

  // Form states
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [maintType, setMaintType] = useState('Engine Oil');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintInterval, setMaintInterval] = useState('2000');

  const loadGarage = async () => {
    const bikesData = await dbService.getBikes();
    setBikes(bikesData);
    if (bikesData.length > 0) setActiveBike(bikesData[0]);

    const fuelData = await dbService.getFuelLogs();
    setFuelLogs(fuelData);

    const maintData = await dbService.getMaintenanceLogs();
    setMaintenance(maintData);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadGarage();
    }, [])
  );

  const handleAddFuel = async () => {
    if (!fuelLiters || !fuelCost || !activeBike) return;
    const liters = parseFloat(fuelLiters);
    const cost = parseFloat(fuelCost);
    await dbService.addFuelLog({
      bike_id: activeBike.id,
      odometer_km: activeBike.current_odometer,
      liters,
      cost,
      price_per_liter: cost / liters,
      is_full_tank: 1,
    });
    setFuelLiters('');
    setFuelCost('');
    setShowFuelModal(false);
    loadGarage();
  };

  const handleAddMaintenance = async () => {
    if (!maintType || !activeBike) return;
    const interval = parseFloat(maintInterval) || 2000;
    await dbService.addMaintenanceLog({
      bike_id: activeBike.id,
      type: maintType,
      description: maintDesc || `${maintType} completed.`,
      odometer_km: activeBike.current_odometer,
      next_service_km: activeBike.current_odometer + interval,
    });
    setMaintDesc('');
    setShowMaintModal(false);
    loadGarage();
  };

  // Calculate Fuel Economy (km/L)
  const calculateAvgEconomy = () => {
    if (fuelLogs.length < 2) return '42.5';
    const totalLiters = fuelLogs.reduce((acc, f) => acc + f.liters, 0);
    const odoDiff = Math.abs(fuelLogs[0].odometer_km - fuelLogs[fuelLogs.length - 1].odometer_km);
    return totalLiters > 0 && odoDiff > 0 ? (odoDiff / totalLiters).toFixed(1) : '42.5';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'GARAGE & SERVICE',
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

        {/* Bike Profile Card */}
        {activeBike && (
          <View style={styles.bikeCard}>
            <View style={styles.bikeHeader}>
              <View style={styles.bikeIconBox}>
                <Bike size={24} color={CYANIDE_THEME.primary} />
              </View>
              <View style={styles.bikeTitleBox}>
                <Text style={styles.bikeName}>{activeBike.name}</Text>
                <Text style={styles.bikeSub}>
                  {activeBike.make} {activeBike.model} ({activeBike.year})
                </Text>
              </View>
            </View>

            <View style={styles.odoContainer}>
              <View style={styles.odoBox}>
                <Gauge size={14} color={CYANIDE_THEME.primary} />
                <Text style={styles.odoLabel}>DIGITAL ODOMETER</Text>
              </View>
              <Text style={styles.odoVal}>{activeBike.current_odometer.toLocaleString()} km</Text>
            </View>
          </View>
        )}

        {/* Fuel Economy Highlights */}
        <View style={styles.efficiencyCard}>
          <View style={styles.effLeft}>
            <Fuel size={20} color={CYANIDE_THEME.primary} />
            <View>
              <Text style={styles.effVal}>{calculateAvgEconomy()} km/L</Text>
              <Text style={styles.effLabel}>AVERAGE FUEL ECONOMY</Text>
            </View>
          </View>
        </View>

        {/* Sub-tabs for Fuel vs Maintenance */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.subTab, tab === 'fuel' && styles.subTabActive]}
            onPress={() => setTab('fuel')}
          >
            <Fuel size={14} color={tab === 'fuel' ? CYANIDE_THEME.primary : CYANIDE_THEME.textMuted} />
            <Text style={[styles.subTabText, tab === 'fuel' && styles.subTabTextActive]}>
              FUEL LOGS ({fuelLogs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subTab, tab === 'maintenance' && styles.subTabActive]}
            onPress={() => setTab('maintenance')}
          >
            <Wrench
              size={14}
              color={tab === 'maintenance' ? CYANIDE_THEME.primary : CYANIDE_THEME.textMuted}
            />
            <Text style={[styles.subTabText, tab === 'maintenance' && styles.subTabTextActive]}>
              MAINTENANCE ({maintenance.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Entry Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => (tab === 'fuel' ? setShowFuelModal(true) : setShowMaintModal(true))}
        >
          <Plus size={18} color={CYANIDE_THEME.bg} />
          <Text style={styles.addBtnText}>
            {tab === 'fuel' ? 'ADD FUEL FILL-UP' : 'ADD SERVICE LOG'}
          </Text>
        </TouchableOpacity>

        {/* List Content */}
        {tab === 'fuel' ? (
          <View>
            {fuelLogs.map((log) => (
              <FuelCard key={log.id} log={log} />
            ))}
          </View>
        ) : (
          <View>
            {maintenance.map((item) => (
              <MaintenanceCard
                key={item.id}
                item={item}
                currentOdometer={activeBike?.current_odometer || 0}
              />
            ))}
          </View>
        )}

        {/* Add Fuel Modal */}
        <Modal visible={showFuelModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>LOG FUEL FILL-UP</Text>

              <Text style={styles.inputLabel}>LITERS ADDED</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 8.5"
                placeholderTextColor={CYANIDE_THEME.textMuted}
                keyboardType="numeric"
                value={fuelLiters}
                onChangeText={setFuelLiters}
              />

              <Text style={styles.inputLabel}>TOTAL COST ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 14.20"
                placeholderTextColor={CYANIDE_THEME.textMuted}
                keyboardType="numeric"
                value={fuelCost}
                onChangeText={setFuelCost}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowFuelModal(false)}
                >
                  <Text style={styles.modalCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleAddFuel}>
                  <Text style={styles.modalSaveText}>SAVE LOG</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Maintenance Modal */}
        <Modal visible={showMaintModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>LOG MAINTENANCE</Text>

              <Text style={styles.inputLabel}>SERVICE TYPE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Engine Oil / Chain Lube"
                placeholderTextColor={CYANIDE_THEME.textMuted}
                value={maintType}
                onChangeText={setMaintType}
              />

              <Text style={styles.inputLabel}>DESCRIPTION / NOTES</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Motul 10W40 synthetic"
                placeholderTextColor={CYANIDE_THEME.textMuted}
                value={maintDesc}
                onChangeText={setMaintDesc}
              />

              <Text style={styles.inputLabel}>NEXT SERVICE INTERVAL (KM)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2000"
                placeholderTextColor={CYANIDE_THEME.textMuted}
                keyboardType="numeric"
                value={maintInterval}
                onChangeText={setMaintInterval}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowMaintModal(false)}
                >
                  <Text style={styles.modalCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleAddMaintenance}>
                  <Text style={styles.modalSaveText}>SAVE SERVICE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  bikeCard: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    marginBottom: 12,
  },
  bikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  bikeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  bikeTitleBox: {
    gap: 2,
  },
  bikeName: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
  },
  bikeSub: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: CYANIDE_THEME.textMuted,
  },
  odoContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  odoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  odoLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
  },
  odoVal: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
    color: CYANIDE_THEME.primary,
  },
  efficiencyCard: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    marginBottom: 14,
  },
  effLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  effVal: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
  },
  effLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: CYANIDE_THEME.card,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  subTabActive: {
    borderColor: CYANIDE_THEME.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  subTabText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
    color: CYANIDE_THEME.textMuted,
  },
  subTabTextActive: {
    color: CYANIDE_THEME.primary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYANIDE_THEME.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  addBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
    color: CYANIDE_THEME.bg,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: CYANIDE_THEME.modalBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '900',
    color: CYANIDE_THEME.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: CYANIDE_THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'monospace',
    fontSize: 14,
    color: CYANIDE_THEME.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYANIDE_THEME.cardBorder,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    color: CYANIDE_THEME.textMuted,
  },
  modalSave: {
    flex: 1,
    backgroundColor: CYANIDE_THEME.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
    color: CYANIDE_THEME.bg,
  },
});
