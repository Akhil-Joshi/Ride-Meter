export interface Bike {
  id: number;
  name: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  initial_odometer: number;
  current_odometer: number;
  created_at: string;
}

export interface Trip {
  id: number;
  bike_id: number;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  moving_seconds: number;
  stopped_seconds: number;
  distance_km: number;
  average_speed_kmh: number;
  max_speed_kmh: number;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  trip_type: string;
  notes: string;
  is_favorite: number;
  status: string;
  created_at: string;
}

export interface FuelLog {
  id: number;
  bike_id: number;
  trip_id?: number;
  odometer_km: number;
  liters: number;
  cost: number;
  price_per_liter: number;
  is_full_tank: number;
  notes: string;
  filled_at: string;
}

export interface Maintenance {
  id: number;
  bike_id: number;
  type: string;
  description: string;
  odometer_km: number;
  cost: number;
  next_service_km: number;
  service_date: string;
  notes: string;
}

export interface Reminder {
  id: number;
  bike_id: number;
  title: string;
  description: string;
  reminder_date: string;
  reminder_odometer_km: number;
  is_completed: number;
  created_at: string;
}

// 100% Clean Initial State (No Mock Bikes, Trips, Fuel, or Maintenance Data)
export const INITIAL_BIKES: Bike[] = [];
export const INITIAL_TRIPS: Trip[] = [];
export const INITIAL_FUEL_LOGS: FuelLog[] = [];
export const INITIAL_MAINTENANCE: Maintenance[] = [];
