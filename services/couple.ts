/**
 * Couple Service
 *
 * Handles all couple-related database operations.
 *
 * Principles:
 * - Single responsibility (couple operations only)
 * - Consistent return types { data, error }
 * - Type-safe with database types
 */

import { supabase } from '@/lib/supabase';
import { generateInviteCode, calculateInviteExpiration } from '@/utils/invite';
import type { Couple, CoupleInsert, Profile } from '@/types/database';

/**
 * Service response type for consistent return values
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Couple with partner profiles
 */
export interface CoupleWithPartners extends Couple {
  partner_a: Pick<Profile, 'id' | 'display_name' | 'user_id'> | null;
  partner_b: Pick<Profile, 'id' | 'display_name' | 'user_id'> | null;
}

/**
 * Creates a new couple with the given user as partner A
 * @param profileId - The profile ID of the user creating the couple
 */
export async function createCouple(profileId: string): Promise<ServiceResponse<Couple>> {
  try {
    const inviteCode = generateInviteCode();
    const expiresAt = calculateInviteExpiration();

    const { data, error } = await supabase
      .from('couples')
      .insert({
        partner_a_id: profileId,
        invite_code: inviteCode,
        invite_expires_at: expiresAt,
        status: 'pending',
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    // Update the profile with the couple_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ couple_id: data.id })
      .eq('id', profileId);

    if (profileError) {
      // Couple was created but profile link failed - log but don't fail
      // The user can still use the invite code
      console.error('Failed to link profile to couple:', profileError.message);
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches a couple by its invite code
 * @param inviteCode - The invite code to search for
 */
export async function getCoupleByInviteCode(
  inviteCode: string
): Promise<ServiceResponse<CoupleWithPartners>> {
  try {
    const { data, error } = await supabase
      .from('couples')
      .select(`
        *,
        partner_a:profiles!partner_a_id(id, display_name, user_id),
        partner_b:profiles!partner_b_id(id, display_name, user_id)
      `)
      .eq('invite_code', inviteCode)
      .maybeSingle();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Joins a user to an existing couple as partner B
 * @param coupleId - The couple ID to join
 * @param profileId - The profile ID of the joining user
 */
export async function joinCouple(
  coupleId: string,
  profileId: string
): Promise<ServiceResponse<Couple>> {
  try {
    const { data, error } = await supabase
      .from('couples')
      .update({
        partner_b_id: profileId,
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', coupleId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    // Update the joining user's profile with the couple_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ couple_id: coupleId })
      .eq('id', profileId);

    if (profileError) {
      // Couple was joined but profile link failed - log error
      // The couple status is already updated, profile can be linked later
      console.error('Failed to link profile to couple:', profileError.message);
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Fetches a couple by ID with both partner profiles
 * @param coupleId - The couple ID
 */
export async function getCouple(coupleId: string): Promise<ServiceResponse<CoupleWithPartners>> {
  try {
    const { data, error } = await supabase
      .from('couples')
      .select(`
        *,
        partner_a:profiles!partner_a_id(id, display_name, user_id),
        partner_b:profiles!partner_b_id(id, display_name, user_id)
      `)
      .eq('id', coupleId)
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
 * Regenerates the invite code for a couple
 * @param coupleId - The couple ID
 */
export async function regenerateInviteCode(coupleId: string): Promise<ServiceResponse<Couple>> {
  try {
    const newCode = generateInviteCode();
    const expiresAt = calculateInviteExpiration();

    const { data, error } = await supabase
      .from('couples')
      .update({
        invite_code: newCode,
        invite_expires_at: expiresAt,
      })
      .eq('id', coupleId)
      .select()
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
 * Removes a user from a couple
 * @param coupleId - The couple ID
 * @param profileId - The profile ID of the leaving user
 * @param role - Whether the user is partner_a or partner_b
 */
export async function leaveCouple(
  coupleId: string,
  profileId: string,
  role: 'partner_a' | 'partner_b'
): Promise<ServiceResponse<Couple>> {
  try {
    // Remove user from couple
    const updateData: Record<string, unknown> = {
      [role === 'partner_a' ? 'partner_a_id' : 'partner_b_id']: null,
    };

    // If this is the last person, deactivate the couple
    const { data: couple } = await supabase
      .from('couples')
      .select('partner_a_id, partner_b_id')
      .eq('id', coupleId)
      .single();

    const otherPartner = role === 'partner_a' ? couple?.partner_b_id : couple?.partner_a_id;
    if (!otherPartner) {
      updateData.status = 'inactive';
    }

    const { data, error } = await supabase
      .from('couples')
      .update(updateData)
      .eq('id', coupleId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    // Clear couple_id from the leaving user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ couple_id: null })
      .eq('id', profileId);

    if (profileError) {
      // Couple was updated but profile unlink failed - log error
      console.error('Failed to unlink profile from couple:', profileError.message);
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Validates if a user can join a couple
 * Checks: code exists, not expired, couple not full, user not already in couple
 */
export async function validateJoinCouple(
  inviteCode: string,
  profileId: string
): Promise<ServiceResponse<{ canJoin: boolean; reason?: string; couple?: CoupleWithPartners }>> {
  try {
    // Check if user already has a couple
    const { data: profile } = await supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', profileId)
      .single();

    if (profile?.couple_id) {
      return {
        data: { canJoin: false, reason: 'You are already in a couple' },
        error: null,
      };
    }

    // Get the couple by invite code
    const { data: couple, error } = await getCoupleByInviteCode(inviteCode);

    if (error) {
      return { data: null, error };
    }

    if (!couple) {
      return {
        data: { canJoin: false, reason: 'Invalid invite code' },
        error: null,
      };
    }

    // Check if expired
    if (new Date(couple.invite_expires_at) <= new Date()) {
      return {
        data: { canJoin: false, reason: 'This invite code has expired' },
        error: null,
      };
    }

    // Check if couple already has partner B
    if (couple.partner_b_id) {
      return {
        data: { canJoin: false, reason: 'This couple already has two partners' },
        error: null,
      };
    }

    // Check if trying to join own couple
    if (couple.partner_a_id === profileId) {
      return {
        data: { canJoin: false, reason: 'You cannot join your own couple' },
        error: null,
      };
    }

    return {
      data: { canJoin: true, couple },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}
