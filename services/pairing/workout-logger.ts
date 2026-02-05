/**
 * Workout Logger Service
 *
 * Handles logging workout data including exercise performance,
 * subjective feedback, and physiological metrics.
 */

import type {
  WorkoutLog,
  ExerciseLog,
  PostWorkoutFeedback,
} from './types';

// ============================================
// STORAGE INTERFACE
// ============================================

/**
 * Storage adapter interface for workout logs
 * Allows different storage implementations (AsyncStorage, SQLite, etc.)
 */
export interface WorkoutLogStorage {
  saveWorkout(log: WorkoutLog): Promise<void>;
  getWorkout(workoutId: string): Promise<WorkoutLog | null>;
  getWorkoutsByUser(userId: string, limit?: number): Promise<WorkoutLog[]>;
  getWorkoutsByCouple(coupleId: string, limit?: number): Promise<WorkoutLog[]>;
  getRecentExerciseLogs(
    userId: string,
    exerciseId: string,
    limit?: number
  ): Promise<ExerciseLog[]>;
  deleteWorkout(workoutId: string): Promise<void>;
}

// ============================================
// IN-MEMORY STORAGE (for development/testing)
// ============================================

const workoutStore = new Map<string, WorkoutLog>();

export const inMemoryStorage: WorkoutLogStorage = {
  async saveWorkout(log: WorkoutLog): Promise<void> {
    workoutStore.set(log.id, log);
  },

  async getWorkout(workoutId: string): Promise<WorkoutLog | null> {
    return workoutStore.get(workoutId) || null;
  },

  async getWorkoutsByUser(userId: string, limit = 50): Promise<WorkoutLog[]> {
    const workouts: WorkoutLog[] = [];
    for (const workout of workoutStore.values()) {
      if (workout.personAId === userId || workout.personBId === userId) {
        workouts.push(workout);
      }
    }
    return workouts
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  },

  async getWorkoutsByCouple(coupleId: string, limit = 50): Promise<WorkoutLog[]> {
    const workouts: WorkoutLog[] = [];
    for (const workout of workoutStore.values()) {
      if (workout.coupleId === coupleId) {
        workouts.push(workout);
      }
    }
    return workouts
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  },

  async getRecentExerciseLogs(
    userId: string,
    exerciseId: string,
    limit = 10
  ): Promise<ExerciseLog[]> {
    const logs: ExerciseLog[] = [];
    const workouts = await this.getWorkoutsByUser(userId, 20);

    for (const workout of workouts) {
      // Get logs for this user from the workout
      const userLogs = workout.personAId === userId
        ? workout.personALogs
        : workout.personBLogs;

      for (const log of userLogs) {
        if (log.exerciseId === exerciseId) {
          logs.push(log);
        }
      }
    }

    return logs.slice(0, limit);
  },

  async deleteWorkout(workoutId: string): Promise<void> {
    workoutStore.delete(workoutId);
  },
};

// ============================================
// WORKOUT LOGGER CLASS
// ============================================

export class WorkoutLogger {
  private storage: WorkoutLogStorage;

  constructor(storage: WorkoutLogStorage = inMemoryStorage) {
    this.storage = storage;
  }

  /**
   * Start a new workout session
   */
  startWorkout(params: {
    coupleId: string;
    personAId: string;
    personBId: string;
    generatedWorkoutId: string;
    workoutType: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'mixed';
  }): WorkoutLog {
    return {
      id: generateId(),
      coupleId: params.coupleId,
      personAId: params.personAId,
      personBId: params.personBId,
      generatedWorkoutId: params.generatedWorkoutId,
      startTime: new Date(),
      endTime: null,
      personALogs: [],
      personBLogs: [],
      personAFeedback: null,
      personBFeedback: null,
      workoutType: params.workoutType,
    };
  }

  /**
   * Log an exercise for a person
   */
  logExercise(
    workout: WorkoutLog,
    personId: string,
    exerciseLog: Omit<ExerciseLog, 'timestamp'>
  ): WorkoutLog {
    const fullLog: ExerciseLog = {
      ...exerciseLog,
      timestamp: new Date(),
    };

    if (personId === workout.personAId) {
      return {
        ...workout,
        personALogs: [...workout.personALogs, fullLog],
      };
    } else if (personId === workout.personBId) {
      return {
        ...workout,
        personBLogs: [...workout.personBLogs, fullLog],
      };
    }

    throw new Error(`Person ${personId} not part of this workout`);
  }

