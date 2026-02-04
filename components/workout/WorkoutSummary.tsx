/**
 * Workout Summary Component
 *
 * Displays workout completion summary with stats and achievements.
 *
 * Principles:
 * - Celebrate completion
 * - Show key metrics clearly
 * - Provide clear path forward
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface WorkoutSummaryProps {
  workoutName: string;
  duration: number; // in seconds
  blocksCompleted: number;
  totalBlocks: number;
  xpEarned: number;
  streakDay: number;
  muscleGroups: string[];
  onDone: () => void;
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatMuscleGroup(group: string): string {
  return group
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function WorkoutSummary({
  workoutName,
  duration,
  blocksCompleted,
  totalBlocks,
  xpEarned,
  streakDay,
  muscleGroups,
  onDone,
}: WorkoutSummaryProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.celebration}>🎉</Text>
        <Text style={styles.title}>Workout Complete!</Text>
        <Text style={styles.workoutName}>{workoutName}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Duration"
          value={formatDuration(duration)}
          icon="⏱️"
        />
        <StatCard
          label="Blocks"
          value={`${blocksCompleted}/${totalBlocks}`}
          icon="✓"
        />
        <StatCard
          label="XP Earned"
          value={`+${xpEarned} XP`}
          icon="⭐"
        />
        <StatCard
          label="Streak"
          value={`${streakDay} day${streakDay !== 1 ? 's' : ''}`}
          icon="🔥"
        />
      </View>

      {/* Muscle Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Muscles Worked</Text>
        <View style={styles.muscleGroups}>
          {muscleGroups.map((group) => (
            <View key={group} style={styles.muscleTag}>
              <Text style={styles.muscleTagText}>
                {formatMuscleGroup(group)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Done Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Done"
          onPress={onDone}
          size="lg"
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  celebration: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  workoutName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '50%',
    padding: SPACING.xs,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  muscleTag: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  muscleTagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: SPACING.lg,
  },
  button: {
    width: '100%',
  },
});
