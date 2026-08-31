import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Bike, Fuel, Wrench, Plus, Gauge, Edit3 } from 'lucide-react-native';
import { dbService } from '../../database/db';
import { Bike as BikeType, FuelLog, Maintenance } from '../../utils/mockData';
import { FuelCard } from '../../components/FuelCard';
import { MaintenanceCard } from '../../components/MaintenanceCard';
import { useFocusEffect, Stack } from 'expo-router';
import { useSettings } from '../../context/SettingsContext';

export default function GarageScreen() {
  const { settings, theme } = useSettings();
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [activeBike, setActiveBike] = useState<BikeType | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [tab, setTab] = useState<'fuel' | 'maintenance'>('fuel');

  // Modals state
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showEditBikeModal, setShowEditBikeModal] = useState(false);

  // Form states for Fuel & Maintenance
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [maintType, setMaintType] = useState('Engine Oil');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintInterval, setMaintInterval] = useState('2000');

  // Form states for Editing Bike Profile
  const [bikeName, setBikeName] = useState('');
  const [bikeMake, setBikeMake] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [bikeYear, setBikeYear] = useState('');
  const [bikeOdo, setBikeOdo] = useState('');

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

  const openEditBikeModal = () => {
    if (!activeBike) return;
    setBikeName(activeBike.name);
    setBikeMake(activeBike.make);
    setBikeModel(activeBike.model);
    setBikeYear(activeBike.year.toString());
    setBikeOdo(activeBike.current_odometer.toString());
    setShowEditBikeModal(true);
  };

  const handleSaveBike = async () => {
    if (!activeBike) return;
    await dbService.saveBike({
      id: activeBike.id,
      name: bikeName.trim() || activeBike.name,
      make: bikeMake.trim() || activeBike.make,
      model: bikeModel.trim() || activeBike.model,
      year: parseInt(bikeYear, 10) || activeBike.year,
      current_odometer: parseFloat(bikeOdo) || activeBike.current_odometer,
    });
    setShowEditBikeModal(false);
    loadGarage();
  };

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

  // Calculate Real-World Fuel Economy (km/L or MPG)
  const calculateAvgEconomy = () => {
    if (fuelLogs.length >= 2) {
      const sortedLogs = [...fuelLogs].sort((a, b) => a.odometer_km - b.odometer_km);
      let totalDist = 0;
      let totalLiters = 0;

      for (let i = 1; i < sortedLogs.length; i++) {
        const dist = sortedLogs[i].odometer_km - sortedLogs[i - 1].odometer_km;
        const liters = sortedLogs[i].liters;
        if (dist > 0 && liters > 0) {
          totalDist += dist;
          totalLiters += liters;
        }
      }

      if (totalLiters > 0 && totalDist > 0) {
        const economyKmL = totalDist / totalLiters;
        if (settings.distanceUnit === 'mi') {
          return `${(economyKmL * 2.35215).toFixed(1)} MPG`;
        }
        return `${economyKmL.toFixed(1)} km/L`;
      }
    }

    if (fuelLogs.length === 1 && activeBike) {
      const initialLog = fuelLogs[0];
      const distTraveled = activeBike.current_odometer - initialLog.odometer_km;
      if (distTraveled > 0 && initialLog.liters > 0) {
        const economyKmL = distTraveled / initialLog.liters;
        if (settings.distanceUnit === 'mi') {
          return `${(economyKmL * 2.35215).toFixed(1)} MPG`;
        }
        return `${economyKmL.toFixed(1)} km/L`;
      }
    }

    return settings.distanceUnit === 'mi' ? '-- MPG' : '-- km/L';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen
        options={{
          title: 'GARAGE & SERVICE',
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

        {/* Bike Profile Card */}
        {activeBike && (
          <View style={[styles.bikeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.bikeHeader}>
              <View style={[styles.bikeIconBox, { backgroundColor: theme.glowBg, borderColor: theme.primary }]}>
                <Bike size={24} color={theme.primary} />
              </View>
              <View style={styles.bikeTitleBox}>
                <Text style={[styles.bikeName, { color: theme.textPrimary }]}>{activeBike.name}</Text>
                <Text style={[styles.bikeSub, { color: theme.textMuted }]}>
                  {activeBike.make} {activeBike.model} ({activeBike.year})
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.editBikeBtn, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder }]}
                onPress={openEditBikeModal}
              >
                <Edit3 size={14} color={theme.primary} />
                <Text style={[styles.editBikeBtnText, { color: theme.primary }]}>EDIT</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.odoContainer, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder }]}>
              <View style={styles.odoBox}>
                <Gauge size={14} color={theme.primary} />
                <Text style={[styles.odoLabel, { color: theme.textMuted }]}>DIGITAL ODOMETER</Text>
              </View>
              <Text style={[styles.odoVal, { color: theme.primary }]}>{activeBike.current_odometer.toLocaleString()} km</Text>
            </View>
          </View>
        )}

        {/* Fuel Economy Highlights */}
        <View style={[styles.efficiencyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.effLeft}>
            <Fuel size={20} color={theme.primary} />
            <View>
              <Text style={[styles.effVal, { color: theme.textPrimary }]}>{calculateAvgEconomy()}</Text>
              <Text style={[styles.effLabel, { color: theme.textMuted }]}>
                CALCULATED FUEL ECONOMY ({settings.distanceUnit === 'mi' ? 'MPG' : 'KM/L'})
              </Text>
            </View>
          </View>
        </View>

        {/* Sub-tabs for Fuel vs Maintenance */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.subTab,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              tab === 'fuel' && { borderColor: theme.primary, backgroundColor: theme.cardHover },
            ]}
            onPress={() => setTab('fuel')}
          >
            <Fuel size={14} color={tab === 'fuel' ? theme.primary : theme.textMuted} />
            <Text style={[styles.subTabText, { color: theme.textMuted }, tab === 'fuel' && { color: theme.primary }]}>
              FUEL LOGS ({fuelLogs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subTab,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              tab === 'maintenance' && { borderColor: theme.primary, backgroundColor: theme.cardHover },
            ]}
            onPress={() => setTab('maintenance')}
          >
            <Wrench
              size={14}
              color={tab === 'maintenance' ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.subTabText, { color: theme.textMuted }, tab === 'maintenance' && { color: theme.primary }]}>
              MAINTENANCE ({maintenance.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Entry Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => (tab === 'fuel' ? setShowFuelModal(true) : setShowMaintModal(true))}
        >
          <Plus size={18} color={theme.bg} />
          <Text style={[styles.addBtnText, { color: theme.bg }]}>
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

        {/* Edit Bike Profile Modal */}
        <Modal visible={showEditBikeModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { backgroundColor: theme.modalBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>EDIT BIKE PROFILE</Text>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>BIKE NAME / DISPLAY TITLE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. Hunter 350 / Speedster"
                placeholderTextColor={theme.textMuted}
                value={bikeName}
                onChangeText={setBikeName}
              />

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>MAKE (MANUFACTURER)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. Royal Enfield"
                placeholderTextColor={theme.textMuted}
                value={bikeMake}
                onChangeText={setBikeMake}
              />

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>MODEL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. Hunter 350"
                placeholderTextColor={theme.textMuted}
                value={bikeModel}
                onChangeText={setBikeModel}
              />

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>YEAR</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. 2024"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={bikeYear}
                onChangeText={setBikeYear}
              />

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CURRENT ODOMETER (KM)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. 4250"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={bikeOdo}
                onChangeText={setBikeOdo}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalCancel, { borderColor: theme.cardBorder }]}
                  onPress={() => setShowEditBikeModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSave, { backgroundColor: theme.primary }]} onPress={handleSaveBike}>
                  <Text style={[styles.modalSaveText, { color: theme.bg }]}>SAVE CHANGES</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Fuel Modal */}
        <Modal visible={showFuelModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { backgroundColor: theme.modalBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>LOG FUEL FILL-UP</Text>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>LITERS ADDED</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. 8.5"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={fuelLiters}
                onChangeText={setFuelLiters}
              />

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>TOTAL COST ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. 14.20"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={fuelCost}
                onChangeText={setFuelCost}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalCancel, { borderColor: theme.cardBorder }]}
                  onPress={() => setShowFuelModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSave, { backgroundColor: theme.primary }]} onPress={handleAddFuel}>
                  <Text style={[styles.modalSaveText, { color: theme.bg }]}>SAVE LOG</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Maintenance Modal */}
        <Modal visible={showMaintModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { backgroundColor: theme.modalBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>LOG MAINTENANCE</Text>

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>SERVICE TYPE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. Engine Oil / Chain Lube"
                placeholderTextColor={theme.textMuted}
                value={maintType}
                onChangeText={setMaintType}
              />

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>DESCRIPTION / NOTES</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. Motul 10W40 synthetic"
                placeholderTextColor={theme.textMuted}
                value={maintDesc}
                onChangeText={setMaintDesc}
              />

              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>NEXT SERVICE INTERVAL (KM)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.cardHover, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="e.g. 2000"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={maintInterval}
                onChangeText={setMaintInterval}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalCancel, { borderColor: theme.cardBorder }]}
                  onPress={() => setShowMaintModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSave, { backgroundColor: theme.primary }]} onPress={handleAddMaintenance}>
                  <Text style={[styles.modalSaveText, { color: theme.bg }]}>SAVE SERVICE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  bikeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bikeTitleBox: {
    flex: 1,
    gap: 2,
  },
  bikeName: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
  },
  bikeSub: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  editBikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBikeBtnText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  odoContainer: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
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
  },
  odoVal: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
  },
  efficiencyCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
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
  },
  effLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
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
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  subTabText: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 14,
  },
  addBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
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
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'monospace',
    fontSize: 14,
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
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
  },
});
