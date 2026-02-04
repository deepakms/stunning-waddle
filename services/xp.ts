/**
 * XP Service
 *
 * Handles XP calculation, recording, and retrieval.
 *
 * Principles:
 * - Pure functions for calculations
 * - Type-safe database operations
 * - Clear multiplier logic
 */

import { supabase } from '@/lib/supabase';
import { XP_PER_MINUTE, SOLO_XP_MULTIPLIER, STREAK_MULTIPLIERS } from '@/constants/app';
import type { XPTransaction, XPReason } from '@/types/database';

// ============================================
// TYPES
// ============================================

interface ServiceResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface CalculateXpParams {
  durationMinutes: number;
  isSolo: boolean;
}

interface RecordXpParams {
  coupleId: string;
  amount: number;
  reason: XPReason;
  sessionId?: string;
  betId?: string;
  multiplier?: number;
  baseAmount?: number;
}

// ============================================
// PURE CALCULATION FUNCTIONS
// ============================================

/**
 * Calculates base XP from workout parameters
 */
export function calculateWorkoutXp(params: CalculateXpParams): number {
  const { durationMinutes, isSolo } = params;

  const baseXp = durationMinutes * XP_PER_MINUTE;
  const multiplier = isSolo ? SOLO_XP_MULTIPLIER : 1;

  return Math.round(baseXp * multiplier);
}

/**
 * Applies streak multiplier to XP amount
 */
export function applyStreakMultiplier(xp: number, streakDays: number): number {
  let multiplier = 1;

  // Check multipliers from highest to lowest
  if (streakDays >= 30) {
    multiplier = STREAK_MULTIPLIERS[30];
  } else if (streakDays >= 7) {
    multiplier = STREAK_MULTIPLIERS[7];
  }

  return Math.round(xp * multiplier);
}

/**
 * Calculates total XP for a completed workout
 */
export function calculateTotalWorkoutXp(
  durationMinutes: number,
  isSolo: boolean,
  streakDays: number
): { total: number; base: number; multiplier: number } {
  const baseXp = calculateWorkoutXp({ durationMinutes, isSolo });
  const totalXp = applyStreakMultiplier(baseXp, streakDays);
  const multiplier = totalXp / baseXp;

  return {
    total: totalXp,
    base: baseXp,
    multiplier,
  };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Records an XP transaction
 */
export async function recordXpTransaction(
  params: RecordXpParams
): Promise<ServiceResponse<XPTransaction>> {
  try {
    const { data, error } = await supabase
      .from('xp_transactions')
      .insert({
        couple_id: params.coupleId,
        amount: params.amount,
        reason: params.reason,
        session_id: params.sessionId ?? null,
        bet_id: params.betId ?? null,
        multiplier: params.multiplier ?? 1,
        base_amount: params.baseAmount ?? params.amount,
      })
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
 * Gets XP transaction history for a couple
 */
export async function getXpHistory(
  coupleId: string,
  limit?: number
): Promise<ServiceResponse<XPTransaction[]>> {
  try {
    let query = supabase
      .from('xp_transactions')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Gets total XP for a couple
 */
export async function getTotalXp(coupleId: string): Promise<ServiceResponse<number>> {
  try {
    const { data, error } = await supabase
      .from('couples')
      .select('total_xp')
      .eq('id', coupleId)
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data?.total_xp ?? 0, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Updates couple's total XP
 */
export async function updateCoupleXp(
  coupleId: string,
  xpToAdd: number
): Promise<ServiceResponse<number>> {
  try {
    // First get current XP
    const { data: current } = await getTotalXp(coupleId);
    const newTotal = (current ?? 0) + xpToAdd;

    const { data, error } = await supabase
      .from('couples')
      .update({ total_xp: newTotal })
      .eq('id', coupleId)
      .select('total_xp')
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data: data?.total_xp ?? newTotal, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Records XP for workout completion and updates couple total
 */
export async function awardWorkoutXp(
  coupleId: string,
  sessionId: string,
  durationMinutes: number,
  isSolo: boolean,
  streakDays: number
): Promise<ServiceResponse<{ xpAwarded: number; newTotal: number }>> {
  try {
    const { total, base, multiplier } = calculateTotalWorkoutXp(
      durationMinutes,
      isSolo,
      streakDays
    );

    // Record transaction
    const { error: txError } = await recordXpTransaction({
      coupleId,
      amount: total,
      reason: 'workout_completed',
      sessionId,
      multiplier,
      baseAmount: base,
    });

    if (txError) {
      return { data: null, error: txError };
    }

    // Update couple total
    const { data: newTotal, error: updateError } = await updateCoupleXp(coupleId, total);

    if (updateError) {
      return { data: null, error: updateError };
    }

    return {
      data: { xpAwarded: total, newTotal: newTotal ?? 0 },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}
