import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INITIAL_BIKES,
  INITIAL_TRIPS,
  INITIAL_FUEL_LOGS,
  INITIAL_MAINTENANCE,
  Bike,
  Trip,
  FuelLog,
  Maintenance,
} from '../utils/mockData';

function toId(value: unknown): number {
  if (typeof value === 'bigint') return Number(value);
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function coordOrNull(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (Math.abs(n) < 0.0001) return null;
  return n;
}

const ASYNC_KEYS = {
  BIKES: '@ridemeter_bikes',
  TRIPS: '@ridemeter_trips',
  TRIP_POINTS: '@ridemeter_trip_points',
  FUEL: '@ridemeter_fuel',
  MAINTENANCE: '@ridemeter_maintenance',
  SETTINGS: '@ridemeter_settings',
};

export class DatabaseService {
  private static instance: DatabaseService;
  private isNative: boolean = Platform.OS !== 'web';
  private sqliteDb: any = null;
  private initPromise: Promise<void> | null = null;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initDatabase();
    }
    await this.initPromise;
  }

  public async initDatabase(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      if (this.isNative) {
        try {
          const SQLite = require('expo-sqlite');
          this.sqliteDb = await SQLite.openDatabaseAsync('ridemeter.db');
          const { CREATE_TABLES_SQL } = require('./schema');
          await this.sqliteDb.execAsync(CREATE_TABLES_SQL);
          await this.syncAsyncStorageToSqliteIfEmpty();
          await this.seedInitialDataIfEmpty();
        } catch (err) {
          console.warn('SQLite init failed; keeping existing file and using AsyncStorage fallback:', err);
          this.isNative = false;
          await this.seedWebStorageIfEmpty();
        }
      } else {
        await this.seedWebStorageIfEmpty();
      }
    })();
    return this.initPromise;
  }

  private async syncAsyncStorageToSqliteIfEmpty(): Promise<void> {
    if (!this.sqliteDb) return;
    try {
      // 1. Sync Bikes from AsyncStorage if SQLite bikes table is empty
      const bikeCountRes = await this.sqliteDb.getAllAsync('SELECT COUNT(*) as count FROM bikes;');
      if (bikeCountRes && bikeCountRes[0]?.count === 0) {
        const asyncBikes = await AsyncStorage.getItem(ASYNC_KEYS.BIKES);
        if (asyncBikes) {
          const parsedBikes: Bike[] = JSON.parse(asyncBikes);
          for (const bike of parsedBikes) {
            await this.sqliteDb.runAsync(
              `INSERT INTO bikes (id, name, registration_number, make, model, year, initial_odometer, current_odometer, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                toId(bike.id) || Date.now(),
                bike.name || 'My Motorcycle',
                bike.registration_number || '',
                bike.make || '',
                bike.model || '',
                Number(bike.year || 2024),
                Number(bike.initial_odometer || 0),
                Number(bike.current_odometer || 0),
                bike.created_at || new Date().toISOString(),
              ]
            );
          }
        }
      }

      // 2. Sync Trips from AsyncStorage if SQLite trips table is empty
      const tripCountRes = await this.sqliteDb.getAllAsync('SELECT COUNT(*) as count FROM trips;');
      if (tripCountRes && tripCountRes[0]?.count === 0) {
        const asyncTrips = await AsyncStorage.getItem(ASYNC_KEYS.TRIPS);
        if (asyncTrips) {
          const parsedTrips: Trip[] = JSON.parse(asyncTrips);
          for (const trip of parsedTrips) {
            await this.insertTripSqlite(trip, toId(trip.id) || undefined);
          }
        }
      }

      // 3. Sync Fuel Logs from AsyncStorage if SQLite fuel_logs table is empty
      const fuelCountRes = await this.sqliteDb.getAllAsync('SELECT COUNT(*) as count FROM fuel_logs;');
      if (fuelCountRes && fuelCountRes[0]?.count === 0) {
        const asyncFuel = await AsyncStorage.getItem(ASYNC_KEYS.FUEL);
        if (asyncFuel) {
          const parsedFuel: FuelLog[] = JSON.parse(asyncFuel);
          for (const fuel of parsedFuel) {
            await this.sqliteDb.runAsync(
              `INSERT INTO fuel_logs (bike_id, odometer_km, liters, cost, price_per_liter, is_full_tank, notes, filled_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                fuel.bike_id || 1,
                Number(fuel.odometer_km || 0),
                Number(fuel.liters || 0),
                Number(fuel.cost || 0),
                Number(fuel.price_per_liter || 0),
                fuel.is_full_tank ? 1 : 0,
                fuel.notes || '',
                fuel.filled_at || new Date().toISOString(),
              ]
            );
          }
        }
      }

      // 4. Sync Maintenance Logs from AsyncStorage if SQLite maintenance table is empty
      const maintCountRes = await this.sqliteDb.getAllAsync('SELECT COUNT(*) as count FROM maintenance;');
      if (maintCountRes && maintCountRes[0]?.count === 0) {
        const asyncMaint = await AsyncStorage.getItem(ASYNC_KEYS.MAINTENANCE);
        if (asyncMaint) {
          const parsedMaint: Maintenance[] = JSON.parse(asyncMaint);
          for (const maint of parsedMaint) {
            await this.sqliteDb.runAsync(
              `INSERT INTO maintenance (bike_id, type, description, odometer_km, cost, next_service_km, service_date, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                maint.bike_id || 1,
                maint.type || 'General Service',
                maint.description || '',
                Number(maint.odometer_km || 0),
                Number(maint.cost || 0),
                Number(maint.next_service_km || 0),
                maint.service_date || new Date().toISOString(),
                maint.notes || '',
              ]
            );
          }
        }
      }
    } catch (e) {
      console.warn('Sync AsyncStorage to SQLite failed:', e);
    }
  }

  private async syncFuelLogsToSqlite(logs: FuelLog[]): Promise<void> {
    if (!this.sqliteDb) return;
    for (const f of logs) {
      try {
        const id = toId(f.id);
        if (id) {
          await this.sqliteDb.runAsync(
            `INSERT OR REPLACE INTO fuel_logs (id, bike_id, odometer_km, liters, cost, price_per_liter, is_full_tank, notes, filled_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              id,
              f.bike_id || 1,
              Number(f.odometer_km || 0),
              Number(f.liters || 0),
              Number(f.cost || 0),
              Number(f.price_per_liter || 0),
              f.is_full_tank ? 1 : 0,
              f.notes || '',
              f.filled_at || new Date().toISOString(),
            ]
          );
        } else {
          await this.sqliteDb.runAsync(
            `INSERT INTO fuel_logs (bike_id, odometer_km, liters, cost, price_per_liter, is_full_tank, notes, filled_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              f.bike_id || 1,
              Number(f.odometer_km || 0),
              Number(f.liters || 0),
              Number(f.cost || 0),
              Number(f.price_per_liter || 0),
              f.is_full_tank ? 1 : 0,
              f.notes || '',
              f.filled_at || new Date().toISOString(),
            ]
          );
        }
      } catch { }
    }
  }

  private async syncMaintenanceLogsToSqlite(logs: Maintenance[]): Promise<void> {
    if (!this.sqliteDb) return;
    for (const m of logs) {
      try {
        const id = toId(m.id);
        if (id) {
          await this.sqliteDb.runAsync(
            `INSERT OR REPLACE INTO maintenance (id, bike_id, type, description, odometer_km, cost, next_service_km, service_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              id,
              m.bike_id || 1,
              m.type || 'General Service',
              m.description || '',
              Number(m.odometer_km || 0),
              Number(m.cost || 0),
              Number(m.next_service_km || 0),
              m.service_date || new Date().toISOString(),
              m.notes || '',
            ]
          );
        } else {
          await this.sqliteDb.runAsync(
            `INSERT INTO maintenance (bike_id, type, description, odometer_km, cost, next_service_km, service_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              m.bike_id || 1,
              m.type || 'General Service',
              m.description || '',
              Number(m.odometer_km || 0),
              Number(m.cost || 0),
              Number(m.next_service_km || 0),
              m.service_date || new Date().toISOString(),
              m.notes || '',
            ]
          );
        }
      } catch { }
    }
  }

  private async seedInitialDataIfEmpty(): Promise<void> {
    if (!this.sqliteDb) return;
    try {
      const bikes = await this.sqliteDb.getAllAsync('SELECT COUNT(*) as count FROM bikes;');
      if (bikes && bikes[0]?.count === 0) {
        for (const bike of INITIAL_BIKES) {
          await this.sqliteDb.runAsync(
            `INSERT INTO bikes (id, name, registration_number, make, model, year, initial_odometer, current_odometer, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              bike.id,
              bike.name || 'My Motorcycle',
              bike.registration_number || '',
              bike.make || '',
              bike.model || '',
              bike.year || 2024,
              bike.initial_odometer || 0,
              bike.current_odometer || 0,
              bike.created_at || new Date().toISOString(),
            ]
          );
        }
      }
    } catch (e) {
      console.warn('Seed SQLite failed, switching to AsyncStorage fallback:', e);
      this.isNative = false;
      await this.seedWebStorageIfEmpty();
    }
  }

  private async seedWebStorageIfEmpty(): Promise<void> {
    const existingBikes = await AsyncStorage.getItem(ASYNC_KEYS.BIKES);
    if (!existingBikes) {
      await AsyncStorage.setItem(ASYNC_KEYS.BIKES, JSON.stringify(INITIAL_BIKES));
      await AsyncStorage.setItem(ASYNC_KEYS.TRIPS, JSON.stringify(INITIAL_TRIPS));
      await AsyncStorage.setItem(ASYNC_KEYS.FUEL, JSON.stringify(INITIAL_FUEL_LOGS));
      await AsyncStorage.setItem(ASYNC_KEYS.MAINTENANCE, JSON.stringify(INITIAL_MAINTENANCE));
    }
  }

  // --- BIKES ---
  public async getBikes(): Promise<Bike[]> {
    await this.ensureInitialized();
    let sqliteBikes: Bike[] = [];
    if (this.isNative && this.sqliteDb) {
      try {
        const rows = await this.sqliteDb.getAllAsync('SELECT * FROM bikes ORDER BY id ASC;');
        sqliteBikes = (rows as any[]).map((b) => ({
          ...b,
          id: toId(b.id),
          year: Number(b.year || 2024),
          initial_odometer: Number(b.initial_odometer || 0),
          current_odometer: Number(b.current_odometer || 0),
        }));
      } catch (e) {
        console.warn('Native getBikes failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    let asyncBikes: Bike[] = [];
    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.BIKES);
      if (data) {
        const parsed: Bike[] = JSON.parse(data);
        asyncBikes = parsed.map((b) => ({
          ...b,
          id: toId(b.id),
          year: Number(b.year || 2024),
          initial_odometer: Number(b.initial_odometer || 0),
          current_odometer: Number(b.current_odometer || 0),
        }));
      }
    } catch (e) {
      console.warn('AsyncStorage getBikes failed:', e);
    }

    const seenSignatures = new Set<string>();
    const usedIds = new Set<number>();
    const mergedBikes: Bike[] = [];

    for (const b of sqliteBikes) {
      const sig = `${b.name}_${b.registration_number}_${b.make}_${b.model}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        if (b.id) usedIds.add(b.id);
        mergedBikes.push(b);
      }
    }

    for (const b of asyncBikes) {
      const sig = `${b.name}_${b.registration_number}_${b.make}_${b.model}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        let validId = b.id;
        if (!validId || usedIds.has(validId)) {
          validId = Date.now() + Math.floor(Math.random() * 1000);
        }
        usedIds.add(validId);
        mergedBikes.push({ ...b, id: validId });
      }
    }

    if (mergedBikes.length === 0) {
      return INITIAL_BIKES;
    }

    mergedBikes.sort((a, b) => a.id - b.id);

    if (this.sqliteDb && mergedBikes.length > sqliteBikes.length) {
      for (const bike of mergedBikes) {
        if (!sqliteBikes.some((sb) => toId(sb.id) === bike.id)) {
          this.sqliteDb
            .runAsync(
              `INSERT INTO bikes (id, name, registration_number, make, model, year, initial_odometer, current_odometer, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                bike.id,
                bike.name || 'My Motorcycle',
                bike.registration_number || '',
                bike.make || '',
                bike.model || '',
                Number(bike.year || 2024),
                Number(bike.initial_odometer || 0),
                Number(bike.current_odometer || 0),
                bike.created_at || new Date().toISOString(),
              ]
            )
            .catch(() => {});
        }
      }
    }
    AsyncStorage.setItem(ASYNC_KEYS.BIKES, JSON.stringify(mergedBikes)).catch(() => {});

    return mergedBikes;
  }

  public async saveBike(bike: Partial<Bike>): Promise<number> {
    await this.ensureInitialized();
    const bikeId = toId(bike.id);
    let savedId = bikeId;

    if (this.isNative && this.sqliteDb) {
      try {
        if (bikeId) {
          const existingList = await this.sqliteDb.getAllAsync('SELECT * FROM bikes WHERE id=?;', [bikeId]);
          if (existingList && existingList.length > 0) {
            const existing = existingList[0];
            const updatedName = bike.name ?? existing.name ?? 'My Motorcycle';
            const updatedReg = bike.registration_number ?? existing.registration_number ?? '';
            const updatedMake = bike.make ?? existing.make ?? '';
            const updatedModel = bike.model ?? existing.model ?? '';
            const updatedYear = bike.year ?? existing.year ?? 2024;
            const updatedOdo = bike.current_odometer !== undefined ? Number(bike.current_odometer) : Number(existing.current_odometer || 0);

            await this.sqliteDb.runAsync(
              `UPDATE bikes SET name=?, registration_number=?, make=?, model=?, year=?, current_odometer=? WHERE id=?;`,
              [
                updatedName,
                updatedReg,
                updatedMake,
                updatedModel,
                Number(updatedYear),
                Number(updatedOdo),
                bikeId,
              ]
            );
          }
          savedId = bikeId;
        } else {
          const res = await this.sqliteDb.runAsync(
            `INSERT INTO bikes (name, registration_number, make, model, year, initial_odometer, current_odometer, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              bike.name || 'My Motorcycle',
              bike.registration_number || '',
              bike.make || '',
              bike.model || '',
              bike.year || new Date().getFullYear(),
              bike.initial_odometer || 0,
              bike.current_odometer || bike.initial_odometer || 0,
              new Date().toISOString(),
            ]
          );
          savedId = toId(res.lastInsertRowId);
        }
      } catch (e) {
        console.warn('Native saveBike failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    if (!savedId) {
      savedId = Date.now();
    }

    try {
      const bikes = await this.getBikes();
      const idx = bikes.findIndex((b) => toId(b.id) === savedId);
      if (idx !== -1) {
        bikes[idx] = { ...bikes[idx], ...bike, id: savedId } as Bike;
      } else {
        bikes.push({
          id: savedId,
          name: bike.name || 'My Motorcycle',
          registration_number: bike.registration_number || '',
          make: bike.make || '',
          model: bike.model || '',
          year: bike.year || new Date().getFullYear(),
          initial_odometer: bike.initial_odometer || 0,
          current_odometer: bike.current_odometer || bike.initial_odometer || 0,
          created_at: new Date().toISOString(),
        });
      }
      await AsyncStorage.setItem(ASYNC_KEYS.BIKES, JSON.stringify(bikes));
    } catch (e) {
      console.warn('AsyncStorage saveBike backup failed:', e);
    }

    return savedId;
  }

  // --- TRIPS ---
  public async getTrips(): Promise<Trip[]> {
    await this.ensureInitialized();
    let sqliteTrips: Trip[] = [];
    if (this.isNative && this.sqliteDb) {
      try {
        const rows = await this.sqliteDb.getAllAsync('SELECT * FROM trips ORDER BY started_at DESC;');
        sqliteTrips = (rows as any[]).map((t) => ({
          ...t,
          id: toId(t.id),
          bike_id: toId(t.bike_id) || 1,
          duration_seconds: Number(t.duration_seconds || 0),
          moving_seconds: Number(t.moving_seconds || 0),
          stopped_seconds: Number(t.stopped_seconds || 0),
          distance_km: Number(t.distance_km || 0),
          average_speed_kmh: Number(t.average_speed_kmh || 0),
          max_speed_kmh: Number(t.max_speed_kmh || 0),
          start_latitude: coordOrNull(t.start_latitude) ?? 0,
          start_longitude: coordOrNull(t.start_longitude) ?? 0,
          end_latitude: coordOrNull(t.end_latitude) ?? 0,
          end_longitude: coordOrNull(t.end_longitude) ?? 0,
          is_favorite: Number(t.is_favorite || 0),
        }));
      } catch (e) {
        console.warn('Native getTrips failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    let asyncTrips: Trip[] = [];
    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.TRIPS);
      if (data) {
        const parsed: Trip[] = JSON.parse(data);
        asyncTrips = parsed.map((t) => ({
          ...t,
          id: toId(t.id),
          bike_id: toId(t.bike_id) || 1,
          duration_seconds: Number(t.duration_seconds || 0),
          moving_seconds: Number(t.moving_seconds || 0),
          stopped_seconds: Number(t.stopped_seconds || 0),
          distance_km: Number(t.distance_km || 0),
          average_speed_kmh: Number(t.average_speed_kmh || 0),
          max_speed_kmh: Number(t.max_speed_kmh || 0),
          start_latitude: coordOrNull(t.start_latitude) ?? 0,
          start_longitude: coordOrNull(t.start_longitude) ?? 0,
          end_latitude: coordOrNull(t.end_latitude) ?? 0,
          end_longitude: coordOrNull(t.end_longitude) ?? 0,
          is_favorite: Number(t.is_favorite || 0),
        }));
      }
    } catch (e) {
      console.warn('AsyncStorage getTrips failed:', e);
    }

    const seenSignatures = new Set<string>();
    const usedIds = new Set<number>();
    const mergedTrips: Trip[] = [];

    for (const t of sqliteTrips) {
      const sig = `${t.started_at}_${t.distance_km}_${t.duration_seconds}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        if (t.id) usedIds.add(t.id);
        mergedTrips.push(t);
      }
    }

    for (const t of asyncTrips) {
      const sig = `${t.started_at}_${t.distance_km}_${t.duration_seconds}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        let validId = t.id;
        if (!validId || usedIds.has(validId)) {
          validId = Date.now() + Math.floor(Math.random() * 1000);
        }
        usedIds.add(validId);
        mergedTrips.push({ ...t, id: validId });
      }
    }

    mergedTrips.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    if (this.sqliteDb && mergedTrips.length > sqliteTrips.length) {
      for (const trip of mergedTrips) {
        if (!sqliteTrips.some((st) => toId(st.id) === trip.id)) {
          this.insertTripSqlite(trip, trip.id).catch(() => {});
        }
      }
    }
    AsyncStorage.setItem(ASYNC_KEYS.TRIPS, JSON.stringify(mergedTrips)).catch(() => {});

    return mergedTrips;
  }

  public async getTripById(id: number): Promise<Trip | null> {
    await this.ensureInitialized();
    const wanted = toId(id);
    if (!wanted) return null;

    if (this.isNative && this.sqliteDb) {
      try {
        const row = await this.sqliteDb.getFirstAsync('SELECT * FROM trips WHERE id = ?;', [wanted]);
        if (row) {
          const t = row as any;
          return {
            ...t,
            id: toId(t.id),
            bike_id: toId(t.bike_id) || 1,
            duration_seconds: Number(t.duration_seconds || 0),
            moving_seconds: Number(t.moving_seconds || 0),
            stopped_seconds: Number(t.stopped_seconds || 0),
            distance_km: Number(t.distance_km || 0),
            average_speed_kmh: Number(t.average_speed_kmh || 0),
            max_speed_kmh: Number(t.max_speed_kmh || 0),
            start_latitude: coordOrNull(t.start_latitude) ?? 0,
            start_longitude: coordOrNull(t.start_longitude) ?? 0,
            end_latitude: coordOrNull(t.end_latitude) ?? 0,
            end_longitude: coordOrNull(t.end_longitude) ?? 0,
            is_favorite: Number(t.is_favorite || 0),
          };
        }
      } catch (e) {
        console.warn('Native getTripById failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    const trips = await this.getTrips();
    return trips.find((t) => toId(t.id) === wanted) || null;
  }

  private async insertTripSqlite(trip: Partial<Trip>, explicitId?: number): Promise<number> {
    const createdAt = new Date().toISOString();
    const cols = `bike_id, started_at, ended_at, duration_seconds, moving_seconds, stopped_seconds, distance_km, average_speed_kmh, max_speed_kmh, start_latitude, start_longitude, end_latitude, end_longitude, trip_type, notes, is_favorite, status, created_at`;
    const values = [
      trip.bike_id || 1,
      trip.started_at || createdAt,
      trip.ended_at ?? null,
      trip.duration_seconds || 0,
      trip.moving_seconds || 0,
      trip.stopped_seconds || 0,
      trip.distance_km || 0,
      trip.average_speed_kmh || 0,
      trip.max_speed_kmh || 0,
      coordOrNull(trip.start_latitude),
      coordOrNull(trip.start_longitude),
      coordOrNull(trip.end_latitude),
      coordOrNull(trip.end_longitude),
      trip.trip_type || 'Personal',
      trip.notes || '',
      trip.is_favorite ? 1 : 0,
      trip.status || 'active',
      createdAt,
    ];

    if (explicitId) {
      await this.sqliteDb.runAsync(
        `INSERT INTO trips (id, ${cols}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [explicitId, ...values]
      );
      return explicitId;
    }

    const res = await this.sqliteDb.runAsync(
      `INSERT INTO trips (${cols}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      values
    );
    let insertId = toId(res.lastInsertRowId);
    if (!insertId) {
      const row = await this.sqliteDb.getFirstAsync('SELECT last_insert_rowid() AS id;');
      insertId = toId(row?.id);
    }
    return insertId;
  }

  public async saveTrip(trip: Partial<Trip>): Promise<number> {
    await this.ensureInitialized();
    const tripId = toId(trip.id);
    let savedId = tripId;

    if (this.isNative && this.sqliteDb) {
      try {
        if (tripId) {
          const existing = await this.sqliteDb.getFirstAsync('SELECT * FROM trips WHERE id=?;', [tripId]);
          if (existing) {
            const bikeId = trip.bike_id !== undefined ? Number(trip.bike_id) : Number(existing.bike_id || 1);
            const startedAt = trip.started_at || existing.started_at;
            const endedAt = trip.ended_at !== undefined ? trip.ended_at : existing.ended_at;
            const dur = trip.duration_seconds !== undefined ? Number(trip.duration_seconds) : Number(existing.duration_seconds || 0);
            const mov = trip.moving_seconds !== undefined ? Number(trip.moving_seconds) : Number(existing.moving_seconds || 0);
            const stp = trip.stopped_seconds !== undefined ? Number(trip.stopped_seconds) : Number(existing.stopped_seconds || 0);
            const dist = trip.distance_km !== undefined ? Number(trip.distance_km) : Number(existing.distance_km || 0);
            const avgSpd = trip.average_speed_kmh !== undefined ? Number(trip.average_speed_kmh) : Number(existing.average_speed_kmh || 0);
            const maxSpd = trip.max_speed_kmh !== undefined ? Number(trip.max_speed_kmh) : Number(existing.max_speed_kmh || 0);
            const startLat = coordOrNull(trip.start_latitude) ?? coordOrNull(existing.start_latitude);
            const startLon = coordOrNull(trip.start_longitude) ?? coordOrNull(existing.start_longitude);
            const endLat = coordOrNull(trip.end_latitude) ?? coordOrNull(existing.end_latitude);
            const endLon = coordOrNull(trip.end_longitude) ?? coordOrNull(existing.end_longitude);
            const tripType = trip.trip_type || existing.trip_type || 'Personal';
            const notes = trip.notes !== undefined ? trip.notes : (existing.notes || '');
            const isFav = trip.is_favorite !== undefined ? (trip.is_favorite ? 1 : 0) : Number(existing.is_favorite || 0);
            const status = trip.status || existing.status || 'completed';

            await this.sqliteDb.runAsync(
              `UPDATE trips SET bike_id=?, started_at=?, ended_at=?, duration_seconds=?, moving_seconds=?, stopped_seconds=?, distance_km=?, average_speed_kmh=?, max_speed_kmh=?, start_latitude=?, start_longitude=?, end_latitude=?, end_longitude=?, trip_type=?, notes=?, is_favorite=?, status=? WHERE id=?;`,
              [
                bikeId,
                startedAt,
                endedAt ?? null,
                dur,
                mov,
                stp,
                dist,
                avgSpd,
                maxSpd,
                startLat,
                startLon,
                endLat,
                endLon,
                tripType,
                notes,
                isFav,
                status,
                tripId,
              ]
            );
            savedId = tripId;
          } else {
            savedId = await this.insertTripSqlite(trip, tripId);
          }
        } else {
          savedId = await this.insertTripSqlite(trip);
        }
      } catch (e) {
        console.warn('Native saveTrip failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    if (!savedId) {
      savedId = Date.now();
    }

    try {
      const trips = await this.getTrips();
      const idx = trips.findIndex((t) => toId(t.id) === savedId);
      const rowToSave: Trip = {
        id: savedId,
        bike_id: trip.bike_id || 1,
        started_at: trip.started_at || new Date().toISOString(),
        ended_at: trip.ended_at || '',
        duration_seconds: trip.duration_seconds || 0,
        moving_seconds: trip.moving_seconds || 0,
        stopped_seconds: trip.stopped_seconds || 0,
        distance_km: trip.distance_km || 0,
        average_speed_kmh: trip.average_speed_kmh || 0,
        max_speed_kmh: trip.max_speed_kmh || 0,
        start_latitude: coordOrNull(trip.start_latitude) ?? 0,
        start_longitude: coordOrNull(trip.start_longitude) ?? 0,
        end_latitude: coordOrNull(trip.end_latitude) ?? 0,
        end_longitude: coordOrNull(trip.end_longitude) ?? 0,
        trip_type: trip.trip_type || 'Personal',
        notes: trip.notes || '',
        is_favorite: trip.is_favorite ? 1 : 0,
        status: trip.status || 'active',
        created_at: new Date().toISOString(),
      };
      if (idx !== -1) {
        trips[idx] = { ...trips[idx], ...rowToSave, id: savedId };
      } else {
        trips.unshift(rowToSave);
      }
      await AsyncStorage.setItem(ASYNC_KEYS.TRIPS, JSON.stringify(trips));
    } catch (e) {
      console.warn('AsyncStorage saveTrip backup failed:', e);
    }

    return savedId;
  }

  public async deleteTrip(id: number): Promise<void> {
    await this.ensureInitialized();
    const tripId = toId(id);
    if (!tripId) return;

    if (this.isNative && this.sqliteDb) {
      try {
        await this.sqliteDb.runAsync('DELETE FROM trips WHERE id=?;', [tripId]);
      } catch (e) {
        console.warn('Native deleteTrip failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.TRIPS);
      if (data) {
        const trips: Trip[] = JSON.parse(data);
        const filtered = trips.filter((t) => toId(t.id) !== tripId);
        await AsyncStorage.setItem(ASYNC_KEYS.TRIPS, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('AsyncStorage deleteTrip failed:', e);
    }
  }

  // --- FUEL ---
  public async getFuelLogs(): Promise<FuelLog[]> {
    await this.ensureInitialized();
    let sqliteLogs: FuelLog[] = [];
    if (this.isNative && this.sqliteDb) {
      try {
        const rows = await this.sqliteDb.getAllAsync('SELECT * FROM fuel_logs ORDER BY filled_at DESC;');
        sqliteLogs = (rows as any[]).map((f) => ({
          ...f,
          id: toId(f.id),
          bike_id: toId(f.bike_id) || 1,
          odometer_km: Number(f.odometer_km || 0),
          liters: Number(f.liters || 0),
          cost: Number(f.cost || 0),
          price_per_liter: Number(f.price_per_liter || 0),
          is_full_tank: Number(f.is_full_tank || 0),
        }));
      } catch (e) {
        console.warn('Native getFuelLogs failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    let asyncLogs: FuelLog[] = [];
    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.FUEL);
      if (data) {
        const parsed: FuelLog[] = JSON.parse(data);
        asyncLogs = parsed.map((f) => ({
          ...f,
          id: toId(f.id),
          bike_id: toId(f.bike_id) || 1,
          odometer_km: Number(f.odometer_km || 0),
          liters: Number(f.liters || 0),
          cost: Number(f.cost || 0),
          price_per_liter: Number(f.price_per_liter || 0),
          is_full_tank: Number(f.is_full_tank || 0),
        }));
      }
    } catch (e) {
      console.warn('AsyncStorage getFuelLogs failed:', e);
    }

    const seenSignatures = new Set<string>();
    const usedIds = new Set<number>();
    const mergedLogs: FuelLog[] = [];

    for (const f of sqliteLogs) {
      const sig = `${f.filled_at}_${f.odometer_km}_${f.liters}_${f.cost}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        if (f.id) usedIds.add(f.id);
        mergedLogs.push(f);
      }
    }

    for (const f of asyncLogs) {
      const sig = `${f.filled_at}_${f.odometer_km}_${f.liters}_${f.cost}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        let validId = f.id;
        if (!validId || usedIds.has(validId)) {
          validId = Date.now() + Math.floor(Math.random() * 1000);
        }
        usedIds.add(validId);
        mergedLogs.push({ ...f, id: validId });
      }
    }

    mergedLogs.sort((a, b) => new Date(b.filled_at).getTime() - new Date(a.filled_at).getTime());

    if (this.sqliteDb && mergedLogs.length > sqliteLogs.length) {
      this.syncFuelLogsToSqlite(mergedLogs).catch(() => {});
    }
    AsyncStorage.setItem(ASYNC_KEYS.FUEL, JSON.stringify(mergedLogs)).catch(() => {});

    return mergedLogs;
  }

  public async addFuelLog(fuel: Partial<FuelLog>): Promise<number> {
    await this.ensureInitialized();
    let newId = 0;
    const filledAt = fuel.filled_at || new Date().toISOString();
    const pricePerLiter = fuel.price_per_liter || (fuel.cost && fuel.liters ? fuel.cost / fuel.liters : 0);

    if (this.isNative && this.sqliteDb) {
      try {
        const res = await this.sqliteDb.runAsync(
          `INSERT INTO fuel_logs (bike_id, odometer_km, liters, cost, price_per_liter, is_full_tank, notes, filled_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            fuel.bike_id || 1,
            fuel.odometer_km || 0,
            fuel.liters || 0,
            fuel.cost || 0,
            pricePerLiter,
            fuel.is_full_tank ? 1 : 0,
            fuel.notes || '',
            filledAt,
          ]
        );
        newId = toId(res.lastInsertRowId);
      } catch (e) {
        console.warn('Native addFuelLog failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    if (!newId) {
      newId = Date.now();
    }

    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.FUEL);
      const logs: FuelLog[] = data ? JSON.parse(data) : [];
      const newLog: FuelLog = {
        id: newId,
        bike_id: fuel.bike_id || 1,
        odometer_km: Number(fuel.odometer_km || 0),
        liters: Number(fuel.liters || 0),
        cost: Number(fuel.cost || 0),
        price_per_liter: Number(pricePerLiter),
        is_full_tank: fuel.is_full_tank ? 1 : 0,
        notes: fuel.notes || '',
        filled_at: filledAt,
      };
      const sig = `${filledAt}_${fuel.odometer_km}_${fuel.liters}_${fuel.cost}`;
      if (!logs.some((l) => `${l.filled_at}_${l.odometer_km}_${l.liters}_${l.cost}` === sig)) {
        logs.unshift(newLog);
        await AsyncStorage.setItem(ASYNC_KEYS.FUEL, JSON.stringify(logs));
      }
    } catch (e) {
      console.warn('AsyncStorage addFuelLog backup failed:', e);
    }

    return newId;
  }

  public async updateFuelLog(fuel: Partial<FuelLog>): Promise<void> {
    await this.ensureInitialized();
    const fuelId = toId(fuel.id);
    if (!fuelId) return;

    const pricePerLiter = fuel.price_per_liter || (fuel.cost && fuel.liters ? fuel.cost / fuel.liters : 0);

    if (this.isNative && this.sqliteDb) {
      try {
        await this.sqliteDb.runAsync(
          `UPDATE fuel_logs SET liters=?, cost=?, price_per_liter=?, odometer_km=?, notes=? WHERE id=?;`,
          [
            fuel.liters || 0,
            fuel.cost || 0,
            pricePerLiter,
            fuel.odometer_km || 0,
            fuel.notes || '',
            fuelId,
          ]
        );
      } catch (e) {
        console.warn('Native updateFuelLog failed:', e);
      }
    }

    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.FUEL);
      if (data) {
        const logs: FuelLog[] = JSON.parse(data);
        const idx = logs.findIndex((l) => toId(l.id) === fuelId);
        if (idx !== -1) {
          logs[idx] = { ...logs[idx], ...fuel, id: fuelId };
          await AsyncStorage.setItem(ASYNC_KEYS.FUEL, JSON.stringify(logs));
        }
      }
    } catch (e) {
      console.warn('AsyncStorage updateFuelLog backup failed:', e);
    }
  }

  public async deleteFuelLog(id: number): Promise<void> {
    await this.ensureInitialized();
    const fuelId = toId(id);
    if (!fuelId) return;

    if (this.isNative && this.sqliteDb) {
      try {
        await this.sqliteDb.runAsync('DELETE FROM fuel_logs WHERE id=?;', [fuelId]);
      } catch (e) {
        console.warn('Native deleteFuelLog failed:', e);
      }
    }

    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.FUEL);
      if (data) {
        const logs: FuelLog[] = JSON.parse(data);
        const filtered = logs.filter((l) => toId(l.id) !== fuelId);
        await AsyncStorage.setItem(ASYNC_KEYS.FUEL, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('AsyncStorage deleteFuelLog failed:', e);
    }
  }

  // --- MAINTENANCE ---
  public async getMaintenanceLogs(): Promise<Maintenance[]> {
    await this.ensureInitialized();
    let sqliteLogs: Maintenance[] = [];
    if (this.isNative && this.sqliteDb) {
      try {
        const rows = await this.sqliteDb.getAllAsync('SELECT * FROM maintenance ORDER BY service_date DESC;');
        sqliteLogs = (rows as any[]).map((m) => ({
          ...m,
          id: toId(m.id),
          bike_id: toId(m.bike_id) || 1,
          odometer_km: Number(m.odometer_km || 0),
          cost: Number(m.cost || 0),
          next_service_km: Number(m.next_service_km || 0),
        }));
      } catch (e) {
        console.warn('Native getMaintenanceLogs failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    let asyncLogs: Maintenance[] = [];
    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.MAINTENANCE);
      if (data) {
        const parsed: Maintenance[] = JSON.parse(data);
        asyncLogs = parsed.map((m) => ({
          ...m,
          id: toId(m.id),
          bike_id: toId(m.bike_id) || 1,
          odometer_km: Number(m.odometer_km || 0),
          cost: Number(m.cost || 0),
          next_service_km: Number(m.next_service_km || 0),
        }));
      }
    } catch (e) {
      console.warn('AsyncStorage getMaintenanceLogs failed:', e);
    }

    const seenSignatures = new Set<string>();
    const usedIds = new Set<number>();
    const mergedLogs: Maintenance[] = [];

    for (const m of sqliteLogs) {
      const sig = `${m.service_date}_${m.odometer_km}_${m.type}_${m.cost}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        if (m.id) usedIds.add(m.id);
        mergedLogs.push(m);
      }
    }

    for (const m of asyncLogs) {
      const sig = `${m.service_date}_${m.odometer_km}_${m.type}_${m.cost}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        let validId = m.id;
        if (!validId || usedIds.has(validId)) {
          validId = Date.now() + Math.floor(Math.random() * 1000);
        }
        usedIds.add(validId);
        mergedLogs.push({ ...m, id: validId });
      }
    }

    mergedLogs.sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());

    if (this.sqliteDb && mergedLogs.length > sqliteLogs.length) {
      this.syncMaintenanceLogsToSqlite(mergedLogs).catch(() => {});
    }
    AsyncStorage.setItem(ASYNC_KEYS.MAINTENANCE, JSON.stringify(mergedLogs)).catch(() => {});

    return mergedLogs;
  }

  public async addMaintenanceLog(maint: Partial<Maintenance>): Promise<number> {
    await this.ensureInitialized();
    let newId = 0;
    const serviceDate = maint.service_date || new Date().toISOString();

    if (this.isNative && this.sqliteDb) {
      try {
        const res = await this.sqliteDb.runAsync(
          `INSERT INTO maintenance (bike_id, type, description, odometer_km, cost, next_service_km, service_date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            maint.bike_id || 1,
            maint.type || 'General Service',
            maint.description || '',
            maint.odometer_km || 0,
            maint.cost || 0,
            maint.next_service_km || 0,
            serviceDate,
            maint.notes || '',
          ]
        );
        newId = toId(res.lastInsertRowId);
      } catch (e) {
        console.warn('Native addMaintenanceLog failed, fallback to AsyncStorage:', e);
        this.isNative = false;
      }
    }

    if (!newId) {
      newId = Date.now();
    }

    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.MAINTENANCE);
      const logs: Maintenance[] = data ? JSON.parse(data) : [];
      const newLog: Maintenance = {
        id: newId,
        bike_id: maint.bike_id || 1,
        type: maint.type || 'General Service',
        description: maint.description || '',
        odometer_km: maint.odometer_km || 0,
        cost: maint.cost || 0,
        next_service_km: maint.next_service_km || (maint.odometer_km ? maint.odometer_km + 2000 : 2000),
        service_date: serviceDate,
        notes: maint.notes || '',
      };
      const sig = `${serviceDate}_${maint.odometer_km}_${maint.type}_${maint.cost}`;
      if (!logs.some((l) => `${l.service_date}_${l.odometer_km}_${l.type}_${l.cost}` === sig)) {
        logs.unshift(newLog);
        await AsyncStorage.setItem(ASYNC_KEYS.MAINTENANCE, JSON.stringify(logs));
      }
    } catch (e) {
      console.warn('AsyncStorage addMaintenanceLog backup failed:', e);
    }

    return newId;
  }

  public async updateMaintenanceLog(maint: Partial<Maintenance>): Promise<void> {
    await this.ensureInitialized();
    const maintId = toId(maint.id);
    if (!maintId) return;

    if (this.isNative && this.sqliteDb) {
      try {
        await this.sqliteDb.runAsync(
          `UPDATE maintenance SET type=?, description=?, odometer_km=?, next_service_km=?, cost=?, notes=? WHERE id=?;`,
          [
            maint.type || 'General Service',
            maint.description || '',
            maint.odometer_km || 0,
            maint.next_service_km || 0,
            maint.cost || 0,
            maint.notes || '',
            maintId,
          ]
        );
      } catch (e) {
        console.warn('Native updateMaintenanceLog failed:', e);
      }
    }

    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.MAINTENANCE);
      if (data) {
        const logs: Maintenance[] = JSON.parse(data);
        const idx = logs.findIndex((m) => toId(m.id) === maintId);
        if (idx !== -1) {
          logs[idx] = { ...logs[idx], ...maint, id: maintId };
          await AsyncStorage.setItem(ASYNC_KEYS.MAINTENANCE, JSON.stringify(logs));
        }
      }
    } catch (e) {
      console.warn('AsyncStorage updateMaintenanceLog backup failed:', e);
    }
  }

  public async deleteMaintenanceLog(id: number): Promise<void> {
    await this.ensureInitialized();
    const maintId = toId(id);
    if (!maintId) return;

    if (this.isNative && this.sqliteDb) {
      try {
        await this.sqliteDb.runAsync('DELETE FROM maintenance WHERE id=?;', [maintId]);
      } catch (e) {
        console.warn('Native deleteMaintenanceLog failed:', e);
      }
    }

    try {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.MAINTENANCE);
      if (data) {
        const logs: Maintenance[] = JSON.parse(data);
        const filtered = logs.filter((m) => toId(m.id) !== maintId);
        await AsyncStorage.setItem(ASYNC_KEYS.MAINTENANCE, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('AsyncStorage deleteMaintenanceLog failed:', e);
    }
  }

  // --- RESET ALL DATA ---
  public async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    if (this.isNative && this.sqliteDb) {
      try {
        await this.sqliteDb.execAsync(`
          DELETE FROM trip_points;
          DELETE FROM trips;
          DELETE FROM fuel_logs;
          DELETE FROM maintenance;
          DELETE FROM reminders;
        `);
      } catch (e) {
        console.warn('Native clearAllData failed:', e);
      }
    }
    await AsyncStorage.removeItem(ASYNC_KEYS.TRIPS);
    await AsyncStorage.removeItem(ASYNC_KEYS.TRIP_POINTS);
    await AsyncStorage.removeItem(ASYNC_KEYS.FUEL);
    await AsyncStorage.removeItem(ASYNC_KEYS.MAINTENANCE);
  }
}

export const dbService = DatabaseService.getInstance();
