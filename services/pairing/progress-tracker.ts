/**
 * Progress Tracker Service
 *
 * Tracks and updates individual user progress profiles
 * based on workout performance and feedback.
 */

import type {
  UserProgressProfile,
  ExerciseMastery,
  EstimatedAbilities,
  ProgressionRate,
  ConsistencyMetrics,
  RecoveryStatus,
  FatigueLevel,
  WorkoutLog,
  ExerciseLog,
  MuscleGroup,
  AbilityType,
} from './types';

import { getExerciseById, type ExerciseDefinition } from '@/data/exercises/exercise-catalog';

// ============================================
// STORAGE INTERFACE
// ============================================

export interface ProgressProfileStorage {
  saveProfile(profile: UserProgressProfile): Promise<void>;
  getProfile(userId: string): Promise<UserProgressProfile | null>;
  deleteProfile(userId: string): Promise<void>;
}

// ============================================
// IN-MEMORY STORAGE (for development/testing)
// ============================================

const profileStore = new Map<string, UserProgressProfile>();

export const inMemoryProfileStorage: ProgressProfileStorage = {
  async saveProfile(profile: UserProgressProfile): Promise<void> {
    profileStore.set(profile.userId, profile);
  },

  async getProfile(userId: string): Promise<UserProgressProfile | null> {
    return profileStore.get(userId) || null;
  },

  async deleteProfile(userId: string): Promise<void> {
    profileStore.delete(userId);
  },
};

// ============================================
// PROGRESS TRACKER CLASS
// ============================================

export class ProgressTracker {
  private storage: ProgressProfileStorage;

  constructor(storage: ProgressProfileStorage = inMemoryProfileStorage) {
    this.storage = storage;
  }

  /**
   * Create initial profile from onboarding data
   */
  createInitialProfile(params: {
    userId: string;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    injuries: string[];
    goals: string[];
  }): UserProgressProfile {
    const baseAbility = this.getBaseAbility(params.fitnessLevel);

    return {
      userId: params.userId,
      estimatedAbilities: this.createInitialAbilities(baseAbility),
      progressionRate: {
        overall: 'improving',
        byMuscleGroup: {},
      },
      exerciseMastery: {},
      consistency: {
        currentStreak: 0,
        longestStreak: 0,
        workoutsThisWeek: 0,
        workoutsThisMonth: 0,
        averageWorkoutsPerWeek: 0,
        lastWorkoutDate: null,
      },
      recoveryStatus: this.createInitialRecoveryStatus(),
      injuries: params.injuries,
      learnedPreferences: {
        preferredExercises: [],
        dislikedExercises: [],
        preferredWorkoutDuration: 30,
        preferredIntensity: 'moderate',
        bestPerformanceTimeOfDay: null,
      },
      goals: params.goals,
      lastUpdated: new Date(),
    };
  }

  /**
   * Update profile after a workout
   */
  async updateAfterWorkout(
    profile: UserProgressProfile,
    workout: WorkoutLog,
    exerciseLogs: ExerciseLog[]
  ): Promise<UserProgressProfile> {
    let updatedProfile = { ...profile };

    // Update exercise mastery for each exercise performed
    for (const log of exerciseLogs) {
      updatedProfile = this.updateExerciseMastery(updatedProfile, log);
    }

    // Update consistency metrics
    updatedProfile = this.updateConsistency(updatedProfile, workout);

    // Update recovery status (muscle fatigue)
    updatedProfile = this.updateRecoveryStatus(updatedProfile, exerciseLogs);

    // Update estimated abilities based on performance
    updatedProfile = this.updateAbilities(updatedProfile, exerciseLogs);

    // Update progression rate
    updatedProfile = this.updateProgressionRate(updatedProfile);

    // Update learned preferences from feedback
    if (profile.userId === workout.personAId && workout.personAFeedback) {
      updatedProfile = this.updatePreferences(updatedProfile, workout.personAFeedback, exerciseLogs);
    } else if (profile.userId === workout.personBId && workout.personBFeedback) {
      updatedProfile = this.updatePreferences(updatedProfile, workout.personBFeedback, exerciseLogs);
    }

    updatedProfile.lastUpdated = new Date();
    await this.storage.saveProfile(updatedProfile);

    return updatedProfile;
  }

  /**
   * Get or create a profile
   */
  async getOrCreateProfile(
    userId: string,
    defaults?: Partial<UserProgressProfile>
  ): Promise<UserProgressProfile> {
    const existing = await this.storage.getProfile(userId);
    if (existing) return existing;

    const newProfile = this.createInitialProfile({
      userId,
      fitnessLevel: 'beginner',
      injuries: [],
      goals: [],
      ...defaults,
    });

    await this.storage.saveProfile(newProfile);
    return newProfile;
  }

