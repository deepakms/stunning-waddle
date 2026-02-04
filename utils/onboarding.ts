/**
 * Onboarding Utilities
 *
 * Functions for fitness level calculation, unit conversions, and form validation.
 *
 * Principles:
 * - Pure functions for calculations
 * - Type-safe with explicit interfaces
 * - Comprehensive validation
 */

// ============================================
// TYPES
// ============================================

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type CardioCapacity = 'low' | 'moderate' | 'high' | 'very_high';

export type BiologicalSex = 'male' | 'female' | 'other';

export type UnitPreference = 'metric' | 'imperial';

export type PrimaryGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'build_strength'
  | 'improve_endurance'
  | 'increase_flexibility'
  | 'general_fitness'
  | 'stress_relief';

export interface FitnessAssessment {
  activityLevel: ActivityLevel;
  canDoPushups: boolean;
  canHoldPlank: boolean;
  canDoFullSquat: boolean;
  cardioCapacity: CardioCapacity;
}

export interface BasicsFormData {
  birthYear: number;
  heightCm: number;
  weightKg: number;
  biologicalSex: BiologicalSex;
  unitPreference: UnitPreference;
}

export interface FitnessFormData {
  activityLevel: ActivityLevel;
  canDoPushups: boolean;
  canHoldPlank: boolean;
  canDoFullSquat: boolean;
  cardioCapacity: CardioCapacity;
}

export interface GoalsFormData {
  primaryGoal: PrimaryGoal;
  secondaryGoal: PrimaryGoal | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

// ============================================
// CONSTANTS
// ============================================

const ACTIVITY_LEVEL_SCORES: Record<ActivityLevel, number> = {
  sedentary: 0,
  lightly_active: 1,
  moderately_active: 2,
  very_active: 3,
  extremely_active: 4,
};

const CARDIO_CAPACITY_SCORES: Record<CardioCapacity, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  very_high: 3,
};

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
const KG_PER_LB = 0.453592;

const MIN_BIRTH_YEAR = 1920;
const MAX_BIRTH_YEAR = new Date().getFullYear() - 13; // At least 13 years old
const MIN_HEIGHT_CM = 100;
const MAX_HEIGHT_CM = 250;
const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 300;

// ============================================
// FITNESS LEVEL CALCULATION
// ============================================

/**
 * Calculates fitness level (1-5) based on assessment answers
 *
 * Scoring algorithm:
 * - Activity level: 0-4 points
 * - Each ability (pushups, plank, squat): 1 point each
 * - Cardio capacity: 0-3 points
 * - Total: 0-10 points, mapped to 1-5 fitness level
 */
export function calculateFitnessLevel(assessment: FitnessAssessment): number {
  let score = 0;

  // Activity level score (0-4)
  score += ACTIVITY_LEVEL_SCORES[assessment.activityLevel];

  // Ability scores (0-3)
  if (assessment.canDoPushups) score += 1;
  if (assessment.canHoldPlank) score += 1;
  if (assessment.canDoFullSquat) score += 1;

  // Cardio capacity score (0-3)
  score += CARDIO_CAPACITY_SCORES[assessment.cardioCapacity];

  // Total possible: 10 points
  // Map to 1-5 fitness level
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  if (score <= 5) return 3;
  if (score <= 7) return 4;
  return 5;
}

// ============================================
// UNIT CONVERSIONS
// ============================================

/**
 * Converts height from feet and inches to centimeters
 */
export function convertHeightToMetric(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches;
  return Math.round(totalInches * CM_PER_INCH);
}

/**
 * Converts height from centimeters to feet and inches
 */
export function convertHeightToImperial(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = totalInches % INCHES_PER_FOOT;
  return { feet, inches };
}

/**
 * Converts weight from pounds to kilograms
 */
export function convertWeightToMetric(lbs: number): number {
  return Math.round(lbs * KG_PER_LB);
}

/**
 * Converts weight from kilograms to pounds
 */
export function convertWeightToImperial(kg: number): number {
  return Math.round(kg / KG_PER_LB);
}

// ============================================
// FORM VALIDATION
// ============================================

/**
 * Validates the basics form data
 */
