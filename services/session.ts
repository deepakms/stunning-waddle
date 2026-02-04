/**
 * Session Service
 *
 * Handles workout session operations including creation, state management,
 * and real-time synchronization support.
 *
 * Principles:
 * - Type-safe with database types
 * - Atomic state updates for real-time sync
 * - Clear separation between session and session_state
 */

import { supabase } from '@/lib/supabase';
import type { Session, SessionState, SessionStateUpdate, WorkoutData } from '@/types/database';

// ============================================
// TYPES
// ============================================

interface ServiceResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface CreateSessionInput {
  couple_id: string;
  workout_data: WorkoutData;
  partner_a_id: string;
  partner_b_id: string;
  name?: string;
  description?: string;
}

// ============================================
// SESSION QUERIES
// ============================================

/**
 * Fetches a session by ID
 */
export async function getSessionById(id: string): Promise<ServiceResponse<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
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
 * Fetches sessions for a couple
 */
export async function getSessionsByCouple(
  coupleId: string,
  limit?: number
): Promise<ServiceResponse<Session[]>> {
  try {
    let query = supabase
      .from('sessions')
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
 * Fetches active session for a couple
 */
export async function getActiveSession(coupleId: string): Promise<ServiceResponse<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('couple_id', coupleId)
      .in('status', ['ready', 'in_progress', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

// ============================================
// SESSION STATE QUERIES
// ============================================

/**
 * Fetches session state by session ID
 */
export async function getSessionState(sessionId: string): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    // Normalize data to ensure valid values
    const normalizedData = {
      ...data,
      current_block_index: Math.max(0, data.current_block_index),
      timer_seconds_remaining: Math.max(0, data.timer_seconds_remaining ?? 0),
    };

    return { data: normalizedData, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

// ============================================
// SESSION MUTATIONS
// ============================================

/**
 * Creates a new workout session
 */
export async function createSession(input: CreateSessionInput): Promise<ServiceResponse<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        couple_id: input.couple_id,
        workout_data: input.workout_data,
        partner_a_id: input.partner_a_id,
        partner_b_id: input.partner_b_id,
        name: input.name ?? null,
        description: input.description ?? null,
        status: 'ready',
        current_block_index: 0,
        xp_earned: 0,
        is_solo: false,
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
 * Creates initial session state for real-time sync
 */
export async function createSessionState(
  sessionId: string,
  initialTimerSeconds: number
): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .insert({
        session_id: sessionId,
        current_block_index: 0,
        timer_running: false,
        timer_seconds_remaining: initialTimerSeconds,
        is_paused: false,
        partner_a_ready: false,
        partner_b_ready: false,
        last_updated_at: new Date().toISOString(),
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
 * Updates session state (for real-time sync)
 */
export async function updateSessionState(
  sessionId: string,
  updates: SessionStateUpdate,
  updatedBy: string
): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .update({
        ...updates,
        updated_by: updatedBy,
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
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
 * Starts a session (changes status to in_progress)
 */
export async function startSession(sessionId: string): Promise<ServiceResponse<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
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
 * Pauses a session
 */
export async function pauseSession(
  sessionId: string,
  pausedBy: string
): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .update({
        is_paused: true,
        timer_running: false,
        paused_by: pausedBy,
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    // Also update session status
    await supabase
      .from('sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId);

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Resumes a paused session
 */
export async function resumeSession(sessionId: string): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .update({
        is_paused: false,
        timer_running: true,
        paused_by: null,
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    // Also update session status
    await supabase
      .from('sessions')
      .update({ status: 'in_progress' })
      .eq('id', sessionId);

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Completes a session
 */
export async function completeSession(
  sessionId: string,
  totalActiveSeconds: number
): Promise<ServiceResponse<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_active_seconds: totalActiveSeconds,
      })
      .eq('id', sessionId)
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
 * Abandons a session
 */
export async function abandonSession(sessionId: string): Promise<ServiceResponse<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'abandoned',
      })
      .eq('id', sessionId)
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
 * Sets partner readiness for ready check
 */
export async function setPartnerReady(
  sessionId: string,
  isPartnerA: boolean,
  profileId: string
): Promise<ServiceResponse<SessionState>> {
  try {
    const updateField = isPartnerA ? 'partner_a_ready' : 'partner_b_ready';

    const { data, error } = await supabase
      .from('session_state')
      .update({
        [updateField]: true,
        updated_by: profileId,
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
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
 * Resets partner readiness (for next block)
 */
export async function resetPartnerReadiness(sessionId: string): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .update({
        partner_a_ready: false,
        partner_b_ready: false,
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
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
 * Advances to next block
 */
export async function advanceToNextBlock(
  sessionId: string,
  nextBlockIndex: number,
  timerSeconds: number
): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .update({
        current_block_index: nextBlockIndex,
        timer_seconds_remaining: timerSeconds,
        timer_running: false,
        partner_a_ready: false,
        partner_b_ready: false,
        block_started_at: null,
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      return { data: null, error: { message: error.message } };
    }

    // Also update the session's current block index
    await supabase
      .from('sessions')
      .update({ current_block_index: nextBlockIndex })
      .eq('id', sessionId);

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Network error occurred' } };
  }
}

/**
 * Starts the timer for current block
 */
export async function startBlockTimer(sessionId: string): Promise<ServiceResponse<SessionState>> {
  try {
    const { data, error } = await supabase
      .from('session_state')
      .update({
        timer_running: true,
        block_started_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
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
