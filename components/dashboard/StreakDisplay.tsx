/**
 * Streak Display Component
 *
 * Shows current streak with visual emphasis and bonus information.
 *
 * Principles:
 * - Prominent streak number
 * - Clear indication of XP bonuses
 * - Shows best streak for motivation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, STREAK_MULTIPLIERS } from '@/constants/app';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  isActive?: boolean;
}

function getXpBonusMessage(streak: number): string | null {
  if (streak >= 30) {
    return '2x XP Bonus!';
  }
  if (streak >= 7) {
    return '1.5x XP Bonus!';
  }
  return null;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  isActive = false,
}: StreakDisplayProps) {
  const bonusMessage = isActive ? getXpBonusMessage(currentStreak) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isActive && <Text style={styles.fireEmoji}>🔥</Text>}
        <Text style={styles.streakCount}>{currentStreak}</Text>
      </View>

      <Text style={styles.label}>
        {currentStreak === 1 ? 'day streak' : 'day streak'}
      </Text>

      {bonusMessage && (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusText}>{bonusMessage}</Text>
        </View>
      )}

      <Text style={styles.bestStreak}>
        Best: {longestStreak} days
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  fireEmoji: {
    fontSize: 40,
    marginRight: SPACING.xs,
  },
  streakCount: {
    fontSize: 56,
    fontWeight: '700',
    color: COLORS.text,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  bonusBadge: {
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginBottom: SPACING.md,
  },
  bonusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.warning,
  },
  bestStreak: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
