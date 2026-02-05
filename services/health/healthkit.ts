/**
 * Apple HealthKit Integration
 *
 * iOS-specific health data access using HealthKit.
 * Requires react-native-health package.
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
} from './types';
import {
  calculateHeartRateZones,
  getHeartRateZone as getZone,
  calculateMaxHeartRate,
} from './types';

// ============================================
// HEALTHKIT PERMISSION MAPPING
// ============================================

const HEALTHKIT_PERMISSIONS: Record<HealthPermission, { read: string; write?: string }> = {
  heartRate: { read: 'HeartRate', write: 'HeartRate' },
  restingHeartRate: { read: 'RestingHeartRate' },
  workout: { read: 'Workout', write: 'Workout' },
  activeCalories: { read: 'ActiveEnergyBurned', write: 'ActiveEnergyBurned' },
  steps: { read: 'StepCount' },
  weight: { read: 'Weight', write: 'Weight' },
  height: { read: 'Height' },
  dateOfBirth: { read: 'DateOfBirth' },
};

// ============================================
// HEALTHKIT SERVICE
// ============================================

class HealthKitService implements IHealthService {
  private AppleHealthKit: any = null;
  private isInitialized = false;
  private heartRateObserver: any = null;

  /**
   * Initialize HealthKit (lazy load)
   */
  private async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (Platform.OS !== 'ios') return false;

    try {
      // Dynamic import to avoid errors on Android
      const healthKit = require('react-native-health');
      this.AppleHealthKit = healthKit.default || healthKit;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('HealthKit not available:', error);
      return false;
    }
  }

  async checkAvailability(): Promise<HealthAvailability> {
    if (Platform.OS !== 'ios') {
      return {
        isAvailable: false,
        platform: Platform.OS as 'android' | 'unsupported',
        reason: 'HealthKit is only available on iOS',
      };
    }

    const initialized = await this.initialize();
    if (!initialized) {
      return {
        isAvailable: false,
        platform: 'ios',
        reason: 'HealthKit library not installed. Run: npx expo install react-native-health',
      };
    }

    return new Promise((resolve) => {
      this.AppleHealthKit.isAvailable((error: any, available: boolean) => {
        resolve({
          isAvailable: available && !error,
          platform: 'ios',
          reason: error ? error.message : undefined,
        });
      });
    });
  }

  async requestPermissions(permissions: HealthPermission[]): Promise<HealthPermissionStatus[]> {
    const initialized = await this.initialize();
    if (!initialized) {
      return permissions.map(p => ({
        permission: p,
        read: 'denied' as const,
        write: 'denied' as const,
      }));
    }

    // Build HealthKit permission options
    const readPermissions: string[] = [];
    const writePermissions: string[] = [];

    for (const perm of permissions) {
      const mapping = HEALTHKIT_PERMISSIONS[perm];
      if (mapping) {
        readPermissions.push(mapping.read);
        if (mapping.write) {
          writePermissions.push(mapping.write);
        }
      }
    }

    const options = {
      permissions: {
        read: readPermissions,
        write: writePermissions,
      },
    };

    return new Promise((resolve) => {
      this.AppleHealthKit.initHealthKit(options, (error: any) => {
        if (error) {
          console.warn('HealthKit permission error:', error);
          resolve(permissions.map(p => ({
            permission: p,
            read: 'denied' as const,
            write: 'denied' as const,
          })));
          return;
        }

        // HealthKit doesn't provide granular permission status
        // If initHealthKit succeeds, permissions were granted
        resolve(permissions.map(p => ({
          permission: p,
          read: 'granted' as const,
          write: HEALTHKIT_PERMISSIONS[p].write ? 'granted' as const : 'notDetermined' as const,
        })));
      });
    });
  }

  async getPermissionStatus(permissions: HealthPermission[]): Promise<HealthPermissionStatus[]> {
    // HealthKit doesn't provide a way to check status without requesting
    // Return notDetermined for all
    return permissions.map(p => ({
      permission: p,
      read: 'notDetermined' as const,
      write: 'notDetermined' as const,
    }));
  }

  async startHeartRateMonitoring(
    callback: (sample: HeartRateSample) => void,
    intervalMs = 5000
  ): Promise<{ stop: () => void }> {
    const initialized = await this.initialize();
    if (!initialized) {
      return { stop: () => {} };
    }

    // HealthKit doesn't support real-time streaming
    // We'll poll for new samples at the specified interval
    let isRunning = true;
    let lastTimestamp = new Date();

    const poll = async () => {
      if (!isRunning) return;

      try {
        const samples = await this.getHeartRateSamples(lastTimestamp, new Date());
        if (samples.length > 0) {
          const latest = samples[samples.length - 1];
          callback(latest);
          lastTimestamp = latest.timestamp;
        }
      } catch (error) {
        console.warn('Heart rate polling error:', error);
      }

      if (isRunning) {
        setTimeout(poll, intervalMs);
      }
    };

    // Start polling
    poll();

    return {
      stop: () => {
        isRunning = false;
      },
    };
  }

  async getHeartRateSamples(startDate: Date, endDate: Date): Promise<HeartRateSample[]> {
    const initialized = await this.initialize();
    if (!initialized) return [];

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: true,
    };

    return new Promise((resolve) => {
      this.AppleHealthKit.getHeartRateSamples(options, (error: any, results: any[]) => {
        if (error) {
          console.warn('Error getting heart rate samples:', error);
          resolve([]);
          return;
        }

        const samples: HeartRateSample[] = (results || []).map((r: any) => ({
          value: r.value,
          timestamp: new Date(r.startDate || r.endDate),
          source: r.sourceName,
        }));

        resolve(samples);
      });
    });
  }

  async getRestingHeartRate(): Promise<number | null> {
    const initialized = await this.initialize();
    if (!initialized) return null;

    const options = {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      endDate: new Date().toISOString(),
    };

    return new Promise((resolve) => {
      this.AppleHealthKit.getRestingHeartRateSamples(options, (error: any, results: any[]) => {
        if (error || !results || results.length === 0) {
          resolve(null);
          return;
        }

        // Return most recent resting heart rate
        const latest = results[results.length - 1];
        resolve(Math.round(latest.value));
      });
    });
  }

  async saveWorkout(data: {
    startTime: Date;
    endTime: Date;
    workoutType: string;
    calories: number;
    heartRateSamples?: HeartRateSample[];
  }): Promise<boolean> {
    const initialized = await this.initialize();
    if (!initialized) return false;

    const options = {
      type: 'TraditionalStrengthTraining', // HealthKit workout type
      startDate: data.startTime.toISOString(),
      endDate: data.endTime.toISOString(),
      energyBurned: data.calories,
      energyBurnedUnit: 'calorie',
    };

    return new Promise((resolve) => {
      this.AppleHealthKit.saveWorkout(options, (error: any) => {
        if (error) {
          console.warn('Error saving workout:', error);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  async getAge(): Promise<number | null> {
    const initialized = await this.initialize();
    if (!initialized) return null;

    return new Promise((resolve) => {
      this.AppleHealthKit.getDateOfBirth({}, (error: any, results: any) => {
        if (error || !results || !results.value) {
          resolve(null);
          return;
        }

        const birthDate = new Date(results.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        resolve(age);
      });
    });
  }

  calculateHeartRateZones(maxHR: number): UserHealthProfile['heartRateZones'] {
    return calculateHeartRateZones(maxHR);
  }

  getHeartRateZone(heartRate: number, maxHR: number): HeartRateZone {
    return getZone(heartRate, maxHR);
  }
}

// Export singleton instance
export const healthKitService = new HealthKitService();
