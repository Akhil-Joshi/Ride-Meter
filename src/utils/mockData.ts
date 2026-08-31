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

export const INITIAL_BIKES: Bike[] = [
  {
    id: 1,
    name: 'Neon Beast',
    registration_number: 'BA-2-PA 9812',
    make: 'Honda',
    model: 'CB650R Neo Sports',
    year: 2024,
    initial_odometer: 12500,
    current_odometer: 12842.6,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: 'Midnight Cruiser',
    registration_number: 'BA-3-PA 1042',
    make: 'Yamaha',
    model: 'MT-09 SP',
    year: 2025,
    initial_odometer: 4200,
    current_odometer: 4890.2,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 1,
    bike_id: 1,
    started_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    duration_seconds: 3872,
    moving_seconds: 3501,
    stopped_seconds: 371,
    distance_km: 24.82,
    average_speed_kmh: 42.7,
    max_speed_kmh: 78.4,
    start_latitude: 27.7172,
    start_longitude: 85.324,
    end_latitude: 27.671,
    end_longitude: 85.312,
    trip_type: 'Personal',
    notes: 'Morning mountain pass run. Smooth asphalt and clean weather.',
    is_favorite: 1,
    status: 'completed',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    bike_id: 1,
    started_at: new Date(Date.now() - 26 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 25 * 3600000).toISOString(),
    duration_seconds: 1260,
    moving_seconds: 1100,
    stopped_seconds: 160,
    distance_km: 12.4,
    average_speed_kmh: 38.1,
    max_speed_kmh: 62.0,
    start_latitude: 27.7172,
    start_longitude: 85.324,
    end_latitude: 27.700,
    end_longitude: 85.300,
    trip_type: 'Commute',
    notes: 'City commute to garage.',
    is_favorite: 0,
    status: 'completed',
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: 3,
    bike_id: 1,
    started_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    ended_at: new Date(Date.now() - 68 * 3600000).toISOString(),
    duration_seconds: 14400,
    moving_seconds: 12800,
    stopped_seconds: 1600,
    distance_km: 142.6,
    average_speed_kmh: 58.4,
    max_speed_kmh: 112.5,
    start_latitude: 27.7172,
    start_longitude: 85.324,
    end_latitude: 28.2096,
    end_longitude: 83.9856,
    trip_type: 'Tour',
    notes: 'Weekend highway tour. Tested top gear acceleration.',
    is_favorite: 1,
    status: 'completed',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  {
    id: 1,
    bike_id: 1,
    odometer_km: 12842.6,
    liters: 8.5,
    cost: 1420.0,
    price_per_liter: 167.06,
    is_full_tank: 1,
    notes: 'High-octane fuel fill at Shell station.',
    filled_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 2,
    bike_id: 1,
    odometer_km: 12480.0,
    liters: 9.1,
    cost: 1515.0,
    price_per_liter: 166.48,
    is_full_tank: 1,
    notes: 'Full tank before highway tour.',
    filled_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const INITIAL_MAINTENANCE: Maintenance[] = [
  {
    id: 1,
    bike_id: 1,
    type: 'Engine Oil',
    description: 'Full synthetic 10W-40 Motul oil change & filter.',
    odometer_km: 12000.0,
    cost: 3500.0,
    next_service_km: 14000.0,
    service_date: new Date(Date.now() - 20 * 86400000).toISOString(),
    notes: 'Oil looked clean. Replaced washer.',
  },
  {
    id: 2,
    bike_id: 1,
    type: 'Chain Service',
    description: 'Chain degreased, tension adjusted & Motul Lube applied.',
    odometer_km: 12500.0,
    cost: 450.0,
    next_service_km: 13000.0,
    service_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    notes: 'Chain slack set to 25mm.',
  },
];
