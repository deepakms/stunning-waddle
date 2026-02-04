/**
 * Dashboard Screen
 *
 * Main hub showing couple stats, workout CTA, and active bet.
 * Modern, clean design focused on engagement and motivation.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { StreakDisplay } from '@/components/dashboard/StreakDisplay';
import { XpProgress } from '@/components/dashboard/XpProgress';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function DashboardScreen() {
  const { user } = useAuth();
  const {
    profile,
    profileWithCouple,
    isLoading,
    refetch,
    hasCouple,
    isOnboarded,
  } = useProfile();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👋</Text>
          <Text style={styles.emptyTitle}>Welcome!</Text>
          <Text style={styles.emptyText}>
            Let's set up your profile to get started.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(onboarding)/basics')}
          >
            <Text style={styles.ctaButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const couple = profileWithCouple?.couple;
  const streak = couple?.current_streak ?? 0;
  const longestStreak = couple?.longest_streak ?? 0;
  const totalXp = couple?.total_xp ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey, {profile.display_name}</Text>
            <Text style={styles.subtitle}>Ready to crush it today?</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={styles.avatarText}>
              {profile.display_name.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main CTA */}
        <TouchableOpacity
          style={[styles.workoutCta, !hasCouple && styles.ctaDisabled]}
          onPress={() => hasCouple && router.push('/(tabs)/workout')}
          activeOpacity={hasCouple ? 0.8 : 1}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaIcon}>💪</Text>
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaTitle}>Start Workout</Text>
              <Text style={styles.ctaDescription}>
                {hasCouple
                  ? 'Begin your session together'
                  : 'Connect with partner first'}
              </Text>
            </View>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

        {/* Partner Status */}
        {!hasCouple && (
          <TouchableOpacity
            style={styles.partnerCard}
            onPress={() => router.push('/(main)/invite')}
          >
            <View style={styles.partnerContent}>
              <Text style={styles.partnerIcon}>❤️</Text>
              <View style={styles.partnerTextContainer}>
                <Text style={styles.partnerTitle}>Invite Your Partner</Text>
                <Text style={styles.partnerDescription}>
                  Workouts are better together
                </Text>
              </View>
            </View>
            <Text style={styles.partnerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Onboarding Reminder */}
        {!isOnboarded && (
          <TouchableOpacity
            style={styles.onboardingCard}
            onPress={() => router.push('/(onboarding)/basics')}
          >
            <Text style={styles.onboardingIcon}>✨</Text>
            <View style={styles.onboardingTextContainer}>
              <Text style={styles.onboardingTitle}>Complete Your Profile</Text>
              <Text style={styles.onboardingDescription}>
                Get personalized workouts
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Section */}
        {hasCouple && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Progress</Text>

            <View style={styles.statsRow}>
              {/* Streak Card */}
              <View style={styles.streakCard}>
                <StreakDisplay
                  currentStreak={streak}
                  longestStreak={longestStreak}
                  isActive={streak > 0}
                />
              </View>
            </View>

            {/* XP Progress */}
            <View style={styles.xpCard}>
              <XpProgress totalXp={totalXp} />
            </View>
          </View>
        )}

        {/* Quick Stats */}
        {hasCouple && (
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {couple?.workouts_per_week ?? 0}
              </Text>
              <Text style={styles.quickStatLabel}>Weekly Goal</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {profile.preferred_workout_length ?? 30}
              </Text>
              <Text style={styles.quickStatLabel}>Min/Workout</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {profile.fitness_level ?? '?'}
              </Text>
              <Text style={styles.quickStatLabel}>Level</Text>
            </View>
          </View>
        )}

        {/* Recent Activity Placeholder */}
        {hasCouple && (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyActivityIcon}>🎉</Text>
              <Text style={styles.emptyActivityText}>
                Complete your first workout to see activity here
              </Text>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Workout CTA
  workoutCta: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  ctaDisabled: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ctaIcon: {
    fontSize: 40,
    marginRight: SPACING.md,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#ffffff',
  },
  ctaDescription: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  ctaArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '300',
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },

  // Partner Card
  partnerCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  partnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partnerIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  partnerTextContainer: {
    flex: 1,
  },
  partnerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#991b1b',
  },
  partnerDescription: {
    fontSize: FONT_SIZES.sm,
    color: '#dc2626',
    marginTop: 2,
  },
  partnerArrow: {
    fontSize: 20,
    color: '#dc2626',
  },

  // Onboarding Card
  onboardingCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  onboardingIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  onboardingTextContainer: {
    flex: 1,
  },
  onboardingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#92400e',
  },
  onboardingDescription: {
    fontSize: FONT_SIZES.sm,
    color: '#b45309',
    marginTop: 2,
  },

  // Stats Section
  statsSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsRow: {
    marginBottom: SPACING.md,
  },
  streakCard: {
    flex: 1,
  },
  xpCard: {
    marginBottom: SPACING.md,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quickStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },

  // Activity Section
  activitySection: {
    marginTop: SPACING.md,
  },
  emptyActivity: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyActivityIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyActivityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
