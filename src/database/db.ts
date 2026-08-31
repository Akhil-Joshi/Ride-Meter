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

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initDatabase(): Promise<void> {
    if (this.isNative) {
      try {
        const SQLite = require('expo-sqlite');
        this.sqliteDb = await SQLite.openDatabaseAsync('ridemeter.db');
        const { CREATE_TABLES_SQL } = require('./schema');
        await this.sqliteDb.execAsync(CREATE_TABLES_SQL);
        await this.seedInitialDataIfEmpty();
      } catch (err) {
        console.warn('Native SQLite init failed, falling back to Web Storage:', err);
        this.isNative = false;
        await this.seedWebStorageIfEmpty();
      }
    } else {
      await this.seedWebStorageIfEmpty();
    }
  }

  private async seedInitialDataIfEmpty(): Promise<void> {
    if (!this.sqliteDb) return;
    const bikes = await this.sqliteDb.getAllAsync('SELECT COUNT(*) as count FROM bikes;');
    if (bikes[0]?.count === 0) {
      for (const bike of INITIAL_BIKES) {
        await this.sqliteDb.runAsync(
          `INSERT INTO bikes (id, name, registration_number, make, model, year, initial_odometer, current_odometer, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            bike.id,
            bike.name,
            bike.registration_number,
            bike.make,
            bike.model,
            bike.year,
            bike.initial_odometer,
            bike.current_odometer,
            bike.created_at,
          ]
        );
      }

      for (const trip of INITIAL_TRIPS) {
        await this.sqliteDb.runAsync(
          `INSERT INTO trips (id, bike_id, started_at, ended_at, duration_seconds, moving_seconds, stopped_seconds, distance_km, average_speed_kmh, max_speed_kmh, start_latitude, start_longitude, end_latitude, end_longitude, trip_type, notes, is_favorite, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            trip.id,
            trip.bike_id,
            trip.started_at,
            trip.ended_at,
            trip.duration_seconds,
            trip.moving_seconds,
            trip.stopped_seconds,
            trip.distance_km,
            trip.average_speed_kmh,
            trip.max_speed_kmh,
            trip.start_latitude,
            trip.start_longitude,
            trip.end_latitude,
            trip.end_longitude,
            trip.trip_type,
            trip.notes,
            trip.is_favorite,
            trip.status,
            trip.created_at,
          ]
        );
      }

      for (const fuel of INITIAL_FUEL_LOGS) {
        await this.sqliteDb.runAsync(
          `INSERT INTO fuel_logs (id, bike_id, odometer_km, liters, cost, price_per_liter, is_full_tank, notes, filled_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            fuel.id,
            fuel.bike_id,
            fuel.odometer_km,
            fuel.liters,
            fuel.cost,
            fuel.price_per_liter,
            fuel.is_full_tank,
            fuel.notes,
            fuel.filled_at,
          ]
        );
      }

      for (const maint of INITIAL_MAINTENANCE) {
        await this.sqliteDb.runAsync(
          `INSERT INTO maintenance (id, bike_id, type, description, odometer_km, cost, next_service_km, service_date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            maint.id,
            maint.bike_id,
            maint.type,
            maint.description,
            maint.odometer_km,
            maint.cost,
            maint.next_service_km,
            maint.service_date,
            maint.notes,
          ]
        );
      }
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
    if (this.isNative && this.sqliteDb) {
      return await this.sqliteDb.getAllAsync('SELECT * FROM bikes ORDER BY id ASC;');
    } else {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.BIKES);
      return data ? JSON.parse(data) : INITIAL_BIKES;
    }
  }

  public async saveBike(bike: Partial<Bike>): Promise<number> {
    if (this.isNative && this.sqliteDb) {
      if (bike.id) {
        await this.sqliteDb.runAsync(
          `UPDATE bikes SET name=?, registration_number=?, make=?, model=?, year=?, current_odometer=? WHERE id=?;`,
          [bike.name, bike.registration_number, bike.make, bike.model, bike.year, bike.current_odometer, bike.id]
        );
        return bike.id;
      } else {
        const res = await this.sqliteDb.runAsync(
          `INSERT INTO bikes (name, registration_number, make, model, year, initial_odometer, current_odometer, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            bike.name,
            bike.registration_number || '',
            bike.make || '',
            bike.model || '',
            bike.year || new Date().getFullYear(),
            bike.initial_odometer || 0,
            bike.current_odometer || bike.initial_odometer || 0,
            new Date().toISOString(),
          ]
        );
        return res.lastInsertRowId;
      }
    } else {
      const bikes = await this.getBikes();
      if (bike.id) {
        const idx = bikes.findIndex((b) => b.id === bike.id);
        if (idx !== -1) bikes[idx] = { ...bikes[idx], ...bike } as Bike;
      } else {
        const newId = Date.now();
        bikes.push({
          id: newId,
          name: bike.name || 'My Motorcycle',
          registration_number: bike.registration_number || '',
          make: bike.make || '',
          model: bike.model || '',
          year: bike.year || new Date().getFullYear(),
          initial_odometer: bike.initial_odometer || 0,
          current_odometer: bike.current_odometer || bike.initial_odometer || 0,
          created_at: new Date().toISOString(),
        });
        bike.id = newId;
      }
      await AsyncStorage.setItem(ASYNC_KEYS.BIKES, JSON.stringify(bikes));
      return bike.id || Date.now();
    }
  }

  // --- TRIPS ---
  public async getTrips(): Promise<Trip[]> {
    if (this.isNative && this.sqliteDb) {
      return await this.sqliteDb.getAllAsync('SELECT * FROM trips ORDER BY started_at DESC;');
    } else {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.TRIPS);
      const trips: Trip[] = data ? JSON.parse(data) : INITIAL_TRIPS;
      return trips.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }
  }

  public async getTripById(id: number): Promise<Trip | null> {
    const trips = await this.getTrips();
    return trips.find((t) => t.id === id) || null;
  }

  public async saveTrip(trip: Partial<Trip>): Promise<number> {
    if (this.isNative && this.sqliteDb) {
      if (trip.id) {
        await this.sqliteDb.runAsync(
          `UPDATE trips SET ended_at=?, duration_seconds=?, moving_seconds=?, stopped_seconds=?, distance_km=?, average_speed_kmh=?, max_speed_kmh=?, notes=?, is_favorite=?, status=? WHERE id=?;`,
          [
            trip.ended_at || null,
            trip.duration_seconds || 0,
            trip.moving_seconds || 0,
            trip.stopped_seconds || 0,
            trip.distance_km || 0,
            trip.average_speed_kmh || 0,
            trip.max_speed_kmh || 0,
            trip.notes || '',
            trip.is_favorite ? 1 : 0,
            trip.status || 'completed',
            trip.id,
          ]
        );
        return trip.id;
      } else {
        const res = await this.sqliteDb.runAsync(
          `INSERT INTO trips (bike_id, started_at, ended_at, duration_seconds, moving_seconds, stopped_seconds, distance_km, average_speed_kmh, max_speed_kmh, start_latitude, start_longitude, end_latitude, end_longitude, trip_type, notes, is_favorite, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            trip.bike_id || 1,
            trip.started_at || new Date().toISOString(),
            trip.ended_at || null,
            trip.duration_seconds || 0,
            trip.moving_seconds || 0,
            trip.stopped_seconds || 0,
            trip.distance_km || 0,
            trip.average_speed_kmh || 0,
            trip.max_speed_kmh || 0,
            trip.start_latitude || 0,
            trip.start_longitude || 0,
            trip.end_latitude || 0,
            trip.end_longitude || 0,
            trip.trip_type || 'Personal',
            trip.notes || '',
            trip.is_favorite ? 1 : 0,
            trip.status || 'active',
            new Date().toISOString(),
          ]
        );
        return res.lastInsertRowId;
      }
    } else {
      const trips = await this.getTrips();
      if (trip.id) {
        const idx = trips.findIndex((t) => t.id === trip.id);
        if (idx !== -1) trips[idx] = { ...trips[idx], ...trip } as Trip;
      } else {
        const newId = Date.now();
        const newTrip: Trip = {
          id: newId,
          bike_id: trip.bike_id || 1,
          started_at: trip.started_at || new Date().toISOString(),
          ended_at: trip.ended_at || '',
          duration_seconds: trip.duration_seconds || 0,
          moving_seconds: trip.moving_seconds || 0,
          stopped_seconds: trip.stopped_seconds || 0,
          distance_km: trip.distance_km || 0,
          average_speed_kmh: trip.average_speed_kmh || 0,
          max_speed_kmh: trip.max_speed_kmh || 0,
          start_latitude: trip.start_latitude || 0,
          start_longitude: trip.start_longitude || 0,
          end_latitude: trip.end_latitude || 0,
          end_longitude: trip.end_longitude || 0,
          trip_type: trip.trip_type || 'Personal',
          notes: trip.notes || '',
          is_favorite: trip.is_favorite ? 1 : 0,
          status: trip.status || 'active',
          created_at: new Date().toISOString(),
        };
        trips.unshift(newTrip);
        trip.id = newId;
      }
      await AsyncStorage.setItem(ASYNC_KEYS.TRIPS, JSON.stringify(trips));
      return trip.id || Date.now();
    }
  }

  public async deleteTrip(id: number): Promise<void> {
    if (this.isNative && this.sqliteDb) {
      await this.sqliteDb.runAsync('DELETE FROM trips WHERE id=?;', [id]);
    } else {
      const trips = await this.getTrips();
      const filtered = trips.filter((t) => t.id !== id);
      await AsyncStorage.setItem(ASYNC_KEYS.TRIPS, JSON.stringify(filtered));
    }
  }

  // --- FUEL ---
  public async getFuelLogs(): Promise<FuelLog[]> {
    if (this.isNative && this.sqliteDb) {
      return await this.sqliteDb.getAllAsync('SELECT * FROM fuel_logs ORDER BY filled_at DESC;');
    } else {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.FUEL);
      return data ? JSON.parse(data) : INITIAL_FUEL_LOGS;
    }
  }

  public async addFuelLog(fuel: Partial<FuelLog>): Promise<number> {
    if (this.isNative && this.sqliteDb) {
      const res = await this.sqliteDb.runAsync(
        `INSERT INTO fuel_logs (bike_id, odometer_km, liters, cost, price_per_liter, is_full_tank, notes, filled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          fuel.bike_id || 1,
          fuel.odometer_km || 0,
          fuel.liters || 0,
          fuel.cost || 0,
          fuel.price_per_liter || (fuel.cost && fuel.liters ? fuel.cost / fuel.liters : 0),
          fuel.is_full_tank ? 1 : 0,
          fuel.notes || '',
          fuel.filled_at || new Date().toISOString(),
        ]
      );
      return res.lastInsertRowId;
    } else {
      const logs = await this.getFuelLogs();
      const newId = Date.now();
      const newLog: FuelLog = {
        id: newId,
        bike_id: fuel.bike_id || 1,
        odometer_km: fuel.odometer_km || 0,
        liters: fuel.liters || 0,
        cost: fuel.cost || 0,
        price_per_liter: fuel.price_per_liter || (fuel.cost && fuel.liters ? fuel.cost / fuel.liters : 0),
        is_full_tank: fuel.is_full_tank ? 1 : 0,
        notes: fuel.notes || '',
        filled_at: fuel.filled_at || new Date().toISOString(),
      };
      logs.unshift(newLog);
      await AsyncStorage.setItem(ASYNC_KEYS.FUEL, JSON.stringify(logs));
      return newId;
    }
  }

  // --- MAINTENANCE ---
  public async getMaintenanceLogs(): Promise<Maintenance[]> {
    if (this.isNative && this.sqliteDb) {
      return await this.sqliteDb.getAllAsync('SELECT * FROM maintenance ORDER BY service_date DESC;');
    } else {
      const data = await AsyncStorage.getItem(ASYNC_KEYS.MAINTENANCE);
      return data ? JSON.parse(data) : INITIAL_MAINTENANCE;
    }
  }

  public async addMaintenanceLog(maint: Partial<Maintenance>): Promise<number> {
    if (this.isNative && this.sqliteDb) {
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
          maint.service_date || new Date().toISOString(),
          maint.notes || '',
        ]
      );
      return res.lastInsertRowId;
    } else {
      const logs = await this.getMaintenanceLogs();
      const newId = Date.now();
      const newLog: Maintenance = {
        id: newId,
        bike_id: maint.bike_id || 1,
        type: maint.type || 'General Service',
        description: maint.description || '',
        odometer_km: maint.odometer_km || 0,
        cost: maint.cost || 0,
        next_service_km: maint.next_service_km || (maint.odometer_km ? maint.odometer_km + 2000 : 2000),
        service_date: maint.service_date || new Date().toISOString(),
        notes: maint.notes || '',
      };
      logs.unshift(newLog);
      await AsyncStorage.setItem(ASYNC_KEYS.MAINTENANCE, JSON.stringify(logs));
      return newId;
    }
  }

  // --- RESET ALL DATA ---
  public async clearAllData(): Promise<void> {
    if (this.isNative && this.sqliteDb) {
      await this.sqliteDb.execAsync(`
        DELETE FROM trip_points;
        DELETE FROM trips;
        DELETE FROM fuel_logs;
        DELETE FROM maintenance;
        DELETE FROM reminders;
      `);
    } else {
      await AsyncStorage.removeItem(ASYNC_KEYS.TRIPS);
      await AsyncStorage.removeItem(ASYNC_KEYS.TRIP_POINTS);
      await AsyncStorage.removeItem(ASYNC_KEYS.FUEL);
      await AsyncStorage.removeItem(ASYNC_KEYS.MAINTENANCE);
    }
    await this.initDatabase();
  }
}

export const dbService = DatabaseService.getInstance();
