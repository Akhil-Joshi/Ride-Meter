export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS bikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    registration_number TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    initial_odometer REAL DEFAULT 0,
    current_odometer REAL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bike_id INTEGER,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    moving_seconds INTEGER DEFAULT 0,
    stopped_seconds INTEGER DEFAULT 0,
    distance_km REAL DEFAULT 0,
    average_speed_kmh REAL DEFAULT 0,
    max_speed_kmh REAL DEFAULT 0,
    start_latitude REAL,
    start_longitude REAL,
    end_latitude REAL,
    end_longitude REAL,
    trip_type TEXT,
    notes TEXT,
    is_favorite INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY (bike_id) REFERENCES bikes(id)
);

CREATE TABLE IF NOT EXISTS trip_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    altitude REAL,
    speed_kmh REAL,
    accuracy REAL,
    heading REAL,
    recorded_at TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bike_id INTEGER NOT NULL,
    trip_id INTEGER,
    odometer_km REAL,
    liters REAL NOT NULL,
    cost REAL,
    price_per_liter REAL,
    is_full_tank INTEGER DEFAULT 1,
    notes TEXT,
    filled_at TEXT NOT NULL,
    FOREIGN KEY (bike_id) REFERENCES bikes(id)
);

CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bike_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    odometer_km REAL,
    cost REAL,
    next_service_km REAL,
    service_date TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (bike_id) REFERENCES bikes(id)
);

CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bike_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    reminder_date TEXT,
    reminder_odometer_km REAL,
    is_completed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (bike_id) REFERENCES bikes(id)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_points_trip_id ON trip_points(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON trips(started_at);
CREATE INDEX IF NOT EXISTS idx_trips_bike_id ON trips(bike_id);
CREATE INDEX IF NOT EXISTS idx_fuel_bike_id ON fuel_logs(bike_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_bike_id ON maintenance(bike_id);
`;