export function validateBasicsForm(data: BasicsFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Birth year validation
  if (!data.birthYear) {
    errors.birthYear = 'Birth year is required';
  } else if (data.birthYear < MIN_BIRTH_YEAR || data.birthYear > MAX_BIRTH_YEAR) {
    errors.birthYear = `Birth year must be between ${MIN_BIRTH_YEAR} and ${MAX_BIRTH_YEAR}`;
  }

  // Height validation
  if (!data.heightCm) {
    errors.heightCm = 'Height is required';
  } else if (data.heightCm < MIN_HEIGHT_CM || data.heightCm > MAX_HEIGHT_CM) {
    errors.heightCm = `Height must be between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm`;
  }

  // Weight validation
  if (!data.weightKg) {
    errors.weightKg = 'Weight is required';
  } else if (data.weightKg < MIN_WEIGHT_KG || data.weightKg > MAX_WEIGHT_KG) {
    errors.weightKg = `Weight must be between ${MIN_WEIGHT_KG} and ${MAX_WEIGHT_KG} kg`;
  }

  // Biological sex validation
  if (!data.biologicalSex) {
    errors.biologicalSex = 'Biological sex is required';
  }

  return errors;
}

/**
 * Validates the fitness assessment form data
 */
export function validateFitnessForm(data: FitnessFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.activityLevel) {
    errors.activityLevel = 'Activity level is required';
  }

  if (!data.cardioCapacity) {
    errors.cardioCapacity = 'Cardio capacity is required';
  }

  return errors;
}

/**
 * Validates the goals form data
 */
export function validateGoalsForm(data: GoalsFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.primaryGoal) {
    errors.primaryGoal = 'Primary goal is required';
  }

  // Secondary goal is optional

  return errors;
}

/**
 * List of common injury areas
 */
export const INJURY_AREAS = [
  { id: 'knee', label: 'Knee' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'back_lower', label: 'Lower Back' },
  { id: 'back_upper', label: 'Upper Back' },
  { id: 'hip', label: 'Hip' },
  { id: 'ankle', label: 'Ankle' },
  { id: 'wrist', label: 'Wrist' },
  { id: 'neck', label: 'Neck' },
  { id: 'elbow', label: 'Elbow' },
] as const;

/**
 * List of common equipment options
 */
export const EQUIPMENT_OPTIONS = [
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'resistance_bands', label: 'Resistance Bands' },
  { id: 'yoga_mat', label: 'Yoga Mat' },
  { id: 'pull_up_bar', label: 'Pull-up Bar' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'jump_rope', label: 'Jump Rope' },
  { id: 'foam_roller', label: 'Foam Roller' },
  { id: 'stability_ball', label: 'Stability Ball' },
  { id: 'bench', label: 'Workout Bench' },
  { id: 'barbell', label: 'Barbell' },
] as const;

/**
 * List of workout activity types
 */
export const ACTIVITY_TYPES = [
  { id: 'strength', label: 'Strength Training' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'hiit', label: 'HIIT' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'stretching', label: 'Stretching' },
  { id: 'pilates', label: 'Pilates' },
  { id: 'dance', label: 'Dance' },
  { id: 'martial_arts', label: 'Martial Arts' },
  { id: 'running', label: 'Running' },
  { id: 'cycling', label: 'Cycling' },
] as const;

/**
 * Primary goal options with descriptions
 */
export const GOAL_OPTIONS = [
  {
    id: 'lose_weight' as PrimaryGoal,
    label: 'Lose Weight',
    description: 'Burn fat and reduce body weight',
  },
  {
    id: 'build_muscle' as PrimaryGoal,
    label: 'Build Muscle',
    description: 'Increase muscle size and definition',
  },
  {
    id: 'build_strength' as PrimaryGoal,
    label: 'Build Strength',
    description: 'Get stronger and more powerful',
  },
  {
    id: 'improve_endurance' as PrimaryGoal,
    label: 'Improve Endurance',
    description: 'Build stamina and cardiovascular health',
  },
  {
    id: 'increase_flexibility' as PrimaryGoal,
    label: 'Increase Flexibility',
    description: 'Improve mobility and range of motion',
  },
  {
    id: 'general_fitness' as PrimaryGoal,
    label: 'General Fitness',
    description: 'Improve overall health and fitness',
  },
  {
    id: 'stress_relief' as PrimaryGoal,
    label: 'Stress Relief',
    description: 'Reduce stress and improve mental wellbeing',
  },
] as const;
