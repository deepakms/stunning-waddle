/**
 * Health Service - Unified API
 *
 * Cross-platform health data integration.
 * Automatically selects HealthKit on iOS or Health Connect on Android.
 */

import { Platform } from 'react-native';
import type {
  IHealthService,
  HealthAvailability,
  HealthPermission,
  HealthPermissionStatus,
  HeartRateSample,
  HeartRateZone,
  UserHealthProfile,
  HeartRateData,
  WorkoutHealthData,
} from './types';
import {
  calculateHeartRateZones,
  getHeartRateZone,
  calculateMaxHeartRate,
  calculateAverageHeartRate,
  getHeartRateRange,
  getZoneColor,
  getZoneName,
} from './types';
import { healthKitService } from './healthkit';
import { healthConnectService } from './health-connect';

// Re-export types
export type {
  IHealthService,
  HealthAvailability,
  HealthPermission,
  HealthPermissionStatus,
  HeartRateSample,
  HeartRateZone,
  UserHealthProfile,
  HeartRateData,
  WorkoutHealthData,
};

// Re-export utilities
export {
  calculateHeartRateZones,
  getHeartRateZone,
  calculateMaxHeartRate,
  calculateAverageHeartRate,
  getHeartRateRange,
  getZoneColor,
  getZoneName,
};

// ============================================
// UNIFIED HEALTH SERVICE
// ============================================

class UnifiedHealthService implements IHealthService {
  private platformService: IHealthService;

  constructor() {
    // Select the appropriate platform service
    this.platformService =
      Platform.OS === 'ios' ? healthKitService : healthConnectService;
  }

  async checkAvailability(): Promise<HealthAvailability> {
    return this.platformService.checkAvailability();
  }

  async requestPermissions(
    permissions: HealthPermission[]
  ): Promise<HealthPermissionStatus[]> {
    return this.platformService.requestPermissions(permissions);
  }

  async getPermissionStatus(
    permissions: HealthPermission[]
  ): Promise<HealthPermissionStatus[]> {
    return this.platformService.getPermissionStatus(permissions);
  }

  async startHeartRateMonitoring(
    callback: (sample: HeartRateSample) => void,
    intervalMs?: number
  ): Promise<{ stop: () => void }> {
    return this.platformService.startHeartRateMonitoring(callback, intervalMs);
  }

  async getHeartRateSamples(
    startDate: Date,
    endDate: Date
  ): Promise<HeartRateSample[]> {
    return this.platformService.getHeartRateSamples(startDate, endDate);
  }

  async getRestingHeartRate(): Promise<number | null> {
    return this.platformService.getRestingHeartRate();
  }

  async saveWorkout(data: {
    startTime: Date;
    endTime: Date;
    workoutType: string;
    calories: number;
    heartRateSamples?: HeartRateSample[];
  }): Promise<boolean> {
    return this.platformService.saveWorkout(data);
  }

  async getAge(): Promise<number | null> {
    return this.platformService.getAge();
  }

  calculateHeartRateZones(maxHR: number): UserHealthProfile['heartRateZones'] {
    return calculateHeartRateZones(maxHR);
  }

  getHeartRateZone(heartRate: number, maxHR: number): HeartRateZone {
    return getHeartRateZone(heartRate, maxHR);
  }

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Request all heart rate related permissions
   */
  async requestHeartRatePermissions(): Promise<boolean> {
    const status = await this.requestPermissions(['heartRate', 'restingHeartRate']);
    return status.some((s) => s.read === 'granted');
  }

  /**
   * Request all workout related permissions
   */
  async requestWorkoutPermissions(): Promise<boolean> {
    const status = await this.requestPermissions([
      'heartRate',
      'workout',
      'activeCalories',
    ]);
    return status.every((s) => s.read === 'granted' || s.write === 'granted');
  }

  /**
   * Get user's estimated max heart rate
   * Uses age if available, otherwise defaults to 190
   */
  async getEstimatedMaxHeartRate(): Promise<number> {
    const age = await this.getAge();
    if (age) {
      return calculateMaxHeartRate(age);
    }
    return 190; // Default max HR
  }

  /**
   * Build HeartRateData from samples
   */
  async getHeartRateData(
    startDate: Date,
    endDate: Date
  ): Promise<HeartRateData> {
    const samples = await this.getHeartRateSamples(startDate, endDate);
    const maxHR = await this.getEstimatedMaxHeartRate();

    const current = samples.length > 0 ? samples[samples.length - 1].value : null;
    const average = calculateAverageHeartRate(samples);
    const range = getHeartRateRange(samples);

    return {
      current,
      average,
      min: range?.min ?? null,
      max: range?.max ?? null,
      samples,
      zone: current ? getHeartRateZone(current, maxHR) : null,
    };
  }

  /**
   * Get a summary of workout health data
   */
  async getWorkoutHealthData(
    startTime: Date,
    endTime: Date
  ): Promise<WorkoutHealthData> {
    const heartRate = await this.getHeartRateData(startTime, endTime);

    // Calculate active minutes (time spent above warmup zone)
    let activeMinutes = 0;
    if (heartRate.samples.length > 0) {
      const maxHR = await this.getEstimatedMaxHeartRate();
      const activeSamples = heartRate.samples.filter(
        (s) => getHeartRateZone(s.value, maxHR) !== 'rest'
      );
      // Rough estimate based on sample count
      activeMinutes = Math.round(activeSamples.length * 0.5);
    }

    return {
      startTime,
      endTime,
      heartRate,
      calories: null, // Would come from health data if available
      activeMinutes,
      steps: null, // Would come from health data if available
    };
  }
}

// Export singleton instance
export const healthService = new UnifiedHealthService();

// ============================================
// REACT HOOK FOR HEALTH DATA
// ============================================

import { useState, useEffect, useCallback } from 'react';

export interface UseHealthResult {
  isAvailable: boolean;
  isLoading: boolean;
  hasPermission: boolean;
  error: string | null;
  heartRate: number | null;
  heartRateZone: HeartRateZone | null;
  requestPermission: () => Promise<boolean>;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
}

export function useHealth(maxHeartRate: number = 190): UseHealthResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [heartRateZone, setHeartRateZone] = useState<HeartRateZone | null>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  // Check availability on mount
  useEffect(() => {
    async function check() {
      try {
        const availability = await healthService.checkAvailability();
        setIsAvailable(availability.isAvailable);
        if (!availability.isAvailable) {
          setError(availability.reason || 'Health features not available');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    check();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const granted = await healthService.requestHeartRatePermissions();
      setHasPermission(granted);
      if (!granted) {
        setError('Permission denied');
      }
      return granted;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startMonitoring = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const { stop } = await healthService.startHeartRateMonitoring((sample) => {
        setHeartRate(sample.value);
        setHeartRateZone(getHeartRateZone(sample.value, maxHeartRate));
      });
      setStopFn(() => stop);
    } catch (e: any) {
      setError(e.message);
    }
  }, [hasPermission, maxHeartRate, requestPermission]);

  const stopMonitoring = useCallback(() => {
    if (stopFn) {
      stopFn();
      setStopFn(null);
    }
  }, [stopFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopFn) stopFn();
    };
  }, [stopFn]);

  return {
    isAvailable,
    isLoading,
    hasPermission,
    error,
    heartRate,
    heartRateZone,
    requestPermission,
    startMonitoring,
    stopMonitoring,
  };
}
