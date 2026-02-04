/**
 * Onboarding Progress Indicator
 *
 * Shows the user's progress through the onboarding flow.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import { ONBOARDING_STEPS } from '@/stores/onboarding';

interface OnboardingProgressProps {
  currentStep: number;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = (currentStep + 1) / totalSteps;
  const currentStepInfo = ONBOARDING_STEPS[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <Text style={styles.stepTitle}>{currentStepInfo?.title}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.dots}>
        {ONBOARDING_STEPS.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.dot,
              index <= currentStep && styles.dotActive,
              index === currentStep && styles.dotCurrent,
            ]}
            accessibilityLabel={`${step.title}${index < currentStep ? ', completed' : index === currentStep ? ', current' : ''}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  stepText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  dotCurrent: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.25 }],
  },
});
