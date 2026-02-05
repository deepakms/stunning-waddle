/**
 * Health Service - Types and Interfaces
 *
 * Platform-agnostic types for health data integration.
 * Supports Apple HealthKit and Android Health Connect.
 */

// ============================================
// HEALTH DATA TYPES
// ============================================

export interface HeartRateSample {
  value: number; // BPM
  timestamp: Date;
  source?: string; // Device/app that recorded the data
}

export interface HeartRateData {
  current: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  samples: HeartRateSample[];
  zone: HeartRateZone | null;
}

export type HeartRateZone =
  | 'rest'      // < 50% max HR
  | 'warmup'    // 50-60% max HR
  | 'fatburn'   // 60-70% max HR
  | 'cardio'    // 70-80% max HR
  | 'peak'      // 80-90% max HR
  | 'maximum';  // > 90% max HR

export interface WorkoutHealthData {
  startTime: Date;
  endTime: Date | null;
  heartRate: HeartRateData;
  calories: number | null;
  activeMinutes: number | null;
  steps: number | null;
}

export interface UserHealthProfile {
  age: number | null;
  maxHeartRate: number; // Calculated or from health data
  restingHeartRate: number | null;
  heartRateZones: {
    rest: { min: number; max: number };
    warmup: { min: number; max: number };
    fatburn: { min: number; max: number };
    cardio: { min: number; max: number };
    peak: { min: number; max: number };
    maximum: { min: number; max: number };
  };
}

// ============================================
// PERMISSION TYPES
// ============================================

export type HealthPermission =
  | 'heartRate'
  | 'restingHeartRate'
  | 'workout'
  | 'activeCalories'
  | 'steps'
  | 'weight'
  | 'height'
  | 'dateOfBirth';

export interface HealthPermissionStatus {
  permission: HealthPermission;
  read: 'granted' | 'denied' | 'notDetermined';
  write: 'granted' | 'denied' | 'notDetermined';
}

export interface HealthAvailability {
  isAvailable: boolean;
  platform: 'ios' | 'android' | 'unsupported';
  reason?: string;
}

// ============================================
// HEALTH SERVICE INTERFACE
// ============================================

export interface IHealthService {
  /**
   * Check if health features are available on this device
   */
  checkAvailability(): Promise<HealthAvailability>;

  /**
   * Request permissions to read/write health data
   */
  requestPermissions(permissions: HealthPermission[]): Promise<HealthPermissionStatus[]>;

  /**
   * Check current permission status
   */
  getPermissionStatus(permissions: HealthPermission[]): Promise<HealthPermissionStatus[]>;

  /**
   * Start monitoring heart rate in real-time
   */
  startHeartRateMonitoring(
    callback: (sample: HeartRateSample) => void,
    intervalMs?: number
  ): Promise<{ stop: () => void }>;

  /**
   * Get heart rate samples for a time range
   */
  getHeartRateSamples(
    startDate: Date,
    endDate: Date
  ): Promise<HeartRateSample[]>;

  /**
   * Get resting heart rate
   */
  getRestingHeartRate(): Promise<number | null>;

  /**
   * Save a workout to the health store
   */
  saveWorkout(data: {
    startTime: Date;
    endTime: Date;
    workoutType: string;
    calories: number;
    heartRateSamples?: HeartRateSample[];
  }): Promise<boolean>;

  /**
   * Get user's age from health data
   */
  getAge(): Promise<number | null>;

  /**
   * Calculate heart rate zones based on user profile
   */
  calculateHeartRateZones(maxHR: number): UserHealthProfile['heartRateZones'];

  /**
   * Determine which zone a heart rate falls into
   */
  getHeartRateZone(heartRate: number, maxHR: number): HeartRateZone;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate max heart rate using the Tanaka formula
 * More accurate than the traditional 220-age formula
 */
export function calculateMaxHeartRate(age: number): number {
  // Tanaka formula: 208 - (0.7 × age)
  return Math.round(208 - (0.7 * age));
}

/**
 * Calculate heart rate zones based on max HR
 * Uses Karvonen method percentages
 */
export function calculateHeartRateZones(maxHR: number): UserHealthProfile['heartRateZones'] {
  return {
    rest: { min: 0, max: Math.round(maxHR * 0.5) },
    warmup: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
    fatburn: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
    cardio: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8) },
    peak: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9) },
    maximum: { min: Math.round(maxHR * 0.9), max: maxHR },
  };
}

/**
 * Determine heart rate zone from current HR and max HR
 */
export function getHeartRateZone(heartRate: number, maxHR: number): HeartRateZone {
  const percentage = heartRate / maxHR;

  if (percentage >= 0.9) return 'maximum';
  if (percentage >= 0.8) return 'peak';
  if (percentage >= 0.7) return 'cardio';
  if (percentage >= 0.6) return 'fatburn';
  if (percentage >= 0.5) return 'warmup';
  return 'rest';
}

/**
 * Get zone color for UI display
 */
export function getZoneColor(zone: HeartRateZone): string {
  const colors: Record<HeartRateZone, string> = {
    rest: '#808080',     // Gray
    warmup: '#4CAF50',   // Green
    fatburn: '#8BC34A',  // Light Green
    cardio: '#FFC107',   // Amber
    peak: '#FF9800',     // Orange
    maximum: '#F44336',  // Red
  };
  return colors[zone];
}

/**
 * Get zone name for display
 */
export function getZoneName(zone: HeartRateZone): string {
  const names: Record<HeartRateZone, string> = {
    rest: 'Resting',
    warmup: 'Warm Up',
    fatburn: 'Fat Burn',
    cardio: 'Cardio',
    peak: 'Peak',
    maximum: 'Maximum',
  };
  return names[zone];
}

/**
 * Calculate average heart rate from samples
 */
export function calculateAverageHeartRate(samples: HeartRateSample[]): number | null {
  if (samples.length === 0) return null;
  const sum = samples.reduce((acc, s) => acc + s.value, 0);
  return Math.round(sum / samples.length);
}

/**
 * Get min and max heart rate from samples
 */
export function getHeartRateRange(samples: HeartRateSample[]): { min: number; max: number } | null {
  if (samples.length === 0) return null;
  const values = samples.map(s => s.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
