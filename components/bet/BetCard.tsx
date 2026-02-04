/**
 * Bet Card Component
 *
 * Displays a bet with stakes, scores, and status.
 *
 * Principles:
 * - Clear visual hierarchy
 * - Shows both participants' stakes/scores
 * - Status indication
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import { getBetMetricLabel } from '@/services/bet';
import type { Bet, BetStatus, BetMetric } from '@/types/database';

interface BetCardProps {
  bet: Bet;
  challengerName: string;
  challengedName: string;
  currentUserId: string;
  testID?: string;
}

const STATUS_COLORS: Record<BetStatus, string> = {
  pending: COLORS.warning,
  accepted: COLORS.primary,
  active: COLORS.success,
  completed: COLORS.textSecondary,
  cancelled: COLORS.error,
};

const STATUS_LABELS: Record<BetStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BetCard({
  bet,
  challengerName,
  challengedName,
  currentUserId,
  testID,
}: BetCardProps) {
  const isChallenger = currentUserId === bet.challenger_id;
  const isActive = bet.status === 'active';
  const isCompleted = bet.status === 'completed';

  const userWon = isCompleted && bet.winner_id === currentUserId;
  const userLost = isCompleted && bet.winner_id !== null && bet.winner_id !== currentUserId;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.metricLabel}>
          {getBetMetricLabel(bet.metric)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[bet.status]}20` }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[bet.status] }]}>
            {STATUS_LABELS[bet.status]}
          </Text>
        </View>
      </View>

      {/* Participants */}
      <View style={styles.participants}>
        {/* Challenger */}
        <View style={styles.participant}>
          <Text style={styles.participantName}>{challengerName}</Text>
          <Text style={styles.stake}>{bet.challenger_stake}</Text>
          {isActive && (
            <Text style={styles.score}>{bet.challenger_score ?? 0}</Text>
          )}
        </View>

        <Text style={styles.vs}>vs</Text>

        {/* Challenged */}
        <View style={styles.participant}>
          <Text style={styles.participantName}>{challengedName}</Text>
          <Text style={styles.stake}>{bet.challenged_stake}</Text>
          {isActive && (
            <Text style={styles.score}>{bet.challenged_score ?? 0}</Text>
          )}
        </View>
      </View>

      {/* Result for completed bets */}
      {isCompleted && (
        <View style={[styles.resultBanner, userWon && styles.winBanner, userLost && styles.loseBanner]}>
          <Text style={styles.resultText}>
            {userWon ? '🎉 You Won!' : userLost ? 'You Lost' : 'Tie'}
          </Text>
        </View>
      )}

      {/* Date range */}
      <View style={styles.footer}>
        <Text style={styles.dateRange}>
          {formatDate(bet.starts_at)} - {formatDate(bet.ends_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metricLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  participant: {
    flex: 1,
    alignItems: 'center',
  },
  participantName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stake: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  score: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  vs: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.md,
  },
  resultBanner: {
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.border,
  },
  winBanner: {
    backgroundColor: `${COLORS.success}20`,
  },
  loseBanner: {
    backgroundColor: `${COLORS.error}20`,
  },
  resultText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  dateRange: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
