/**
 * Workout Service
 *
 * Bridge between UI and pairing logic system.
 * Manages workout generation, session state, and feedback collection.
 */

import { generateWorkout, type GeneratedWorkout, type ExercisePair, type PairingInput } from './pairing';
import {
  workoutLogger,
  WorkoutLogger,
  ExerciseLogBuilder,
  FeedbackBuilder,
  progressTracker,
  coupleTracker,
  type WorkoutLog,
  type ExerciseLog,
  type PostWorkoutFeedback,
  type UserProgressProfile,
  type CoupleProgressProfile,
} from './pairing';
import { ALL_EXERCISES, getExerciseById, type ExerciseDefinition } from '@/data/exercises/exercise-catalog';
import { WORKOUT_STRUCTURE, type WorkoutDuration } from '@/constants/app';

// ============================================
// TYPES
// ============================================

export interface WorkoutBlock {
  id: string;
  index: number;
  type: 'warmup' | 'exercise' | 'rest' | 'cooldown';
  duration: number;
  exerciseA: {
    id: string;
    name: string;
    reps: number | null;
    duration: number | null;
    cues: string[];
  };
  exerciseB: {
    id: string;
    name: string;
    reps: number | null;
    duration: number | null;
    cues: string[];
  };
  pairingStrategy: string;
  isPartnerExercise: boolean;
}

export interface PreparedWorkout {
  id: string;
  name: string;
  duration: WorkoutDuration;
  totalBlocks: number;
  blocks: WorkoutBlock[];
  muscleGroups: string[];
  estimatedCalories: number;
  difficultyA: number;
  difficultyB: number;
  pairingStrategiesUsed: string[];
}

export interface ExerciseFeedback {
  exerciseId: string;
  completed: boolean;
  actualReps: number | null;
  actualRIR: number;
  formQuality: 'poor' | 'okay' | 'good' | 'perfect';
  feltTooEasy: boolean;
  feltTooHard: boolean;
  feltPain: boolean;
  notes: string | null;
}

export interface WorkoutFeedback {
  overallDifficulty: 1 | 2 | 3 | 4 | 5;
  enjoymentRating: 1 | 2 | 3 | 4 | 5;
  partnerConnectionRating: 1 | 2 | 3 | 4 | 5;
  wouldRepeat: boolean;
  favoriteExercise: string | null;
  leastFavoriteExercise: string | null;
  comments: string | null;
  energyLevelAfter: 'depleted' | 'tired' | 'good' | 'energized';
  exerciseFeedback: ExerciseFeedback[];
}

export interface ActiveWorkoutState {
  preparedWorkout: PreparedWorkout;
  workoutLog: WorkoutLog;
  currentBlockIndex: number;
  startTime: Date;
  isPartnerA: boolean;
  completedBlocks: Set<number>;
  skippedBlocks: Set<number>;
}

// ============================================
// IN-MEMORY STORE (for current workout session)
// ============================================

let activeWorkout: ActiveWorkoutState | null = null;

// ============================================
// WORKOUT GENERATION
// ============================================

/**
 * Generate a workout for a couple based on their profiles and preferences
 */
export async function prepareWorkout(params: {
  duration: WorkoutDuration;
  focusArea: string;
  userAProfile: UserProgressProfile;
  userBProfile: UserProgressProfile;
  coupleProfile: CoupleProgressProfile;
  equipment: string[];
  space: 'small' | 'medium' | 'large';
}): Promise<PreparedWorkout> {
  const { duration, focusArea, userAProfile, userBProfile, coupleProfile, equipment, space } = params;
  const structure = WORKOUT_STRUCTURE[duration];

  // Map focus area to muscle groups
  const focusGroups = mapFocusToMuscleGroups(focusArea);

  // Generate workout using pairing engine
  const pairingInput: PairingInput = {
    personA: userAProfile,
    personB: userBProfile,
    coupleProfile,
    sessionContext: {
      duration,
      equipment,
      space,
      workoutType: focusArea.includes('cardio') ? 'cardio' : 'strength',
      focusMuscleGroups: focusGroups,
    },
  };

  const generatedWorkout = generateWorkout(pairingInput);

  // Convert to UI-friendly blocks
  const blocks = convertToBlocks(generatedWorkout, structure, duration);

  // Calculate difficulty levels
  const difficultyA = calculateAverageDifficulty(blocks, 'A');
  const difficultyB = calculateAverageDifficulty(blocks, 'B');

  // Get unique muscle groups
  const muscleGroups = [...new Set(
    blocks.flatMap(b => {
      const exA = getExerciseById(b.exerciseA.id);
      return exA?.primary_muscles || [];
    })
  )];

  // Get unique pairing strategies
  const pairingStrategiesUsed = [...new Set(
    blocks.filter(b => b.type === 'exercise').map(b => b.pairingStrategy)
  )];

  return {
    id: `workout_${Date.now()}`,
    name: generateWorkoutName(focusArea, duration),
    duration,
    totalBlocks: blocks.length,
    blocks,
    muscleGroups,
    estimatedCalories: duration * 8,
    difficultyA,
    difficultyB,
    pairingStrategiesUsed,
  };
}

