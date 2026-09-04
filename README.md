# RideMeter 🏍️⚡
> **Offline GPS Motorcycle Speedometer, Trip Computer & Local Service Log**  
> *Built with React Native, Expo SDK 57, Expo Router, and SQLite.*

---

## 📸 Overview

**RideMeter** transforms your smartphone into a digital motorcycle instrument cluster and local trip computer. Engineered strictly **offline-first**, RideMeter requires zero internet connection, zero user sign-ups, and zero cloud tracking. All speed smoothing, sensor fusion, distance calculations, fuel logs, and service records are processed and stored locally on your device in SQLite.

---

## ✨ Key Features

### 1. ⚡ Arc Speedometer & Instrument Gauge
- **Wide-Arc Vector Gauge**: High-resolution SVG 0–200 km/h (or 0–140 mph) dial with a dynamic blade needle and cyan backlight glow.
- **Clean Digital Readout Pod**: Isolated digital speed display pod positioned cleanly below the analog pivot pin to prevent visual overlap.
- **Speed Limit Alerts**: Visual warning banner and dynamic red gauge glow when exceeding user-configured speed limits.
- **Reset Button**: Easily reset live trip metrics back to an initial state anytime from the Dashboard.

### 2. 🛰️ Precision Ride Engine & Sensor Fusion (`RideTracker`)
- **Doppler GNSS Speed Priority**: Prioritizes satellite Doppler speed readings (`coords.speed`) over position-differencing for immediate, flutter-free speed response.
- **IMU Stationary Detection (`expo-sensors`)**: Fuses accelerometer and gyroscope data to detect physical stillness, preventing GPS wander (typical 5–10 km/h drift at rest) from inflating trip distance or showing false speed at stops.
- **Motorcycle Vibration Tolerance**: Distinguishes between device translation and engine idle vibration at traffic lights, keeping speedometer anchored to 0 km/h when parked.
- **Responsive Crawl Speeds (1–7 km/h)**: Asymmetric Exponential Moving Average (EMA) smoothing tuned for immediate throttle pickup and crawl speeds comparable to Google Maps.
- **Auto-Pause & Keep-Awake**: Intelligently separates moving time from stopped time and keeps the display active during rides.
- **Crash Recovery**: Active trip state is saved continuously to local storage, allowing unsaved trip data to be restored seamlessly after app closure or device reboot.

### 3. 📍 Trip Lifecycle & Coordinate Reliability
- **Guaranteed Start & End Coordinates**: Explicitly locks live GPS positions (`getCurrentPositionAsync`) at ride start and ride completion, eliminating `0.0, 0.0` or missing coordinate records.
- **Calibrated Average & Max Speed**: Calculates average speed strictly from moving time and distance, preventing runaway initial average speed spikes.
- **Robust Persistence & Numeric IDs**: End-to-end numeric trip ID handling in SQLite, context, and router screens, guaranteeing long trips (15+ minutes) save reliably without navigation loss.
- **Safe Coordinate Formatting**: Utility handles coordinate edge cases with clean, user-friendly labels.

### 4. 🛠️ Garage & Maintenance Suite (Full CRUD)
- **Editable Motorcycle Profile**: Customize your motorcycle's Display Name, Make, Model, Year, and Odometer.
- **Fuel Fill-Up Logs (Add, Edit, Delete)**: Record liters added, total cost, price per liter, and odometer. Edit or delete previous fill-ups anytime.
- **Real-World Fuel Economy**: Automatically calculates actual fuel efficiency (`km/L` or `MPG`) from consecutive fill-up logs and trip distances.
- **Service Interval Tracker (Add, Edit, Delete)**: Track oil changes, chain lubes, tire replacements, and brake pad wear with visual progress bars and overdue alerts.

### 5. 📊 Ride Analytics & Logbook
- **Comprehensive Trip Logs**: View detailed ride history with total distance, moving vs. stopped time, average speed, max speed, and start/end coordinates.
- **Interactive Analytics**: Filter metrics by Lifetime, Monthly, or Weekly periods with category breakdowns (*Personal*, *Commute*, *Tour*).
- **Horizontal Category Filters**: Smooth horizontal scrolling badge chips for filtering ride history and favorites.

### 6. 💀 Skeletons & Clean Empty States
- **Clean Initial State**: Zero dummy/mock data pre-populated; starts with your actual bike profile.
- **Animated Pulse Skeletons**: Smooth skeleton loading placeholders across Garage, History, Analytics, and Trip details.
- **Aesthetic Empty States**: Contextual illustrations and action buttons when no rides, fuel logs, or service entries exist yet.

### 7. 🎨 Custom Theme Engine
- **Overdrive Industrial (Dark Mode)**: Deep cyan and obsidian black aesthetic designed for nighttime cockpit visibility.
- **High-Visibility (Light Mode)**: Crisp white and high-contrast sky blue theme for direct sunlight outdoor riding.
- **System Mode**: Seamlessly follows your device's global light/dark theme preference.

