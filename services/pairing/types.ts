/**
 * Pairing Logic System - Type Definitions
 *
 * Core types for the exercise pairing, progress tracking,
 * and adaptive workout system.
 */

import type {
  MuscleGroup,
  ExerciseType,
  MovementPattern,
  SpaceRequired,
  DifficultyLabel,
} from '@/types/database';

import type {
  ExerciseDefinition,
  EquipmentType,
  InjuryType,
  ExerciseCategory,
  IntensityLevel,
} from '@/data/exercises/exercise-catalog';

// ============================================
// WORKOUT LOGGING TYPES
// ============================================

/**
 * Log of a single exercise within a workout
 */
export interface ExerciseLog {
  exerciseId: string;

  // Prescribed values
  prescribedReps: number | null;
  prescribedDuration: number | null;
  prescribedSets: number;
  prescribedRIR: number;
  prescribedWeight: number | null;

  // Actual performance
  actualReps: number | null;
  actualDuration: number | null;
  actualSets: number;
  actualRIR: number; // Self-reported: how many reps could you have done more?
  actualWeight: number | null;

  // Quality indicators
  formQuality: 'poor' | 'okay' | 'good' | 'perfect';
  completed: boolean;
  skipped: boolean;
  skipReason?: 'injury' | 'too_hard' | 'too_easy' | 'no_equipment' | 'time' | 'other';

  // Feedback
  feltTooEasy: boolean;
  feltTooHard: boolean;
  feltPain: boolean;
  painLocation?: InjuryType;
  enjoyed: boolean;
}

/**
 * Complete workout log for one person
 */
export interface WorkoutLog {
  id: string;
  date: Date;
  personId: string;
  partnerId: string;
  coupleId: string;

  // Session metadata
  workoutId: string; // Reference to the generated workout
  duration: number; // Actual duration in minutes
  workoutType: WorkoutType;
  completionRate: number; // 0-1, % of prescribed exercises completed

  // Exercise data
  exerciseLogs: ExerciseLog[];

  // Physiological data (optional - from wearables/manual input)
  avgHeartRate?: number;
  maxHeartRate?: number;
  caloriesBurned?: number;

  // Subjective feedback
  overallRPE: number; // 1-10 (Rating of Perceived Exertion)
  enjoymentRating: number; // 1-5
  partnerConnectionRating: number; // 1-5

  // Notes
  userNotes?: string;
}

/**
 * Post-workout feedback form
 */
export interface PostWorkoutFeedback {
  workoutLogId: string;

  // Quick ratings (always collected)
  overallDifficulty: 1 | 2 | 3 | 4 | 5; // 1=too easy, 5=too hard
  enjoyment: 1 | 2 | 3 | 4 | 5;
  partnerConnection: 1 | 2 | 3 | 4 | 5;

  // Per-exercise feedback (optional quick tap)
  exerciseFeedback: Record<string, 'too_easy' | 'just_right' | 'too_hard'>;

  // Detailed feedback (optional)
  favoriteExercise?: string;
  leastFavoriteExercise?: string;
  injuryOrPain?: string;
  suggestions?: string;
}

// ============================================
// USER PROGRESS TYPES
// ============================================

/**
 * Estimated abilities for a user (calculated from workout history)
 */
export interface EstimatedAbilities {
  // Assessment-based estimates
  pushUpMax: number; // Estimated max reps in one set
  plankMaxSeconds: number;
  squatMax: number;
  pullUpMax: number;
  cardioCapacityMinutes: number; // Minutes at moderate intensity

  // Per muscle group strength scores (1-100)
  chestStrength: number;
  backStrength: number;
  shoulderStrength: number;
  bicepStrength: number;
  tricepStrength: number;
  coreStrength: number;
  quadStrength: number;
  hamstringStrength: number;
  gluteStrength: number;
  calfStrength: number;

  // Per movement pattern proficiency (1-100)
  pushProficiency: number;
  pullProficiency: number;
  hingeProficiency: number;
  squatProficiency: number;
  lungeProficiency: number;
  coreProficiency: number;
  cardioEndurance: number;

  // Flexibility scores (1-100)
  upperBodyFlexibility: number;
  lowerBodyFlexibility: number;
  spineFlexibility: number;
}

