/**
 * Streak Service
 *
 * Handles workout streak calculation and tracking.
 *
 * Principles:
 * - Pure functions for calculations
 * - Clear day boundary logic
 * - Type-safe database operations
 */

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

interface ServiceResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutAt: Date | null;
}

interface StreakUpdateResult {
  newStreak: number;
  isNewRecord: boolean;
  streakMaintained: boolean;
  streakBroken: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets the start of day (midnight) for a date in UTC
 */
function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculates the number of days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const d1 = getStartOfDay(date1);
  const d2 = getStartOfDay(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================
// PURE CALCULATION FUNCTIONS
// ============================================

/**
 * Calculates the streak update based on last workout date
 */
export function calculateStreakUpdate(
  currentStreak: number,
  lastWorkoutAt: Date | null,
  currentDate: Date = new Date(),
  longestStreak: number = 0
): StreakUpdateResult {
  // First workout ever
  if (!lastWorkoutAt) {
    return {
      newStreak: 1,
      isNewRecord: longestStreak === 0,
      streakMaintained: false,
      streakBroken: false,
    };
  }

  const daysDiff = daysBetween(lastWorkoutAt, currentDate);

  // Same day - streak maintained but not incremented
  if (daysDiff === 0) {
    return {
      newStreak: currentStreak,
      isNewRecord: false,
      streakMaintained: true,
      streakBroken: false,
    };
  }

  // Next day - streak increments
  if (daysDiff === 1) {
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      isNewRecord: newStreak > longestStreak,
      streakMaintained: false,
      streakBroken: false,
    };
  }

  // More than 1 day - streak resets
  return {
    newStreak: 1,
    isNewRecord: false,
    streakMaintained: false,
    streakBroken: true,
  };
}

/**
 * Checks if streak is still active (workout within last 1 day)
 */
export function isStreakActive(lastWorkoutAt: Date | null): boolean {
  if (!lastWorkoutAt) {
    return false;
  }

  const daysDiff = daysBetween(lastWorkoutAt, new Date());
  return daysDiff <= 1;
}

/**
 * Gets streak status message
 */
export function getStreakMessage(streak: number, isActive: boolean): string {
  if (!isActive) {
    return 'Start a new streak!';
  }

  if (streak === 1) {
    return "You're on day 1!";
  }

  if (streak < 7) {
    return `${streak} day streak! Keep it up!`;
  }

  if (streak < 30) {
    return `${streak} day streak! 🔥 1.5x XP bonus!`;
  }

  return `${streak} day streak! 🔥🔥 2x XP bonus!`;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Gets streak data for a couple
 */
export async function getStreakData(coupleId: string): Promise<ServiceResponse<StreakData>> {
  try {
    const { data, error } = await supabase
      .from('couples')
      .select('current_streak, longest_streak, last_workout_at')
      .eq('id', coupleId)
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return {
      data: {
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastWorkoutAt: data.last_workout_at ? new Date(data.last_workout_at) : null,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Updates streak data for a couple
 */
export async function updateStreak(
  coupleId: string,
  newStreak: number,
  isNewRecord: boolean = false
): Promise<ServiceResponse<StreakData>> {
  try {
    const updateData: Record<string, any> = {
      current_streak: newStreak,
      last_workout_at: new Date().toISOString(),
    };

    if (isNewRecord) {
      updateData.longest_streak = newStreak;
    }

    const { data, error } = await supabase
      .from('couples')
      .update(updateData)
      .eq('id', coupleId)
      .select('current_streak, longest_streak, last_workout_at')
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return {
      data: {
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastWorkoutAt: data.last_workout_at ? new Date(data.last_workout_at) : null,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Processes workout completion for streak update
 */
export async function processWorkoutStreak(
  coupleId: string
): Promise<ServiceResponse<StreakUpdateResult>> {
  try {
    // Get current streak data
    const { data: streakData, error: getError } = await getStreakData(coupleId);

    if (getError || !streakData) {
      return { data: null, error: getError ?? { message: 'Failed to get streak data' } };
    }

    // Calculate new streak
    const result = calculateStreakUpdate(
      streakData.currentStreak,
      streakData.lastWorkoutAt,
      new Date(),
      streakData.longestStreak
    );

    // Update if changed
    if (!result.streakMaintained || result.newStreak !== streakData.currentStreak) {
      const { error: updateError } = await updateStreak(
        coupleId,
        result.newStreak,
        result.isNewRecord
      );

      if (updateError) {
        return { data: null, error: updateError };
      }
    }

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}
