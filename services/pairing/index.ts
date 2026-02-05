/**
 * Pairing Logic System - Public API
 *
 * Main entry point for the exercise pairing system.
 */

// Types
export type {
  // Workout logging
  ExerciseLog,
  WorkoutLog,
  PostWorkoutFeedback,

  // User progress
  EstimatedAbilities,
  ProgressionRate,
  ExerciseMastery,
  ConsistencyMetrics,
  FatigueLevel,
  RecoveryStatus,
  UserProgressProfile,

  // Couple progress
  FitnessGapSnapshot,
  SharedMilestone,
  PairingHistoryEntry,
  CoupleProgressProfile,

  // Pairing
  PairingStrategy,
  PartnerInteractionType,
  WorkoutType,
  PairingInput,
  PairingScore,
  ExercisePair,
  GeneratedWorkout,

  // Progression
  ProgressionChangeType,
  ExerciseProgressionRecommendation,
  PairingAdjustments,

  // Periodization
  TrainingPhase,
  PhaseConfig,
  PeriodizationPlan,

  // Heart rate
  HeartRateZone,
  PersonalHRZones,
} from './types';

// Pairing engine
export {
  generateWorkout,
  calculateFitnessGap,
  selectPairingStrategy,
  checkConstraints,
  filterExercisesByConstraints,
} from './pairing-engine';

// Progression rules
export {
  analyzeExerciseProgression,
  analyzeAllProgressions,
  getProgressionChain,
  findExerciseForDifficulty,
  DEFAULT_PROGRESSION_CRITERIA,
  DEFAULT_REGRESSION_CRITERIA,
} from './progression-rules';

// Re-export training knowledge
export {
  TRAINING_PRINCIPLES,
  FAT_LOSS_PRINCIPLES,
  HEART_RATE_ZONES,
  WORKOUT_TEMPLATES,
  calculateMaxHeartRate,
  calculateZoneRanges,
} from '@/data/exercises/training-knowledge';
