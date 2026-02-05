/**
 * Progression Rules
 *
 * Determines when to progress or regress exercises based on
 * performance data, feedback, and safety considerations.
 */

import type {
  ExerciseMastery,
  ExerciseLog,
  ExerciseProgressionRecommendation,
  ProgressionChangeType,
  UserProgressProfile,
} from './types';

import {
  getExerciseById,
  type ExerciseDefinition,
} from '@/data/exercises/exercise-catalog';

// ============================================
// PROGRESSION CRITERIA
// ============================================

export interface ProgressionCriteria {
  // Minimum times exercise must be performed before progression
  minimumTimesPerformed: number;

  // Minimum form quality required (1=poor, 2=okay, 3=good, 4=perfect)
  minimumFormQuality: number;

  // RIR threshold - if average RIR exceeds this, exercise is too easy
  rirTooEasyThreshold: number;

  // Number of consecutive sessions meeting criteria
  consecutiveSuccessesRequired: number;

  // Must have no pain reported in recent sessions
  painFreeSessionsRequired: number;

  // Completion rate threshold
  minimumCompletionRate: number;
}

export interface RegressionCriteria {
  // Number of failures to complete prescribed reps
  failuresToComplete: number;

  // Number of times marked "too hard"
  tooHardReports: number;

  // Number of sessions with poor form
  poorFormSessions: number;

  // Pain reported triggers immediate regression
  painReportedTriggersRegression: boolean;

  // RIR threshold - if RIR is consistently this low, too hard
  rirTooHardThreshold: number;
}

// Default criteria
export const DEFAULT_PROGRESSION_CRITERIA: ProgressionCriteria = {
  minimumTimesPerformed: 3,
  minimumFormQuality: 3, // "good"
  rirTooEasyThreshold: 3,
  consecutiveSuccessesRequired: 2,
  painFreeSessionsRequired: 3,
  minimumCompletionRate: 0.9,
};

export const DEFAULT_REGRESSION_CRITERIA: RegressionCriteria = {
  failuresToComplete: 2,
  tooHardReports: 2,
  poorFormSessions: 2,
  painReportedTriggersRegression: true,
  rirTooHardThreshold: 0,
};

// ============================================
// PROGRESSION ANALYSIS
// ============================================

/**
 * Analyze if an exercise should be progressed, regressed, or maintained
 */
export function analyzeExerciseProgression(
  mastery: ExerciseMastery,
  recentLogs: ExerciseLog[],
  exercise: ExerciseDefinition,
  progressionCriteria: ProgressionCriteria = DEFAULT_PROGRESSION_CRITERIA,
  regressionCriteria: RegressionCriteria = DEFAULT_REGRESSION_CRITERIA
): ExerciseProgressionRecommendation {
  // Check for regression signals first (safety)
  const regressionCheck = checkRegressionSignals(
    mastery,
    recentLogs,
    regressionCriteria
  );

  if (regressionCheck.shouldRegress) {
    return createRegressionRecommendation(
      exercise,
      regressionCheck.reason,
      regressionCheck.confidence
    );
  }

  // Check for progression signals
  const progressionCheck = checkProgressionSignals(
    mastery,
    recentLogs,
    progressionCriteria
  );

  if (progressionCheck.shouldProgress) {
    return createProgressionRecommendation(
      exercise,
      mastery,
      progressionCheck.reason,
      progressionCheck.confidence
    );
  }

  // Default: maintain current level
  return {
    exerciseId: exercise.id,
    change: 'maintain',
    reason: 'Performance is appropriate for current level',
    confidence: 0.8,
  };
}

// ============================================
// REGRESSION CHECKS
// ============================================

interface RegressionSignals {
  shouldRegress: boolean;
  reason: string;
  confidence: number;
}

function checkRegressionSignals(
  mastery: ExerciseMastery,
  recentLogs: ExerciseLog[],
  criteria: RegressionCriteria
): RegressionSignals {
  const recent5 = recentLogs.slice(-5);

  // Check for pain (immediate regression)
  const painReported = recent5.some(log => log.feltPain);
  if (painReported && criteria.painReportedTriggersRegression) {
    return {
      shouldRegress: true,
      reason: 'Pain was reported during exercise',
      confidence: 1.0,
    };
  }

  // Check for failures to complete
  const failureCount = recent5.filter(log => !log.completed).length;
  if (failureCount >= criteria.failuresToComplete) {
    return {
      shouldRegress: true,
      reason: `Failed to complete prescribed reps ${failureCount} times`,
      confidence: 0.9,
    };
  }

  // Check for "too hard" reports
  const tooHardCount = recent5.filter(log => log.feltTooHard).length;
  if (tooHardCount >= criteria.tooHardReports) {
    return {
      shouldRegress: true,
      reason: `Marked as "too hard" ${tooHardCount} times`,
      confidence: 0.85,
    };
  }

  // Check for poor form
  const poorFormCount = recent5.filter(log => log.formQuality === 'poor').length;
  if (poorFormCount >= criteria.poorFormSessions) {
    return {
      shouldRegress: true,
      reason: `Form breakdown in ${poorFormCount} sessions`,
      confidence: 0.8,
    };
  }

  // Check for consistently low RIR (going to failure)
  const avgRIR = calculateAverageRIR(recent5);
  if (avgRIR <= criteria.rirTooHardThreshold && recent5.length >= 3) {
    return {
      shouldRegress: true,
      reason: `Consistently reaching failure (avg RIR: ${avgRIR.toFixed(1)})`,
      confidence: 0.75,
    };
  }

  return {
    shouldRegress: false,
    reason: '',
    confidence: 0,
  };
}

