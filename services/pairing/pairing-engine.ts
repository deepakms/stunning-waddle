/**
 * Pairing Engine
 *
 * The core algorithm that generates exercise pairings for couples
 * based on their profiles, preferences, and goals.
 */

import type {
  PairingInput,
  ExercisePair,
  GeneratedWorkout,
  PairingStrategy,
  PairingScore,
  PartnerInteractionType,
  UserProgressProfile,
  CoupleProgressProfile,
  WorkoutType,
} from './types';

import {
  ALL_EXERCISES,
  getExercisesByMuscleGroup,
  getExercisesByCategory,
  getExercisesSafeForInjury,
  type ExerciseDefinition,
  type EquipmentType,
  type InjuryType,
} from '@/data/exercises/exercise-catalog';

import type { MuscleGroup, SpaceRequired } from '@/types/database';

import {
  getProgressionChain,
  findExerciseForDifficulty,
} from './progression-rules';

// ============================================
// CONSTRAINT CHECKING
// ============================================

interface ConstraintCheckResult {
  passed: boolean;
  reason?: string;
}

/**
 * Check if an exercise passes all hard constraints for a user
 */
function checkConstraints(
  exercise: ExerciseDefinition,
  profile: UserProgressProfile,
  equipment: EquipmentType[],
  space: SpaceRequired
): ConstraintCheckResult {
  // Safety: Check injury contraindications
  for (const injury of profile.currentInjuries) {
    if (exercise.contraindicated_injuries.includes(injury)) {
      return {
        passed: false,
        reason: `Contraindicated for injury: ${injury}`,
      };
    }
  }

  // Equipment: Check if required equipment is available
  const hasRequiredEquipment = exercise.equipment_required.every(
    req => req === 'none' || equipment.includes(req)
  );

  if (!hasRequiredEquipment) {
    // Check alternatives
    const hasAlternative = exercise.equipment_alternatives.some(
      alt => alt.every(eq => equipment.includes(eq))
    );

    if (!hasAlternative) {
      return {
        passed: false,
        reason: `Missing required equipment: ${exercise.equipment_required.join(', ')}`,
      };
    }
  }

  // Space: Check if space is sufficient
  const spaceRank: Record<SpaceRequired, number> = {
    minimal: 1,
    small: 2,
    medium: 3,
    large: 4,
  };

  if (spaceRank[exercise.space_required] > spaceRank[space]) {
    return {
      passed: false,
      reason: `Requires more space: ${exercise.space_required}`,
    };
  }

  // Ability: Check if user can perform the exercise
  if (exercise.requires_pushup_ability && profile.estimatedAbilities.pushUpMax < 1) {
    return { passed: false, reason: 'Requires push-up ability' };
  }

  if (exercise.requires_plank_ability && profile.estimatedAbilities.plankMaxSeconds < 10) {
    return { passed: false, reason: 'Requires plank ability' };
  }

  if (exercise.requires_squat_ability && profile.estimatedAbilities.squatMax < 1) {
    return { passed: false, reason: 'Requires squat ability' };
  }

  return { passed: true };
}

/**
 * Filter exercises by constraints for both partners
 */
function filterExercisesByConstraints(
  exercises: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  equipment: EquipmentType[],
  space: SpaceRequired
): {
  safeForA: ExerciseDefinition[];
  safeForB: ExerciseDefinition[];
  safeForBoth: ExerciseDefinition[];
} {
  const safeForA = exercises.filter(
    e => checkConstraints(e, profileA, equipment, space).passed
  );

  const safeForB = exercises.filter(
    e => checkConstraints(e, profileB, equipment, space).passed
  );

  const safeForBoth = safeForA.filter(e => safeForB.includes(e));

  return { safeForA, safeForB, safeForBoth };
}

// ============================================
// FITNESS GAP CALCULATION
// ============================================

/**
 * Calculate overall fitness gap between partners
 * Returns -100 to +100 (negative = A is stronger)
 */