/**
 * Progression rate classification
 */
export type ProgressionRate = 'declining' | 'plateau' | 'slow' | 'normal' | 'fast';

/**
 * Mastery tracking for a single exercise
 */
export interface ExerciseMastery {
  exerciseId: string;

  // Volume tracking
  totalRepsAllTime: number;
  totalTimeAllTime: number; // seconds
  timesPerformed: number;
  lastPerformed: Date | null;

  // Performance tracking
  bestReps: number;
  bestDuration: number; // seconds
  bestWeight: number;
  recentPerformances: Array<{
    date: Date;
    reps: number | null;
    duration: number | null;
    weight: number | null;
    rir: number;
    formQuality: 'poor' | 'okay' | 'good' | 'perfect';
  }>;

  // Trend analysis
  performanceTrend: 'improving' | 'stable' | 'declining';
  averageRIR: number;
  consistentlyTooEasy: boolean; // RIR > 4 multiple times
  consistentlyTooHard: boolean; // RIR < 1 or failures

  // Readiness for progression
  readyToProgress: boolean;
  suggestedProgression: string | null; // Exercise ID of harder variation

  // Form quality tracking
  averageFormQuality: number; // 1-4
  formReadyForProgression: boolean;
}

/**
 * Workout consistency metrics
 */
export interface ConsistencyMetrics {
  workoutsLast7Days: number;
  workoutsLast30Days: number;
  averageWorkoutsPerWeek: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date | null;
}

/**
 * Recovery status tracking
 */
export type FatigueLevel = 'fresh' | 'recovered' | 'fatigued' | 'overtrained';

export interface RecoveryStatus {
  lastWorkoutDate: Date | null;
  hoursSinceLastWorkout: number;
  muscleGroupFatigue: Record<MuscleGroup, FatigueLevel>;
  overallFatigue: FatigueLevel;
  recommendedRestDays: number;
}

/**
 * Complete user progress profile
 */
export interface UserProgressProfile {
  userId: string;
  lastUpdated: Date;

  // Current estimated abilities
  estimatedAbilities: EstimatedAbilities;

  // Progression velocity
  progressionRate: {
    overall: ProgressionRate;
    byMuscleGroup: Partial<Record<MuscleGroup, ProgressionRate>>;
  };

  // Exercise mastery tracking
  exerciseMastery: Record<string, ExerciseMastery>;

  // Workout consistency
  consistency: ConsistencyMetrics;

  // Recovery indicators
  recoveryStatus: RecoveryStatus;

  // Preferences (learned over time)
  learnedPreferences: {
    preferredExercises: string[];
    dislikedExercises: string[];
    preferredIntensity: IntensityLevel;
    optimalWorkoutDuration: number;
    optimalWorkoutTime: 'morning' | 'afternoon' | 'evening' | null;
    respondsWellToHighIntensity: boolean;
    respondsWellToHighVolume: boolean;
  };

  // Injury history
  currentInjuries: InjuryType[];
  pastInjuries: InjuryType[];
}

// ============================================
// COUPLE PROGRESS TYPES
// ============================================

/**
 * Fitness gap measurement between partners
 */
export interface FitnessGapSnapshot {
  date: Date;
  overallGap: number; // -100 to +100 (negative = personA stronger)
  strengthGap: number;
  cardioGap: number;
  flexibilityGap: number;
  upperBodyGap: number;
  lowerBodyGap: number;
  coreGap: number;
}

/**
 * Shared milestone achievement
 */
export interface SharedMilestone {
  id: string;
  date: Date;
  milestone: string;
  type: 'streak' | 'exercise_unlocked' | 'total_workouts' | 'improvement' | 'challenge_completed';
  celebrationShown: boolean;
}

/**
 * Record of a pairing strategy used
 */
export interface PairingHistoryEntry {
  date: Date;
  pairingStrategy: PairingStrategy;
  exercisePairId: string;
  effectivenessScore: number; // 0-1 based on completion, enjoyment, connection
  personAFeedback: 'positive' | 'neutral' | 'negative' | null;
  personBFeedback: 'positive' | 'neutral' | 'negative' | null;
}

/**
 * Complete couple progress profile
 */
export interface CoupleProgressProfile {
  coupleId: string;
  personAId: string;
  personBId: string;
  lastUpdated: Date;

