/**
 * Skeleton Component
 *
 * Animated loading placeholder for content.
 * Creates a shimmer effect while data loads.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '@/constants/app';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonText({
  lines = 1,
  style,
}: {
  lines?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 && lines > 1 ? '60%' : '100%'}
          style={index < lines - 1 ? { marginBottom: SPACING.sm } : undefined}
        />
      ))}
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={18} style={{ marginBottom: SPACING.xs }} />
          <Skeleton width={80} height={14} />
        </View>
      </View>
      <SkeletonText lines={2} style={{ marginTop: SPACING.md }} />
    </View>
  );
}

export function SkeletonWorkoutCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.workoutCard, style]}>
      <Skeleton width={60} height={60} borderRadius={12} />
      <View style={styles.workoutCardContent}>
        <Skeleton width={150} height={20} style={{ marginBottom: SPACING.xs }} />
        <Skeleton width={100} height={16} />
      </View>
      <Skeleton width={50} height={24} borderRadius={12} />
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <View>
          <Skeleton width={120} height={24} style={{ marginBottom: SPACING.xs }} />
          <Skeleton width={180} height={18} />
        </View>
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>

      {/* CTA */}
      <Skeleton height={80} borderRadius={20} style={{ marginBottom: SPACING.lg }} />

      {/* Stats */}
      <View style={styles.statsRow}>
        <Skeleton height={100} style={styles.statCard} borderRadius={16} />
        <Skeleton height={100} style={styles.statCard} borderRadius={16} />
      </View>

      {/* XP Card */}
      <Skeleton height={120} borderRadius={16} style={{ marginBottom: SPACING.lg }} />

      {/* Activity */}
      <Skeleton width={120} height={20} style={{ marginBottom: SPACING.md }} />
      <Skeleton height={80} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.surface,
  },
  textContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutCardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  dashboard: {
    padding: SPACING.lg,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
  },
});
