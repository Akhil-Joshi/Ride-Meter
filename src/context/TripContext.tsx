import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { dbService } from '../database/db';
import {
  gyroMagnitude,
  RideTracker,
  type RideMotionState,
  userAccelMagnitude,
} from '../services/rideTracker';
import { useSettings } from './SettingsContext';

export type TripStatus = 'idle' | 'active' | 'paused' | 'completed';
export type GPSQuality = 'searching' | 'locked' | 'weak' | 'disabled';

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
  startRide: (tripType?: string) => Promise<void>;
  pauseRide: () => void;
  resumeRide: () => void;
  endRide: () => Promise<number | null>;
  recoverRide: () => Promise<void>;
  discardRecoveredRide: () => Promise<void>;
  resetRide: () => Promise<void>;
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
  startRide: async () => { },
  pauseRide: () => { },
  resumeRide: () => { },
  endRide: async () => null,
  recoverRide: async () => { },
  discardRecoveredRide: async () => { },
  resetRide: async () => { },
});

const ACTIVE_TRIP_KEY = '@ridemeter_active_trip_state';

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

  const trackerRef = useRef(new RideTracker());
  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const motionSubRef = useRef<{ remove: () => void } | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  const activeTripIdRef = useRef<number | null>(null);
  const motionStateRef = useRef<RideMotionState>('stopped');

  const durationSecondsRef = useRef(0);
  const movingSecondsRef = useRef(0);
  const stoppedSecondsRef = useRef(0);
  const maxSpeedRef = useRef(0);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  settingsRef.current = settings;
  activeTripIdRef.current = activeTripId;

  const applyTick = (speedKmh: number, totalMeters: number, state: RideMotionState) => {
    motionStateRef.current = state;
    setCurrentSpeed(speedKmh);
    setDistanceKm(totalMeters / 1000);
    if (state === 'moving' && speedKmh > 0) {
      maxSpeedRef.current = Math.max(maxSpeedRef.current, speedKmh);
      setMaxSpeed(maxSpeedRef.current);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_TRIP_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.tripStatus !== 'completed' && parsed.tripStatus !== 'idle') {
            setHasRecoverableTrip(true);
            setRecoverableTripData(parsed);
          }
        } catch { }
      }
    });
  }, []);

  useEffect(() => {
    if (tripStatus === 'active') {
      timerIntervalRef.current = setInterval(() => {
        durationSecondsRef.current += 1;
        setDurationSeconds(durationSecondsRef.current);
        if (motionStateRef.current === 'moving') {
          movingSecondsRef.current += 1;
          setMovingSeconds(movingSecondsRef.current);
        } else {
          stoppedSecondsRef.current += 1;
          setStoppedSeconds(stoppedSecondsRef.current);
        }
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [tripStatus]);

  useEffect(() => {
    if (movingSeconds > 0 && distanceKm > 0) {
      setAverageSpeed(parseFloat((distanceKm / (movingSeconds / 3600)).toFixed(1)));
    } else {
      setAverageSpeed(0);
    }
  }, [distanceKm, movingSeconds]);

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

  useEffect(() => {
    if (tripStatus !== 'active' && tripStatus !== 'paused') {
      if (tripStatus === 'completed' || tripStatus === 'idle') {
        AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      }
      return;
    }

    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      AsyncStorage.setItem(
        ACTIVE_TRIP_KEY,
        JSON.stringify({
          tripStatus,
          activeTripId: activeTripId == null ? null : Number(activeTripId),
          distanceKm,
          currentSpeed,
          maxSpeed,
          durationSeconds,
          movingSeconds,
          stoppedSeconds,
          startedAt: startedAtRef.current,
          timestamp: Date.now(),
        })
      );
    }, 1500);

    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [tripStatus, activeTripId, distanceKm, currentSpeed, maxSpeed, durationSeconds, movingSeconds, stoppedSeconds]);

  useEffect(() => {
    if (tripStatus === 'active') {
      if (settings.simulatedRideMode) {
        startSimulatedLocationUpdates();
      } else {
        startRealLocationUpdates();
      }
    } else {
      stopSensors();
    }
    return () => stopSensors();
  }, [tripStatus, settings.simulatedRideMode]);

  const ingestGpsFix = (fix: {
    latitude: number;
    longitude: number;
    accuracyM: number;
    speedMps: number | null;
    timestampMs: number;
  }, simulated: boolean) => {
    if (fix.accuracyM <= 15) setGpsQuality('locked');
    else if (fix.accuracyM <= 40) setGpsQuality('weak');
    else setGpsQuality('searching');
    setGpsAccuracy(Math.round(fix.accuracyM));

    const tripId = activeTripIdRef.current;
    if (tripId && !lastCoordsRef.current) {
      dbService.saveTrip({
        id: tripId,
        start_latitude: fix.latitude,
        start_longitude: fix.longitude,
      });
    }

    const tick = trackerRef.current.ingestGps(fix, simulated);
    lastCoordsRef.current = { latitude: fix.latitude, longitude: fix.longitude };
    applyTick(tick.speedKmh, tick.totalMeters, tick.state);
  };

  const startMotionUpdates = async () => {
    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) return;

      const permission = await DeviceMotion.requestPermissionsAsync();
      if (!permission.granted) return;

      DeviceMotion.setUpdateInterval(50);
      motionSubRef.current = DeviceMotion.addListener((data) => {
        trackerRef.current.ingestImu({
          userAccelMps2: userAccelMagnitude(data.acceleration, data.accelerationIncludingGravity),
          gyroDps: gyroMagnitude(data.rotationRate),
        });
      });
    } catch (err) {
      console.warn('Device motion unavailable:', err);
    }
  };

  const startRealLocationUpdates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsQuality('disabled');
        return;
      }
      setGpsQuality('searching');
      await startMotionUpdates();

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 200,
          distanceInterval: 0,
        },
        (loc) => {
          const rawMps = loc.coords.speed;
          ingestGpsFix(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracyM: loc.coords.accuracy || 25,
              speedMps: rawMps != null && Number.isFinite(rawMps) && rawMps >= 0 ? rawMps : null,
              timestampMs: loc.timestamp,
            },
            false
          );
        }
      );
    } catch (err) {
      console.warn('GPS location sub error:', err);
      setGpsQuality('disabled');
    }
  };

  const startSimulatedLocationUpdates = () => {
    stopSensors();
    setGpsQuality('locked');
    setGpsAccuracy(3);

    let lat = 27.7172;
    let lon = 85.324;
    let speed = 45;
    let acceleration = 1.5;

    simIntervalRef.current = setInterval(() => {
      speed += acceleration + (Math.random() * 4 - 2);
      if (speed > 115) acceleration = -2;
      if (speed < 20) acceleration = 2;
      speed = Math.max(0, speed);

      const distMeters = (speed / 3.6) * 1.0;
      lat += (distMeters / 111000) * 0.7;
      lon += (distMeters / (111000 * Math.cos(lat * (Math.PI / 180)))) * 0.7;

      ingestGpsFix(
        {
          latitude: lat,
          longitude: lon,
          accuracyM: 3.5,
          speedMps: speed / 3.6,
          timestampMs: Date.now(),
        },
        true
      );
    }, 1000);
  };

  const stopSensors = () => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    if (motionSubRef.current) {
      motionSubRef.current.remove();
      motionSubRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  const startRide = async (tripType: string = 'Personal') => {
    try {
      if (Platform.OS !== 'web') {
        await activateKeepAwakeAsync();
      }
    } catch { }

    const startedAt = new Date().toISOString();
    startedAtRef.current = startedAt;

    const tripId = Number(await dbService.saveTrip({
      started_at: startedAt,
      status: 'active',
      trip_type: tripType,
      start_latitude: lastCoordsRef.current?.latitude,
      start_longitude: lastCoordsRef.current?.longitude,
    }));

    activeTripIdRef.current = tripId || null;
    setActiveTripId(tripId || null);
    setDistanceKm(0);
    setCurrentSpeed(0);
    setAverageSpeed(0);
    setMaxSpeed(0);
    maxSpeedRef.current = 0;
    setDurationSeconds(0);
    setMovingSeconds(0);
    setStoppedSeconds(0);
    durationSecondsRef.current = 0;
    movingSecondsRef.current = 0;
    stoppedSecondsRef.current = 0;
    trackerRef.current.reset(0);
    lastCoordsRef.current = null;
    motionStateRef.current = 'stopped';
    setTripStatus('active');
  };

  const pauseRide = () => {
    setTripStatus('paused');
  };

  const resumeRide = () => {
    setTripStatus('active');
  };

  const endRide = async (): Promise<number | null> => {
    stopSensors();

    try {
      if (Platform.OS !== 'web') {
        await deactivateKeepAwake();
      }
    } catch { }

    const endedAt = new Date().toISOString();
    const meters = trackerRef.current.getTotalMeters();
    const snapshot = {
      ended_at: endedAt,
      duration_seconds: durationSecondsRef.current,
      moving_seconds: movingSecondsRef.current,
      stopped_seconds: stoppedSecondsRef.current,
      distance_km: parseFloat((meters / 1000).toFixed(2)),
      average_speed_kmh: movingSecondsRef.current > 0
        ? parseFloat(((meters / 1000) / (movingSecondsRef.current / 3600)).toFixed(1))
        : 0,
      max_speed_kmh: maxSpeedRef.current,
      end_latitude: lastCoordsRef.current?.latitude,
      end_longitude: lastCoordsRef.current?.longitude,
      status: 'completed' as const,
    };

    let savedTripId = activeTripIdRef.current ? Number(activeTripIdRef.current) : 0;
    try {
      if (savedTripId) {
        savedTripId = Number(await dbService.saveTrip({ id: savedTripId, ...snapshot }));
      } else {
        savedTripId = Number(await dbService.saveTrip({
          started_at: startedAtRef.current || endedAt,
          ...snapshot,
        }));
      }

      const bikes = await dbService.getBikes();
      if (bikes.length > 0 && meters > 0) {
        const activeBike = bikes[0];
        const newOdo = parseFloat((activeBike.current_odometer + meters / 1000).toFixed(1));
        await dbService.saveBike({ id: activeBike.id, current_odometer: newOdo });
      }
    } catch (e) {
      console.warn('End ride save failed:', e);
    }

    setTripStatus('completed');
    await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
    return savedTripId || null;
  };

  const recoverRide = async () => {
    if (!recoverableTripData) return;
    try {
      if (Platform.OS !== 'web') {
        await activateKeepAwakeAsync();
      }
    } catch { }

    const recoveredKm = recoverableTripData.distanceKm || 0;
    setActiveTripId(recoverableTripData.activeTripId || null);
    setDistanceKm(recoveredKm);
    setCurrentSpeed(0);
    setMaxSpeed(recoverableTripData.maxSpeed || 0);
    setDurationSeconds(recoverableTripData.durationSeconds || 0);
    setMovingSeconds(recoverableTripData.movingSeconds || 0);
    setStoppedSeconds(recoverableTripData.stoppedSeconds || 0);
    startedAtRef.current = recoverableTripData.startedAt || new Date().toISOString();
    trackerRef.current.reset(recoveredKm * 1000);
    lastCoordsRef.current = null;
    motionStateRef.current = 'stopped';
    durationSecondsRef.current = recoverableTripData.durationSeconds || 0;
    movingSecondsRef.current = recoverableTripData.movingSeconds || 0;
    stoppedSecondsRef.current = recoverableTripData.stoppedSeconds || 0;
    maxSpeedRef.current = recoverableTripData.maxSpeed || 0;

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

  const resetRide = async () => {
    stopSensors();
    if (activeTripId && tripStatus !== 'completed') {
      try {
        await dbService.deleteTrip(activeTripId);
      } catch (e) {
        console.warn('Delete active trip error on reset:', e);
      }
    }
    setActiveTripId(null);
    setTripStatus('idle');
    setCurrentSpeed(0);
    setAverageSpeed(0);
    setMaxSpeed(0);
    setDistanceKm(0);
    setDurationSeconds(0);
    setMovingSeconds(0);
    setStoppedSeconds(0);
    setIsSpeedAlertActive(false);
    trackerRef.current.reset(0);
    lastCoordsRef.current = null;
    motionStateRef.current = 'stopped';
    durationSecondsRef.current = 0;
    movingSecondsRef.current = 0;
    stoppedSecondsRef.current = 0;
    maxSpeedRef.current = 0;
    startedAtRef.current = null;
    await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
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
        resetRide,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);