  /**
   * Save a profile
   */
  async saveProfile(profile: UserProgressProfile): Promise<void> {
    await this.storage.saveProfile(profile);
  }

  // ============================================
  // PRIVATE HELPERS - MASTERY
  // ============================================

  private updateExerciseMastery(
    profile: UserProgressProfile,
    log: ExerciseLog
  ): UserProgressProfile {
    const existing = profile.exerciseMastery[log.exerciseId] || {
      exerciseId: log.exerciseId,
      timesPerformed: 0,
      averageRIR: 2,
      averageFormQuality: 2.5,
      lastPerformed: null,
      personalBest: null,
      formReadyForProgression: false,
      progressionUnlockedDate: null,
    };

    const formQualityMap = { poor: 1, okay: 2, good: 3, perfect: 4 };
    const newFormQuality = formQualityMap[log.formQuality];

    // Running average calculation
    const newAvgRIR =
      (existing.averageRIR * existing.timesPerformed + log.actualRIR) /
      (existing.timesPerformed + 1);

    const newAvgForm =
      (existing.averageFormQuality * existing.timesPerformed + newFormQuality) /
      (existing.timesPerformed + 1);

    // Update personal best (reps or weight)
    let personalBest = existing.personalBest;
    if (log.actualReps && (!personalBest || log.actualReps > personalBest.reps)) {
      personalBest = {
        reps: log.actualReps,
        weight: log.actualWeight || null,
        date: new Date(),
      };
    }

    // Check if form is ready for progression
    const formReadyForProgression =
      newAvgForm >= 3 && // "good" or better
      existing.timesPerformed >= 2 && // done at least a few times
      !log.feltPain;

    const updatedMastery: ExerciseMastery = {
      exerciseId: log.exerciseId,
      timesPerformed: existing.timesPerformed + 1,
      averageRIR: Math.round(newAvgRIR * 10) / 10,
      averageFormQuality: Math.round(newAvgForm * 10) / 10,
      lastPerformed: new Date(),
      personalBest,
      formReadyForProgression,
      progressionUnlockedDate: formReadyForProgression && !existing.formReadyForProgression
        ? new Date()
        : existing.progressionUnlockedDate,
    };

    return {
      ...profile,
      exerciseMastery: {
        ...profile.exerciseMastery,
        [log.exerciseId]: updatedMastery,
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS - CONSISTENCY
  // ============================================

  private updateConsistency(
    profile: UserProgressProfile,
    workout: WorkoutLog
  ): UserProgressProfile {
    const now = new Date();
    const lastWorkout = profile.consistency.lastWorkoutDate;

    // Calculate streak
    let newStreak = profile.consistency.currentStreak;
    if (lastWorkout) {
      const daysSinceLastWorkout = Math.floor(
        (now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastWorkout <= 3) {
        // Within reasonable gap, continue streak
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Calculate workouts this week
    const startOfWeek = getStartOfWeek(now);
    const workoutsThisWeek =
      lastWorkout && lastWorkout >= startOfWeek
        ? profile.consistency.workoutsThisWeek + 1
        : 1;

    // Calculate workouts this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const workoutsThisMonth =
      lastWorkout && lastWorkout >= startOfMonth
        ? profile.consistency.workoutsThisMonth + 1
        : 1;

    // Update average (simple running average)
    const avgWorkouts =
      profile.consistency.averageWorkoutsPerWeek > 0
        ? (profile.consistency.averageWorkoutsPerWeek * 3 + workoutsThisWeek) / 4
        : workoutsThisWeek;

    return {
      ...profile,
      consistency: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, profile.consistency.longestStreak),
        workoutsThisWeek,
        workoutsThisMonth,
        averageWorkoutsPerWeek: Math.round(avgWorkouts * 10) / 10,
        lastWorkoutDate: now,
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS - RECOVERY
  // ============================================

  private updateRecoveryStatus(
    profile: UserProgressProfile,
    exerciseLogs: ExerciseLog[]
  ): UserProgressProfile {
    const updatedFatigue = { ...profile.recoveryStatus.fatigueByMuscle };

    for (const log of exerciseLogs) {
      const exercise = getExerciseById(log.exerciseId);
      if (!exercise) continue;

      // Add fatigue to primary muscles
      for (const muscle of exercise.primary_muscles) {
        const current = updatedFatigue[muscle as MuscleGroup] || 0;
        const added = this.calculateFatigueAdded(log, true);
        updatedFatigue[muscle as MuscleGroup] = Math.min(100, current + added);
      }

      // Add less fatigue to secondary muscles
      for (const muscle of exercise.secondary_muscles) {
        const current = updatedFatigue[muscle as MuscleGroup] || 0;
        const added = this.calculateFatigueAdded(log, false);
        updatedFatigue[muscle as MuscleGroup] = Math.min(100, current + added);
      }
    }

    // Determine overall fatigue level
    const fatigueValues = Object.values(updatedFatigue);
    const avgFatigue =
      fatigueValues.length > 0
        ? fatigueValues.reduce((a, b) => a + b, 0) / fatigueValues.length
        : 0;

    let overallFatigue: FatigueLevel = 'fresh';
    if (avgFatigue > 70) overallFatigue = 'exhausted';
    else if (avgFatigue > 50) overallFatigue = 'fatigued';
    else if (avgFatigue > 25) overallFatigue = 'moderate';

    return {
      ...profile,
      recoveryStatus: {
        ...profile.recoveryStatus,
        fatigueByMuscle: updatedFatigue,
        overallFatigue,
        lastRecoveryUpdate: new Date(),
      },
    };
  }

  private calculateFatigueAdded(log: ExerciseLog, isPrimary: boolean): number {
    // Base fatigue from doing the exercise
    let fatigue = isPrimary ? 20 : 10;

    // More fatigue if worked hard (low RIR)
    if (log.actualRIR <= 1) fatigue += 15;
    else if (log.actualRIR <= 2) fatigue += 10;
    else if (log.actualRIR <= 3) fatigue += 5;

    // More fatigue if more reps
    if (log.actualReps && log.actualReps > 12) {
      fatigue += 5;
    }

    return fatigue;
  }

  // ============================================
  // PRIVATE HELPERS - ABILITIES
  // ============================================

  private updateAbilities(
    profile: UserProgressProfile,
    exerciseLogs: ExerciseLog[]
  ): UserProgressProfile {
    const updatedAbilities = { ...profile.estimatedAbilities };

    for (const log of exerciseLogs) {
      const exercise = getExerciseById(log.exerciseId);
      if (!exercise) continue;

      // Update strength for strength exercises
      if (exercise.movement_type === 'strength') {
        for (const muscle of exercise.primary_muscles) {
          const muscleKey = muscle as MuscleGroup;
          const current = updatedAbilities.strength[muscleKey] || 50;
          const adjustment = this.calculateAbilityAdjustment(log, exercise);
          updatedAbilities.strength[muscleKey] = clamp(current + adjustment, 0, 100);
        }
      }

      // Update flexibility for flexibility exercises
      if (exercise.movement_type === 'flexibility') {
        for (const muscle of exercise.primary_muscles) {
          const muscleKey = muscle as MuscleGroup;
          const current = updatedAbilities.flexibility[muscleKey] || 50;
          const adjustment = this.calculateAbilityAdjustment(log, exercise) * 0.5;
          updatedAbilities.flexibility[muscleKey] = clamp(current + adjustment, 0, 100);
        }
      }

      // Update cardio endurance for cardio/HIIT
      if (exercise.movement_type === 'cardio' || exercise.movement_type === 'plyometric') {
        const current = updatedAbilities.cardioEndurance;
        const adjustment = this.calculateAbilityAdjustment(log, exercise) * 0.3;
        updatedAbilities.cardioEndurance = clamp(current + adjustment, 0, 100);
      }
    }

    return {
      ...profile,
      estimatedAbilities: updatedAbilities,
    };
  }

  private calculateAbilityAdjustment(log: ExerciseLog, exercise: ExerciseDefinition): number {
    // Base adjustment based on difficulty and performance
    let adjustment = 0;

    // If exercise was too easy (high RIR), slight positive adjustment
    if (log.actualRIR >= 4 && log.completed) {
      adjustment = 0.5;
    }
    // If exercise was appropriate difficulty (RIR 1-3), good adjustment
    else if (log.actualRIR >= 1 && log.actualRIR <= 3 && log.completed) {
      adjustment = 1.0;
    }
    // If struggling (RIR 0), still learning
    else if (log.actualRIR === 0 && log.completed) {
      adjustment = 0.5;
    }
    // If couldn't complete, no adjustment or slight decrease
    else if (!log.completed) {
      adjustment = -0.5;
    }

    // Bonus for good form
    if (log.formQuality === 'perfect') adjustment += 0.3;
    if (log.formQuality === 'good') adjustment += 0.1;

    // Scale by exercise difficulty
    adjustment *= (exercise.difficulty / 5);

    return adjustment;
  }

  // ============================================
  // PRIVATE HELPERS - PROGRESSION RATE
  // ============================================

  private updateProgressionRate(profile: UserProgressProfile): UserProgressProfile {
    // Analyze recent mastery changes to determine progression rate
    const masteryEntries = Object.values(profile.exerciseMastery);

    if (masteryEntries.length < 3) {
      // Not enough data yet
      return profile;
    }

    // Count exercises where user is improving
    let improving = 0;
    let declining = 0;

    for (const mastery of masteryEntries) {
      if (mastery.timesPerformed >= 3) {
        if (mastery.averageRIR > 3 && mastery.averageFormQuality >= 3) {
          // Exercise is getting too easy - sign of improvement
          improving++;
        } else if (mastery.averageRIR < 1 || mastery.averageFormQuality < 2) {
          // Struggling - sign of decline or overreaching
          declining++;
        }
      }
    }

    let overall: ProgressionRate = 'plateau';
    if (improving > declining * 2) overall = 'improving';
    if (declining > improving * 2) overall = 'declining';

    return {
      ...profile,
      progressionRate: {
        ...profile.progressionRate,
        overall,
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS - PREFERENCES
  // ============================================

  private updatePreferences(
    profile: UserProgressProfile,
    feedback: any,
    exerciseLogs: ExerciseLog[]
  ): UserProgressProfile {
    const prefs = { ...profile.learnedPreferences };

    // Add favorite exercise
    if (feedback.favoriteExercise) {
      if (!prefs.preferredExercises.includes(feedback.favoriteExercise)) {
        prefs.preferredExercises = [
          ...prefs.preferredExercises,
          feedback.favoriteExercise,
        ].slice(-10); // Keep last 10
      }
    }

    // Add disliked exercise
    if (feedback.leastFavoriteExercise) {
      if (!prefs.dislikedExercises.includes(feedback.leastFavoriteExercise)) {
        prefs.dislikedExercises = [
          ...prefs.dislikedExercises,
          feedback.leastFavoriteExercise,
        ].slice(-10);
      }
    }

    // Learn preferred intensity
    if (feedback.overallDifficulty) {
      if (feedback.overallDifficulty <= 2) {
        prefs.preferredIntensity = 'light';
      } else if (feedback.overallDifficulty >= 4) {
        prefs.preferredIntensity = 'intense';
      } else {
        prefs.preferredIntensity = 'moderate';
      }
    }

    return {
      ...profile,
      learnedPreferences: prefs,
    };
  }

  // ============================================
  // INITIALIZATION HELPERS
  // ============================================

  private getBaseAbility(fitnessLevel: 'beginner' | 'intermediate' | 'advanced'): number {
    switch (fitnessLevel) {
      case 'beginner':
        return 30;
      case 'intermediate':
        return 55;
      case 'advanced':
        return 80;
    }
  }

  private createInitialAbilities(baseAbility: number): EstimatedAbilities {
    const createMuscleMap = (base: number): Record<MuscleGroup, number> => ({
      chest: base,
      back: base,
      shoulders: base,
      biceps: base,
      triceps: base,
      core: base,
      glutes: base,
      quads: base,
      hamstrings: base,
      calves: base,
      hip_flexors: base,
      forearms: base,
    });

    return {
      strength: createMuscleMap(baseAbility),
      flexibility: createMuscleMap(baseAbility * 0.8),
      cardioEndurance: baseAbility,
      balance: baseAbility * 0.9,
    };
  }

  private createInitialRecoveryStatus(): RecoveryStatus {
    return {
      fatigueByMuscle: {},
      overallFatigue: 'fresh',
      recommendedRestDays: 1,
      lastRecoveryUpdate: new Date(),
    };
  }

  // ============================================
  // RECOVERY DECAY (call periodically)
  // ============================================

  /**
   * Apply recovery decay (muscles recover over time)
   * Call this when loading a profile or periodically
   */
  applyRecoveryDecay(profile: UserProgressProfile): UserProgressProfile {
    const now = new Date();
    const lastUpdate = profile.recoveryStatus.lastRecoveryUpdate;
    const hoursSinceUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate < 1) {
      return profile; // Too soon to apply decay
    }

    // Recovery rate: ~25% per 24 hours
    const recoveryMultiplier = Math.pow(0.75, hoursSinceUpdate / 24);

    const updatedFatigue: Record<string, number> = {};
    for (const [muscle, fatigue] of Object.entries(
      profile.recoveryStatus.fatigueByMuscle
    )) {
      updatedFatigue[muscle] = Math.max(0, fatigue * recoveryMultiplier);
    }

    // Determine new overall fatigue
    const fatigueValues = Object.values(updatedFatigue);
    const avgFatigue =
      fatigueValues.length > 0
        ? fatigueValues.reduce((a, b) => a + b, 0) / fatigueValues.length
        : 0;

    let overallFatigue: FatigueLevel = 'fresh';
    if (avgFatigue > 70) overallFatigue = 'exhausted';
    else if (avgFatigue > 50) overallFatigue = 'fatigued';
    else if (avgFatigue > 25) overallFatigue = 'moderate';

    return {
      ...profile,
      recoveryStatus: {
        fatigueByMuscle: updatedFatigue as Record<MuscleGroup, number>,
        overallFatigue,
        recommendedRestDays: avgFatigue > 60 ? 2 : avgFatigue > 30 ? 1 : 0,
        lastRecoveryUpdate: now,
      },
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Default instance
export const progressTracker = new ProgressTracker();
