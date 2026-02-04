/**
 * Fitness Level Onboarding Screen
 *
 * Assesses user's current fitness level through activity and ability questions.
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
import { useOnboardingStore, type FitnessData } from '@/stores/onboarding';
import {
  validateFitnessForm,
  type ActivityLevel,
  type CardioCapacity,
} from '@/utils/onboarding';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little to no exercise',
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
  },
  {
    value: 'moderately_active',
    label: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
  },
  {
    value: 'very_active',
    label: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
  },
  {
    value: 'extremely_active',
    label: 'Extremely Active',
    description: 'Very hard exercise & physical job',
  },
];

const CARDIO_LEVELS: { value: CardioCapacity; label: string; description: string }[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Get winded easily',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Can do 20 min of cardio',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Can do 30+ min of cardio',
  },
  {
    value: 'very_high',
    label: 'Very High',
    description: 'Excellent cardiovascular fitness',
  },
];

export default function FitnessScreen() {
  const { fitness, setFitness, nextStep, prevStep } = useOnboardingStore();

  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    fitness?.activityLevel ?? null
  );
  const [canDoPushups, setCanDoPushups] = useState<boolean | null>(
    fitness?.canDoPushups ?? null
  );
  const [canHoldPlank, setCanHoldPlank] = useState<boolean | null>(
    fitness?.canHoldPlank ?? null
  );
  const [canDoFullSquat, setCanDoFullSquat] = useState<boolean | null>(
    fitness?.canDoFullSquat ?? null
  );
  const [cardioCapacity, setCardioCapacity] = useState<CardioCapacity | null>(
    fitness?.cardioCapacity ?? null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    prevStep();
    router.back();
  };

  const handleNext = () => {
    const formData: FitnessData = {
      activityLevel: activityLevel!,
      canDoPushups: canDoPushups ?? false,
      canHoldPlank: canHoldPlank ?? false,
      canDoFullSquat: canDoFullSquat ?? false,
      cardioCapacity: cardioCapacity!,
    };

    const validationErrors = validateFitnessForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setFitness(formData);
    nextStep();
    router.push('/(onboarding)/goals');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <OnboardingProgress currentStep={1} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Help us understand your current fitness level
        </Text>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Activity Level</Text>
          <View style={styles.optionsList}>
            {ACTIVITY_LEVELS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.listOption,
                  activityLevel === option.value && styles.listOptionActive,
                ]}
                onPress={() => setActivityLevel(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: activityLevel === option.value }}
              >
                <Text
                  style={[
                    styles.listOptionLabel,
                    activityLevel === option.value && styles.listOptionLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.listOptionDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.activityLevel && (
            <Text style={styles.errorText}>{errors.activityLevel}</Text>
          )}
        </View>

        {/* Fitness Abilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Fitness Check</Text>
          <Text style={styles.sectionHint}>
            Answer honestly - this helps us customize your workouts
          </Text>

          {/* Pushups */}
          <View style={styles.abilityQuestion}>
            <Text style={styles.abilityText}>
              Can you do 10 push-ups with good form?
            </Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  canDoPushups === true && styles.yesNoButtonActive,
                ]}
                onPress={() => setCanDoPushups(true)}
                accessibilityRole="radio"
                accessibilityState={{ selected: canDoPushups === true }}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    canDoPushups === true && styles.yesNoTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  canDoPushups === false && styles.yesNoButtonActive,
                ]}
                onPress={() => setCanDoPushups(false)}
                accessibilityRole="radio"
                accessibilityState={{ selected: canDoPushups === false }}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    canDoPushups === false && styles.yesNoTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Plank */}
          <View style={styles.abilityQuestion}>
            <Text style={styles.abilityText}>
              Can you hold a plank for 30 seconds?
            </Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  canHoldPlank === true && styles.yesNoButtonActive,
                ]}
                onPress={() => setCanHoldPlank(true)}
                accessibilityRole="radio"
                accessibilityState={{ selected: canHoldPlank === true }}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    canHoldPlank === true && styles.yesNoTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  canHoldPlank === false && styles.yesNoButtonActive,
                ]}
                onPress={() => setCanHoldPlank(false)}
                accessibilityRole="radio"
                accessibilityState={{ selected: canHoldPlank === false }}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    canHoldPlank === false && styles.yesNoTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Squat */}
          <View style={styles.abilityQuestion}>
            <Text style={styles.abilityText}>
              Can you do a full squat (thighs parallel)?
            </Text>
            <View style={styles.yesNoContainer}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  canDoFullSquat === true && styles.yesNoButtonActive,
                ]}
                onPress={() => setCanDoFullSquat(true)}
                accessibilityRole="radio"
                accessibilityState={{ selected: canDoFullSquat === true }}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    canDoFullSquat === true && styles.yesNoTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  canDoFullSquat === false && styles.yesNoButtonActive,
                ]}
                onPress={() => setCanDoFullSquat(false)}
                accessibilityRole="radio"
                accessibilityState={{ selected: canDoFullSquat === false }}
              >
                <Text
                  style={[
                    styles.yesNoText,
                    canDoFullSquat === false && styles.yesNoTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cardio Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cardio Capacity</Text>
          <View style={styles.optionsList}>
            {CARDIO_LEVELS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.listOption,
                  cardioCapacity === option.value && styles.listOptionActive,
                ]}
                onPress={() => setCardioCapacity(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: cardioCapacity === option.value }}
              >
                <Text
                  style={[
                    styles.listOptionLabel,
                    cardioCapacity === option.value && styles.listOptionLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.listOptionDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.cardioCapacity && (
            <Text style={styles.errorText}>{errors.cardioCapacity}</Text>
          )}
        </View>
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
    marginBottom: SPACING.sm,
  },
  sectionHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  optionsList: {
    gap: SPACING.sm,
  },
  listOption: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  listOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  listOptionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  listOptionLabelActive: {
    color: COLORS.primary,
  },
  listOptionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  abilityQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  abilityText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginRight: SPACING.md,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  yesNoButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  yesNoButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  yesNoText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  yesNoTextActive: {
    color: COLORS.primary,
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
