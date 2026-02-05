/**
 * Heart Rate Monitor Component
 *
 * Displays real-time heart rate with zone visualization.
 * Connects to Apple Health or Android Health Connect.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import {
  useHealth,
  getZoneColor,
  getZoneName,
  type HeartRateZone,
} from '@/services/health';

interface HeartRateMonitorProps {
  maxHeartRate?: number;
  onHeartRateChange?: (hr: number, zone: HeartRateZone) => void;
  compact?: boolean;
  showZone?: boolean;
}

export function HeartRateMonitor({
  maxHeartRate = 190,
  onHeartRateChange,
  compact = false,
  showZone = true,
}: HeartRateMonitorProps) {
  const {
    isAvailable,
    isLoading,
    hasPermission,
    error,
    heartRate,
    heartRateZone,
    requestPermission,
    startMonitoring,
    stopMonitoring,
  } = useHealth(maxHeartRate);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when heart rate is active
  useEffect(() => {
    if (heartRate && isMonitoring) {
      // Pulse speed based on heart rate
      const duration = Math.max(300, 60000 / heartRate / 2);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [heartRate, isMonitoring]);

  // Notify parent of heart rate changes
  useEffect(() => {
    if (heartRate && heartRateZone && onHeartRateChange) {
      onHeartRateChange(heartRate, heartRateZone);
    }
  }, [heartRate, heartRateZone, onHeartRateChange]);

  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      stopMonitoring();
      setIsMonitoring(false);
    } else {
      await startMonitoring();
      setIsMonitoring(true);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      await startMonitoring();
      setIsMonitoring(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Text style={styles.loadingText}>Checking health access...</Text>
      </View>
    );
  }

  // Not available
  if (!isAvailable) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Text style={styles.unavailableText}>
          {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} not available
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Need permission
  if (!hasPermission && !isMonitoring) {
    return (
      <TouchableOpacity
        style={[styles.container, compact && styles.containerCompact, styles.permissionContainer]}
        onPress={handleRequestPermission}
      >
        <Text style={styles.permissionIcon}>❤️</Text>
        <Text style={styles.permissionText}>
          Tap to connect {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Compact view
  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.containerCompact,
          { backgroundColor: heartRateZone ? `${getZoneColor(heartRateZone)}20` : COLORS.surface },
        ]}
        onPress={handleToggleMonitoring}
      >
        <Animated.Text
          style={[
            styles.heartIconCompact,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          ❤️
        </Animated.Text>
        <Text style={styles.hrValueCompact}>
          {heartRate || '--'}
        </Text>
        {showZone && heartRateZone && (
          <View style={[styles.zoneBadgeCompact, { backgroundColor: getZoneColor(heartRateZone) }]}>
            <Text style={styles.zoneBadgeText}>{getZoneName(heartRateZone)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Full view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heart Rate</Text>
        <TouchableOpacity
          style={[styles.toggleButton, isMonitoring && styles.toggleButtonActive]}
          onPress={handleToggleMonitoring}
        >
          <Text style={styles.toggleButtonText}>
            {isMonitoring ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hrDisplay}>
        <Animated.View
          style={[
            styles.heartContainer,
            { transform: [{ scale: pulseAnim }] },
            heartRateZone && { backgroundColor: `${getZoneColor(heartRateZone)}20` },
          ]}
        >
          <Text style={styles.heartIcon}>❤️</Text>
        </Animated.View>

        <View style={styles.hrValueContainer}>
          <Text style={styles.hrValue}>{heartRate || '--'}</Text>
          <Text style={styles.hrUnit}>BPM</Text>
        </View>
      </View>

      {showZone && (
        <View style={styles.zoneContainer}>
          {heartRateZone ? (
            <View
              style={[
                styles.zoneBadge,
                { backgroundColor: getZoneColor(heartRateZone) },
              ]}
            >
              <Text style={styles.zoneText}>{getZoneName(heartRateZone)}</Text>
            </View>
          ) : (
            <Text style={styles.noZoneText}>
              {isMonitoring ? 'Waiting for data...' : 'Start monitoring to see zone'}
            </Text>
          )}
        </View>
      )}

      {/* Zone Legend */}
      <View style={styles.zoneLegend}>
        {(['warmup', 'fatburn', 'cardio', 'peak'] as HeartRateZone[]).map((zone) => (
          <View key={zone} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: getZoneColor(zone) }]}
            />
            <Text style={styles.legendText}>{getZoneName(zone)}</Text>
          </View>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ============================================
// MINI HEART RATE BADGE
// ============================================

interface HeartRateBadgeProps {
  heartRate: number | null;
  zone: HeartRateZone | null;
  onPress?: () => void;
}

export function HeartRateBadge({ heartRate, zone, onPress }: HeartRateBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (heartRate) {
      const duration = Math.max(300, 60000 / heartRate / 2);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => pulseAnim.stopAnimation();
  }, [heartRate]);

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        zone && { backgroundColor: `${getZoneColor(zone)}20` },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Animated.Text
        style={[styles.badgeHeart, { transform: [{ scale: pulseAnim }] }]}
      >
        ❤️
      </Animated.Text>
      <Text style={styles.badgeValue}>{heartRate || '--'}</Text>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  permissionContainer: {
    justifyContent: 'center',
  },
  permissionIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  permissionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.error,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // HR Display
  hrDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heartContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 40,
  },
  hrValueContainer: {
    alignItems: 'center',
  },
  hrValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
  },
  hrUnit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: -4,
  },

  // Compact
  heartIconCompact: {
    fontSize: 18,
  },
  hrValueCompact: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  zoneBadgeCompact: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // Zone
  zoneContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  zoneBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  zoneBadgeText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  zoneText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  noZoneText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Legend
  zoneLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeHeart: {
    fontSize: 14,
  },
  badgeValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },

  // States
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
