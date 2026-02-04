/**
 * Home Screen
 *
 * Main dashboard showing user profile, partner status, and quick actions.
 * Fetches real data and handles loading/error states.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const {
    profile,
    profileWithCouple,
    isLoading,
    isLoadingWithCouple,
    error,
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

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Button
            title="Try Again"
            onPress={() => refetch()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // No profile - needs setup
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Complete Your Profile</Text>
          <Text style={styles.setupMessage}>
            Let's set up your profile to get started with couples workouts.
          </Text>
          <Button
            title="Set Up Profile"
            onPress={() => router.push('/(onboarding)/basics')}
            style={styles.setupButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.displayName}>{profile.display_name}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(main)/profile')}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <Text style={styles.profileInitial}>
              {profile.display_name.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Partner Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Partner Status</Text>
          {hasCouple ? (
            <View style={styles.partnerInfo}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={styles.statValue}>
                  {profileWithCouple?.couple?.status === 'active' ? 'Connected' : 'Pending'}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total XP</Text>
                <Text style={styles.statValue}>
                  {profileWithCouple?.couple?.total_xp ?? 0}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Current Streak</Text>
                <Text style={styles.statValue}>
                  {profileWithCouple?.couple?.current_streak ?? 0} days
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noPartner}>
              <Text style={styles.noPartnerText}>
                You haven't connected with a partner yet.
              </Text>
              <Button
                title="Invite Partner"
                onPress={() => router.push('/(main)/invite')}
                variant="outline"
                size="sm"
                style={styles.inviteButton}
              />
            </View>
          )}
        </View>

        {/* Quick Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile.fitness_level ?? '?'}
              </Text>
              <Text style={styles.statItemLabel}>Fitness Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile.preferred_workout_length ?? 30}
              </Text>
              <Text style={styles.statItemLabel}>Min/Workout</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile.preferred_activities?.length ?? 0}
              </Text>
              <Text style={styles.statItemLabel}>Activities</Text>
            </View>
          </View>
        </View>

        {/* Onboarding Reminder */}
        {!isOnboarded && (
          <View style={[styles.card, styles.onboardingCard]}>
            <Text style={styles.onboardingTitle}>Complete Your Setup</Text>
            <Text style={styles.onboardingText}>
              Finish setting up your profile to get personalized workout recommendations.
            </Text>
            <Button
              title="Continue Setup"
              onPress={() => router.push('/(onboarding)/basics')}
              size="sm"
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Start Workout"
            onPress={() => router.push('/(main)/workout')}
            style={styles.primaryAction}
            disabled={!hasCouple}
          />
          {!hasCouple && (
            <Text style={styles.disabledHint}>
              Connect with a partner to start workouts
            </Text>
          )}
        </View>

        {/* Debug Info (remove in production) */}
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>User ID: {user?.id}</Text>
          <Text style={styles.debugText}>Email: {user?.email}</Text>
          <Text style={styles.debugText}>Profile ID: {profile?.id}</Text>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="ghost"
            size="sm"
          />
        </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    minWidth: 120,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  setupTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  setupMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  setupButton: {
    minWidth: 160,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  displayName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  partnerInfo: {
    gap: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  noPartner: {
    alignItems: 'center',
  },
  noPartnerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  inviteButton: {
    minWidth: 140,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statItemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  onboardingCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  onboardingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: SPACING.xs,
  },
  onboardingText: {
    fontSize: FONT_SIZES.sm,
    color: '#b45309',
    marginBottom: SPACING.md,
  },
  quickActions: {
    marginTop: SPACING.lg,
  },
  primaryAction: {
    marginBottom: SPACING.sm,
  },
  disabledHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  debugSection: {
    marginTop: SPACING.xxl,
    padding: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  debugText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginBottom: SPACING.xs,
  },
});