  // Fitness gap tracking over time
  fitnessGapHistory: FitnessGapSnapshot[];
  currentGap: FitnessGapSnapshot;
  gapTrend: 'widening' | 'stable' | 'closing';

  // Shared achievements
  sharedMilestones: SharedMilestone[];
  totalWorkoutsTogether: number;
  longestStreakTogether: number;
  currentStreakTogether: number;

  // Pairing effectiveness tracking
  pairingHistory: PairingHistoryEntry[];
  preferredStrategies: PairingStrategy[];
  avoidStrategies: PairingStrategy[];

  // Partner exercise comfort progression
  partnerExerciseComfort: {
    personAComfort: number; // 1-5
    personBComfort: number; // 1-5
    mutualComfort: number; // min of both
    history: Array<{ date: Date; level: number }>;
    unlockedPartnerExercises: string[];
  };

  // Competition preference (learned over time)
  competitionPreference: {
    personAEnjoys: number; // 1-5
    personBEnjoys: number; // 1-5
    mutualCompetitionScore: number;
    competitiveModesUsed: number;
    cooperativeModesUsed: number;
  };
}

// ============================================
// PAIRING STRATEGY TYPES
// ============================================

/**
 * All available pairing strategies
 */
export type PairingStrategy =
  // Category A: Same Exercise
  | 'identical'
  | 'same_exercise_different_reps'
  | 'same_exercise_different_tempo'
  | 'same_exercise_different_load'
  | 'same_exercise_different_rom'

  // Category B: Progression Chain
  | 'adjacent_progression'
  | 'distant_progression'

  // Category C: Same Target
  | 'same_muscle_different_exercise'
  | 'same_pattern_different_exercise'
  | 'same_position_different_exercise'

  // Category D: Complementary
  | 'agonist_antagonist'
  | 'upper_lower_split'
  | 'weakness_targeting'

  // Category E: Partner-Specific
  | 'cooperative_partner'
  | 'assisted_partner'
  | 'mirror_facing'
  | 'competitive_same'
  | 'competitive_handicapped'
  | 'alternating_station'

  // Category F: Physiological
  | 'hr_zone_matched'
  | 'rpe_rir_matched'
  | 'calorie_matched'
  | 'time_under_tension_matched';

/**
 * Partner interaction type for an exercise pair
 */
export type PartnerInteractionType =
  | 'cooperative'
  | 'assisted'
  | 'mirror'
  | 'competitive'
  | 'independent';

/**
 * Workout type classification
 */
export type WorkoutType =
  | 'strength'
  | 'hiit'
  | 'cardio'
  | 'flexibility'
  | 'recovery'
  | 'mixed';

// ============================================
// PAIRING ENGINE TYPES
// ============================================

/**
 * Input for generating a workout
 */
export interface PairingInput {
  personA: UserProgressProfile;
  personB: UserProgressProfile;
  coupleProfile: CoupleProgressProfile;

  sessionContext: {
    duration: number; // minutes
    equipment: EquipmentType[];
    space: SpaceRequired;
    workoutType: WorkoutType;
    focus: MuscleGroup[] | null; // null = full body
    intensityPreference?: IntensityLevel;
  };
}

/**
 * Scoring breakdown for a pairing
 */
export interface PairingScore {
  safetyScore: number; // 0-1, must be 1.0
  abilityMatchScore: number; // 0-1
  hrZoneMatchScore: number; // 0-1
  rirMatchScore: number; // 0-1
  timeSyncScore: number; // 0-1
  goalAlignmentScore: number; // 0-1
  enjoymentScore: number; // 0-1
  varietyScore: number; // 0-1
  connectionScore: number; // 0-1
  totalScore: number; // weighted sum
}

/**
 * A paired set of exercises for the couple
 */
export interface ExercisePair {
  id: string;
  exerciseA: ExerciseDefinition;
  exerciseB: ExerciseDefinition;
  pairingStrategy: PairingStrategy;

  // Prescriptions for each person
  prescriptionA: {
    sets: number;
    reps: number | null;
    duration: number | null;
    targetRIR: number;
    weight: number | null;
    tempo: string; // e.g., "2-0-2" (down-pause-up)
  };
  prescriptionB: {
    sets: number;
    reps: number | null;
    duration: number | null;
    targetRIR: number;
    weight: number | null;
    tempo: string;
  };