// ============================================
// PROGRESSION CHECKS
// ============================================

interface ProgressionSignals {
  shouldProgress: boolean;
  reason: string;
  confidence: number;
  progressionType: 'variation' | 'reps' | 'weight' | 'sets';
}

function checkProgressionSignals(
  mastery: ExerciseMastery,
  recentLogs: ExerciseLog[],
  criteria: ProgressionCriteria
): ProgressionSignals {
  const defaultReturn: ProgressionSignals = {
    shouldProgress: false,
    reason: '',
    confidence: 0,
    progressionType: 'variation',
  };

  // Must have performed exercise enough times
  if (mastery.timesPerformed < criteria.minimumTimesPerformed) {
    return defaultReturn;
  }

  const recent5 = recentLogs.slice(-5);
  if (recent5.length < criteria.consecutiveSuccessesRequired) {
    return defaultReturn;
  }

  // Check form quality
  const avgFormQuality = calculateAverageFormQuality(recent5);
  if (avgFormQuality < criteria.minimumFormQuality) {
    return defaultReturn;
  }

  // Check completion rate
  const completionRate = recent5.filter(log => log.completed).length / recent5.length;
  if (completionRate < criteria.minimumCompletionRate) {
    return defaultReturn;
  }

  // Check for pain-free sessions
  const recentPainFree = recent5.slice(-criteria.painFreeSessionsRequired);
  const hasPain = recentPainFree.some(log => log.feltPain);
  if (hasPain) {
    return defaultReturn;
  }

  // Check RIR - is exercise too easy?
  const avgRIR = calculateAverageRIR(recent5);
  if (avgRIR > criteria.rirTooEasyThreshold) {
    // Check consecutive successes
    const consecutiveEasy = countConsecutiveEasySessions(
      recent5,
      criteria.rirTooEasyThreshold
    );

    if (consecutiveEasy >= criteria.consecutiveSuccessesRequired) {
      return {
        shouldProgress: true,
        reason: `Consistently completing with ${avgRIR.toFixed(1)} RIR (too easy)`,
        confidence: Math.min(0.95, 0.7 + consecutiveEasy * 0.1),
        progressionType: determineProgressionType(mastery, avgRIR),
      };
    }
  }

  // Check for explicit "too easy" feedback
  const tooEasyCount = recent5.filter(log => log.feltTooEasy).length;
  if (tooEasyCount >= 2) {
    return {
      shouldProgress: true,
      reason: `User marked as "too easy" ${tooEasyCount} times`,
      confidence: 0.85,
      progressionType: 'variation',
    };
  }

  return defaultReturn;
}

// ============================================
// RECOMMENDATION CREATORS
// ============================================

function createRegressionRecommendation(
  exercise: ExerciseDefinition,
  reason: string,
  confidence: number
): ExerciseProgressionRecommendation {
  // Try to find easier variation
  if (exercise.easier_variation) {
    const easierExercise = findExerciseByName(exercise.easier_variation);
    if (easierExercise) {
      return {
        exerciseId: exercise.id,
        change: 'regress_variation',
        newExerciseId: easierExercise.id,
        reason,
        confidence,
      };
    }
  }

  // If no easier variation, reduce reps
  return {
    exerciseId: exercise.id,
    change: 'reduce_reps',
    newReps: Math.max(5, (exercise.default_reps || 10) - 3),
    reason: `${reason}. No easier variation available, reducing reps.`,
    confidence,
  };
}

