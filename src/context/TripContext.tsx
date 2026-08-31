import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from './SettingsContext';
import { calculateHaversineDistance } from '../utils/formatting';
import { dbService } from '../database/db';

export type TripStatus = 'idle' | 'active' | 'paused' | 'completed';
export type GPSQuality = 'searching' | 'locked' | 'weak' | 'disabled';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  speedKmh: number;
  accuracy: number;
  timestamp: number;
}

interface TripContextType {
  tripStatus: TripStatus;
  currentSpeed: number;
  averageSpeed: number;
  maxSpeed: number;
  distanceKm: number;
  durationSeconds: number;
  movingSeconds: number;
  stoppedSeconds: number;
  gpsQuality: GPSQuality;
  gpsAccuracy: number;
  isSpeedAlertActive: boolean;
  activeTripId: number | null;
  hasRecoverableTrip: boolean;
  recoverableTripData: any | null;
  startRide: () => Promise<void>;
  pauseRide: () => void;
  resumeRide: () => void;
  endRide: () => Promise<number | null>;
  recoverRide: () => Promise<void>;
  discardRecoveredRide: () => Promise<void>;
}

const TripContext = createContext<TripContextType>({
  tripStatus: 'idle',
  currentSpeed: 0,
  averageSpeed: 0,
  maxSpeed: 0,
  distanceKm: 0,
  durationSeconds: 0,
  movingSeconds: 0,
  stoppedSeconds: 0,
  gpsQuality: 'searching',
  gpsAccuracy: 0,
  isSpeedAlertActive: false,
  activeTripId: null,
  hasRecoverableTrip: false,
  recoverableTripData: null,
  startRide: async () => {},
  pauseRide: () => {},
  resumeRide: () => {},
  endRide: async () => null,
  recoverRide: async () => {},
  discardRecoveredRide: async () => {},
});

