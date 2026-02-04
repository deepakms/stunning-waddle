/**
 * Tests for useSessionSync Hook
 *
 * TDD Approach: Define expected real-time session sync behavior before implementation.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock data
const mockSessionId = 'session-123';
const mockProfileId = 'profile-456';

const mockSessionState = {
  id: 'state-1',
  session_id: mockSessionId,
  current_block_index: 0,
  block_started_at: null,
  timer_running: false,
  timer_seconds_remaining: 45,
  is_paused: false,
  paused_by: null,
  partner_a_ready: false,
  partner_b_ready: false,
  last_updated_at: '2024-01-01T00:00:00Z',
  updated_by: null,
};

// Create mock channel - singleton pattern to maintain listeners across chain calls
const createMockChannel = () => {
  const listeners: Record<string, Function[]> = {};

  const channel: any = {
    on: jest.fn((eventType: string, config: any, callback?: Function) => {
      // For postgres_changes, use eventType as key
      // For broadcast, use config.event as key
      let key = eventType;
      if (eventType === 'broadcast' && typeof config === 'object' && config.event) {
        key = config.event;
      }
      if (!listeners[key]) listeners[key] = [];
      if (callback) listeners[key].push(callback);
      // Return same channel for chaining
      return channel;
    }),
    subscribe: jest.fn(function(this: any, callback?: (status: string) => void) {
      if (callback) {
        // Call async to simulate real behavior
        setTimeout(() => callback('SUBSCRIBED'), 0);
      }
      // Return channel for chaining (Supabase behavior)
      return channel;
    }),
    unsubscribe: jest.fn(),
    send: jest.fn(),
    _trigger: (event: string, payload: any) => {
      if (listeners[event]) {
        listeners[event].forEach((cb) => cb(payload));
      }
    },
    _listeners: listeners,
  };

  return channel;
};

let mockChannel = createMockChannel();

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockSessionState, error: null }),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: mockSessionState, error: null }),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase';
import { useSessionSync } from '@/hooks/useSessionSync';

describe('useSessionSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel = createMockChannel();
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  describe('initialization', () => {
    it('should create a realtime channel for the session', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith(`session:${mockSessionId}`);
      });
    });

    it('should subscribe to postgres changes for session_state', async () => {
      renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: '*',
            schema: 'public',
            table: 'session_state',
            filter: `session_id=eq.${mockSessionId}`,
          }),
          expect.any(Function)
        );
      });
    });

    it('should subscribe to broadcast events', async () => {
      renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(mockChannel.on).toHaveBeenCalledWith(
          'broadcast',
          expect.objectContaining({ event: 'timer_tick' }),
          expect.any(Function)
        );
        expect(mockChannel.on).toHaveBeenCalledWith(
          'broadcast',
          expect.objectContaining({ event: 'exercise_complete' }),
          expect.any(Function)
        );
      });
    });

    it('should fetch initial session state', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.state).not.toBeNull();
        expect(result.current.state?.currentBlockIndex).toBe(0);
      });
    });

    it('should set isConnected to true when subscribed', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });

  describe('state management', () => {
    it('should update local state when postgres change received', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.state).not.toBeNull();
      });

      // Simulate postgres change
      act(() => {
        mockChannel._trigger('postgres_changes', {
          new: {
            ...mockSessionState,
            current_block_index: 2,
            timer_running: true,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.state?.currentBlockIndex).toBe(2);
        expect(result.current.state?.timerRunning).toBe(true);
      });
    });

    it('should update timer from broadcast events', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.state).not.toBeNull();
      });

      // Simulate timer tick broadcast
      act(() => {
        mockChannel._trigger('timer_tick', {
          payload: { seconds: 30 },
        });
      });

      await waitFor(() => {
        expect(result.current.state?.timerSecondsRemaining).toBe(30);
      });
    });
  });

  describe('updateState', () => {
    it('should update session state in database', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.updateState).toBeDefined();
      });

      await act(async () => {
        await result.current.updateState({ timerRunning: true });
      });

      expect(supabase.from).toHaveBeenCalledWith('session_state');
    });

    it('should optimistically update local state', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.state).not.toBeNull();
      });

      await act(async () => {
        await result.current.updateState({ isPaused: true });
      });

      expect(result.current.state?.isPaused).toBe(true);
    });
  });

  describe('broadcast functions', () => {
    it('should broadcast timer tick', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.broadcastTimerTick).toBeDefined();
      });

      act(() => {
        result.current.broadcastTimerTick(25);
      });

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'timer_tick',
        payload: { seconds: 25 },
      });
    });

    it('should broadcast exercise completion', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.signalExerciseComplete).toBeDefined();
      });

      act(() => {
        result.current.signalExerciseComplete(1, 10);
      });

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'exercise_complete',
        payload: { blockIndex: 1, reps: 10, profileId: mockProfileId },
      });
    });
  });

  describe('cleanup', () => {
    it('should remove channel on unmount', async () => {
      const { unmount } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalled();
      });

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('partner readiness', () => {
    it('should track partner A ready state', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.state).not.toBeNull();
      });

      act(() => {
        mockChannel._trigger('postgres_changes', {
          new: {
            ...mockSessionState,
            partner_a_ready: true,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.state?.partnerAReady).toBe(true);
      });
    });

    it('should track partner B ready state', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.state).not.toBeNull();
      });

      act(() => {
        mockChannel._trigger('postgres_changes', {
          new: {
            ...mockSessionState,
            partner_b_ready: true,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.state?.partnerBReady).toBe(true);
      });
    });
  });

  describe('pause functionality', () => {
    it('should handle pause state', async () => {
      const { result } = renderHook(() => useSessionSync(mockSessionId, mockProfileId));

      await waitFor(() => {
        expect(result.current.state).not.toBeNull();
      });

      act(() => {
        mockChannel._trigger('postgres_changes', {
          new: {
            ...mockSessionState,
            is_paused: true,
            paused_by: mockProfileId,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.state?.isPaused).toBe(true);
        expect(result.current.state?.pausedBy).toBe(mockProfileId);
      });
    });
  });
});

describe('useSessionSync - No Session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not create channel when sessionId is empty', async () => {
    renderHook(() => useSessionSync('', mockProfileId));

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('should return null state when no session', async () => {
    const { result } = renderHook(() => useSessionSync('', mockProfileId));

    expect(result.current.state).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });
});
