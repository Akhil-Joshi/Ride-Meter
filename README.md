# RideMeter 🏍️⚡
> **Offline GPS Motorcycle Speedometer, Trip Computer & Local Service Log**  
> *Built with React Native, Expo SDK 57, Expo Router, and SQLite.*

---

## 📸 Overview

**RideMeter** transforms your smartphone into a digital motorcycle instrument cluster and local trip computer. Engineered strictly **offline-first**, RideMeter requires zero internet connection, zero user sign-ups, and zero cloud tracking. All speed smoothing, distance calculations, fuel logs, and service records are stored locally on your device in SQLite.

---

## ✨ Key Features

### 1. ⚡ Arc Speedometer & Instrument Gauge
- **Wide-Arc Vector Gauge**: High-resolution SVG 0–200 km/h (or 0–140 mph) dial with a dynamic blade needle and cyan backlight glow.
- **Clean Digital Readout Pod**: Isolated digital speed display pod positioned cleanly below the analog pivot pin to prevent overlap.
- **Speed Limit Alerts**: Visual banner and dynamic red gauge glow when exceeding user-configured speed limits.
- **Reset Button**: Easily reset live trip metrics back to initial state anytime from the Dashboard.

### 2. 📍 GPS Ride Engine & Crash Recovery
- **EMA Speed Smoothing**: Exponential Moving Average filtering eliminates erratic GPS speed spikes while maintaining instant responsiveness.
- **Haversine Distance Accuracy**: Precise distance accumulation calculated between consecutive GPS coordinates.
- **Auto-Pause & Keep-Awake**: Automatically pauses metrics when stationary at traffic lights and keeps the screen illuminated while riding.
- **Crash Recovery**: State persistence guarantees unsaved trip metrics can be restored if the device reboots or app closes unexpectedly.

### 3. 🛠️ Garage & Maintenance Suite (Full CRUD)
- **Editable Motorcycle Profile**: Customize your motorcycle's Display Name, Make, Model, Year, and Odometer.
- **Fuel Fill-Up Logs (Add, Edit, Delete)**: Record liters added, total cost, price per liter, and odometer. Edit or delete previous fill-ups anytime.
- **Real-World Fuel Economy**: Automatically calculates actual fuel efficiency (`km/L` or `MPG`) from consecutive fill-up logs and trip distances.
- **Service Interval Tracker (Add, Edit, Delete)**: Track oil changes, chain lubes, tire replacements, and brake pad wear with visual progress bars and overdue alerts.

### 4. 📊 Ride Analytics & Logbook
- **Comprehensive Trip Logs**: View detailed ride history with total distance, moving vs. stopped time, average speed, max speed, and start/end coordinates.
- **Interactive Analytics**: Filter metrics by Lifetime, Monthly, or Weekly periods with category breakdowns (*Personal*, *Commute*, *Tour*).
- **Horizontal Category Filters**: Smooth horizontal scrolling badge chips for filtering ride history and favorites.

### 5. 💀 Skeletons & Clean Empty States
- **Clean Initial State**: Zero dummy/mock data pre-populated. Starts with your clean bike profile.
- **Animated Pulse Skeletons**: Smooth skeleton loading placeholders across Garage, History, Analytics, and Trip details.
- **Aesthetic Empty States**: Contextual empty state illustrations and call-to-action buttons when no rides, fuel fill-ups, or service logs exist yet.

### 6. 🎨 Custom Theme Engine
- **Overdrive Industrial (Dark Mode)**: Deep cyan and obsidian black aesthetic designed for nighttime cockpit visibility.
- **High-Visibility (Light Mode)**: Crisp white and high-contrast sky blue theme for direct sunlight outdoor riding.
- **System Mode**: Seamlessly follows your device's global light/dark theme preference.

### 7. 📤 Offline Data Portability & Exports
- **GPX Trail Export**: Export individual ride routes to standard `.gpx` files for mapping tools (Strava, Google Earth, Gaia GPS).
- **CSV Data Export**: Export full trip history logbooks to `.csv` spreadsheets.
- **Full JSON Backup**: Create 1-click complete offline backups of all bikes, trips, fuel logs, and service history.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Framework** | [Expo SDK 57](https://expo.dev) / React Native 0.76+ |
| **Routing** | [Expo Router](https://docs.expo.dev/router/introduction/) (`NativeTabs` & `Stack`) |
| **Database** | `expo-sqlite` (Native SQLite with AsyncStorage fallback for Web) |
| **Graphics** | `react-native-svg` (Custom Arc Instruments & Gauges) |
| **Icons** | `lucide-react-native` & `@expo/vector-icons` |
| **Location** | `expo-location` & `expo-keep-awake` |
| **Type Safety** | TypeScript |

---

## 📁 Project Architecture

```
ride-meter/
├── src/
│   ├── app/
│   │   ├── _layout.tsx           # Root Stack & Theme Provider setup
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # NativeTabs configuration & vector icons
│   │   │   ├── index.tsx         # Ride Dashboard (Gauge, Controls, Reset)
│   │   │   ├── history.tsx       # Ride Logs (Search & Horizontal Filters)
│   │   │   ├── stats.tsx         # Ride Analytics & Category Breakdown
│   │   │   ├── garage.tsx        # Garage, Editable Bike Profile & CRUD Logs
│   │   │   └── settings.tsx      # Settings & Theme Mode Switcher
│   │   └── history/
│   │       └── [id].tsx          # Trip Detail Screen & GPX/CSV Exporter
│   ├── components/
│   │   ├── SpeedometerGauge.tsx  # SVG 0-200 Arc Gauge Component
│   │   ├── StatCard.tsx          # Dynamic Metric Card Component
│   │   ├── TripCard.tsx          # Ride Logbook Card Component
│   │   ├── FuelCard.tsx          # Fuel Fill-up Log Card (Edit & Delete)
│   │   ├── MaintenanceCard.tsx   # Service Card (Edit & Delete)
│   │   ├── SkeletonLoader.tsx    # Animated Pulse Skeleton Component
│   │   ├── EmptyState.tsx        # Aesthetic Empty State Card Component
│   │   ├── GPSStatusBadge.tsx    # Live GPS Satellite Lock Indicator
│   │   └── SpeedAlertBanner.tsx  # Over-speed Warning Banner
│   ├── constants/
│   │   └── colors.ts             # Theme Tokens (DARK_THEME & LIGHT_THEME)
│   ├── context/
│   │   ├── SettingsContext.tsx   # Units, Alerts, & Theme Mode State
│   │   └── TripContext.tsx       # Live GPS Engine, EMA Smoothing & Trips
│   ├── database/
│   │   ├── db.ts                 # Database Service (SQLite & Web Storage)
│   │   └── schema.ts             # SQLite DDL Schema Definition
│   ├── services/
│   │   └── exportService.ts      # CSV, JSON, and GPX Data Exporters
│   └── utils/
│       ├── formatting.ts         # Haversine Formula, Unit Conversions
│       └── mockData.ts           # Types & Initial Clean Setup
├── app.json
├── metro.config.js               # Web WASM support for expo-sqlite
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

## 🧪 Build & Web Export

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
