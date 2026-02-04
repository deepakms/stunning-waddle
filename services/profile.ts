/**
 * Profile Service
 *
 * Handles all profile-related database operations.
 *
 * Principles:
 * - Single responsibility (profile operations only)
 * - Consistent return types { data, error }
 * - Type-safe with database types
 */

import { supabase } from '@/lib/supabase';
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/database';

/**
 * Service response type for consistent return values
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Fetches a profile by its ID
 * @param profileId - The profile's unique ID
 */
export async function getProfile(profileId: string): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches a profile by user ID (auth.users.id)
 * @param userId - The user's auth ID
 */
export async function getProfileByUserId(userId: string): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Creates a new profile
 * @param profile - The profile data to insert
 */
export async function createProfile(
  profile: Partial<ProfileInsert> & { user_id: string; display_name: string }
): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: profile.user_id,
        display_name: profile.display_name,
        fitness_level: profile.fitness_level ?? null,
        injuries: profile.injuries ?? [],
        preferred_activities: profile.preferred_activities ?? [],
        disliked_activities: profile.disliked_activities ?? [],
        available_equipment: profile.available_equipment ?? [],
        preferred_workout_length: profile.preferred_workout_length ?? 30,
        can_do_pushups_10: profile.can_do_pushups_10 ?? false,
        can_hold_plank_30s: profile.can_hold_plank_30s ?? false,
        can_do_full_squat: profile.can_do_full_squat ?? false,
      })
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Updates an existing profile
 * @param profileId - The profile's unique ID
 * @param updates - The fields to update
 */
export async function updateProfile(
  profileId: string,
  updates: ProfileUpdate
): Promise<ServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches a profile with its couple data
 * @param userId - The user's auth ID
 */
export async function getProfileWithCouple(userId: string): Promise<
  ServiceResponse<Profile & { couple: { id: string; invite_code: string; status: string } | null }>
> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        couple:couples(id, invite_code, status, total_xp, current_streak)
      `)
      .eq('user_id', userId)
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Marks profile onboarding as complete
 * @param profileId - The profile's unique ID
 */
export async function completeOnboarding(profileId: string): Promise<ServiceResponse<Profile>> {
  return updateProfile(profileId, {
    onboarding_completed_at: new Date().toISOString(),
  });
}