function createProgressionRecommendation(
  exercise: ExerciseDefinition,
  mastery: ExerciseMastery,
  reason: string,
  confidence: number
): ExerciseProgressionRecommendation {
  // Check if there's a harder variation available
  if (exercise.harder_variation) {
    const harderExercise = findExerciseByName(exercise.harder_variation);
    if (harderExercise && mastery.formReadyForProgression) {
      return {
        exerciseId: exercise.id,
        change: 'progress_variation',
        newExerciseId: harderExercise.id,
        reason,
        confidence,
      };
    }
  }

  // If form isn't ready for new variation, add reps first
  if (!mastery.formReadyForProgression) {
    return {
      exerciseId: exercise.id,
      change: 'add_reps',
      newReps: (exercise.default_reps || 10) + 2,
      reason: `${reason}. Form not yet ready for harder variation, adding reps.`,
      confidence: confidence * 0.9,
    };
  }

  // If at max variation, add reps or weight
  if (exercise.equipment_required.some(e => e.includes('dumbbell'))) {
    return {
      exerciseId: exercise.id,
      change: 'add_weight',
      reason: `${reason}. At hardest variation, increasing weight.`,
      confidence,
    };
  }

  return {
    exerciseId: exercise.id,
    change: 'add_reps',
    newReps: (exercise.default_reps || 10) + 3,
    reason: `${reason}. Adding reps for progressive overload.`,
    confidence,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateAverageRIR(logs: ExerciseLog[]): number {
  if (logs.length === 0) return 2;
  const total = logs.reduce((sum, log) => sum + log.actualRIR, 0);
  return total / logs.length;
}

function calculateAverageFormQuality(logs: ExerciseLog[]): number {
  if (logs.length === 0) return 2;
  const qualityMap = { poor: 1, okay: 2, good: 3, perfect: 4 };
  const total = logs.reduce((sum, log) => sum + qualityMap[log.formQuality], 0);
  return total / logs.length;
}

function countConsecutiveEasySessions(
  logs: ExerciseLog[],
  rirThreshold: number
): number {
  let count = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].actualRIR > rirThreshold && logs[i].completed) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function determineProgressionType(
  mastery: ExerciseMastery,
  avgRIR: number
): 'variation' | 'reps' | 'weight' | 'sets' {
  // If form is excellent and RIR is very high, try harder variation
  if (mastery.averageFormQuality >= 3.5 && avgRIR >= 4) {
    return 'variation';
  }

  // If good form but moderate RIR, add reps
  if (mastery.averageFormQuality >= 3) {
    return 'reps';
  }

  // Default to reps
  return 'reps';
}

function findExerciseByName(name: string): ExerciseDefinition | undefined {
  // This is a simple implementation - in production would use a proper index
  const { ALL_EXERCISES } = require('@/data/exercises/exercise-catalog');
  return ALL_EXERCISES.find(
    (e: ExerciseDefinition) =>
      e.name.toLowerCase() === name.toLowerCase()
  );
}

// ============================================
// BATCH ANALYSIS
// ============================================

/**
 * Analyze all exercises for a user and return progression recommendations
 */
export function analyzeAllProgressions(
  profile: UserProgressProfile,
  recentWorkoutLogs: ExerciseLog[][],
  exerciseCatalog: ExerciseDefinition[]
): ExerciseProgressionRecommendation[] {
  const recommendations: ExerciseProgressionRecommendation[] = [];

  // Group logs by exercise
  const logsByExercise = new Map<string, ExerciseLog[]>();
  recentWorkoutLogs.flat().forEach(log => {
    const existing = logsByExercise.get(log.exerciseId) || [];
    existing.push(log);
    logsByExercise.set(log.exerciseId, existing);
  });

  // Analyze each exercise the user has mastery data for
  for (const [exerciseId, mastery] of Object.entries(profile.exerciseMastery)) {
    const exercise = exerciseCatalog.find(e => e.id === exerciseId);
    if (!exercise) continue;

    const logs = logsByExercise.get(exerciseId) || [];
    if (logs.length === 0) continue;

    const recommendation = analyzeExerciseProgression(
      mastery,
      logs,
      exercise
    );

    // Only include non-maintain recommendations
    if (recommendation.change !== 'maintain') {
      recommendations.push(recommendation);
    }
  }

  return recommendations;
}

// ============================================
// PROGRESSION CHAIN HELPERS
// ============================================

/**
 * Get the full progression chain for an exercise
 */
export function getProgressionChain(
  exercise: ExerciseDefinition,
  exerciseCatalog: ExerciseDefinition[]
): ExerciseDefinition[] {
  const chain: ExerciseDefinition[] = [];

  // Find all easier variations
  let current = exercise;
  while (current.easier_variation) {
    const easier = exerciseCatalog.find(
      e => e.name.toLowerCase() === current.easier_variation?.toLowerCase()
    );
    if (easier && !chain.includes(easier)) {
      chain.unshift(easier);
      current = easier;
    } else {
      break;
    }
  }

  // Add current exercise
  chain.push(exercise);

  // Find all harder variations
  current = exercise;
  while (current.harder_variation) {
    const harder = exerciseCatalog.find(
      e => e.name.toLowerCase() === current.harder_variation?.toLowerCase()
    );
    if (harder && !chain.includes(harder)) {
      chain.push(harder);
      current = harder;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Find the appropriate exercise in a chain for a given difficulty level
 */
export function findExerciseForDifficulty(
  chain: ExerciseDefinition[],
  targetDifficulty: number
): ExerciseDefinition {
  // Find closest match
  let best = chain[0];
  let bestDiff = Math.abs(chain[0].difficulty - targetDifficulty);

  for (const exercise of chain) {
    const diff = Math.abs(exercise.difficulty - targetDifficulty);
    if (diff < bestDiff) {
      best = exercise;
      bestDiff = diff;
    }
  }

  return best;
}