### 8. 📤 Offline Data Portability & Exports
- **GPX Trail Export**: Export individual ride routes to standard `.gpx` files for mapping tools (Strava, Google Earth, Gaia GPS).
- **CSV Data Export**: Export full trip history logbooks to `.csv` spreadsheets.
- **Full JSON Backup**: Create 1-click complete offline backups of all bikes, trips, fuel logs, and service history.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Framework** | [Expo SDK 57](https://expo.dev) / React Native 0.86+ / React 19 |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) (`NativeTabs` & Nested `Stack` routes) |
| **Database** | `expo-sqlite` (Native SQLite with AsyncStorage fallback for Web) |
| **Sensors & Location** | `expo-location` (GNSS Doppler & Position), `expo-sensors` (DeviceMotion IMU), `expo-keep-awake` |
| **Graphics** | `react-native-svg` (Custom Arc Instruments & Gauges) |
| **Icons** | `lucide-react-native` & `@expo/vector-icons` |
| **Type Safety** | TypeScript |

---

## 📁 Project Architecture

```
ride-meter/
├── src/
│   ├── app/
│   │   ├── _layout.tsx               # Root Stack & Theme Provider setup
│   │   ├── index.tsx                 # Root entry redirect to /dashboard
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           # NativeTabs configuration & vector icons
│   │   │   ├── dashboard/
│   │   │   │   ├── _layout.tsx       # Dashboard stack layout
│   │   │   │   └── index.tsx         # Ride Dashboard (Gauge, Controls, Reset)
│   │   │   ├── logs/
│   │   │   │   ├── _layout.tsx       # Logs stack layout
│   │   │   │   └── index.tsx         # Ride Logs (Search & Horizontal Filters)
│   │   │   ├── stats/
│   │   │   │   ├── _layout.tsx       # Stats stack layout
│   │   │   │   └── index.tsx         # Ride Analytics & Category Breakdown
│   │   │   ├── garage/
│   │   │   │   ├── _layout.tsx       # Garage stack layout
│   │   │   │   └── index.tsx         # Garage, Editable Bike Profile & CRUD Logs
│   │   │   └── settings/
│   │   │       ├── _layout.tsx       # Settings stack layout
│   │   │       └── index.tsx         # Settings & Theme Mode Switcher
│   │   └── history/
│   │       └── [id].tsx              # Trip Detail Screen & GPX/CSV Exporter
│   ├── components/
│   │   ├── SpeedometerGauge.tsx      # SVG 0-200 Arc Gauge Component
│   │   ├── StatCard.tsx              # Dynamic Metric Card Component
│   │   ├── TripCard.tsx              # Ride Logbook Card Component
│   │   ├── FuelCard.tsx              # Fuel Fill-up Log Card (Edit & Delete)
│   │   ├── MaintenanceCard.tsx       # Service Card (Edit & Delete)
│   │   ├── SkeletonLoader.tsx        # Animated Pulse Skeleton Component
│   │   ├── EmptyState.tsx            # Aesthetic Empty State Card Component
│   │   ├── GPSStatusBadge.tsx        # Live GPS Satellite Lock Indicator
│   │   └── SpeedAlertBanner.tsx      # Over-speed Warning Banner
│   ├── constants/
│   │   └── colors.ts                 # Theme Tokens (DARK_THEME & LIGHT_THEME)
│   ├── context/
│   │   ├── SettingsContext.tsx       # Units, Alerts, & Theme Mode State
│   │   └── TripContext.tsx           # Live GPS Engine, State Machine & Trips
│   ├── database/
│   │   ├── db.ts                     # Database Service (SQLite & Web Storage)
│   │   └── schema.ts                 # SQLite DDL Schema Definition
│   ├── services/
│   │   ├── exportService.ts          # CSV, JSON, and GPX Data Exporters
│   │   └── rideTracker.ts            # Sensor Fusion, Doppler Speed & Motion Engine
│   └── utils/
│       ├── formatting.ts             # Haversine Distance, LatLng, Unit Conversions
│       └── mockData.ts               # Types & Initial Clean Setup
├── app.json
├── metro.config.js                   # Web WASM support for expo-sqlite
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) or [Bun](https://bun.sh)
- [Expo Go app](https://expo.dev/go) on iOS/Android OR Android Studio / Xcode for emulators

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ride-meter.git
   cd ride-meter
   ```

2. **Install dependencies**:
   ```bash
   bun install
   # or
   npm install
   ```

3. **Start the development server**:
   ```bash
   bun start -c
   # or
   npx expo start -c
   ```

4. **Run on target platform**:
   - Press `i` for **iOS Simulator**
   - Press `a` for **Android Emulator**
   - Press `w` for **Web Browser**
   - Scan the QR code with **Expo Go** on your physical mobile phone

---

## 🧪 Build & Type Check

To test production static web export:
```bash
npx expo export -p web
```

To run TypeScript type checking:
```bash
npx tsc --noEmit
```

---

## 🔒 Privacy & Offline Philosophy

- **Zero Cloud Dependence**: RideMeter does not communicate with external servers or tracking APIs.
- **Local SQLite Storage**: Your location history, speed logs, and bike service records never leave your device.
- **Open Data Export**: Export your data anytime in open formats (`.gpx`, `.csv`, `.json`).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
