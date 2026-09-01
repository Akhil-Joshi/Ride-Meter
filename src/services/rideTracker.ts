import { calculateHaversineDistance } from '../utils/formatting';

/**
 * Phone trip computer (how consumer GPS apps actually work):
 *
 * - Distance comes from accepted GPS positions (Haversine), never from
 *   integrating the accelerometer (that drifts within seconds).
 * - Instant speed prefers the GNSS Doppler value (`coords.speed`). Position
 *   differencing is the fallback when Doppler is missing.
 * - Accelerometer + gyro do not measure road speed. They detect a still
 *   device so GPS wander (typical 5–10 km/h at rest) is not counted.
 * - Engine vibration can make IMU look "busy" at a red light, so IMU may
 *   confirm stopped but must not force moving. GPS cluster is the authority
 *   when the device is shaking on a running bike.
 */

export type RideMotionState = 'stopped' | 'moving';

export type GpsFix = {
  latitude: number;
  longitude: number;
  accuracyM: number;
  /** GNSS speed in m/s, or null if the chip has no valid Doppler reading. */
  speedMps: number | null;
  timestampMs: number;
};

export type ImuFix = {
  /** Magnitude of user acceleration (gravity removed), m/s². */
  userAccelMps2: number;
  /** Magnitude of rotation rate, deg/s. */
  gyroDps: number;
};

export type RideTick = {
  state: RideMotionState;
  speedKmh: number;
  deltaMeters: number;
  totalMeters: number;
};

