/**
 * Exercise Card Component
 *
 * Displays exercise information during a workout block.
 * Shows exercise name, reps/duration, and completion status.
 *
 * Principles:
 * - Clear visual hierarchy
 * - Supports both rep-based and timed exercises
 * - Visual feedback for completion
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface ExerciseSlot {
  exercise_id: string;
  exercise_name: string;
  reps?: number;
  duration_seconds?: number;
  completed: boolean;
  completed_reps?: number;
}

interface ExerciseCardProps {
  exercise: ExerciseSlot;
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

export function ExerciseCard({
  exercise,
  size = 'medium',
  label,
}: ExerciseCardProps) {
  const isRest = exercise.exercise_id === 'rest';

  const getMetricText = (): string => {
    if (isRest) return 'Rest';
    if (exercise.reps) return `${exercise.reps} reps`;
    if (exercise.duration_seconds) return `${exercise.duration_seconds} seconds`;
    return '';
  };

  return (
    <View
      testID="exercise-card"
      style={[
        styles.container,
        styles[`size_${size}`],
        exercise.completed && styles.completed,
      ]}
    >
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            styles[`name_${size}`],
            isRest && styles.restName,
          ]}
          numberOfLines={2}
        >
          {exercise.exercise_name}
        </Text>

        {!isRest && (
          <Text style={[styles.metric, styles[`metric_${size}`]]}>
            {getMetricText()}
          </Text>
        )}
      </View>

      {exercise.completed && (
        <View testID="completed-indicator" style={styles.completedBadge}>
          <Text style={styles.completedText}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    position: 'relative',
  },
  size_small: {
    minHeight: 60,
    padding: SPACING.sm,
  },
  size_medium: {
    minHeight: 80,
  },
  size_large: {
    minHeight: 120,
    padding: SPACING.lg,
  },
  completed: {
    backgroundColor: `${COLORS.success}15`,
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
    color: COLORS.text,
  },
  name_small: {
    fontSize: FONT_SIZES.sm,
  },
  name_medium: {
    fontSize: FONT_SIZES.md,
  },
  name_large: {
    fontSize: FONT_SIZES.xl,
  },
  restName: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  metric: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  metric_small: {
    fontSize: FONT_SIZES.xs,
  },
  metric_medium: {
    fontSize: FONT_SIZES.sm,
  },
  metric_large: {
    fontSize: FONT_SIZES.md,
  },
  completedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});
