/**
 * Onboarding Completion Screen
 *
 * Celebrates completion and saves onboarding data to the user's profile.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProfile } from '@/hooks/useProfile';
import { calculateFitnessLevel } from '@/utils/onboarding';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function CompleteScreen() {
  const { basics, fitness, goals, getAllData, reset } = useOnboardingStore();
  const { profile, updateProfile, isUpdating } = useProfile();

  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Calculate fitness level from assessment
  const fitnessLevel = fitness
    ? calculateFitnessLevel(fitness)
    : null;

  const handleComplete = async () => {
    if (!profile?.id) {
      setError('Profile not found. Please try again.');
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      const allData = getAllData();

      // Build profile update from onboarding data
      const profileUpdate = {
        // Basics
        birth_year: allData.basics?.birthYear,
        height_cm: allData.basics?.heightCm,
        weight_kg: allData.basics?.weightKg,
        biological_sex: allData.basics?.biologicalSex,
        unit_preference: allData.basics?.unitPreference,

        // Fitness
        fitness_level: fitnessLevel,
        activity_level: allData.fitness?.activityLevel,

        // Goals
        primary_goal: allData.goals?.primaryGoal,
        secondary_goal: allData.goals?.secondaryGoal,

        // Injuries & Health
        injuries: allData.injuries,
        chronic_conditions: allData.chronicConditions,
        movements_to_avoid: allData.movementsToAvoid,

        // Equipment & Location
        equipment_available: allData.equipment,
        workout_location: allData.location,
        space_availability: allData.spaceAvailability,

        // Preferences
        preferred_workout_length: allData.preferences?.workoutLength,
        preferred_activities: allData.preferences?.enjoyedActivities,
        disliked_activities: allData.preferences?.dislikedActivities,
        music_preference: allData.preferences?.musicPreference,

        // Mark onboarding complete
        onboarding_completed_at: new Date().toISOString(),
      };

      await updateProfile(profileUpdate);

      // Clear onboarding store
      reset();

      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGoHome = () => {
    router.replace('/(main)/home');
  };

  const handleInvitePartner = () => {
    router.replace('/(main)/invite');
  };

  // If complete, show success
  if (isComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>You're All Set!</Text>
          <Text style={styles.successText}>
            Your profile is complete. Now invite your partner to start working out together!
          </Text>

          <View style={styles.fitnessCard}>
            <Text style={styles.fitnessLabel}>Your Fitness Level</Text>
            <View style={styles.fitnessLevel}>
              <Text style={styles.fitnessNumber}>{fitnessLevel}</Text>
              <Text style={styles.fitnessMax}>/5</Text>
            </View>
            <Text style={styles.fitnessHint}>
              {getFitnessLevelDescription(fitnessLevel ?? 1)}
            </Text>
          </View>

          <View style={styles.successActions}>
            <Button
              title="Invite Partner"
              onPress={handleInvitePartner}
              style={styles.primaryButton}
            />
            <Button
              title="Go to Home"
              onPress={handleGoHome}
              variant="outline"
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Almost Done!</Text>
          <Text style={styles.subtitle}>
            Let's save your profile and get you started.
          </Text>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Your Profile Summary</Text>

            {basics && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Basic Info</Text>
                <Text style={styles.summaryValue}>
                  Born {basics.birthYear}, {basics.heightCm}cm, {basics.weightKg}kg
                </Text>
              </View>
            )}

            {fitnessLevel && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fitness Level</Text>
                <Text style={styles.summaryValue}>
                  Level {fitnessLevel} - {getFitnessLevelLabel(fitnessLevel)}
                </Text>
              </View>
            )}

            {goals && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Primary Goal</Text>
                <Text style={styles.summaryValue}>
                  {formatGoal(goals.primaryGoal)}
                </Text>
              </View>
            )}
          </View>

          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={() => router.back()}
            variant="outline"
            style={styles.backButton}
            disabled={isCompleting}
          />
          <Button
            title={isCompleting ? 'Saving...' : 'Complete Setup'}
            onPress={handleComplete}
            style={styles.completeButton}
            loading={isCompleting}
            disabled={isCompleting}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function getFitnessLevelLabel(level: number): string {
  switch (level) {
    case 1: return 'Beginner';
    case 2: return 'Novice';
    case 3: return 'Intermediate';
    case 4: return 'Advanced';
    case 5: return 'Expert';
    default: return 'Unknown';
  }
}

function getFitnessLevelDescription(level: number): string {
  switch (level) {
    case 1: return 'Great starting point! We\'ll build your foundation.';
    case 2: return 'Good base! Ready to build strength and endurance.';
    case 3: return 'Solid fitness! Time to push your limits.';
    case 4: return 'Strong and capable! Ready for challenging workouts.';
    case 5: return 'Elite fitness! Ready for intense training.';
    default: return '';
  }
}

function formatGoal(goal: string): string {
  return goal
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  summary: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryRow: {
    marginBottom: SPACING.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorCard: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successIconText: {
    fontSize: 50,
    color: '#ffffff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  fitnessCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    width: '100%',
  },
  fitnessLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fitnessLevel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  fitnessNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: COLORS.primary,
  },
  fitnessMax: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  fitnessHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  successActions: {
    width: '100%',
    gap: SPACING.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});
