import { Stack, useFocusEffect } from 'expo-router';
import { Bike, Edit3, Fuel, Gauge, Plus, Wrench } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../../components/EmptyState';
import { FuelCard } from '../../../components/FuelCard';
import { MaintenanceCard } from '../../../components/MaintenanceCard';
import { CardSkeleton } from '../../../components/SkeletonLoader';
import { useSettings } from '../../../context/SettingsContext';
import { dbService } from '../../../database/db';
import { Bike as BikeType, FuelLog, Maintenance } from '../../../utils/mockData';

export default function GarageScreen() {
  const { settings, theme } = useSettings();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [activeBike, setActiveBike] = useState<BikeType | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [tab, setTab] = useState<'fuel' | 'maintenance'>('fuel');

  // Modals state
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showEditBikeModal, setShowEditBikeModal] = useState(false);

  // Edit Modals state
  const [editingFuel, setEditingFuel] = useState<FuelLog | null>(null);
  const [editingMaint, setEditingMaint] = useState<Maintenance | null>(null);

  // Form states for Add Fuel & Maintenance
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [maintType, setMaintType] = useState('Engine Oil');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintInterval, setMaintInterval] = useState('2000');

  // Form states for Edit Fuel
  const [editFuelLiters, setEditFuelLiters] = useState('');
  const [editFuelCost, setEditFuelCost] = useState('');
  const [editFuelOdo, setEditFuelOdo] = useState('');
  const [editFuelNotes, setEditFuelNotes] = useState('');

  // Form states for Edit Maintenance
  const [editMaintType, setEditMaintType] = useState('');
  const [editMaintDesc, setEditMaintDesc] = useState('');
  const [editMaintOdo, setEditMaintOdo] = useState('');
  const [editMaintNextOdo, setEditMaintNextOdo] = useState('');

  // Form states for Editing/Adding Bike Profile
  const [bikeName, setBikeName] = useState('');
  const [bikeMake, setBikeMake] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [bikeYear, setBikeYear] = useState('');
  const [bikeOdo, setBikeOdo] = useState('');

  const loadGarage = async () => {
    try {
      const bikesData = await dbService.getBikes();
      setBikes(bikesData);
      if (bikesData.length > 0) {
        setActiveBike(bikesData[0]);
      } else {
        setActiveBike(null);
      }

      const fuelData = await dbService.getFuelLogs();
      setFuelLogs(fuelData);

      const maintData = await dbService.getMaintenanceLogs();
      setMaintenance(maintData);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadGarage();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadGarage();
    setRefreshing(false);
  }, []);

  const openAddOrEditBikeModal = () => {
    if (activeBike) {
      setBikeName(activeBike.name);
      setBikeMake(activeBike.make);
      setBikeModel(activeBike.model);
      setBikeYear(activeBike.year.toString());
      setBikeOdo(activeBike.current_odometer.toString());
    } else {
      setBikeName('');
      setBikeMake('');
      setBikeModel('');
      setBikeYear(new Date().getFullYear().toString());
      setBikeOdo('0');
    }
    setShowEditBikeModal(true);
  };

  const handleSaveBike = async () => {
    await dbService.saveBike({
      id: activeBike ? activeBike.id : undefined,
      name: bikeName.trim() || 'My Motorcycle',
      make: bikeMake.trim() || 'Motorcycle',
      model: bikeModel.trim() || 'Standard',
      year: parseInt(bikeYear, 10) || new Date().getFullYear(),
      initial_odometer: parseFloat(bikeOdo) || 0,
      current_odometer: parseFloat(bikeOdo) || 0,
    });
    setShowEditBikeModal(false);
    loadGarage();
  };

  const handleAddFuel = async () => {
    if (!fuelLiters || !fuelCost) return;
    const liters = parseFloat(fuelLiters);
    const cost = parseFloat(fuelCost);
    await dbService.addFuelLog({
      bike_id: activeBike ? activeBike.id : 1,
      odometer_km: activeBike ? activeBike.current_odometer : 0,
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

  const handleOpenEditFuel = (log: FuelLog) => {
    setEditingFuel(log);
    setEditFuelLiters(log.liters.toString());
    setEditFuelCost(log.cost.toString());
    setEditFuelOdo(log.odometer_km.toString());
    setEditFuelNotes(log.notes || '');
  };

  const handleSaveEditFuel = async () => {
    if (!editingFuel) return;
    const liters = parseFloat(editFuelLiters) || editingFuel.liters;
    const cost = parseFloat(editFuelCost) || editingFuel.cost;
    const odo = parseFloat(editFuelOdo) || editingFuel.odometer_km;
    await dbService.updateFuelLog({
      id: editingFuel.id,
      liters,
      cost,
      price_per_liter: liters > 0 ? cost / liters : 0,
      odometer_km: odo,
      notes: editFuelNotes,
    });
    setEditingFuel(null);
    loadGarage();
  };

  const handleDeleteFuel = (id: number) => {
    Alert.alert(
      'Delete Fuel Log',
      'Are you sure you want to delete this fill-up log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dbService.deleteFuelLog(id);
            loadGarage();
          },
        },
      ]
    );
  };

  const handleAddMaintenance = async () => {
    if (!maintType) return;
    const interval = parseFloat(maintInterval) || 2000;
    const odo = activeBike ? activeBike.current_odometer : 0;
    await dbService.addMaintenanceLog({
      bike_id: activeBike ? activeBike.id : 1,
      type: maintType,
      description: maintDesc || `${maintType} completed.`,
      odometer_km: odo,
      next_service_km: odo + interval,
    });
    setMaintDesc('');
    setShowMaintModal(false);
    loadGarage();
  };

  const handleOpenEditMaint = (item: Maintenance) => {
    setEditingMaint(item);
    setEditMaintType(item.type);
    setEditMaintDesc(item.description);
    setEditMaintOdo(item.odometer_km.toString());
    setEditMaintNextOdo(item.next_service_km.toString());
  };

  const handleSaveEditMaint = async () => {
    if (!editingMaint) return;
    await dbService.updateMaintenanceLog({
      id: editingMaint.id,
      type: editMaintType.trim() || editingMaint.type,
      description: editMaintDesc.trim() || editingMaint.description,
      odometer_km: parseFloat(editMaintOdo) || editingMaint.odometer_km,
      next_service_km: parseFloat(editMaintNextOdo) || editingMaint.next_service_km,
    });
    setEditingMaint(null);
    loadGarage();
  };

  const handleDeleteMaintenance = (id: number) => {
    Alert.alert(
      'Delete Service Log',
      'Are you sure you want to delete this maintenance record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dbService.deleteMaintenanceLog(id);
            loadGarage();
          },
        },
      ]
    );
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
      <Stack.Screen options={{ title: 'Service' }} />
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

        {/* Bike Profile Card */}
        {loading ? (
          <CardSkeleton count={1} />
        ) : activeBike ? (
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

              <TouchableOpacity style={styles.editBikeBtn} onPress={openAddOrEditBikeModal}>
                <Edit3 size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.bikeMetricsRow, { borderTopColor: theme.cardBorder }]}>
              <View style={styles.bikeMetric}>
                <Gauge size={14} color={theme.primary} />
                <Text style={[styles.bikeMetricVal, { color: theme.textSecondary }]}>
                  {activeBike.current_odometer.toLocaleString()} {settings.distanceUnit.toUpperCase()}
                </Text>
                <Text style={[styles.bikeMetricLabel, { color: theme.textMuted }]}>ODOMETER</Text>
              </View>

              <View style={styles.bikeMetric}>
                <Fuel size={14} color={theme.warning} />
                <Text style={[styles.bikeMetricVal, { color: theme.textSecondary }]}>{calculateAvgEconomy()}</Text>
                <Text style={[styles.bikeMetricLabel, { color: theme.textMuted }]}>AVG ECONOMY</Text>
              </View>
            </View>
          </View>
        ) : (
          <EmptyState
            icon={<Bike size={24} color={theme.warning} />}
            title="NO MOTORCYCLE PROFILE"
            description="Create your motorcycle profile to start tracking fuel logs, service history, and odometer data."
            actionLabel="ADD MOTORCYCLE PROFILE"
            onAction={openAddOrEditBikeModal}
          />
        )}

        {/* Tab Selector Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              tab === 'fuel' && { borderColor: theme.primary, backgroundColor: theme.cardHover },
            ]}
            onPress={() => setTab('fuel')}
          >
            <Fuel size={16} color={tab === 'fuel' ? theme.primary : theme.textMuted} />
            <Text
              style={[
                styles.tabLabel,
                { color: theme.textMuted },
                tab === 'fuel' && { color: theme.primary },
              ]}
            >
              FUEL LOGS ({fuelLogs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              tab === 'maintenance' && { borderColor: theme.primary, backgroundColor: theme.cardHover },
            ]}
            onPress={() => setTab('maintenance')}
          >
            <Wrench size={16} color={tab === 'maintenance' ? theme.primary : theme.textMuted} />
            <Text
              style={[
                styles.tabLabel,
                { color: theme.textMuted },
                tab === 'maintenance' && { color: theme.primary },
              ]}
            >
              SERVICE ({maintenance.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => (tab === 'fuel' ? setShowFuelModal(true) : setShowMaintModal(true))}
        >
          <Plus size={18} color={theme.bg} />
          <Text style={[styles.addBtnText, { color: theme.bg }]}>
            LOG NEW {tab === 'fuel' ? 'FUEL FILL-UP' : 'SERVICE RECORD'}
          </Text>
        </TouchableOpacity>

        {/* Content List */}
        {loading ? (
          <CardSkeleton count={3} />
        ) : tab === 'fuel' ? (
          fuelLogs.length === 0 ? (
            <EmptyState
              icon={<Fuel size={24} color={theme.primary} />}
              title="NO FUEL LOGS"
              description="Keep track of fuel consumption, total cost, and calculated km/L efficiency by logging your fill-ups."
              actionLabel="LOG FIRST FILL-UP"
              onAction={() => setShowFuelModal(true)}
            />
          ) : (
            fuelLogs.map((item) => (
              <FuelCard
                key={item.id}
                log={item}
                onEdit={() => handleOpenEditFuel(item)}
                onDelete={() => handleDeleteFuel(item.id)}
              />
            ))
          )
        ) : maintenance.length === 0 ? (
          <EmptyState
            icon={<Wrench size={24} color={theme.primary} />}
            title="NO SERVICE RECORDS"
            description="Never miss an oil change or tire replacement. Log your motorcycle maintenance records here."
            actionLabel="LOG FIRST SERVICE"
            onAction={() => setShowMaintModal(true)}
          />
        ) : (
          maintenance.map((item) => (
            <MaintenanceCard
              key={item.id}
              item={item}
              currentOdometer={activeBike?.current_odometer || 0}
              onEdit={() => handleOpenEditMaint(item)}
              onDelete={() => handleDeleteMaintenance(item.id)}
            />
          ))
        )}
      </ScrollView>

      {/* --- ADD FUEL MODAL --- */}
      <Modal visible={showFuelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>LOG FUEL FILL-UP</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>FUEL QUANTITY (LITERS)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              placeholder="e.g. 12.5"
              placeholderTextColor={theme.textMuted}
              value={fuelLiters}
              onChangeText={setFuelLiters}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>TOTAL COST</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              placeholder="e.g. 1850"
              placeholderTextColor={theme.textMuted}
              value={fuelCost}
              onChangeText={setFuelCost}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowFuelModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleAddFuel}>
                <Text style={[styles.modalSubmitText, { color: theme.bg }]}>SAVE LOG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- EDIT FUEL MODAL --- */}
      <Modal visible={!!editingFuel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>EDIT FUEL LOG</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>FUEL QUANTITY (LITERS)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              value={editFuelLiters}
              onChangeText={setEditFuelLiters}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>TOTAL COST</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              value={editFuelCost}
              onChangeText={setEditFuelCost}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>ODOMETER (KM)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              value={editFuelOdo}
              onChangeText={setEditFuelOdo}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>NOTES</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              value={editFuelNotes}
              onChangeText={setEditFuelNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setEditingFuel(null)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleSaveEditFuel}>
                <Text style={[styles.modalSubmitText, { color: theme.bg }]}>UPDATE LOG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- ADD SERVICE MODAL --- */}
      <Modal visible={showMaintModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>LOG MAINTENANCE RECORD</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>SERVICE TYPE</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              placeholder="e.g. Engine Oil, Brake Pads, Chain Lube"
              placeholderTextColor={theme.textMuted}
              value={maintType}
              onChangeText={setMaintType}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>NOTES & DESCRIPTION</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              placeholder="e.g. Changed Motul 7100 10W40 Full Synthetic"
              placeholderTextColor={theme.textMuted}
              value={maintDesc}
              onChangeText={setMaintDesc}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>NEXT SERVICE INTERVAL (KM)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              placeholder="2000"
              placeholderTextColor={theme.textMuted}
              value={maintInterval}
              onChangeText={setMaintInterval}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowMaintModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleAddMaintenance}>
                <Text style={[styles.modalSubmitText, { color: theme.bg }]}>SAVE RECORD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- EDIT SERVICE MODAL --- */}
      <Modal visible={!!editingMaint} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>EDIT SERVICE RECORD</Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>SERVICE TYPE</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              value={editMaintType}
              onChangeText={setEditMaintType}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>NOTES & DESCRIPTION</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              value={editMaintDesc}
              onChangeText={setEditMaintDesc}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>SERVICE ODOMETER (KM)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              value={editMaintOdo}
              onChangeText={setEditMaintOdo}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>NEXT SERVICE DUE (KM)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              value={editMaintNextOdo}
              onChangeText={setEditMaintNextOdo}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setEditingMaint(null)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleSaveEditMaint}>
                <Text style={[styles.modalSubmitText, { color: theme.bg }]}>UPDATE RECORD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- ADD/EDIT MOTORCYCLE PROFILE MODAL --- */}
      <Modal visible={showEditBikeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {activeBike ? 'EDIT MOTORCYCLE PROFILE' : 'ADD MOTORCYCLE PROFILE'}
            </Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>MOTORCYCLE NAME</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              placeholder="e.g. Blackbird RR"
              placeholderTextColor={theme.textMuted}
              value={bikeName}
              onChangeText={setBikeName}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>MAKE / MANUFACTURER</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              placeholder="e.g. Honda"
              placeholderTextColor={theme.textMuted}
              value={bikeMake}
              onChangeText={setBikeMake}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>MODEL</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              placeholder="e.g. CBR1000RR"
              placeholderTextColor={theme.textMuted}
              value={bikeModel}
              onChangeText={setBikeModel}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>MODEL YEAR</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              placeholder="e.g. 2024"
              placeholderTextColor={theme.textMuted}
              value={bikeYear}
              onChangeText={setBikeYear}
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>CURRENT ODOMETER (KM)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.cardHover, color: theme.textPrimary }]}
              keyboardType="numeric"
              placeholder="e.g. 14500"
              placeholderTextColor={theme.textMuted}
              value={bikeOdo}
              onChangeText={setBikeOdo}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setShowEditBikeModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleSaveBike}>
                <Text style={[styles.modalSubmitText, { color: theme.bg }]}>SAVE PROFILE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
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
  },
  bikeName: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
  },
  bikeSub: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  editBikeBtn: {
    padding: 6,
  },
  bikeMetricsRow: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  bikeMetric: {
    flex: 1,
    gap: 2,
  },
  bikeMetricVal: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '800',
  },
  bikeMetricLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  addBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalInput: {
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '900',
  },
});
