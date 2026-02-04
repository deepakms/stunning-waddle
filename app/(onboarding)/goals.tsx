/**
 * Goals Onboarding Screen
 *
 * Collects user's fitness goals - primary and secondary.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore, type GoalsData } from '@/stores/onboarding';
import { validateGoalsForm, GOAL_OPTIONS, type PrimaryGoal } from '@/utils/onboarding';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function GoalsScreen() {
  const { goals, setGoals, nextStep, prevStep } = useOnboardingStore();

  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(
    goals?.primaryGoal ?? null
  );
  const [secondaryGoal, setSecondaryGoal] = useState<PrimaryGoal | null>(
    goals?.secondaryGoal ?? null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    prevStep();
    router.back();
  };

  const handleNext = () => {
    const formData: GoalsData = {
      primaryGoal: primaryGoal!,
      secondaryGoal,
    };

    const validationErrors = validateGoalsForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setGoals(formData);
    nextStep();
    router.push('/(onboarding)/complete');
  };

  const handlePrimaryGoalSelect = (goal: PrimaryGoal) => {
    setPrimaryGoal(goal);
    // Clear secondary if it matches primary
    if (secondaryGoal === goal) {
      setSecondaryGoal(null);
    }
  };

  const handleSecondaryGoalSelect = (goal: PrimaryGoal) => {
    // Can't select same as primary
    if (goal === primaryGoal) return;
    // Toggle selection
    setSecondaryGoal(secondaryGoal === goal ? null : goal);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <OnboardingProgress currentStep={3} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          What do you want to achieve with your workouts?
        </Text>

        {/* Primary Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Goal</Text>
          <Text style={styles.sectionHint}>
            Choose your main fitness objective
          </Text>
          <View style={styles.goalsGrid}>
            {GOAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.goalCard,
                  primaryGoal === option.id && styles.goalCardActive,
                ]}
                onPress={() => handlePrimaryGoalSelect(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: primaryGoal === option.id }}
              >
                <Text
                  style={[
                    styles.goalLabel,
                    primaryGoal === option.id && styles.goalLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.goalDescription}>{option.description}</Text>
                {primaryGoal === option.id && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Primary</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          {errors.primaryGoal && (
            <Text style={styles.errorText}>{errors.primaryGoal}</Text>
          )}
        </View>

        {/* Secondary Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Secondary Goal (Optional)</Text>
          <Text style={styles.sectionHint}>
            Choose an additional goal to focus on
          </Text>
          <View style={styles.secondaryGoals}>
            {GOAL_OPTIONS.filter((g) => g.id !== primaryGoal).map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.secondaryCard,
                  secondaryGoal === option.id && styles.secondaryCardActive,
                ]}
                onPress={() => handleSecondaryGoalSelect(option.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: secondaryGoal === option.id }}
              >
                <Text
                  style={[
                    styles.secondaryLabel,
                    secondaryGoal === option.id && styles.secondaryLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        {primaryGoal && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Your Goals</Text>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Primary:</Text>
              <Text style={styles.summaryValue}>
                {GOAL_OPTIONS.find((g) => g.id === primaryGoal)?.label}
              </Text>
            </View>
            {secondaryGoal && (
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Secondary:</Text>
                <Text style={styles.summaryValue}>
                  {GOAL_OPTIONS.find((g) => g.id === secondaryGoal)?.label}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <Button
          title="Back"
          onPress={handleBack}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Continue"
          onPress={handleNext}
          style={styles.continueButton}
          disabled={!primaryGoal}
        />
      </View>
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
    paddingTop: 0,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  goalsGrid: {
    gap: SPACING.sm,
  },
  goalCard: {
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  goalCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  goalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  goalLabelActive: {
    color: COLORS.primary,
  },
  goalDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  primaryBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryGoals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  secondaryCard: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  secondaryCardActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary + '10',
  },
  secondaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  secondaryLabelActive: {
    color: COLORS.secondary,
  },
  summary: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryContent: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
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
  continueButton: {
    flex: 2,
  },
});
