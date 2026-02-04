/**
 * XP Progress Component
 *
 * Shows current XP with progress towards next level/milestone.
 *
 * Principles:
 * - Visual progress bar
 * - Clear XP total display
 * - Milestone indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface XpProgressProps {
  totalXp: number;
  weeklyXp?: number;
}

// XP milestones for couples
const MILESTONES = [
  { xp: 0, title: 'Beginner' },
  { xp: 500, title: 'Active' },
  { xp: 2000, title: 'Committed' },
  { xp: 5000, title: 'Dedicated' },
  { xp: 10000, title: 'Power Couple' },
  { xp: 25000, title: 'Fitness Legends' },
];

function getCurrentMilestone(xp: number): { current: typeof MILESTONES[0]; next: typeof MILESTONES[0] | null; progress: number } {
  let currentIndex = 0;

  for (let i = 0; i < MILESTONES.length; i++) {
    if (xp >= MILESTONES[i].xp) {
      currentIndex = i;
    }
  }

  const current = MILESTONES[currentIndex];
  const next = MILESTONES[currentIndex + 1] ?? null;

  let progress = 100;
  if (next) {
    const range = next.xp - current.xp;
    const earned = xp - current.xp;
    progress = Math.round((earned / range) * 100);
  }

  return { current, next, progress };
}

function formatXp(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toLocaleString();
}

export function XpProgress({ totalXp, weeklyXp }: XpProgressProps) {
  const { current, next, progress } = getCurrentMilestone(totalXp);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.xpTotal}>{formatXp(totalXp)} XP</Text>
        </View>
        {weeklyXp !== undefined && (
          <View style={styles.weeklyBadge}>
            <Text style={styles.weeklyText}>+{formatXp(weeklyXp)} this week</Text>
          </View>
        )}
      </View>

      {next && (
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.nextMilestone}>
            {formatXp(next.xp - totalXp)} XP to {next.title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  xpTotal: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weeklyBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  weeklyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.success,
  },
  progressSection: {
    marginTop: SPACING.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  nextMilestone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
