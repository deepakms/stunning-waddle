/**
 * Exercise Service
 *
 * Handles all exercise and exercise pair operations.
 *
 * Principles:
 * - Read-only operations (exercises are seeded, not user-created)
 * - Efficient queries with proper indexing assumptions
 * - Type-safe with database types
 */

import { supabase } from '@/lib/supabase';
import type { Exercise, ExercisePair, MuscleGroup } from '@/types/database';

// ============================================
// TYPES
// ============================================

interface ServiceResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

export interface ExerciseWithPair extends Exercise {
  pair_exercise?: Exercise;
}

// ============================================
// EXERCISE QUERIES
// ============================================

/**
 * Fetches all exercises, ordered by muscle group and difficulty
 */
export async function getExercises(): Promise<ServiceResponse<Exercise[]>> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('muscle_group')
      .order('difficulty');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches a single exercise by ID
 */
export async function getExerciseById(id: string): Promise<ServiceResponse<Exercise>> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches exercises filtered by muscle group
 */
export async function getExercisesByMuscleGroup(
  muscleGroup: MuscleGroup
): Promise<ServiceResponse<Exercise[]>> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('muscle_group', muscleGroup)
      .order('difficulty');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches exercises filtered by difficulty level
 * @param maxDifficulty - Maximum difficulty level (1-5)
 * @param minDifficulty - Minimum difficulty level (optional)
 */
export async function getExercisesByDifficulty(
  maxDifficulty: number,
  minDifficulty?: number
): Promise<ServiceResponse<Exercise[]>> {
  try {
    let query = supabase
      .from('exercises')
      .select('*')
      .lte('difficulty', maxDifficulty);

    if (minDifficulty !== undefined) {
      query = query.gte('difficulty', minDifficulty);
    }

    const { data, error } = await query.order('muscle_group').order('difficulty');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches exercises filtered by muscle group and difficulty
 */
export async function getExercisesByMuscleGroupAndDifficulty(
  muscleGroup: MuscleGroup,
  maxDifficulty: number
): Promise<ServiceResponse<Exercise[]>> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('muscle_group', muscleGroup)
      .lte('difficulty', maxDifficulty)
      .order('difficulty');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Search exercises by name or description
 */
export async function searchExercises(query: string): Promise<ServiceResponse<Exercise[]>> {
  try {
    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .order('name');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches exercises that don't require equipment
 */
export async function getBodyweightExercises(): Promise<ServiceResponse<Exercise[]>> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('equipment_required', '{}')
      .order('muscle_group')
      .order('difficulty');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches partner exercises (exercises designed for two people)
 */
export async function getPartnerExercises(): Promise<ServiceResponse<Exercise[]>> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_partner_exercise', true)
      .order('muscle_group')
      .order('difficulty');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

// ============================================
// EXERCISE PAIR QUERIES
// ============================================

/**
 * Fetches all exercise pairs
 */
export async function getExercisePairs(): Promise<ServiceResponse<ExercisePair[]>> {
  try {
    const { data, error } = await supabase
      .from('exercise_pairs')
      .select('*')
      .order('muscle_group');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches exercise pairs filtered by muscle group
 */
export async function getExercisePairsByMuscleGroup(
  muscleGroup: MuscleGroup
): Promise<ServiceResponse<ExercisePair[]>> {
  try {
    const { data, error } = await supabase
      .from('exercise_pairs')
      .select('*')
      .eq('muscle_group', muscleGroup)
      .order('duration_seconds');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches exercise pairs with full exercise details
 */
export async function getExercisePairsWithExercises(
  muscleGroup?: MuscleGroup
): Promise<ServiceResponse<(ExercisePair & { exercise_a: Exercise; exercise_b: Exercise })[]>> {
  try {
    let query = supabase
      .from('exercise_pairs')
      .select(`
        *,
        exercise_a:exercises!exercise_pairs_exercise_a_id_fkey(*),
        exercise_b:exercises!exercise_pairs_exercise_b_id_fkey(*)
      `);

    if (muscleGroup) {
      query = query.eq('muscle_group', muscleGroup);
    }

    const { data, error } = await query.order('muscle_group');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Gets a random exercise pair for a given muscle group and difficulty range
 */
export async function getRandomExercisePair(
  muscleGroup: MuscleGroup,
  difficultyA: number,
  difficultyB: number
): Promise<ServiceResponse<ExercisePair & { exercise_a: Exercise; exercise_b: Exercise }>> {
  try {
    // Get all pairs for the muscle group
    const { data: pairs, error: pairsError } = await supabase
      .from('exercise_pairs')
      .select(`
        *,
        exercise_a:exercises!exercise_pairs_exercise_a_id_fkey(*),
        exercise_b:exercises!exercise_pairs_exercise_b_id_fkey(*)
      `)
      .eq('muscle_group', muscleGroup);

    if (pairsError) {
      return { data: null, error: { message: pairsError.message } };
    }

    if (!pairs || pairs.length === 0) {
      return { data: null, error: { message: 'No exercise pairs found for muscle group' } };
    }

    // Filter pairs based on difficulty levels
    const suitablePairs = pairs.filter((pair) => {
      const exerciseA = pair.exercise_a;
      const exerciseB = pair.exercise_b;
      return (
        exerciseA.difficulty <= difficultyA &&
        exerciseB.difficulty <= difficultyB
      );
    });

    if (suitablePairs.length === 0) {
      // Fall back to any pair if no suitable difficulty match
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
      return { data: randomPair, error: null };
    }

    // Return a random suitable pair
    const randomPair = suitablePairs[Math.floor(Math.random() * suitablePairs.length)];
    return { data: randomPair, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

// ============================================
// STATS & COUNTS
// ============================================

/**
 * Gets count of exercises by muscle group
 */
export async function getExerciseCountByMuscleGroup(): Promise<
  ServiceResponse<Record<MuscleGroup, number>>
> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    const counts = (data ?? []).reduce((acc, exercise) => {
      const group = exercise.muscle_group as MuscleGroup;
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<MuscleGroup, number>);

    return { data: counts, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Gets total count of exercises
 */
export async function getExerciseCount(): Promise<ServiceResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: count ?? 0, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Gets total count of exercise pairs
 */
export async function getExercisePairCount(): Promise<ServiceResponse<number>> {
  try {
    const { count, error } = await supabase
      .from('exercise_pairs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: count ?? 0, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}