  // Physiological targets
  targetHRZone: number;
  targetRIR: number;
  targetDurationSeconds: number;

  // Partner interaction
  isPartnerExercise: boolean;
  interactionType: PartnerInteractionType;

  // Scoring
  score: PairingScore;
}

/**
 * A complete generated workout
 */
export interface GeneratedWorkout {
  id: string;
  createdAt: Date;
  coupleId: string;

  // Structure
  warmup: ExercisePair[];
  mainWorkout: ExercisePair[];
  cooldown: ExercisePair[];

  // Metadata
  estimatedDuration: number;
  workoutType: WorkoutType;
  focusAreas: MuscleGroup[];
  difficulty: DifficultyLabel;

  // Summary
  totalExercises: number;
  partnerExerciseCount: number;
  competitiveElementCount: number;
}

// ============================================
// PROGRESSION TYPES
// ============================================

/**
 * Change type for an exercise
 */
export type ProgressionChangeType =
  | 'progress_variation' // Move to harder variation
  | 'regress_variation' // Move to easier variation
  | 'add_reps'
  | 'reduce_reps'
  | 'add_weight'
  | 'reduce_weight'
  | 'add_sets'
  | 'reduce_sets'
  | 'adjust_tempo'
  | 'maintain';

/**
 * Recommended change for an exercise
 */
export interface ExerciseProgressionRecommendation {
  exerciseId: string;
  change: ProgressionChangeType;
  newExerciseId?: string; // If changing variation
  newReps?: number;
  newWeight?: number;
  newSets?: number;
  reason: string;
  confidence: number; // 0-1
}

/**
 * Adjustments to make after analyzing a workout
 */
export interface PairingAdjustments {
  personAChanges: ExerciseProgressionRecommendation[];
  personBChanges: ExerciseProgressionRecommendation[];

  // Pairing strategy changes
  strategyChanges: Array<{
    oldStrategy: PairingStrategy;
    newStrategy: PairingStrategy;
    reason: string;
  }>;

  // Newly unlocked content
  newlyUnlockedExercises: {
    personA: string[];
    personB: string[];
    partnerExercises: string[];
  };

  // Alerts to show user
  alerts: Array<{
    type: 'achievement' | 'warning' | 'suggestion' | 'milestone';
    message: string;
    forPerson: 'A' | 'B' | 'both';
  }>;
}

// ============================================
// PERIODIZATION TYPES
// ============================================

/**
 * Training phase in a mesocycle
 */
export type TrainingPhase = 'adaptation' | 'building' | 'peak' | 'deload';

/**
 * Configuration for each training phase
 */
export interface PhaseConfig {
  focus: string;
  intensityRange: [number, number]; // 0-1
  volumeMultiplier: number;
  progressionRate: 'none' | 'slow' | 'normal' | 'fast';
  newExerciseIntroduction: 'none' | 'low' | 'medium' | 'high';
  durationWeeks: number;
}

/**
 * Periodization plan for a couple
 */
export interface PeriodizationPlan {
  coupleId: string;
  startDate: Date;

  // Current position in plan
  currentPhase: TrainingPhase;
  weekInPhase: number;
  totalWeeksInPhase: number;

  // Phase configurations
  phases: Record<TrainingPhase, PhaseConfig>;

  // Auto-deload triggers
  deloadTriggers: {
    weeksWithoutDeload: number;
    plateauWeeks: number;
    overtrainingSignals: string[];
  };

  // History
  phaseHistory: Array<{
    phase: TrainingPhase;
    startDate: Date;
    endDate: Date;
    reason: 'scheduled' | 'auto_deload' | 'user_requested';
  }>;
}

// ============================================
// HEART RATE ZONE TYPES
// ============================================

/**
 * Heart rate zone definition
 */
export interface HeartRateZone {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  percentageOfMax: [number, number];
  description: string;
}

/**
 * Calculated HR zones for an individual
 */
export interface PersonalHRZones {
  maxHR: number;
  restingHR?: number;
  zones: Array<{
    zone: number;
    minHR: number;
    maxHR: number;
  }>;
}