function calculateFitnessGap(
  profileA: UserProgressProfile,
  profileB: UserProgressProfile
): number {
  const abilitiesA = profileA.estimatedAbilities;
  const abilitiesB = profileB.estimatedAbilities;

  // Normalize each ability and calculate weighted difference
  const weights = {
    pushUp: 0.15,
    plank: 0.1,
    squat: 0.15,
    cardio: 0.15,
    upperStrength: 0.15,
    lowerStrength: 0.15,
    coreStrength: 0.15,
  };

  const normalizedDiffs = {
    pushUp: normalizeAbilityDiff(abilitiesA.pushUpMax, abilitiesB.pushUpMax, 30),
    plank: normalizeAbilityDiff(abilitiesA.plankMaxSeconds, abilitiesB.plankMaxSeconds, 120),
    squat: normalizeAbilityDiff(abilitiesA.squatMax, abilitiesB.squatMax, 30),
    cardio: normalizeAbilityDiff(abilitiesA.cardioCapacityMinutes, abilitiesB.cardioCapacityMinutes, 30),
    upperStrength: normalizeAbilityDiff(
      (abilitiesA.chestStrength + abilitiesA.backStrength + abilitiesA.shoulderStrength) / 3,
      (abilitiesB.chestStrength + abilitiesB.backStrength + abilitiesB.shoulderStrength) / 3,
      100
    ),
    lowerStrength: normalizeAbilityDiff(
      (abilitiesA.quadStrength + abilitiesA.hamstringStrength + abilitiesA.gluteStrength) / 3,
      (abilitiesB.quadStrength + abilitiesB.hamstringStrength + abilitiesB.gluteStrength) / 3,
      100
    ),
    coreStrength: normalizeAbilityDiff(abilitiesA.coreStrength, abilitiesB.coreStrength, 100),
  };

  // Weighted sum
  let gap = 0;
  for (const [key, weight] of Object.entries(weights)) {
    gap += normalizedDiffs[key as keyof typeof normalizedDiffs] * weight;
  }

  return Math.round(gap * 100);
}

function normalizeAbilityDiff(a: number, b: number, maxValue: number): number {
  const normalizedA = Math.min(a / maxValue, 1);
  const normalizedB = Math.min(b / maxValue, 1);
  return normalizedB - normalizedA; // Positive = B is stronger
}

// ============================================
// PAIRING STRATEGY SELECTION
// ============================================

/**
 * Determine best pairing strategy based on fitness gap and preferences
 */
function selectPairingStrategy(
  gap: number,
  coupleProfile: CoupleProgressProfile,
  muscleGroup: MuscleGroup
): PairingStrategy {
  const absGap = Math.abs(gap);

  // Consider couple preferences
  const preferredStrategies = coupleProfile.preferredStrategies;
  const avoidStrategies = coupleProfile.avoidStrategies;

  // Small gap (< 15): Can use same exercises
  if (absGap < 15) {
    if (coupleProfile.competitionPreference.mutualCompetitionScore > 3.5) {
      return 'competitive_same';
    }
    return 'same_exercise_different_reps';
  }

  // Medium gap (15-35): Use progression chain or HR matching
  if (absGap < 35) {
    if (coupleProfile.partnerExerciseComfort.mutualComfort >= 3) {
      return 'mirror_facing';
    }
    return 'adjacent_progression';
  }

  // Large gap (35-60): Different exercises or distant progression
  if (absGap < 60) {
    return 'distant_progression';
  }

  // Very large gap (60+): Different exercises entirely
  return 'same_muscle_different_exercise';
}

// ============================================
// PAIR GENERATION
// ============================================

/**
 * Generate candidate pairs for a muscle group
 */
function generateCandidatePairs(
  muscleGroup: MuscleGroup,
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  coupleProfile: CoupleProgressProfile,
  safeExercisesA: ExerciseDefinition[],
  safeExercisesB: ExerciseDefinition[],
  strategy: PairingStrategy
): ExercisePair[] {
  const pairs: ExercisePair[] = [];

  const exercisesForMuscleA = safeExercisesA.filter(
    e => e.muscle_group === muscleGroup
  );
  const exercisesForMuscleB = safeExercisesB.filter(
    e => e.muscle_group === muscleGroup
  );

  if (exercisesForMuscleA.length === 0 || exercisesForMuscleB.length === 0) {
    return pairs;
  }

  switch (strategy) {
    case 'same_exercise_different_reps':
    case 'identical':
      pairs.push(...generateSameExercisePairs(
        exercisesForMuscleA,
        exercisesForMuscleB,
        profileA,
        profileB,
        strategy
      ));
      break;

    case 'adjacent_progression':
    case 'distant_progression':
      pairs.push(...generateProgressionChainPairs(
        exercisesForMuscleA,
        exercisesForMuscleB,
        profileA,
        profileB,
        strategy
      ));
      break;

    case 'same_muscle_different_exercise':
      pairs.push(...generateDifferentExercisePairs(
        exercisesForMuscleA,
        exercisesForMuscleB,
        profileA,
        profileB
      ));
      break;

    case 'mirror_facing':
    case 'competitive_same':
      pairs.push(...generatePartnerPairs(
        exercisesForMuscleA,
        exercisesForMuscleB,
        profileA,
        profileB,
        coupleProfile,
        strategy
      ));
      break;

    default:
      // Default to progression chain
      pairs.push(...generateProgressionChainPairs(
        exercisesForMuscleA,
        exercisesForMuscleB,
        profileA,
        profileB,
        'adjacent_progression'
      ));
  }

  return pairs;
}