/**
 * Generate a simple workout without full profiles (for demo/testing)
 */
export function prepareSimpleWorkout(params: {
  duration: WorkoutDuration;
  focusArea: string;
  fitnessLevelA: 'beginner' | 'intermediate' | 'advanced';
  fitnessLevelB: 'beginner' | 'intermediate' | 'advanced';
}): PreparedWorkout {
  const { duration, focusArea, fitnessLevelA, fitnessLevelB } = params;
  const structure = WORKOUT_STRUCTURE[duration];

  // Get exercises matching focus area
  const focusGroups = mapFocusToMuscleGroups(focusArea);
  const exercises = ALL_EXERCISES.filter(ex =>
    ex.primary_muscles.some(m => focusGroups.includes(m)) ||
    focusGroups.includes('full-body')
  );

  // Build blocks
  const blocks: WorkoutBlock[] = [];
  let blockIndex = 0;

  // Warmup blocks
  const warmupExercises = exercises.filter(ex => ex.movement_type === 'cardio' || ex.difficulty <= 2);
  for (let i = 0; i < structure.warmupBlocks; i++) {
    const exercise = warmupExercises[i % warmupExercises.length] || exercises[0];
    blocks.push(createBlock(blockIndex++, 'warmup', exercise, exercise, 60, fitnessLevelA, fitnessLevelB));
  }

  // Exercise blocks with paired exercises
  const strengthExercises = exercises.filter(ex => ex.movement_type === 'strength');
  for (let i = 0; i < structure.exerciseBlocks; i++) {
    const baseExercise = strengthExercises[i % strengthExercises.length] || exercises[0];
    const { exerciseA, exerciseB } = selectPairedExercises(baseExercise, fitnessLevelA, fitnessLevelB);

    blocks.push(createBlock(
      blockIndex++,
      'exercise',
      exerciseA,
      exerciseB,
      structure.exerciseDuration,
      fitnessLevelA,
      fitnessLevelB
    ));

    // Add rest block every 2-3 exercises
    if ((i + 1) % 3 === 0 && i < structure.exerciseBlocks - 1) {
      blocks.push(createRestBlock(blockIndex++, structure.restDuration));
    }
  }

  // Cooldown blocks
  const cooldownExercises = exercises.filter(ex => ex.movement_type === 'flexibility');
  for (let i = 0; i < structure.cooldownBlocks; i++) {
    const exercise = cooldownExercises[i % cooldownExercises.length] || exercises[0];
    blocks.push(createBlock(blockIndex++, 'cooldown', exercise, exercise, 60, fitnessLevelA, fitnessLevelB));
  }

  const muscleGroups = [...new Set(blocks.flatMap(b => {
    const ex = getExerciseById(b.exerciseA.id);
    return ex?.primary_muscles || [];
  }))];

  return {
    id: `workout_${Date.now()}`,
    name: generateWorkoutName(focusArea, duration),
    duration,
    totalBlocks: blocks.length,
    blocks,
    muscleGroups,
    estimatedCalories: duration * 8,
    difficultyA: fitnessLevelA === 'beginner' ? 2 : fitnessLevelA === 'intermediate' ? 3 : 4,
    difficultyB: fitnessLevelB === 'beginner' ? 2 : fitnessLevelB === 'intermediate' ? 3 : 4,
    pairingStrategiesUsed: ['adjacent_progression', 'same_exercise_different_reps'],
  };
}

// ============================================
// WORKOUT SESSION MANAGEMENT
// ============================================

/**
 * Start a workout session
 */
