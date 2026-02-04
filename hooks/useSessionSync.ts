/**
 * Session Sync Hook
 *
 * Provides real-time synchronization for workout sessions between partners.
 * Uses Supabase Realtime for live state updates and broadcasts.
 *
 * Principles:
 * - Real-time state synchronization via Supabase channels
 * - Optimistic updates with conflict resolution
 * - Clean channel management with proper cleanup
 * - Type-safe state management
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

/**
 * Client-side session state (camelCase for React convention)
 */
export interface ClientSessionState {
  currentBlockIndex: number;
  blockStartedAt: string | null;
  timerRunning: boolean;
  timerSecondsRemaining: number;
  isPaused: boolean;
  pausedBy: string | null;
  partnerAReady: boolean;
  partnerBReady: boolean;
  lastUpdatedAt: string;
  updatedBy: string | null;
}

/**
 * Database session state (snake_case matching DB schema)
 */
interface DbSessionState {
  id: string;
  session_id: string;
  current_block_index: number;
  block_started_at: string | null;
  timer_running: boolean;
  timer_seconds_remaining: number | null;
  is_paused: boolean;
  paused_by: string | null;
  partner_a_ready: boolean;
  partner_b_ready: boolean;
  last_updated_at: string;
  updated_by: string | null;
}

/**
 * Hook return type
 */
interface UseSessionSyncReturn {
  state: ClientSessionState | null;
  isConnected: boolean;
  updateState: (updates: Partial<ClientSessionState>) => Promise<void>;
  broadcastTimerTick: (seconds: number) => void;
  signalExerciseComplete: (blockIndex: number, reps: number) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Maps database state (snake_case) to client state (camelCase)
 */
function mapDbStateToClient(dbState: DbSessionState): ClientSessionState {
  return {
    currentBlockIndex: dbState.current_block_index,
    blockStartedAt: dbState.block_started_at,
    timerRunning: dbState.timer_running,
    timerSecondsRemaining: dbState.timer_seconds_remaining ?? 0,
    isPaused: dbState.is_paused,
    pausedBy: dbState.paused_by,
    partnerAReady: dbState.partner_a_ready,
    partnerBReady: dbState.partner_b_ready,
    lastUpdatedAt: dbState.last_updated_at,
    updatedBy: dbState.updated_by,
  };
}

/**
 * Maps client state updates (camelCase) to database format (snake_case)
 */
function mapClientStateToDb(
  clientState: Partial<ClientSessionState>
): Record<string, unknown> {
  const mapping: Record<string, string> = {
    currentBlockIndex: 'current_block_index',
    blockStartedAt: 'block_started_at',
    timerRunning: 'timer_running',
    timerSecondsRemaining: 'timer_seconds_remaining',
    isPaused: 'is_paused',
    pausedBy: 'paused_by',
    partnerAReady: 'partner_a_ready',
    partnerBReady: 'partner_b_ready',
  };

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(clientState)) {
    const dbKey = mapping[key];
    if (dbKey) {
      result[dbKey] = value;
    }
  }

  return result;
}

/**
 * Fetches initial session state from database
 */
async function fetchSessionState(
  sessionId: string
): Promise<ClientSessionState | null> {
  const { data, error } = await supabase
    .from('session_state')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) {
    console.error('Error fetching session state:', error);
    return null;
  }

  return mapDbStateToClient(data as DbSessionState);
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for real-time session synchronization
 *
 * @param sessionId - The session ID to sync
 * @param myProfileId - The current user's profile ID
 * @returns Session state and sync methods
 */
export function useSessionSync(
  sessionId: string,
  myProfileId: string
): UseSessionSyncReturn {
  const [state, setState] = useState<ClientSessionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to session state changes
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const channelName = `session:${sessionId}`;

    const channel = supabase
      .channel(channelName)
      // Listen for database changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_state',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            setState(mapDbStateToClient(payload.new as DbSessionState));
          }
        }
      )
      // Listen for timer tick broadcasts (high-frequency, not persisted)
      .on('broadcast', { event: 'timer_tick' }, (payload) => {
        setState((prev) =>
          prev
            ? {
                ...prev,
                timerSecondsRemaining: payload.payload.seconds,
              }
            : null
        );
      })
      // Listen for exercise completion broadcasts
      .on('broadcast', { event: 'exercise_complete' }, (payload) => {
        console.log('Partner completed exercise:', payload.payload);
        // Can be used to trigger UI feedback
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    // Fetch initial state
    fetchSessionState(sessionId).then((initialState) => {
      if (initialState) {
        setState(initialState);
      }
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId]);

  /**
   * Updates session state with optimistic update
   */
  const updateState = useCallback(
    async (updates: Partial<ClientSessionState>) => {
      if (!sessionId) return;

      // Optimistic update
      setState((prev) => (prev ? { ...prev, ...updates } : null));

      // Persist to database
      const dbUpdates = mapClientStateToDb(updates);
      const { error } = await supabase
        .from('session_state')
        .update({
          ...dbUpdates,
          last_updated_at: new Date().toISOString(),
          updated_by: myProfileId,
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Failed to update session state:', error);
        // Revert optimistic update by fetching fresh state
        const freshState = await fetchSessionState(sessionId);
        if (freshState) {
          setState(freshState);
        }
      }
    },
    [sessionId, myProfileId]
  );

  /**
   * Broadcasts timer tick to partner (high frequency, not persisted)
   */
  const broadcastTimerTick = useCallback(
    (seconds: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'timer_tick',
        payload: { seconds },
      });
    },
    []
  );

  /**
   * Signals exercise completion to partner
   */
  const signalExerciseComplete = useCallback(
    (blockIndex: number, reps: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'exercise_complete',
        payload: { blockIndex, reps, profileId: myProfileId },
      });
    },
    [myProfileId]
  );

  return {
    state,
    isConnected,
    updateState,
    broadcastTimerTick,
    signalExerciseComplete,
  };
}