function generateSameExercisePairs(
  exercisesA: ExerciseDefinition[],
  exercisesB: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  strategy: PairingStrategy
): ExercisePair[] {
  const pairs: ExercisePair[] = [];

  // Find exercises both can do
  const common = exercisesA.filter(ea =>
    exercisesB.some(eb => eb.id === ea.id)
  );

  for (const exercise of common) {
    const prescriptionA = calculatePrescription(exercise, profileA);
    const prescriptionB = calculatePrescription(exercise, profileB);

    pairs.push({
      id: `pair-${exercise.id}-same`,
      exerciseA: exercise,
      exerciseB: exercise,
      pairingStrategy: strategy,
      prescriptionA,
      prescriptionB,
      targetHRZone: 3,
      targetRIR: 2,
      targetDurationSeconds: Math.max(
        prescriptionA.duration || 30,
        prescriptionB.duration || 30
      ),
      isPartnerExercise: false,
      interactionType: strategy === 'competitive_same' ? 'competitive' : 'independent',
      score: calculatePairScore(exercise, exercise, profileA, profileB, strategy),
    });
  }

  return pairs;
}

function generateProgressionChainPairs(
  exercisesA: ExerciseDefinition[],
  exercisesB: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  strategy: PairingStrategy
): ExercisePair[] {
  const pairs: ExercisePair[] = [];

  // For each exercise available to A, find appropriate exercise for B in same chain
  for (const exerciseA of exercisesA) {
    const chain = getProgressionChain(exerciseA, ALL_EXERCISES);

    if (chain.length < 2) continue;

    // Find B's position in chain based on their ability
    const targetDifficultyB = estimateTargetDifficulty(exerciseA.muscle_group, profileB);
    const exerciseB = findExerciseForDifficulty(chain, targetDifficultyB);

    // Check if B can do this exercise
    if (!exercisesB.some(e => e.id === exerciseB.id)) continue;

    // Check if gap is appropriate for strategy
    const diffGap = Math.abs(exerciseA.difficulty - exerciseB.difficulty);
    if (strategy === 'adjacent_progression' && diffGap > 1.5) continue;
    if (strategy === 'distant_progression' && diffGap < 1) continue;

    const prescriptionA = calculatePrescription(exerciseA, profileA);
    const prescriptionB = calculatePrescription(exerciseB, profileB);

    pairs.push({
      id: `pair-${exerciseA.id}-${exerciseB.id}-prog`,
      exerciseA,
      exerciseB,
      pairingStrategy: strategy,
      prescriptionA,
      prescriptionB,
      targetHRZone: 3,
      targetRIR: 2,
      targetDurationSeconds: calculateSyncedDuration(prescriptionA, prescriptionB),
      isPartnerExercise: false,
      interactionType: 'mirror',
      score: calculatePairScore(exerciseA, exerciseB, profileA, profileB, strategy),
    });
  }

  return pairs;
}

function generateDifferentExercisePairs(
  exercisesA: ExerciseDefinition[],
  exercisesB: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile
): ExercisePair[] {
  const pairs: ExercisePair[] = [];

  // Match exercises by difficulty level
  for (const exerciseA of exercisesA.slice(0, 5)) {
    const targetDifficultyB = estimateTargetDifficulty(exerciseA.muscle_group, profileB);

    // Find exercise for B with similar relative difficulty
    const matchingB = exercisesB
      .filter(e => Math.abs(e.difficulty - targetDifficultyB) <= 1)
      .sort((a, b) =>
        Math.abs(a.difficulty - targetDifficultyB) -
        Math.abs(b.difficulty - targetDifficultyB)
      )[0];

    if (!matchingB) continue;

    const prescriptionA = calculatePrescription(exerciseA, profileA);
    const prescriptionB = calculatePrescription(matchingB, profileB);

    pairs.push({
      id: `pair-${exerciseA.id}-${matchingB.id}-diff`,
      exerciseA,
      exerciseB: matchingB,
      pairingStrategy: 'same_muscle_different_exercise',
      prescriptionA,
      prescriptionB,
      targetHRZone: 3,
      targetRIR: 2,
      targetDurationSeconds: calculateSyncedDuration(prescriptionA, prescriptionB),
      isPartnerExercise: false,
      interactionType: 'independent',
      score: calculatePairScore(exerciseA, matchingB, profileA, profileB, 'same_muscle_different_exercise'),
    });
  }

  return pairs;
}

