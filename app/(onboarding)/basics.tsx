/**
 * Basics Onboarding Screen
 *
 * Collects basic user information: birth year, height, weight, biological sex.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboardingStore, type BasicsData } from '@/stores/onboarding';
import {
  validateBasicsForm,
  convertHeightToMetric,
  convertHeightToImperial,
  convertWeightToMetric,
  convertWeightToImperial,
  type BiologicalSex,
  type UnitPreference,
} from '@/utils/onboarding';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 13 - i);

const SEX_OPTIONS: { value: BiologicalSex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function BasicsScreen() {
  const { basics, setBasics, nextStep } = useOnboardingStore();

  // Form state
  const [unitPreference, setUnitPreference] = useState<UnitPreference>(
    basics?.unitPreference ?? 'metric'
  );
  const [birthYear, setBirthYear] = useState(basics?.birthYear?.toString() ?? '');
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | null>(
    basics?.biologicalSex ?? null
  );

  // Height state (store in metric internally)
  const [heightCm, setHeightCm] = useState(basics?.heightCm ?? 0);
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');

  // Weight state (store in metric internally)
  const [weightKg, setWeightKg] = useState(basics?.weightKg ?? 0);
  const [weightLbs, setWeightLbs] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize imperial values from metric if we have stored data
  useEffect(() => {
    if (basics?.heightCm) {
      const { feet, inches } = convertHeightToImperial(basics.heightCm);
      setHeightFeet(feet.toString());
      setHeightInches(inches.toString());
    }
    if (basics?.weightKg) {
      setWeightLbs(convertWeightToImperial(basics.weightKg).toString());
    }
  }, [basics]);

  const handleUnitChange = (unit: UnitPreference) => {
    setUnitPreference(unit);
  };

  const handleHeightMetricChange = (value: string) => {
    const cm = parseInt(value) || 0;
    setHeightCm(cm);
    if (cm > 0) {
      const { feet, inches } = convertHeightToImperial(cm);
      setHeightFeet(feet.toString());
      setHeightInches(inches.toString());
    }
  };

  const handleHeightImperialChange = (feet: string, inches: string) => {
    setHeightFeet(feet);
    setHeightInches(inches);
    const f = parseInt(feet) || 0;
    const i = parseInt(inches) || 0;
    setHeightCm(convertHeightToMetric(f, i));
  };

  const handleWeightMetricChange = (value: string) => {
    const kg = parseInt(value) || 0;
    setWeightKg(kg);
    if (kg > 0) {
      setWeightLbs(convertWeightToImperial(kg).toString());
    }
  };

  const handleWeightImperialChange = (value: string) => {
    setWeightLbs(value);
    const lbs = parseInt(value) || 0;
    setWeightKg(convertWeightToMetric(lbs));
  };

  const handleNext = () => {
    const formData: BasicsData = {
      birthYear: parseInt(birthYear) || 0,
      heightCm,
      weightKg,
      biologicalSex: biologicalSex!,
      unitPreference,
    };

    const validationErrors = validateBasicsForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setBasics(formData);
    nextStep();
    router.push('/(onboarding)/fitness');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <OnboardingProgress currentStep={0} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Help us personalize your workout experience
          </Text>

          {/* Unit Preference Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Units</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  unitPreference === 'metric' && styles.toggleButtonActive,
                ]}
                onPress={() => handleUnitChange('metric')}
                accessibilityRole="button"
                accessibilityState={{ selected: unitPreference === 'metric' }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    unitPreference === 'metric' && styles.toggleTextActive,
                  ]}
                >
                  Metric (cm/kg)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  unitPreference === 'imperial' && styles.toggleButtonActive,
                ]}
                onPress={() => handleUnitChange('imperial')}
                accessibilityRole="button"
                accessibilityState={{ selected: unitPreference === 'imperial' }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    unitPreference === 'imperial' && styles.toggleTextActive,
                  ]}
                >
                  Imperial (ft/lbs)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Birth Year */}
          <View style={styles.section}>
            <Input
              label="Birth Year"
              value={birthYear}
              onChangeText={setBirthYear}
              placeholder="e.g., 1990"
              keyboardType="number-pad"
              maxLength={4}
              error={errors.birthYear}
              testID="birth-year-input"
            />
          </View>

          {/* Height */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Height</Text>
            {unitPreference === 'metric' ? (
              <Input
                label="Height (cm)"
                value={heightCm > 0 ? heightCm.toString() : ''}
                onChangeText={handleHeightMetricChange}
                placeholder="e.g., 175"
                keyboardType="number-pad"
                maxLength={3}
                error={errors.heightCm}
                testID="height-metric-input"
              />
            ) : (
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Input
                    label="Feet"
                    value={heightFeet}
                    onChangeText={(v) => handleHeightImperialChange(v, heightInches)}
                    placeholder="5"
                    keyboardType="number-pad"
                    maxLength={1}
                    error={errors.heightCm ? ' ' : undefined}
                    testID="height-feet-input"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="Inches"
                    value={heightInches}
                    onChangeText={(v) => handleHeightImperialChange(heightFeet, v)}
                    placeholder="10"
                    keyboardType="number-pad"
                    maxLength={2}
                    error={errors.heightCm ? ' ' : undefined}
                    testID="height-inches-input"
                  />
                </View>
              </View>
            )}
            {errors.heightCm && unitPreference === 'imperial' && (
              <Text style={styles.errorText}>{errors.heightCm}</Text>
            )}
          </View>

          {/* Weight */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weight</Text>
            {unitPreference === 'metric' ? (
              <Input
                label="Weight (kg)"
                value={weightKg > 0 ? weightKg.toString() : ''}
                onChangeText={handleWeightMetricChange}
                placeholder="e.g., 70"
                keyboardType="number-pad"
                maxLength={3}
                error={errors.weightKg}
                testID="weight-metric-input"
              />
            ) : (
              <Input
                label="Weight (lbs)"
                value={weightLbs}
                onChangeText={handleWeightImperialChange}
                placeholder="e.g., 150"
                keyboardType="number-pad"
                maxLength={3}
                error={errors.weightKg}
                testID="weight-imperial-input"
              />
            )}
          </View>

          {/* Biological Sex */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biological Sex</Text>
            <Text style={styles.sectionHint}>
              Used to personalize workout intensity
            </Text>
            <View style={styles.optionsContainer}>
              {SEX_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    biologicalSex === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setBiologicalSex(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: biologicalSex === option.value }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      biologicalSex === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.biologicalSex && (
              <Text style={styles.errorText}>{errors.biologicalSex}</Text>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.actions}>
          <Button
            title="Continue"
            onPress={handleNext}
            style={styles.continueButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
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
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  optionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.primary,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  actions: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueButton: {
    width: '100%',
  },
});
