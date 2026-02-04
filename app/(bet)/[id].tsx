/**
 * Bet Detail Screen
 *
 * Shows full details of a bet including scores and status.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { getBetMetricLabel } from '@/services/bet';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import type { Bet, BetStatus } from '@/types/database';

// Mock bet data
const MOCK_BET: Bet = {
  id: 'mock-bet-1',
  couple_id: 'couple-1',
  challenger_id: 'profile-1',
  challenger_stake: 'Cook dinner for a week',
  challenged_stake: 'Do the dishes for a week',
  metric: 'total_reps',
  custom_metric_description: null,
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  challenger_score: 145,
  challenged_score: 132,
  winner_id: null,
  created_at: new Date().toISOString(),
  resolved_at: null,
};

function getStatusColor(status: BetStatus): string {
  switch (status) {
    case 'pending':
      return COLORS.warning;
    case 'accepted':
    case 'active':
      return COLORS.primary;
    case 'completed':
      return COLORS.success;
    case 'cancelled':
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
}

function getStatusLabel(status: BetStatus): string {
  switch (status) {
    case 'pending':
      return 'Waiting for acceptance';
    case 'accepted':
      return 'Accepted - Starting soon';
    case 'active':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function getDaysRemaining(endsAt: string): number {
  const end = new Date(endsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function BetDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();

  // TODO: Fetch real bet data
  const bet = MOCK_BET;

  const isChallenger = bet.challenger_id === profile?.id;
  const myScore = isChallenger ? bet.challenger_score : bet.challenged_score;
  const partnerScore = isChallenger ? bet.challenged_score : bet.challenger_score;
  const myStake = isChallenger ? bet.challenger_stake : bet.challenged_stake;
  const partnerStake = isChallenger ? bet.challenged_stake : bet.challenger_stake;

  const daysRemaining = getDaysRemaining(bet.ends_at);
  const isWinning = (myScore ?? 0) > (partnerScore ?? 0);
  const isTied = myScore === partnerScore;

  const handleAccept = () => {
    Alert.alert('Accept Bet', 'Are you sure you want to accept this bet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () => {
          // TODO: Accept bet via service
          Alert.alert('Bet Accepted!', 'The competition is on!');
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Bet', 'Are you sure you want to cancel this bet?', [
      { text: 'Keep Bet', style: 'cancel' },
      {
        text: 'Cancel Bet',
        style: 'destructive',
        onPress: () => {
          // TODO: Cancel bet via service
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(bet.status)}20` },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(bet.status) },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(bet.status) },
            ]}
          >
            {getStatusLabel(bet.status)}
          </Text>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.metricIcon}>
            {bet.metric === 'total_reps'
              ? '🔥'
              : bet.metric === 'total_sessions'
              ? '📅'
              : bet.metric === 'xp_earned'
              ? '⭐'
              : '⏱️'}
          </Text>
          <Text style={styles.title}>{getBetMetricLabel(bet.metric)}</Text>
          {bet.status === 'active' && (
            <Text style={styles.daysRemaining}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </Text>
          )}
        </View>

        {/* Score Card */}
        {bet.status === 'active' && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>You</Text>
              <Text
                style={[
                  styles.scoreValue,
                  isWinning && !isTied && styles.scoreWinning,
                ]}
              >
                {myScore ?? 0}
              </Text>
              {isWinning && !isTied && (
                <Text style={styles.winningBadge}>Leading!</Text>
              )}
            </View>

            <View style={styles.scoreDivider}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>Partner</Text>
              <Text
                style={[
                  styles.scoreValue,
                  !isWinning && !isTied && styles.scoreWinning,
                ]}
              >
                {partnerScore ?? 0}
              </Text>
              {!isWinning && !isTied && (
                <Text style={styles.winningBadge}>Leading!</Text>
              )}
            </View>
          </View>
        )}

        {/* Stakes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stakes</Text>

          <View style={styles.stakeCard}>
            <View style={styles.stakeHeader}>
              <Text style={styles.stakeIcon}>👤</Text>
              <Text style={styles.stakeTitle}>If you lose</Text>
            </View>
            <Text style={styles.stakeValue}>{myStake}</Text>
          </View>

          <View style={styles.stakeCard}>
            <View style={styles.stakeHeader}>
              <Text style={styles.stakeIcon}>👥</Text>
              <Text style={styles.stakeTitle}>If partner loses</Text>
            </View>
            <Text style={styles.stakeValue}>{partnerStake}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Started</Text>
              <Text style={styles.timelineValue}>
                {new Date(bet.starts_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.timelineDivider} />
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Ends</Text>
              <Text style={styles.timelineValue}>
                {new Date(bet.ends_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {bet.status === 'pending' && !isChallenger && (
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonIcon}>✅</Text>
            <Text style={styles.acceptButtonText}>Accept Challenge</Text>
          </TouchableOpacity>
        )}

        {(bet.status === 'pending' || bet.status === 'accepted') && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Bet</Text>
          </TouchableOpacity>
        )}

        {/* Motivational Message */}
        {bet.status === 'active' && (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationIcon}>💪</Text>
            <Text style={styles.motivationText}>
              {isWinning
                ? "You're in the lead! Keep up the great work!"
                : isTied
                ? "It's a tie! Time to pull ahead!"
                : "You're behind but it's not over! Get moving!"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    marginBottom: SPACING.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Status
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginBottom: SPACING.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  metricIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  daysRemaining: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Score Card
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  scoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
  },
  scoreWinning: {
    color: COLORS.success,
  },
  winningBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  scoreDivider: {
    paddingHorizontal: SPACING.lg,
  },
  vsText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Stakes
  stakeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  stakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stakeIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  stakeTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stakeValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },

  // Timeline
  timelineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  timelineDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },

  // Action Buttons
  acceptButton: {
    backgroundColor: COLORS.success,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  acceptButtonIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  acceptButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
  },

  // Motivation
  motivationCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  motivationText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
