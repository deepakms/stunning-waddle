/**
 * Android Health Connect Integration
 *
 * Android-specific health data access using Health Connect API.
 * Requires react-native-health-connect package.
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
} from './types';

// ============================================
// HEALTH CONNECT PERMISSION MAPPING
// ============================================

const HEALTH_CONNECT_PERMISSIONS: Record<HealthPermission, { read: string; write?: string }> = {
  heartRate: { read: 'android.permission.health.READ_HEART_RATE', write: 'android.permission.health.WRITE_HEART_RATE' },
  restingHeartRate: { read: 'android.permission.health.READ_RESTING_HEART_RATE' },
  workout: { read: 'android.permission.health.READ_EXERCISE', write: 'android.permission.health.WRITE_EXERCISE' },
  activeCalories: { read: 'android.permission.health.READ_ACTIVE_CALORIES_BURNED', write: 'android.permission.health.WRITE_ACTIVE_CALORIES_BURNED' },
  steps: { read: 'android.permission.health.READ_STEPS' },
  weight: { read: 'android.permission.health.READ_WEIGHT', write: 'android.permission.health.WRITE_WEIGHT' },
  height: { read: 'android.permission.health.READ_HEIGHT' },
  dateOfBirth: { read: 'android.permission.health.READ_DATE_OF_BIRTH' },
};

// ============================================
// HEALTH CONNECT SERVICE
// ============================================

class HealthConnectService implements IHealthService {
  private HealthConnect: any = null;
  private isInitialized = false;

  /**
   * Initialize Health Connect (lazy load)
   */
  private async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (Platform.OS !== 'android') return false;

    try {
      // Dynamic import to avoid errors on iOS
      const healthConnect = require('react-native-health-connect');
      this.HealthConnect = healthConnect;
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Health Connect not available:', error);
      return false;
    }
  }

  async checkAvailability(): Promise<HealthAvailability> {
    if (Platform.OS !== 'android') {
      return {
        isAvailable: false,
        platform: Platform.OS as 'ios' | 'unsupported',
        reason: 'Health Connect is only available on Android',
      };
    }

    const initialized = await this.initialize();
    if (!initialized) {
      return {
        isAvailable: false,
        platform: 'android',
        reason: 'Health Connect library not installed. Run: npx expo install react-native-health-connect',
      };
    }

    try {
      const availability = await this.HealthConnect.getSdkStatus();

      if (availability === this.HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
        return {
          isAvailable: true,
          platform: 'android',
        };
      }

      return {
        isAvailable: false,
        platform: 'android',
        reason: availability === this.HealthConnect.SdkAvailabilityStatus.SDK_UNAVAILABLE
          ? 'Health Connect is not installed on this device'
          : 'Health Connect SDK is not available',
      };
    } catch (error: any) {
      return {
        isAvailable: false,
        platform: 'android',
        reason: error.message,
      };
    }
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

    // Build permission list for Health Connect
    const permissionList: Array<{ accessType: string; recordType: string }> = [];

    for (const perm of permissions) {
      const mapping = HEALTH_CONNECT_PERMISSIONS[perm];
      if (mapping) {
        // Add read permission
        permissionList.push({
          accessType: 'read',
          recordType: this.mapPermissionToRecordType(perm),
        });

        // Add write permission if applicable
        if (mapping.write) {
          permissionList.push({
            accessType: 'write',
            recordType: this.mapPermissionToRecordType(perm),
          });
        }
      }
    }

    try {
      const granted = await this.HealthConnect.requestPermission(permissionList);

      return permissions.map(p => {
        const recordType = this.mapPermissionToRecordType(p);
        const hasRead = granted.some(
          (g: any) => g.recordType === recordType && g.accessType === 'read'
        );
        const hasWrite = granted.some(
          (g: any) => g.recordType === recordType && g.accessType === 'write'
        );

        return {
          permission: p,
          read: hasRead ? 'granted' as const : 'denied' as const,
          write: hasWrite ? 'granted' as const : 'denied' as const,
        };
      });
    } catch (error) {
      console.warn('Health Connect permission error:', error);
      return permissions.map(p => ({
        permission: p,
        read: 'denied' as const,
        write: 'denied' as const,
      }));
    }
  }

  async getPermissionStatus(permissions: HealthPermission[]): Promise<HealthPermissionStatus[]> {
    const initialized = await this.initialize();
    if (!initialized) {
      return permissions.map(p => ({
        permission: p,
        read: 'notDetermined' as const,
        write: 'notDetermined' as const,
      }));
    }

    try {
      const permissionList = permissions.flatMap(p => {
        const mapping = HEALTH_CONNECT_PERMISSIONS[p];
        const recordType = this.mapPermissionToRecordType(p);
        const result = [{ accessType: 'read', recordType }];
        if (mapping.write) {
          result.push({ accessType: 'write', recordType });
        }
        return result;
      });

      const granted = await this.HealthConnect.getGrantedPermissions();

      return permissions.map(p => {
        const recordType = this.mapPermissionToRecordType(p);
        const hasRead = granted.some(
          (g: any) => g.recordType === recordType && g.accessType === 'read'
        );
        const hasWrite = granted.some(
          (g: any) => g.recordType === recordType && g.accessType === 'write'
        );

        return {
          permission: p,
          read: hasRead ? 'granted' as const : 'denied' as const,
          write: hasWrite ? 'granted' as const : 'denied' as const,
        };
      });
    } catch (error) {
      return permissions.map(p => ({
        permission: p,
        read: 'notDetermined' as const,
        write: 'notDetermined' as const,
      }));
    }
  }

  private mapPermissionToRecordType(permission: HealthPermission): string {
    const mapping: Record<HealthPermission, string> = {
      heartRate: 'HeartRate',
      restingHeartRate: 'RestingHeartRate',
      workout: 'ExerciseSession',
      activeCalories: 'ActiveCaloriesBurned',
      steps: 'Steps',
      weight: 'Weight',
      height: 'Height',
      dateOfBirth: 'DateOfBirth',
    };
    return mapping[permission];
  }

  async startHeartRateMonitoring(
    callback: (sample: HeartRateSample) => void,
    intervalMs = 5000
  ): Promise<{ stop: () => void }> {
    const initialized = await this.initialize();
    if (!initialized) {
      return { stop: () => {} };
    }

    // Health Connect doesn't support real-time streaming
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

    try {
      const records = await this.HealthConnect.readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      return (records || []).flatMap((record: any) => {
        return (record.samples || []).map((sample: any) => ({
          value: sample.beatsPerMinute,
          timestamp: new Date(sample.time),
          source: record.metadata?.dataOrigin?.packageName,
        }));
      });
    } catch (error) {
      console.warn('Error getting heart rate samples:', error);
      return [];
    }
  }

  async getRestingHeartRate(): Promise<number | null> {
    const initialized = await this.initialize();
    if (!initialized) return null;

    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const records = await this.HealthConnect.readRecords('RestingHeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: weekAgo.toISOString(),
          endTime: now.toISOString(),
        },
      });

      if (!records || records.length === 0) return null;

      // Return most recent
      const latest = records[records.length - 1];
      return Math.round(latest.beatsPerMinute);
    } catch (error) {
      console.warn('Error getting resting heart rate:', error);
      return null;
    }
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

    try {
      // Save exercise session
      await this.HealthConnect.insertRecords([
        {
          recordType: 'ExerciseSession',
          startTime: data.startTime.toISOString(),
          endTime: data.endTime.toISOString(),
          exerciseType: 58, // STRENGTH_TRAINING
        },
      ]);

      // Save calories if provided
      if (data.calories > 0) {
        await this.HealthConnect.insertRecords([
          {
            recordType: 'ActiveCaloriesBurned',
            startTime: data.startTime.toISOString(),
            endTime: data.endTime.toISOString(),
            energy: {
              value: data.calories,
              unit: 'kilocalories',
            },
          },
        ]);
      }

      // Save heart rate samples if provided
      if (data.heartRateSamples && data.heartRateSamples.length > 0) {
        await this.HealthConnect.insertRecords([
          {
            recordType: 'HeartRate',
            startTime: data.startTime.toISOString(),
            endTime: data.endTime.toISOString(),
            samples: data.heartRateSamples.map(s => ({
              time: s.timestamp.toISOString(),
              beatsPerMinute: s.value,
            })),
          },
        ]);
      }

      return true;
    } catch (error) {
      console.warn('Error saving workout:', error);
      return false;
    }
  }

  async getAge(): Promise<number | null> {
    // Health Connect doesn't directly provide date of birth
    // Would need to calculate from user input or another source
    return null;
  }

  calculateHeartRateZones(maxHR: number): UserHealthProfile['heartRateZones'] {
    return calculateHeartRateZones(maxHR);
  }

  getHeartRateZone(heartRate: number, maxHR: number): HeartRateZone {
    return getZone(heartRate, maxHR);
  }
}

// Export singleton instance
export const healthConnectService = new HealthConnectService();