function generatePartnerPairs(
  exercisesA: ExerciseDefinition[],
  exercisesB: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  coupleProfile: CoupleProgressProfile,
  strategy: PairingStrategy
): ExercisePair[] {
  const pairs: ExercisePair[] = [];

  // Find partner exercises both can do
  const partnerExercises = ALL_EXERCISES.filter(e =>
    e.is_partner_exercise &&
    exercisesA.some(ea => ea.id === e.id) &&
    exercisesB.some(eb => eb.id === e.id)
  );

  for (const exercise of partnerExercises) {
    // Check contact comfort
    if (exercise.requires_contact && coupleProfile.partnerExerciseComfort.mutualComfort < 3) {
      continue;
    }

    const prescriptionA = calculatePrescription(exercise, profileA);
    const prescriptionB = calculatePrescription(exercise, profileB);

    const interactionType: PartnerInteractionType =
      exercise.requires_contact ? 'cooperative' :
      strategy === 'competitive_same' ? 'competitive' : 'mirror';

    pairs.push({
      id: `pair-${exercise.id}-partner`,
      exerciseA: exercise,
      exerciseB: exercise,
      pairingStrategy: strategy,
      prescriptionA,
      prescriptionB,
      targetHRZone: 3,
      targetRIR: 2,
      targetDurationSeconds: prescriptionA.duration || 30,
      isPartnerExercise: true,
      interactionType,
      score: calculatePairScore(exercise, exercise, profileA, profileB, strategy, true),
    });
  }

  return pairs;
}

// ============================================
// PRESCRIPTION CALCULATION
// ============================================

interface ExercisePrescription {
  sets: number;
  reps: number | null;
  duration: number | null;
  targetRIR: number;
  weight: number | null;
  tempo: string;
}

function calculatePrescription(
  exercise: ExerciseDefinition,
  profile: UserProgressProfile
): ExercisePrescription {
  // Get mastery data if available
  const mastery = profile.exerciseMastery[exercise.id];

  // Base values from exercise definition
  let sets = 3;
  let reps = exercise.default_reps;
  let duration = exercise.default_duration_seconds;
  let weight: number | null = null;

  // Adjust based on mastery
  if (mastery) {
    // If consistently too easy, increase slightly
    if (mastery.consistentlyTooEasy && reps) {
      reps = Math.min(reps + 3, 25);
    }
    // If consistently too hard, decrease
    if (mastery.consistentlyTooHard && reps) {
      reps = Math.max(reps - 3, 5);
    }
  }

  // Determine tempo based on goals and difficulty
  const tempo = exercise.difficulty >= 4 ? '2-0-2' : '2-1-2';

  return {
    sets,
    reps,
    duration,
    targetRIR: 2,
    weight,
    tempo,
  };
}

function calculateSyncedDuration(
  prescriptionA: ExercisePrescription,
  prescriptionB: ExercisePrescription
): number {
  const durationA = prescriptionA.duration || (prescriptionA.reps || 10) * 3;
  const durationB = prescriptionB.duration || (prescriptionB.reps || 10) * 3;
  return Math.max(durationA, durationB);
}

// ============================================
// SCORING
// ============================================

