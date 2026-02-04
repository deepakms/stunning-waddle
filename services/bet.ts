/**
 * Bet Service
 *
 * Handles bet creation, tracking, and resolution between partners.
 *
 * Principles:
 * - Type-safe database operations
 * - Clear bet lifecycle management
 * - Fair scoring and resolution
 */

import { supabase } from '@/lib/supabase';
import type { Bet, BetMetric, BetStatus } from '@/types/database';

// ============================================
// TYPES
// ============================================

interface ServiceResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface CreateBetParams {
  coupleId: string;
  challengerId: string;
  challengerStake: string;
  challengedStake: string;
  metric: BetMetric;
  customMetricDescription?: string;
  startsAt: string;
  endsAt: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets human-readable label for bet metric
 */
export function getBetMetricLabel(metric: BetMetric): string {
  const labels: Record<BetMetric, string> = {
    total_reps: 'Total Reps',
    total_sessions: 'Total Sessions',
    total_minutes: 'Total Minutes',
    streak_days: 'Streak Days',
    xp_earned: 'XP Earned',
    custom: 'Custom',
  };

  return labels[metric];
}

/**
 * Gets formatted stake description
 */
export function formatStakeDescription(stake: string): string {
  return stake.charAt(0).toUpperCase() + stake.slice(1);
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Creates a new bet
 */
export async function createBet(params: CreateBetParams): Promise<ServiceResponse<Bet>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .insert({
        couple_id: params.coupleId,
        challenger_id: params.challengerId,
        challenger_stake: params.challengerStake,
        challenged_stake: params.challengedStake,
        metric: params.metric,
        custom_metric_description: params.customMetricDescription ?? null,
        starts_at: params.startsAt,
        ends_at: params.endsAt,
        status: 'pending',
        challenger_score: null,
        challenged_score: null,
        winner_id: null,
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
 * Accepts a pending bet
 */
export async function acceptBet(betId: string): Promise<ServiceResponse<Bet>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .update({
        status: 'accepted',
      })
      .eq('id', betId)
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
 * Starts a bet (moves from accepted to active)
 */
export async function startBet(betId: string): Promise<ServiceResponse<Bet>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .update({
        status: 'active',
        challenger_score: 0,
        challenged_score: 0,
      })
      .eq('id', betId)
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
 * Gets a bet by ID
 */
export async function getBetById(betId: string): Promise<ServiceResponse<Bet>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
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
 * Gets active bet for a couple
 */
export async function getActiveBet(coupleId: string): Promise<ServiceResponse<Bet | null>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('couple_id', coupleId)
      .in('status', ['pending', 'accepted', 'active'])
      .order('created_at', { ascending: false })
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - not an error for us
      return { data: null, error: { message: error.message } };
    }

    return { data: data ?? null, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Gets bet history for a couple
 */
export async function getBetHistory(
  coupleId: string,
  limit?: number
): Promise<ServiceResponse<Bet[]>> {
  try {
    let query = supabase
      .from('bets')
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
 * Updates bet score for a participant
 */
export async function updateBetScore(
  betId: string,
  participant: 'challenger' | 'challenged',
  score: number
): Promise<ServiceResponse<Bet>> {
  try {
    const scoreField = participant === 'challenger' ? 'challenger_score' : 'challenged_score';

    const { data, error } = await supabase
      .from('bets')
      .update({ [scoreField]: score })
      .eq('id', betId)
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
 * Increments bet score for a participant
 */
export async function incrementBetScore(
  betId: string,
  participant: 'challenger' | 'challenged',
  amount: number
): Promise<ServiceResponse<Bet>> {
  try {
    // First get current score
    const { data: bet } = await getBetById(betId);
    if (!bet) {
      return { data: null, error: { message: 'Bet not found' } };
    }

    const currentScore =
      participant === 'challenger'
        ? bet.challenger_score ?? 0
        : bet.challenged_score ?? 0;

    return updateBetScore(betId, participant, currentScore + amount);
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Resolves a bet with a winner
 */
export async function resolveBet(
  betId: string,
  winnerId: string
): Promise<ServiceResponse<Bet>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .update({
        status: 'completed',
        winner_id: winnerId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', betId)
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
 * Auto-resolves a bet based on scores
 */
export async function autoResolveBet(betId: string): Promise<ServiceResponse<Bet>> {
  try {
    // Get bet with current scores
    const { data: bet, error: getError } = await getBetById(betId);

    if (getError || !bet) {
      return { data: null, error: getError ?? { message: 'Bet not found' } };
    }

    const challengerScore = bet.challenger_score ?? 0;
    const challengedScore = bet.challenged_score ?? 0;

    // Determine winner
    let winnerId: string | null = null;

    if (challengerScore > challengedScore) {
      winnerId = bet.challenger_id;
    } else if (challengedScore > challengerScore) {
      // Get the challenged partner's ID (the one who isn't the challenger)
      // This requires knowing the couple's other profile ID
      // For now, we mark it as a tie by leaving winner_id null
      winnerId = 'challenged'; // Placeholder - in real implementation, get from couple
    }
    // If equal, it's a tie (winnerId stays null)

    return resolveBet(betId, winnerId ?? '');
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Cancels a bet
 */
export async function cancelBet(betId: string): Promise<ServiceResponse<Bet>> {
  try {
    const { data, error } = await supabase
      .from('bets')
      .update({ status: 'cancelled' })
      .eq('id', betId)
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
 * Gets bet statistics for a couple
 */
export async function getBetStats(
  coupleId: string
): Promise<ServiceResponse<{
  totalBets: number;
  challengerWins: Record<string, number>;
  currentStreak: Record<string, number>;
}>> {
  try {
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('status', 'completed');

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    const totalBets = bets?.length ?? 0;
    const challengerWins: Record<string, number> = {};

    bets?.forEach((bet) => {
      if (bet.winner_id) {
        challengerWins[bet.winner_id] = (challengerWins[bet.winner_id] ?? 0) + 1;
      }
    });

    return {
      data: {
        totalBets,
        challengerWins,
        currentStreak: {}, // Would need more complex logic to calculate
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}