const ACTIVE_TRIP_KEY = '@ridemeter_active_trip_state';
const STOP_SPEED_THRESHOLD_KMH = 2.0; // below 2 km/h counted as stopped
const ALPHA_EMA = 0.25; // Speed smoothing coefficient

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();

  const [tripStatus, setTripStatus] = useState<TripStatus>('idle');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [averageSpeed, setAverageSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [movingSeconds, setMovingSeconds] = useState<number>(0);
  const [stoppedSeconds, setStoppedSeconds] = useState<number>(0);
  const [gpsQuality, setGpsQuality] = useState<GPSQuality>('searching');
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(10);
  const [isSpeedAlertActive, setIsSpeedAlertActive] = useState<boolean>(false);
  const [activeTripId, setActiveTripId] = useState<number | null>(null);

  const [hasRecoverableTrip, setHasRecoverableTrip] = useState<boolean>(false);
  const [recoverableTripData, setRecoverableTripData] = useState<any | null>(null);

  const lastLocationRef = useRef<LocationPoint | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const simIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const startedAtRef = useRef<string | null>(null);

  // Check for crashed/unfinished ride on mount
  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_TRIP_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.tripStatus !== 'completed' && parsed.tripStatus !== 'idle') {
            setHasRecoverableTrip(true);
            setRecoverableTripData(parsed);
          }
        } catch {}
      }
    });
  }, []);

  // Timer loop for duration, moving, and stopped time
  useEffect(() => {
    if (tripStatus === 'active') {
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
        if (currentSpeed >= STOP_SPEED_THRESHOLD_KMH) {
          setMovingSeconds((prev) => prev + 1);
        } else {
          setStoppedSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [tripStatus, currentSpeed]);

  // Recalculate Average Speed
  useEffect(() => {
    if (movingSeconds > 0 && distanceKm > 0) {
      const avg = (distanceKm / (movingSeconds / 3600));
      setAverageSpeed(parseFloat(avg.toFixed(1)));
    } else {
      setAverageSpeed(0);
    }
  }, [distanceKm, movingSeconds]);

  // Check Speed Alert Limit
  useEffect(() => {
    if (
      settings.speedAlertEnabled &&
      settings.speedLimitKmh > 0 &&
      currentSpeed >= settings.speedLimitKmh
    ) {
      setIsSpeedAlertActive(true);
    } else {
      setIsSpeedAlertActive(false);
    }
  }, [currentSpeed, settings.speedAlertEnabled, settings.speedLimitKmh]);

  // Persist Active Trip Progress for Crash Recovery
  useEffect(() => {
    if (tripStatus === 'active' || tripStatus === 'paused') {
      const stateToPersist = {
        tripStatus,
        activeTripId,
        distanceKm,
        currentSpeed,
        maxSpeed,
        durationSeconds,
        movingSeconds,
        stoppedSeconds,
        startedAt: startedAtRef.current,
        timestamp: Date.now(),
      };
      AsyncStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(stateToPersist));
    } else if (tripStatus === 'completed' || tripStatus === 'idle') {
      AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
    }
  }, [tripStatus, activeTripId, distanceKm, currentSpeed, maxSpeed, durationSeconds, movingSeconds, stoppedSeconds]);

  // Handle Simulation Mode vs Real Location Watch
  useEffect(() => {
    if (tripStatus === 'active') {
      if (settings.simulatedRideMode) {
        startSimulatedLocationUpdates();
      } else {
        startRealLocationUpdates();
      }
    } else {
      stopLocationUpdates();
    }
    return () => stopLocationUpdates();
  }, [tripStatus, settings.simulatedRideMode]);

  const startRealLocationUpdates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsQuality('disabled');
        return;
      }
      setGpsQuality('searching');

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (loc) => {
          processNewLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speedKmh: Math.max(0, (loc.coords.speed || 0) * 3.6),
            accuracy: loc.coords.accuracy || 15,
            timestamp: loc.timestamp,
          });
        }
      );
    } catch (err) {
      console.warn('GPS location sub error:', err);
      setGpsQuality('disabled');
    }
  };

  const startSimulatedLocationUpdates = () => {
    stopLocationUpdates();
    setGpsQuality('locked');
    setGpsAccuracy(3);

    let lat = 27.7172;
    let lon = 85.324;
    let speed = 45;
    let acceleration = 1.5;

    simIntervalRef.current = setInterval(() => {
      // Vary speed realistically between 20 km/h and 115 km/h
      speed += acceleration + (Math.random() * 4 - 2);
      if (speed > 115) acceleration = -2;
      if (speed < 20) acceleration = 2;
      speed = Math.max(0, speed);

      // Advance lat/lon slightly
      const distMeters = (speed / 3.6) * 1.0;
      lat += (distMeters / 111000) * 0.7;
      lon += (distMeters / (111000 * Math.cos(lat * (Math.PI / 180)))) * 0.7;

      processNewLocation({
        latitude: lat,
        longitude: lon,
        speedKmh: speed,
        accuracy: 3.5,
        timestamp: Date.now(),
      });
    }, 1000);
  };

  const stopLocationUpdates = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  const processNewLocation = (point: LocationPoint) => {
    // 1. Update GPS status
    if (point.accuracy <= 15) setGpsQuality('locked');
    else if (point.accuracy <= 40) setGpsQuality('weak');
    else setGpsQuality('searching');

    setGpsAccuracy(Math.round(point.accuracy));

    // 2. Reject noisy locations
    if (point.accuracy > settings.accuracyThresholdMeters) return;

    // 3. Smooth speed via Exponential Moving Average (EMA)
    setCurrentSpeed((prevSpeed) => {
      const smoothed = ALPHA_EMA * point.speedKmh + (1 - ALPHA_EMA) * prevSpeed;
      const finalSpeed = smoothed < 1.0 ? 0 : parseFloat(smoothed.toFixed(1));
      
      // Update max speed (reject spikes > 220 km/h)
      if (finalSpeed <= 220) {
        setMaxSpeed((prevMax) => Math.max(prevMax, finalSpeed));
      }
      return finalSpeed;
    });

    // 4. Calculate Distance via Haversine between consecutive points
    if (lastLocationRef.current) {
      const distMeters = calculateHaversineDistance(
        lastLocationRef.current.latitude,
        lastLocationRef.current.longitude,
        point.latitude,
        point.longitude
      );

      // Noise protection: ignore jump > 500m in 1s or < 2m drift
      if (distMeters >= 2 && distMeters < 500) {
        setDistanceKm((prev) => parseFloat((prev + distMeters / 1000).toFixed(3)));
      }
    }
    lastLocationRef.current = point;
  };

  const startRide = async () => {
    try {
      if (Platform.OS !== 'web') {
        await activateKeepAwakeAsync();
      }
    } catch {}

    const startedAt = new Date().toISOString();
    startedAtRef.current = startedAt;

    // Create DB trip record
    const tripId = await dbService.saveTrip({
      started_at: startedAt,
      status: 'active',
      trip_type: 'Personal',
    });

    setActiveTripId(tripId);
    setDistanceKm(0);
    setCurrentSpeed(0);
    setAverageSpeed(0);
    setMaxSpeed(0);
    setDurationSeconds(0);
    setMovingSeconds(0);
    setStoppedSeconds(0);
    lastLocationRef.current = null;
    setTripStatus('active');
  };

  const pauseRide = () => {
    setTripStatus('paused');
  };

  const resumeRide = () => {
    setTripStatus('active');
  };

  const endRide = async (): Promise<number | null> => {
    setTripStatus('completed');
    stopLocationUpdates();

    try {
      if (Platform.OS !== 'web') {
        await deactivateKeepAwake();
      }
    } catch {}

    const endedAt = new Date().toISOString();
    let savedTripId = activeTripId;

    if (savedTripId) {
      await dbService.saveTrip({
        id: savedTripId,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        moving_seconds: movingSeconds,
        stopped_seconds: stoppedSeconds,
        distance_km: parseFloat(distanceKm.toFixed(2)),
        average_speed_kmh: averageSpeed,
        max_speed_kmh: maxSpeed,
        status: 'completed',
      });

      // Update bike odometer
      const bikes = await dbService.getBikes();
      if (bikes.length > 0) {
        const activeBike = bikes[0];
        const newOdo = parseFloat((activeBike.current_odometer + distanceKm).toFixed(1));
        await dbService.saveBike({ id: activeBike.id, current_odometer: newOdo });
      }
    }

    await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
    return savedTripId;
  };

  const recoverRide = async () => {
    if (!recoverableTripData) return;
    try {
      if (Platform.OS !== 'web') {
        await activateKeepAwakeAsync();
      }
    } catch {}

    setActiveTripId(recoverableTripData.activeTripId || null);
    setDistanceKm(recoverableTripData.distanceKm || 0);
    setCurrentSpeed(recoverableTripData.currentSpeed || 0);
    setMaxSpeed(recoverableTripData.maxSpeed || 0);
    setDurationSeconds(recoverableTripData.durationSeconds || 0);
    setMovingSeconds(recoverableTripData.movingSeconds || 0);
    setStoppedSeconds(recoverableTripData.stoppedSeconds || 0);
    startedAtRef.current = recoverableTripData.startedAt || new Date().toISOString();

    setHasRecoverableTrip(false);
    setRecoverableTripData(null);
    setTripStatus('active');
  };

  const discardRecoveredRide = async () => {
    await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
    setHasRecoverableTrip(false);
    setRecoverableTripData(null);
    setTripStatus('idle');
  };

  return (
    <TripContext.Provider
      value={{
        tripStatus,
        currentSpeed,
        averageSpeed,
        maxSpeed,
        distanceKm,
        durationSeconds,
        movingSeconds,
        stoppedSeconds,
        gpsQuality,
        gpsAccuracy,
        isSpeedAlertActive,
        activeTripId,
        hasRecoverableTrip,
        recoverableTripData,
        startRide,
        pauseRide,
        resumeRide,
        endRide,
        recoverRide,
        discardRecoveredRide,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