function calculatePairScore(
  exerciseA: ExerciseDefinition,
  exerciseB: ExerciseDefinition,
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  strategy: PairingStrategy,
  isPartnerExercise: boolean = false
): PairingScore {
  // Safety score (must be 1.0 - already filtered)
  const safetyScore = 1.0;

  // Ability match: How well do exercises match each person's ability
  const abilityMatchA = calculateAbilityMatch(exerciseA, profileA);
  const abilityMatchB = calculateAbilityMatch(exerciseB, profileB);
  const abilityMatchScore = (abilityMatchA + abilityMatchB) / 2;

  // HR zone match: Do exercises lead to similar relative intensity
  const hrZoneMatchScore = calculateHRZoneMatch(exerciseA, exerciseB);

  // RIR match: Will both finish at similar RIR
  const rirMatchScore = calculateRIRMatchScore(exerciseA, exerciseB, profileA, profileB);

  // Time sync: Can they be done in similar time
  const timeSyncScore = calculateTimeSyncScore(exerciseA, exerciseB);

  // Goal alignment: Support their goals
  const goalAlignmentScore = 0.7; // TODO: implement based on user goals

  // Enjoyment: Do they like these exercises
  const enjoymentA = profileA.learnedPreferences.preferredExercises.includes(exerciseA.id) ? 1.0 :
    profileA.learnedPreferences.dislikedExercises.includes(exerciseA.id) ? 0.2 : 0.6;
  const enjoymentB = profileB.learnedPreferences.preferredExercises.includes(exerciseB.id) ? 1.0 :
    profileB.learnedPreferences.dislikedExercises.includes(exerciseB.id) ? 0.2 : 0.6;
  const enjoymentScore = (enjoymentA + enjoymentB) / 2;

  // Variety: Favor different exercises than recent workouts
  const varietyScore = 0.7; // TODO: implement based on recent history

  // Connection: Partner exercises and facing exercises score higher
  const connectionScore = isPartnerExercise ? 1.0 :
    strategy === 'mirror_facing' ? 0.8 :
    strategy === 'competitive_same' ? 0.7 : 0.4;

  // Calculate weighted total
  const totalScore =
    safetyScore * 1000 +
    abilityMatchScore * 100 +
    hrZoneMatchScore * 50 +
    rirMatchScore * 40 +
    timeSyncScore * 30 +
    goalAlignmentScore * 25 +
    enjoymentScore * 20 +
    varietyScore * 15 +
    connectionScore * 10;

  return {
    safetyScore,
    abilityMatchScore,
    hrZoneMatchScore,
    rirMatchScore,
    timeSyncScore,
    goalAlignmentScore,
    enjoymentScore,
    varietyScore,
    connectionScore,
    totalScore,
  };
}

function calculateAbilityMatch(
  exercise: ExerciseDefinition,
  profile: UserProgressProfile
): number {
  const targetDifficulty = estimateTargetDifficulty(exercise.muscle_group, profile);
  const diff = Math.abs(exercise.difficulty - targetDifficulty);

  if (diff <= 0.5) return 1.0;
  if (diff <= 1.0) return 0.85;
  if (diff <= 1.5) return 0.7;
  if (diff <= 2.0) return 0.5;
  return 0.3;
}

function calculateHRZoneMatch(
  exerciseA: ExerciseDefinition,
  exerciseB: ExerciseDefinition
): number {
  // Compare intensity levels
  const intensityMap = { low: 1, moderate: 2, high: 3, very_high: 4 };
  const intensityA = intensityMap[exerciseA.intensity_level];
  const intensityB = intensityMap[exerciseB.intensity_level];
  const diff = Math.abs(intensityA - intensityB);

  if (diff === 0) return 1.0;
  if (diff === 1) return 0.8;
  if (diff === 2) return 0.5;
  return 0.3;
}

function calculateRIRMatchScore(
  exerciseA: ExerciseDefinition,
  exerciseB: ExerciseDefinition,
  profileA: UserProgressProfile,
  profileB: UserProgressProfile
): number {
  // Based on difficulty relative to ability
  const matchA = calculateAbilityMatch(exerciseA, profileA);
  const matchB = calculateAbilityMatch(exerciseB, profileB);

  // If both are well-matched to ability, RIR should be similar
  return Math.min(matchA, matchB);
}

function calculateTimeSyncScore(
  exerciseA: ExerciseDefinition,
  exerciseB: ExerciseDefinition
): number {
  const timeA = exerciseA.default_duration_seconds || (exerciseA.default_reps || 10) * 3;
  const timeB = exerciseB.default_duration_seconds || (exerciseB.default_reps || 10) * 3;

  const ratio = Math.min(timeA, timeB) / Math.max(timeA, timeB);
  return ratio;
}

