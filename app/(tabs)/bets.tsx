/**
 * Bets Tab Screen
 *
 * Shows active and past bets between partners.
 * Clean interface for creating and tracking bets.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { BetCard } from '@/components/bet/BetCard';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import type { Bet, BetStatus } from '@/types/database';

// Mock data for now - will be replaced with real data
const MOCK_ACTIVE_BET: Bet | null = null;
const MOCK_BET_HISTORY: Bet[] = [];

export default function BetsScreen() {
  const { hasCouple, profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const activeBet = MOCK_ACTIVE_BET;
  const betHistory = MOCK_BET_HISTORY;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bets</Text>
            <Text style={styles.subtitle}>
              Challenge your partner to friendly competitions
            </Text>
          </View>
        </View>

        {/* Partner Required */}
        {!hasCouple && (
          <View style={styles.partnerRequired}>
            <Text style={styles.partnerRequiredIcon}>🤝</Text>
            <Text style={styles.partnerRequiredTitle}>Partner Required</Text>
            <Text style={styles.partnerRequiredText}>
              Connect with a partner to start creating bets together
            </Text>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => router.push('/(main)/invite')}
            >
              <Text style={styles.inviteButtonText}>Invite Partner</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasCouple && (
          <>
            {/* Create Bet Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(bet)/create')}
            >
              <Text style={styles.createButtonIcon}>🎯</Text>
              <View style={styles.createButtonContent}>
                <Text style={styles.createButtonTitle}>Create New Bet</Text>
                <Text style={styles.createButtonDescription}>
                  Challenge your partner
                </Text>
              </View>
              <Text style={styles.createButtonArrow}>+</Text>
            </TouchableOpacity>

            {/* Active Bet Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Bet</Text>
              {activeBet ? (
                <BetCard
                  bet={activeBet}
                  currentUserId={profile?.id ?? ''}
                  onPress={() =>
                    router.push({
                      pathname: '/(bet)/[id]',
                      params: { id: activeBet.id },
                    })
                  }
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🏆</Text>
                  <Text style={styles.emptyTitle}>No Active Bet</Text>
                  <Text style={styles.emptyText}>
                    Create a bet to add some friendly competition
                  </Text>
                </View>
              )}
            </View>

            {/* Bet History Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Bets</Text>
              {betHistory.length > 0 ? (
                <View style={styles.historyList}>
                  {betHistory.map((bet) => (
                    <BetCard
                      key={bet.id}
                      bet={bet}
                      currentUserId={profile?.id ?? ''}
                      onPress={() =>
                        router.push({
                          pathname: '/(bet)/[id]',
                          params: { id: bet.id },
                        })
                      }
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>
                    No past bets yet. Your bet history will appear here.
                  </Text>
                </View>
              )}
            </View>

            {/* Bet Ideas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bet Ideas</Text>
              <View style={styles.ideasGrid}>
                {[
                  { icon: '🔥', title: 'Total Reps', desc: 'Who can do more reps this week?' },
                  { icon: '📅', title: 'Streak Days', desc: 'Maintain the longest streak' },
                  { icon: '⏱️', title: 'Total Minutes', desc: 'Most workout time wins' },
                  { icon: '⭐', title: 'XP Earned', desc: 'Earn the most XP this week' },
                ].map((idea, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.ideaCard}
                    onPress={() => router.push('/(bet)/create')}
                  >
                    <Text style={styles.ideaIcon}>{idea.icon}</Text>
                    <Text style={styles.ideaTitle}>{idea.title}</Text>
                    <Text style={styles.ideaDesc}>{idea.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Partner Required
  partnerRequired: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  partnerRequiredIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  partnerRequiredTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  partnerRequiredText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  inviteButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },

  // Create Button
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  createButtonIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  createButtonContent: {
    flex: 1,
  },
  createButtonTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },
  createButtonDescription: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  createButtonArrow: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
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

  // Empty State
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // History
  historyList: {
    gap: SPACING.md,
  },
  emptyHistory: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  emptyHistoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Ideas Grid
  ideasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  ideaCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  ideaIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  ideaTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  ideaDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