  /**
   * Add post-workout feedback for a person
   */
  addFeedback(
    workout: WorkoutLog,
    personId: string,
    feedback: PostWorkoutFeedback
  ): WorkoutLog {
    if (personId === workout.personAId) {
      return {
        ...workout,
        personAFeedback: feedback,
      };
    } else if (personId === workout.personBId) {
      return {
        ...workout,
        personBFeedback: feedback,
      };
    }

    throw new Error(`Person ${personId} not part of this workout`);
  }

  /**
   * Complete and save a workout
   */
  async completeWorkout(workout: WorkoutLog): Promise<WorkoutLog> {
    const completedWorkout: WorkoutLog = {
      ...workout,
      endTime: new Date(),
    };

    await this.storage.saveWorkout(completedWorkout);
    return completedWorkout;
  }

  /**
   * Get a workout by ID
   */
  async getWorkout(workoutId: string): Promise<WorkoutLog | null> {
    return this.storage.getWorkout(workoutId);
  }

  /**
   * Get recent workouts for a user
   */
  async getUserWorkouts(userId: string, limit = 50): Promise<WorkoutLog[]> {
    return this.storage.getWorkoutsByUser(userId, limit);
  }

  /**
   * Get recent workouts for a couple
   */
  async getCoupleWorkouts(coupleId: string, limit = 50): Promise<WorkoutLog[]> {
    return this.storage.getWorkoutsByCouple(coupleId, limit);
  }

  /**
   * Get recent logs for a specific exercise
   */
  async getExerciseLogs(
    userId: string,
    exerciseId: string,
    limit = 10
  ): Promise<ExerciseLog[]> {
    return this.storage.getRecentExerciseLogs(userId, exerciseId, limit);
  }

  /**
   * Calculate workout statistics
   */
  calculateWorkoutStats(workout: WorkoutLog): WorkoutStats {
    const duration = workout.endTime
      ? (workout.endTime.getTime() - workout.startTime.getTime()) / 1000 / 60
      : 0;

    const personAStats = calculatePersonStats(workout.personALogs);
    const personBStats = calculatePersonStats(workout.personBLogs);

    return {
      durationMinutes: Math.round(duration),
      personA: personAStats,
      personB: personBStats,
      totalExercises: new Set([
        ...workout.personALogs.map(l => l.exerciseId),
        ...workout.personBLogs.map(l => l.exerciseId),
      ]).size,
      completionRate:
        (personAStats.completionRate + personBStats.completionRate) / 2,
    };
  }
}

// ============================================
// STATS TYPES AND HELPERS
// ============================================

export interface PersonWorkoutStats {
  exercisesCompleted: number;
  totalSets: number;
  totalReps: number;
  averageRIR: number;
  completionRate: number;
  averageFormQuality: number;
}

export interface WorkoutStats {
  durationMinutes: number;
  personA: PersonWorkoutStats;
  personB: PersonWorkoutStats;
  totalExercises: number;
  completionRate: number;
}

function calculatePersonStats(logs: ExerciseLog[]): PersonWorkoutStats {
  if (logs.length === 0) {
    return {
      exercisesCompleted: 0,
      totalSets: 0,
      totalReps: 0,
      averageRIR: 0,
      completionRate: 0,
      averageFormQuality: 0,
    };
  }

  const completedLogs = logs.filter(l => l.completed);
  const totalReps = logs.reduce((sum, l) => sum + (l.actualReps || 0), 0);
  const avgRIR = logs.reduce((sum, l) => sum + l.actualRIR, 0) / logs.length;

  const formQualityMap = { poor: 1, okay: 2, good: 3, perfect: 4 };
  const avgForm =
    logs.reduce((sum, l) => sum + formQualityMap[l.formQuality], 0) /
    logs.length;

  return {
    exercisesCompleted: new Set(completedLogs.map(l => l.exerciseId)).size,
    totalSets: logs.length,
    totalReps,
    averageRIR: Math.round(avgRIR * 10) / 10,
    completionRate: completedLogs.length / logs.length,
    averageFormQuality: Math.round(avgForm * 10) / 10,
  };
}