export function startWorkout(
  preparedWorkout: PreparedWorkout,
  coupleId: string,
  personAId: string,
  personBId: string,
  isPartnerA: boolean
): ActiveWorkoutState {
  const workoutLog = workoutLogger.startWorkout({
    coupleId,
    personAId,
    personBId,
    generatedWorkoutId: preparedWorkout.id,
    workoutType: 'strength',
  });

  activeWorkout = {
    preparedWorkout,
    workoutLog,
    currentBlockIndex: 0,
    startTime: new Date(),
    isPartnerA,
    completedBlocks: new Set(),
    skippedBlocks: new Set(),
  };

  return activeWorkout;
}

/**
 * Get current active workout
 */
export function getActiveWorkout(): ActiveWorkoutState | null {
  return activeWorkout;
}

/**
 * Mark a block as completed
 */
export function completeBlock(blockIndex: number): void {
  if (activeWorkout) {
    activeWorkout.completedBlocks.add(blockIndex);
  }
}

/**
 * Mark a block as skipped
 */
export function skipBlock(blockIndex: number): void {
  if (activeWorkout) {
    activeWorkout.skippedBlocks.add(blockIndex);
  }
}

/**
 * Advance to next block
 */
export function advanceToNextBlock(): number {
  if (activeWorkout) {
    activeWorkout.currentBlockIndex++;
    return activeWorkout.currentBlockIndex;
  }
  return 0;
}

/**
 * End workout session and prepare for feedback
 */
export function endWorkoutSession(): {
  preparedWorkout: PreparedWorkout;
  completedBlocks: number;
  totalBlocks: number;
  durationMinutes: number;
} | null {
  if (!activeWorkout) return null;

  const endTime = new Date();
  const durationMinutes = Math.round(
    (endTime.getTime() - activeWorkout.startTime.getTime()) / 60000
  );

  return {
    preparedWorkout: activeWorkout.preparedWorkout,
    completedBlocks: activeWorkout.completedBlocks.size,
    totalBlocks: activeWorkout.preparedWorkout.totalBlocks,
    durationMinutes,
  };
}

// ============================================
// FEEDBACK COLLECTION
// ============================================

/**
 * Submit workout feedback and save to storage
 */
export async function submitWorkoutFeedback(
  feedback: WorkoutFeedback,
  userProfile: UserProgressProfile,
  partnerProfile: UserProgressProfile,
  coupleProfile: CoupleProgressProfile
): Promise<{
  xpEarned: number;
  newStreak: number;
  progressionRecommendations: string[];
}> {
  if (!activeWorkout) {
    throw new Error('No active workout to submit feedback for');
  }

  const { workoutLog, preparedWorkout, isPartnerA } = activeWorkout;
  const personId = isPartnerA ? workoutLog.personAId : workoutLog.personBId;

  // Convert exercise feedback to exercise logs
  const exerciseLogs: ExerciseLog[] = feedback.exerciseFeedback.map(ef => ({
    exerciseId: ef.exerciseId,
    prescribedReps: null,
    prescribedWeight: null,
    prescribedDuration: null,
    actualReps: ef.actualReps,
    actualWeight: null,
    actualDuration: null,
    actualRIR: ef.actualRIR,
    formQuality: ef.formQuality,
    completed: ef.completed,
    feltTooEasy: ef.feltTooEasy,
    feltTooHard: ef.feltTooHard,
    feltPain: ef.feltPain,
    notes: ef.notes,
    timestamp: new Date(),
  }));

  // Add exercise logs to workout log
  let updatedLog = workoutLog;
  for (const log of exerciseLogs) {
    updatedLog = workoutLogger.logExercise(updatedLog, personId, log);
  }

  // Add post-workout feedback
  const postFeedback: PostWorkoutFeedback = {
    overallDifficulty: feedback.overallDifficulty,
    enjoymentRating: feedback.enjoymentRating,
    partnerConnectionRating: feedback.partnerConnectionRating,
    wouldRepeat: feedback.wouldRepeat,
    favoriteExercise: feedback.favoriteExercise || undefined,
    leastFavoriteExercise: feedback.leastFavoriteExercise || undefined,
    comments: feedback.comments || undefined,
    energyLevelAfter: feedback.energyLevelAfter,
  };

  updatedLog = workoutLogger.addFeedback(updatedLog, personId, postFeedback);

  // Save workout log
  await workoutLogger.completeWorkout(updatedLog);

  // Update user profile
  await progressTracker.updateAfterWorkout(userProfile, updatedLog, exerciseLogs);

  // Calculate XP and streak
  const baseXP = preparedWorkout.duration * 5;
  const completionBonus = Math.round(
    (activeWorkout.completedBlocks.size / preparedWorkout.totalBlocks) * 50
  );
  const xpEarned = baseXP + completionBonus;

  // Generate progression recommendations
  const progressionRecommendations: string[] = [];
  for (const ef of feedback.exerciseFeedback) {
    if (ef.feltTooEasy && ef.actualRIR >= 4) {
      const exercise = getExerciseById(ef.exerciseId);
      if (exercise?.harder_variation) {
        progressionRecommendations.push(
          `Ready to try ${exercise.harder_variation}!`
        );
      } else {
        progressionRecommendations.push(
          `Increase reps or weight for ${exercise?.name}`
        );
      }
    }
  }

  // Clear active workout
  activeWorkout = null;

  return {
    xpEarned,
    newStreak: userProfile.consistency.currentStreak + 1,
    progressionRecommendations,
  };
}