function estimateTargetDifficulty(
  muscleGroup: MuscleGroup,
  profile: UserProgressProfile
): number {
  // Map muscle group to relevant strength score
  const abilities = profile.estimatedAbilities;

  let strengthScore: number;
  switch (muscleGroup) {
    case 'chest':
      strengthScore = abilities.chestStrength;
      break;
    case 'back':
      strengthScore = abilities.backStrength;
      break;
    case 'shoulders':
      strengthScore = abilities.shoulderStrength;
      break;
    case 'biceps':
      strengthScore = abilities.bicepStrength;
      break;
    case 'triceps':
      strengthScore = abilities.tricepStrength;
      break;
    case 'core':
      strengthScore = abilities.coreStrength;
      break;
    case 'quadriceps':
    case 'hamstrings':
    case 'glutes':
      strengthScore = (abilities.quadStrength + abilities.hamstringStrength + abilities.gluteStrength) / 3;
      break;
    case 'calves':
      strengthScore = abilities.calfStrength;
      break;
    default:
      strengthScore = 50;
  }

  // Map 0-100 strength score to 1-5 difficulty
  return 1 + (strengthScore / 100) * 4;
}

// ============================================
// WORKOUT GENERATION
// ============================================

/**
 * Generate a complete workout for a couple
 */
export function generateWorkout(input: PairingInput): GeneratedWorkout {
  const { personA, personB, coupleProfile, sessionContext } = input;

  // Calculate fitness gap
  const fitnessGap = calculateFitnessGap(personA, personB);

  // Filter exercises by constraints
  const { safeForA, safeForB } = filterExercisesByConstraints(
    ALL_EXERCISES,
    personA,
    personB,
    sessionContext.equipment,
    sessionContext.space
  );

  // Determine muscle groups to work
  const muscleGroups = sessionContext.focus || getFullBodyMuscleGroups(sessionContext.workoutType);

  // Generate pairs for each section
  const warmupPairs = generateWarmupPairs(safeForA, safeForB, personA, personB, coupleProfile);
  const mainPairs = generateMainWorkoutPairs(
    muscleGroups,
    safeForA,
    safeForB,
    personA,
    personB,
    coupleProfile,
    fitnessGap,
    sessionContext
  );
  const cooldownPairs = generateCooldownPairs(safeForA, safeForB, personA, personB, coupleProfile);

  // Calculate total duration
  const estimatedDuration = estimateWorkoutDuration(warmupPairs, mainPairs, cooldownPairs);

  return {
    id: `workout-${Date.now()}`,
    createdAt: new Date(),
    coupleId: coupleProfile.coupleId,
    warmup: warmupPairs,
    mainWorkout: mainPairs,
    cooldown: cooldownPairs,
    estimatedDuration,
    workoutType: sessionContext.workoutType,
    focusAreas: muscleGroups,
    difficulty: calculateOverallDifficulty(mainPairs),
    totalExercises: warmupPairs.length + mainPairs.length + cooldownPairs.length,
    partnerExerciseCount: [...warmupPairs, ...mainPairs, ...cooldownPairs].filter(p => p.isPartnerExercise).length,
    competitiveElementCount: [...warmupPairs, ...mainPairs, ...cooldownPairs].filter(p => p.interactionType === 'competitive').length,
  };
}

function getFullBodyMuscleGroups(workoutType: WorkoutType): MuscleGroup[] {
  switch (workoutType) {
    case 'strength':
      return ['chest', 'back', 'shoulders', 'quadriceps', 'core'];
    case 'hiit':
      return ['full_body', 'cardio', 'core'];
    case 'cardio':
      return ['cardio', 'quadriceps', 'core'];
    case 'flexibility':
      return ['full_body', 'core'];
    default:
      return ['chest', 'back', 'quadriceps', 'core'];
  }
}

function generateWarmupPairs(
  safeForA: ExerciseDefinition[],
  safeForB: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  coupleProfile: CoupleProgressProfile
): ExercisePair[] {
  const warmupExercises = ALL_EXERCISES.filter(
    e => e.category === 'warmup_dynamic' || e.category === 'warmup_cardio'
  );

  const safeWarmupA = warmupExercises.filter(e => safeForA.some(s => s.id === e.id));
  const safeWarmupB = warmupExercises.filter(e => safeForB.some(s => s.id === e.id));

  // Pick 3-4 warmup exercises both can do
  const common = safeWarmupA.filter(a => safeWarmupB.some(b => b.id === a.id));
  const selected = common.slice(0, 4);

  return selected.map(exercise => ({
    id: `warmup-${exercise.id}`,
    exerciseA: exercise,
    exerciseB: exercise,
    pairingStrategy: 'identical' as PairingStrategy,
    prescriptionA: calculatePrescription(exercise, profileA),
    prescriptionB: calculatePrescription(exercise, profileB),
    targetHRZone: 2,
    targetRIR: 4,
    targetDurationSeconds: exercise.default_duration_seconds || 30,
    isPartnerExercise: false,
    interactionType: 'mirror' as PartnerInteractionType,
    score: calculatePairScore(exercise, exercise, profileA, profileB, 'identical'),
  }));
}