// ============================================
// EXERCISE LOG BUILDER
// ============================================

/**
 * Builder for creating exercise logs with defaults
 */
export class ExerciseLogBuilder {
  private log: Partial<ExerciseLog>;

  constructor(exerciseId: string) {
    this.log = {
      exerciseId,
      completed: true,
      formQuality: 'good',
      feltTooEasy: false,
      feltTooHard: false,
      feltPain: false,
      notes: null,
    };
  }

  prescribedReps(reps: number): this {
    this.log.prescribedReps = reps;
    return this;
  }

  prescribedWeight(weight: number): this {
    this.log.prescribedWeight = weight;
    return this;
  }

  prescribedDuration(seconds: number): this {
    this.log.prescribedDuration = seconds;
    return this;
  }

  actualReps(reps: number): this {
    this.log.actualReps = reps;
    return this;
  }

  actualWeight(weight: number): this {
    this.log.actualWeight = weight;
    return this;
  }

  actualDuration(seconds: number): this {
    this.log.actualDuration = seconds;
    return this;
  }

  rir(rir: number): this {
    this.log.actualRIR = rir;
    return this;
  }

  form(quality: 'poor' | 'okay' | 'good' | 'perfect'): this {
    this.log.formQuality = quality;
    return this;
  }

  notCompleted(): this {
    this.log.completed = false;
    return this;
  }

  tooEasy(): this {
    this.log.feltTooEasy = true;
    return this;
  }

  tooHard(): this {
    this.log.feltTooHard = true;
    return this;
  }

  feltPain(): this {
    this.log.feltPain = true;
    return this;
  }

  withNotes(notes: string): this {
    this.log.notes = notes;
    return this;
  }

  heartRate(avg: number, max: number): this {
    this.log.heartRateAvg = avg;
    this.log.heartRateMax = max;
    return this;
  }

  build(): Omit<ExerciseLog, 'timestamp'> {
    if (this.log.actualRIR === undefined) {
      // Default RIR based on completion and difficulty feedback
      if (this.log.feltTooEasy) {
        this.log.actualRIR = 4;
      } else if (this.log.feltTooHard) {
        this.log.actualRIR = 0;
      } else {
        this.log.actualRIR = 2;
      }
    }

    return this.log as Omit<ExerciseLog, 'timestamp'>;
  }
}

// ============================================
// FEEDBACK BUILDER
// ============================================

/**
 * Builder for creating post-workout feedback
 */
export class FeedbackBuilder {
  private feedback: Partial<PostWorkoutFeedback>;

  constructor() {
    this.feedback = {
      overallDifficulty: 3,
      enjoymentRating: 3,
      partnerConnectionRating: 3,
      wouldRepeat: true,
    };
  }

  difficulty(rating: 1 | 2 | 3 | 4 | 5): this {
    this.feedback.overallDifficulty = rating;
    return this;
  }

  enjoyment(rating: 1 | 2 | 3 | 4 | 5): this {
    this.feedback.enjoymentRating = rating;
    return this;
  }

  connection(rating: 1 | 2 | 3 | 4 | 5): this {
    this.feedback.partnerConnectionRating = rating;
    return this;
  }

  wouldNotRepeat(): this {
    this.feedback.wouldRepeat = false;
    return this;
  }

  favoriteExercise(exerciseId: string): this {
    this.feedback.favoriteExercise = exerciseId;
    return this;
  }

  leastFavorite(exerciseId: string): this {
    this.feedback.leastFavoriteExercise = exerciseId;
    return this;
  }

  comments(text: string): this {
    this.feedback.comments = text;
    return this;
  }

  energyLevel(level: 'depleted' | 'tired' | 'good' | 'energized'): this {
    this.feedback.energyLevelAfter = level;
    return this;
  }

  soreness(areas: string[]): this {
    this.feedback.sorenessAreas = areas;
    return this;
  }

  build(): PostWorkoutFeedback {
    return this.feedback as PostWorkoutFeedback;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(): string {
  return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default instance
export const workoutLogger = new WorkoutLogger();
