/**
 * Tests for Onboarding Utilities
 *
 * TDD Approach: Define expected onboarding calculations and validations.
 */

import {
  calculateFitnessLevel,
  convertHeightToMetric,
  convertHeightToImperial,
  convertWeightToMetric,
  convertWeightToImperial,
  validateBasicsForm,
  validateFitnessForm,
  validateGoalsForm,
  FitnessAssessment,
  BasicsFormData,
  FitnessFormData,
  GoalsFormData,
} from '@/utils/onboarding';

describe('Onboarding Utilities', () => {
  describe('calculateFitnessLevel', () => {
    it('should return 1 for sedentary with no fitness abilities', () => {
      const assessment: FitnessAssessment = {
        activityLevel: 'sedentary',
        canDoPushups: false,
        canHoldPlank: false,
        canDoFullSquat: false,
        cardioCapacity: 'low',
      };
      expect(calculateFitnessLevel(assessment)).toBe(1);
    });

    it('should return 2 for lightly active with some fitness abilities', () => {
      const assessment: FitnessAssessment = {
        activityLevel: 'lightly_active',
        canDoPushups: true,
        canHoldPlank: false,
        canDoFullSquat: true,
        cardioCapacity: 'low',
      };
      expect(calculateFitnessLevel(assessment)).toBe(2);
    });

    it('should return 3 for moderately active with some abilities', () => {
      const assessment: FitnessAssessment = {
        activityLevel: 'moderately_active',
        canDoPushups: true,
        canHoldPlank: false,
        canDoFullSquat: true,
        cardioCapacity: 'low',
      };
      // 2 (activity) + 2 (abilities) + 0 (cardio) = 4 points = level 3
      expect(calculateFitnessLevel(assessment)).toBe(3);
    });

    it('should return 4 for very active with most abilities but moderate cardio', () => {
      const assessment: FitnessAssessment = {
        activityLevel: 'very_active',
        canDoPushups: true,
        canHoldPlank: true,
        canDoFullSquat: false,
        cardioCapacity: 'moderate',
      };
      // 3 (activity) + 2 (abilities) + 1 (cardio) = 6 points = level 4
      expect(calculateFitnessLevel(assessment)).toBe(4);
    });

    it('should return 5 for extremely active with all abilities', () => {
      const assessment: FitnessAssessment = {
        activityLevel: 'extremely_active',
        canDoPushups: true,
        canHoldPlank: true,
        canDoFullSquat: true,
        cardioCapacity: 'very_high',
      };
      expect(calculateFitnessLevel(assessment)).toBe(5);
    });

    it('should account for mixed abilities', () => {
      // Very active but low cardio - should be level 3
      const assessment: FitnessAssessment = {
        activityLevel: 'very_active',
        canDoPushups: true,
        canHoldPlank: false,
        canDoFullSquat: true,
        cardioCapacity: 'low',
      };
      expect(calculateFitnessLevel(assessment)).toBe(3);
    });
  });

  describe('convertHeightToMetric', () => {
    it('should convert 5 feet 10 inches to approximately 178 cm', () => {
      const cm = convertHeightToMetric(5, 10);
      expect(cm).toBeCloseTo(178, 0);
    });

    it('should convert 6 feet 0 inches to approximately 183 cm', () => {
      const cm = convertHeightToMetric(6, 0);
      expect(cm).toBeCloseTo(183, 0);
    });

    it('should convert 5 feet 0 inches to approximately 152 cm', () => {
      const cm = convertHeightToMetric(5, 0);
      expect(cm).toBeCloseTo(152, 0);
    });

    it('should handle edge case of 0 feet 0 inches', () => {
      const cm = convertHeightToMetric(0, 0);
      expect(cm).toBe(0);
    });
  });

  describe('convertHeightToImperial', () => {
    it('should convert 178 cm to 5 feet 10 inches', () => {
      const { feet, inches } = convertHeightToImperial(178);
      expect(feet).toBe(5);
      expect(inches).toBe(10);
    });

    it('should convert 183 cm to 6 feet 0 inches', () => {
      const { feet, inches } = convertHeightToImperial(183);
      expect(feet).toBe(6);
      expect(inches).toBe(0);
    });

    it('should convert 152 cm to 5 feet 0 inches', () => {
      const { feet, inches } = convertHeightToImperial(152);
      expect(feet).toBe(5);
      expect(inches).toBe(0);
    });
  });

  describe('convertWeightToMetric', () => {
    it('should convert 150 lbs to approximately 68 kg', () => {
      const kg = convertWeightToMetric(150);
      expect(kg).toBeCloseTo(68, 0);
    });

    it('should convert 200 lbs to approximately 91 kg', () => {
      const kg = convertWeightToMetric(200);
      expect(kg).toBeCloseTo(91, 0);
    });

    it('should convert 100 lbs to approximately 45 kg', () => {
      const kg = convertWeightToMetric(100);
      expect(kg).toBeCloseTo(45, 0);
    });
  });

  describe('convertWeightToImperial', () => {
    it('should convert 68 kg to approximately 150 lbs', () => {
      const lbs = convertWeightToImperial(68);
      expect(lbs).toBeCloseTo(150, 0);
    });

    it('should convert 91 kg to approximately 201 lbs', () => {
      const lbs = convertWeightToImperial(91);
      // 91 / 0.453592 = 200.6 -> rounds to 201
      expect(lbs).toBeCloseTo(201, 0);
    });

    it('should convert 45 kg to approximately 99 lbs', () => {
      const lbs = convertWeightToImperial(45);
      expect(lbs).toBeCloseTo(99, 0);
    });
  });

  describe('validateBasicsForm', () => {
    it('should return no errors for valid data', () => {
      const data: BasicsFormData = {
        birthYear: 1990,
        heightCm: 175,
        weightKg: 70,
        biologicalSex: 'male',
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(errors).toEqual({});
    });

    it('should return error for missing birth year', () => {
      const data: BasicsFormData = {
        birthYear: null as any,
        heightCm: 175,
        weightKg: 70,
        biologicalSex: 'male',
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(errors.birthYear).toBeDefined();
    });

    it('should return error for invalid birth year', () => {
      const data: BasicsFormData = {
        birthYear: 2020, // Too young
        heightCm: 175,
        weightKg: 70,
        biologicalSex: 'male',
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(errors.birthYear).toBeDefined();
    });

    it('should return error for missing height', () => {
      const data: BasicsFormData = {
        birthYear: 1990,
        heightCm: null as any,
        weightKg: 70,
        biologicalSex: 'male',
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(errors.heightCm).toBeDefined();
    });

    it('should return error for unreasonable height', () => {
      const data: BasicsFormData = {
        birthYear: 1990,
        heightCm: 50, // Too short
        weightKg: 70,
        biologicalSex: 'male',
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(errors.heightCm).toBeDefined();
    });

    it('should return error for missing weight', () => {
      const data: BasicsFormData = {
        birthYear: 1990,
        heightCm: 175,
        weightKg: null as any,
        biologicalSex: 'male',
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(errors.weightKg).toBeDefined();
    });

    it('should return error for missing biological sex', () => {
      const data: BasicsFormData = {
        birthYear: 1990,
        heightCm: 175,
        weightKg: 70,
        biologicalSex: null as any,
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(errors.biologicalSex).toBeDefined();
    });

    it('should return multiple errors for multiple missing fields', () => {
      const data: BasicsFormData = {
        birthYear: null as any,
        heightCm: null as any,
        weightKg: null as any,
        biologicalSex: null as any,
        unitPreference: 'metric',
      };
      const errors = validateBasicsForm(data);
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateFitnessForm', () => {
    it('should return no errors for valid data', () => {
      const data: FitnessFormData = {
        activityLevel: 'moderately_active',
        canDoPushups: true,
        canHoldPlank: true,
        canDoFullSquat: true,
        cardioCapacity: 'moderate',
      };
      const errors = validateFitnessForm(data);
      expect(errors).toEqual({});
    });

    it('should return error for missing activity level', () => {
      const data: FitnessFormData = {
        activityLevel: null as any,
        canDoPushups: true,
        canHoldPlank: true,
        canDoFullSquat: true,
        cardioCapacity: 'moderate',
      };
      const errors = validateFitnessForm(data);
      expect(errors.activityLevel).toBeDefined();
    });

    it('should return error for missing cardio capacity', () => {
      const data: FitnessFormData = {
        activityLevel: 'moderately_active',
        canDoPushups: true,
        canHoldPlank: true,
        canDoFullSquat: true,
        cardioCapacity: null as any,
      };
      const errors = validateFitnessForm(data);
      expect(errors.cardioCapacity).toBeDefined();
    });
  });

  describe('validateGoalsForm', () => {
    it('should return no errors for valid data', () => {
      const data: GoalsFormData = {
        primaryGoal: 'lose_weight',
        secondaryGoal: 'build_strength',
      };
      const errors = validateGoalsForm(data);
      expect(errors).toEqual({});
    });

    it('should return error for missing primary goal', () => {
      const data: GoalsFormData = {
        primaryGoal: null as any,
        secondaryGoal: 'build_strength',
      };
      const errors = validateGoalsForm(data);
      expect(errors.primaryGoal).toBeDefined();
    });

    it('should allow missing secondary goal', () => {
      const data: GoalsFormData = {
        primaryGoal: 'lose_weight',
        secondaryGoal: null,
      };
      const errors = validateGoalsForm(data);
      expect(errors).toEqual({});
    });
  });
});