/**
 * Get exercises from the completed workout for feedback form
 */
export function getExercisesForFeedback(): {
  id: string;
  name: string;
  wasCompleted: boolean;
}[] {
  if (!activeWorkout) return [];

  const { preparedWorkout, completedBlocks, skippedBlocks, isPartnerA } = activeWorkout;

  return preparedWorkout.blocks
    .filter(b => b.type === 'exercise')
    .map((block, index) => ({
      id: isPartnerA ? block.exerciseA.id : block.exerciseB.id,
      name: isPartnerA ? block.exerciseA.name : block.exerciseB.name,
      wasCompleted: completedBlocks.has(block.index) && !skippedBlocks.has(block.index),
    }));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapFocusToMuscleGroups(focusArea: string): string[] {
  switch (focusArea.toLowerCase()) {
    case 'upper-body':
    case 'upper body':
      return ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
    case 'lower-body':
    case 'lower body':
      return ['quads', 'hamstrings', 'glutes', 'calves'];
    case 'core':
      return ['core', 'hip_flexors'];
    case 'cardio':
      return ['full-body'];
    case 'full-body':
    case 'full body':
    default:
      return ['chest', 'back', 'core', 'quads', 'glutes'];
  }
}

function generateWorkoutName(focusArea: string, duration: WorkoutDuration): string {
  const names: Record<string, string[]> = {
    'full-body': ['Full Body Blast', 'Total Body Power', 'Complete Circuit'],
    'upper-body': ['Upper Body Strength', 'Arms & Back Attack', 'Push & Pull'],
    'lower-body': ['Leg Day Power', 'Lower Body Burn', 'Glutes & Legs'],
    'core': ['Core Crusher', 'Ab Attack', 'Core Stability'],
    'cardio': ['Cardio Blast', 'Heart Pumper', 'HIIT Session'],
  };

  const options = names[focusArea.toLowerCase()] || names['full-body'];
  return options[Math.floor(Math.random() * options.length)];
}

function convertToBlocks(
  generatedWorkout: GeneratedWorkout,
  structure: typeof WORKOUT_STRUCTURE[WorkoutDuration],
  duration: WorkoutDuration
): WorkoutBlock[] {
  const blocks: WorkoutBlock[] = [];
  let index = 0;

  // Convert warmup
  for (const pair of generatedWorkout.warmup) {
    blocks.push(pairToBlock(index++, 'warmup', pair, 60));
  }

  // Convert main exercises
  for (let i = 0; i < generatedWorkout.exercisePairs.length; i++) {
    const pair = generatedWorkout.exercisePairs[i];
    blocks.push(pairToBlock(index++, 'exercise', pair, structure.exerciseDuration));

    // Add rest blocks periodically
    if ((i + 1) % 3 === 0 && i < generatedWorkout.exercisePairs.length - 1) {
      blocks.push({
        id: `block_${index}`,
        index: index++,
        type: 'rest',
        duration: structure.restDuration,
        exerciseA: { id: 'rest', name: 'Rest', reps: null, duration: structure.restDuration, cues: [] },
        exerciseB: { id: 'rest', name: 'Rest', reps: null, duration: structure.restDuration, cues: [] },
        pairingStrategy: 'rest',
        isPartnerExercise: false,
      });
    }
  }

  // Convert cooldown
  for (const pair of generatedWorkout.cooldown) {
    blocks.push(pairToBlock(index++, 'cooldown', pair, 60));
  }

  return blocks;
}

function pairToBlock(
  index: number,
  type: 'warmup' | 'exercise' | 'rest' | 'cooldown',
  pair: ExercisePair,
  duration: number
): WorkoutBlock {
  const exerciseA = getExerciseById(pair.exerciseAId);
  const exerciseB = getExerciseById(pair.exerciseBId);

  const isPartnerExercise = pair.pairingStrategy.includes('partner') ||
    pair.pairingStrategy.includes('cooperative') ||
    pair.pairingStrategy.includes('mirror');

  return {
    id: `block_${index}`,
    index,
    type,
    duration,
    exerciseA: {
      id: pair.exerciseAId,
      name: exerciseA?.name || 'Unknown Exercise',
      reps: pair.repsA || null,
      duration: pair.durationA || null,
      cues: exerciseA?.cues || [],
    },
    exerciseB: {
      id: pair.exerciseBId,
      name: exerciseB?.name || 'Unknown Exercise',
      reps: pair.repsB || null,
      duration: pair.durationB || null,
      cues: exerciseB?.cues || [],
    },
    pairingStrategy: pair.pairingStrategy,
    isPartnerExercise,
  };
}

function createBlock(
  index: number,
  type: 'warmup' | 'exercise' | 'rest' | 'cooldown',
  exerciseA: ExerciseDefinition,
  exerciseB: ExerciseDefinition,
  duration: number,
  levelA: string,
  levelB: string
): WorkoutBlock {
  const repsA = exerciseA.default_reps || null;
  const repsB = exerciseB.default_reps || null;

  return {
    id: `block_${index}`,
    index,
    type,
    duration,
    exerciseA: {
      id: exerciseA.id,
      name: exerciseA.name,
      reps: repsA,
      duration: repsA ? null : duration,
      cues: exerciseA.cues,
    },
    exerciseB: {
      id: exerciseB.id,
      name: exerciseB.name,
      reps: repsB,
      duration: repsB ? null : duration,
      cues: exerciseB.cues,
    },
    pairingStrategy: exerciseA.id === exerciseB.id ? 'identical' : 'adjacent_progression',
    isPartnerExercise: false,
  };
}

function createRestBlock(index: number, duration: number): WorkoutBlock {
  return {
    id: `block_${index}`,
    index,
    type: 'rest',
    duration,
    exerciseA: { id: 'rest', name: 'Rest', reps: null, duration, cues: [] },
    exerciseB: { id: 'rest', name: 'Rest', reps: null, duration, cues: [] },
    pairingStrategy: 'rest',
    isPartnerExercise: false,
  };
}

function selectPairedExercises(
  baseExercise: ExerciseDefinition,
  levelA: string,
  levelB: string
): { exerciseA: ExerciseDefinition; exerciseB: ExerciseDefinition } {
  let exerciseA = baseExercise;
  let exerciseB = baseExercise;

  // If different fitness levels, find appropriate variations
  if (levelA !== levelB) {
    const lowerLevel = levelA === 'beginner' || (levelA === 'intermediate' && levelB === 'advanced');

    if (lowerLevel) {
      // A needs easier, B gets base or harder
      if (baseExercise.easier_variation) {
        const easier = ALL_EXERCISES.find(
          e => e.name.toLowerCase() === baseExercise.easier_variation?.toLowerCase()
        );
        if (easier) exerciseA = easier;
      }
      if (levelB === 'advanced' && baseExercise.harder_variation) {
        const harder = ALL_EXERCISES.find(
          e => e.name.toLowerCase() === baseExercise.harder_variation?.toLowerCase()
        );
        if (harder) exerciseB = harder;
      }
    } else {
      // B needs easier, A gets base or harder
      if (baseExercise.easier_variation) {
        const easier = ALL_EXERCISES.find(
          e => e.name.toLowerCase() === baseExercise.easier_variation?.toLowerCase()
        );
        if (easier) exerciseB = easier;
      }
      if (levelA === 'advanced' && baseExercise.harder_variation) {
        const harder = ALL_EXERCISES.find(
          e => e.name.toLowerCase() === baseExercise.harder_variation?.toLowerCase()
        );
        if (harder) exerciseA = harder;
      }
    }
  }

  return { exerciseA, exerciseB };
}

function calculateAverageDifficulty(blocks: WorkoutBlock[], partner: 'A' | 'B'): number {
  const exerciseBlocks = blocks.filter(b => b.type === 'exercise');
  if (exerciseBlocks.length === 0) return 3;

  let totalDifficulty = 0;
  for (const block of exerciseBlocks) {
    const id = partner === 'A' ? block.exerciseA.id : block.exerciseB.id;
    const exercise = getExerciseById(id);
    totalDifficulty += exercise?.difficulty || 3;
  }

  return Math.round(totalDifficulty / exerciseBlocks.length);
}