function generateMainWorkoutPairs(
  muscleGroups: MuscleGroup[],
  safeForA: ExerciseDefinition[],
  safeForB: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  coupleProfile: CoupleProgressProfile,
  fitnessGap: number,
  sessionContext: PairingInput['sessionContext']
): ExercisePair[] {
  const allPairs: ExercisePair[] = [];

  for (const muscleGroup of muscleGroups) {
    const strategy = selectPairingStrategy(fitnessGap, coupleProfile, muscleGroup);

    const candidates = generateCandidatePairs(
      muscleGroup,
      profileA,
      profileB,
      coupleProfile,
      safeForA,
      safeForB,
      strategy
    );

    // Sort by score and pick top 1-2
    const sorted = candidates.sort((a, b) => b.score.totalScore - a.score.totalScore);
    const selected = sorted.slice(0, muscleGroup === 'core' ? 2 : 1);

    allPairs.push(...selected);
  }

  return allPairs;
}

function generateCooldownPairs(
  safeForA: ExerciseDefinition[],
  safeForB: ExerciseDefinition[],
  profileA: UserProgressProfile,
  profileB: UserProgressProfile,
  coupleProfile: CoupleProgressProfile
): ExercisePair[] {
  const cooldownExercises = ALL_EXERCISES.filter(
    e => e.category === 'cooldown_stretch' || e.category === 'cooldown_mobility' || e.category === 'flexibility_static'
  );

  const safeCooldownA = cooldownExercises.filter(e => safeForA.some(s => s.id === e.id));
  const safeCooldownB = cooldownExercises.filter(e => safeForB.some(s => s.id === e.id));

  const common = safeCooldownA.filter(a => safeCooldownB.some(b => b.id === a.id));
  const selected = common.slice(0, 3);

  return selected.map(exercise => ({
    id: `cooldown-${exercise.id}`,
    exerciseA: exercise,
    exerciseB: exercise,
    pairingStrategy: 'identical' as PairingStrategy,
    prescriptionA: calculatePrescription(exercise, profileA),
    prescriptionB: calculatePrescription(exercise, profileB),
    targetHRZone: 1,
    targetRIR: 5,
    targetDurationSeconds: exercise.default_duration_seconds || 30,
    isPartnerExercise: false,
    interactionType: 'mirror' as PartnerInteractionType,
    score: calculatePairScore(exercise, exercise, profileA, profileB, 'identical'),
  }));
}

function estimateWorkoutDuration(
  warmup: ExercisePair[],
  main: ExercisePair[],
  cooldown: ExercisePair[]
): number {
  let total = 0;

  // Warmup: ~5 minutes
  total += warmup.length * 1.5;

  // Main: depends on sets and rest
  for (const pair of main) {
    const sets = pair.prescriptionA.sets;
    const timePerSet = pair.targetDurationSeconds / 60;
    const restTime = 1; // 1 minute rest between sets
    total += sets * (timePerSet + restTime);
  }

  // Cooldown: ~5 minutes
  total += cooldown.length * 1.5;

  return Math.round(total);
}

function calculateOverallDifficulty(pairs: ExercisePair[]): 'beginner' | 'easy' | 'moderate' | 'hard' | 'advanced' {
  if (pairs.length === 0) return 'moderate';

  const avgDifficulty = pairs.reduce(
    (sum, p) => sum + (p.exerciseA.difficulty + p.exerciseB.difficulty) / 2,
    0
  ) / pairs.length;

  if (avgDifficulty <= 1.5) return 'beginner';
  if (avgDifficulty <= 2.5) return 'easy';
  if (avgDifficulty <= 3.5) return 'moderate';
  if (avgDifficulty <= 4.5) return 'hard';
  return 'advanced';
}

// ============================================
// EXPORTS
// ============================================

export {
  generateWorkout,
  calculateFitnessGap,
  selectPairingStrategy,
  checkConstraints,
  filterExercisesByConstraints,
};