const MAX_SPEED_KMH = 220;
const MAX_ACCURACY_M = 80;
const MIN_DT_SEC = 0.35;
const MIN_STEP_M = 1.5;
const GPS_MOVE_KMH = 12;
const GPS_STOP_KMH = 8;
const EMA_UP = 0.35;
const EMA_DOWN = 0.5;
const STOP_CONFIRM = 2;
const IMU_WINDOW = 20;
const IMU_STILL_ACCEL = 0.45;
const IMU_STILL_GYRO = 18;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function mag3(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function rms(values: number[]): number {
  if (values.length === 0) return 0;
  const meanSq = values.reduce((s, v) => s + v * v, 0) / values.length;
  return Math.sqrt(meanSq);
}

export function userAccelMagnitude(acceleration: { x: number; y: number; z: number } | null, includingGravity: { x: number; y: number; z: number }): number {
  if (acceleration) {
    return mag3(acceleration.x, acceleration.y, acceleration.z);
  }
  const g = mag3(includingGravity.x, includingGravity.y, includingGravity.z);
  return Math.abs(g - 9.80665);
}

export function gyroMagnitude(rotationRate: { alpha: number; beta: number; gamma: number } | null): number {
  if (!rotationRate) return 0;
  return mag3(rotationRate.alpha, rotationRate.beta, rotationRate.gamma);
}

export class RideTracker {
  private state: RideMotionState = 'stopped';
  private lastFix: GpsFix | null = null;
  private stopAnchor: GpsFix | null = null;
  private totalMeters = 0;
  private speedEma = 0;
  private stopHits = 0;
  private accelWindow: number[] = [];
  private gyroWindow: number[] = [];

  reset(initialMeters = 0): void {
    this.state = 'stopped';
    this.lastFix = null;
    this.stopAnchor = null;
    this.totalMeters = initialMeters;
    this.speedEma = 0;
    this.stopHits = 0;
    this.accelWindow = [];
    this.gyroWindow = [];
  }

  ingestImu(fix: ImuFix): void {
    this.accelWindow.push(fix.userAccelMps2);
    this.gyroWindow.push(fix.gyroDps);
    if (this.accelWindow.length > IMU_WINDOW) this.accelWindow.shift();
    if (this.gyroWindow.length > IMU_WINDOW) this.gyroWindow.shift();
  }

  ingestGps(fix: GpsFix, simulated = false): RideTick {
    if (!simulated && fix.accuracyM > MAX_ACCURACY_M) {
      return this.snapshot(0);
    }

    if (!this.lastFix) {
      this.lastFix = fix;
      this.stopAnchor = fix;
      this.state = 'stopped';
      this.speedEma = 0;
      return this.snapshot(0);
    }

    const dtSec = (fix.timestampMs - this.lastFix.timestampMs) / 1000;
    if (dtSec >= 0 && dtSec < MIN_DT_SEC) {
      return this.snapshot(0);
    }

    const dt = Math.max(dtSec, MIN_DT_SEC);
    const distM = calculateHaversineDistance(
      this.lastFix.latitude,
      this.lastFix.longitude,
      fix.latitude,
      fix.longitude
    );

    const maxJumpM = Math.max(40, (MAX_SPEED_KMH / 3.6) * dt * 1.5);
    if (distM > maxJumpM) {
      this.lastFix = fix;
      return this.snapshot(0);
    }

    const dopplerKmh =
      fix.speedMps != null && fix.speedMps >= 0 ? fix.speedMps * 3.6 : null;
    const impliedKmh = (distM / dt) * 3.6;
    const clusterR = this.clusterRadiusM(fix.accuracyM);
    const imuStill = simulated ? false : this.isImuStill();

    if (this.state === 'stopped') {
      return this.handleStopped({
        fix,
        distM,
        impliedKmh,
        dopplerKmh,
        clusterR,
        imuStill,
        simulated,
      });
    }

    return this.handleMoving({
      fix,
      distM,
      impliedKmh,
      dopplerKmh,
      clusterR,
      imuStill,
      simulated,
    });
  }

  getState(): RideMotionState {
    return this.state;
  }

  getSpeedKmh(): number {
    return this.state === 'stopped' ? 0 : parseFloat(this.speedEma.toFixed(1));
  }

  getTotalMeters(): number {
    return this.totalMeters;
  }

  private clusterRadiusM(accuracyM: number): number {
    return clamp(accuracyM * 1.6, 12, 28);
  }

  private isImuStill(): boolean {
    if (this.accelWindow.length < 8) return false;
    return rms(this.accelWindow) < IMU_STILL_ACCEL && rms(this.gyroWindow) < IMU_STILL_GYRO;
  }

  private snapshot(deltaMeters: number): RideTick {
    return {
      state: this.state,
      speedKmh: this.getSpeedKmh(),
      deltaMeters,
      totalMeters: this.totalMeters,
    };
  }

  private handleStopped(args: {
    fix: GpsFix;
    distM: number;
    impliedKmh: number;
    dopplerKmh: number | null;
    clusterR: number;
    imuStill: boolean;
    simulated: boolean;
  }): RideTick {
    const { fix, impliedKmh, dopplerKmh, clusterR, imuStill, simulated } = args;
    const anchor = this.stopAnchor || this.lastFix!;
    const fromAnchor = calculateHaversineDistance(
      anchor.latitude,
      anchor.longitude,
      fix.latitude,
      fix.longitude
    );

    const gpsSpeed = dopplerKmh ?? impliedKmh;
    const gpsSaysMove = gpsSpeed >= GPS_MOVE_KMH || impliedKmh >= GPS_MOVE_KMH + 2;
    const leftCluster = fromAnchor > clusterR;

    const shouldMove = simulated
      ? gpsSaysMove
      : leftCluster && gpsSaysMove && !imuStill;

    this.lastFix = fix;

    if (!shouldMove) {
      this.speedEma = 0;
      if (!leftCluster) {
        this.stopAnchor = anchor;
      } else if (imuStill || !gpsSaysMove) {
        this.stopAnchor = fix;
      }
      return this.snapshot(0);
    }

    this.state = 'moving';
    this.stopHits = 0;
    this.stopAnchor = null;
    this.speedEma = clamp(gpsSpeed, 0, MAX_SPEED_KMH);
    return this.snapshot(0);
  }

  private handleMoving(args: {
    fix: GpsFix;
    distM: number;
    impliedKmh: number;
    dopplerKmh: number | null;
    clusterR: number;
    imuStill: boolean;
    simulated: boolean;
  }): RideTick {
    const { fix, distM, impliedKmh, dopplerKmh, clusterR, imuStill, simulated } = args;
    const gpsSpeed = dopplerKmh ?? impliedKmh;
    const wantStop =
      !simulated &&
      (imuStill || (gpsSpeed < GPS_STOP_KMH && impliedKmh < GPS_STOP_KMH + 2 && distM < clusterR));

    if (wantStop) {
      this.stopHits += 1;
      if (this.stopHits >= STOP_CONFIRM) {
        this.state = 'stopped';
        this.stopAnchor = fix;
        this.lastFix = fix;
        this.speedEma = 0;
        this.stopHits = 0;
        return this.snapshot(0);
      }
    } else {
      this.stopHits = 0;
    }

    let instant = dopplerKmh != null && fix.accuracyM <= 45 ? dopplerKmh * 0.8 + impliedKmh * 0.2 : impliedKmh;
    instant = clamp(instant, 0, MAX_SPEED_KMH);
    const alpha = instant >= this.speedEma ? EMA_UP : EMA_DOWN;
    this.speedEma = alpha * instant + (1 - alpha) * this.speedEma;

    this.lastFix = fix;

    if (distM < MIN_STEP_M) {
      return this.snapshot(0);
    }

    this.totalMeters += distM;
    return this.snapshot(distM);
  }
}
