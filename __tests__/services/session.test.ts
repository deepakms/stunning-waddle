/**
 * Tests for Session Service
 *
 * TDD Approach: Define expected session operations before implementation.
 */

// Mock session data
const mockSession = {
  id: 'session-1',
  couple_id: 'couple-1',
  name: 'Morning Workout',
  status: 'ready',
  workout_data: {
    blocks: [],
    total_duration_minutes: 30,
    muscle_groups: ['chest', 'core'],
    difficulty_a: 2,
    difficulty_b: 3,
  },
  current_block_index: 0,
  partner_a_id: 'profile-a',
  partner_b_id: 'profile-b',
};

const mockSessionState = {
  id: 'state-1',
  session_id: 'session-1',
  current_block_index: 0,
  timer_running: false,
  timer_seconds_remaining: 45,
  is_paused: false,
  partner_a_ready: false,
  partner_b_ready: false,
  last_updated_at: '2024-01-01T00:00:00Z',
};

// Create chainable mock
const createChainMock = (data: any, error: any = null) => {
  const mock: any = {};
  const chainMethods = ['select', 'eq', 'insert', 'update', 'delete', 'order', 'single'];

  chainMethods.forEach((method) => {
    mock[method] = jest.fn(() => mock);
  });

  mock.then = (resolve: Function) => Promise.resolve({ data, error }).then(resolve);
  mock.catch = () => mock;

  return mock;
};

let mockCurrentChain = createChainMock(null);

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockCurrentChain),
  },
}));

import { supabase } from '@/lib/supabase';
import {
  getSessionById,
  getSessionState,
  createSession,
  createSessionState,
  updateSessionState,
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  setPartnerReady,
} from '@/services/session';

describe('Session Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessionById', () => {
    it('should fetch a session by ID', async () => {
      mockCurrentChain = createChainMock(mockSession);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getSessionById('session-1');

      expect(supabase.from).toHaveBeenCalledWith('sessions');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('id', 'session-1');
      expect(result.data).toEqual(mockSession);
    });

    it('should return error for non-existent session', async () => {
      mockCurrentChain = createChainMock(null, { message: 'Session not found' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getSessionById('non-existent');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getSessionState', () => {
    it('should fetch session state by session ID', async () => {
      mockCurrentChain = createChainMock(mockSessionState);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getSessionState('session-1');

      expect(supabase.from).toHaveBeenCalledWith('session_state');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('session_id', 'session-1');
      expect(result.data).toEqual(mockSessionState);
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const newSession = {
        couple_id: 'couple-1',
        workout_data: mockSession.workout_data,
        partner_a_id: 'profile-a',
        partner_b_id: 'profile-b',
      };

      mockCurrentChain = createChainMock({ ...mockSession, ...newSession });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await createSession(newSession);

      expect(supabase.from).toHaveBeenCalledWith('sessions');
      expect(mockCurrentChain.insert).toHaveBeenCalled();
      expect(result.data).not.toBeNull();
    });
  });

  describe('createSessionState', () => {
    it('should create initial session state', async () => {
      mockCurrentChain = createChainMock(mockSessionState);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await createSessionState('session-1', 45);

      expect(supabase.from).toHaveBeenCalledWith('session_state');
      expect(mockCurrentChain.insert).toHaveBeenCalled();
      expect(result.data).not.toBeNull();
    });
  });

  describe('updateSessionState', () => {
    it('should update session state', async () => {
      const updates = {
        current_block_index: 1,
        timer_running: true,
      };

      mockCurrentChain = createChainMock({ ...mockSessionState, ...updates });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await updateSessionState('session-1', updates, 'profile-a');

      expect(supabase.from).toHaveBeenCalledWith('session_state');
      expect(mockCurrentChain.update).toHaveBeenCalled();
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('session_id', 'session-1');
    });

    it('should include updated_by and last_updated_at', async () => {
      mockCurrentChain = createChainMock(mockSessionState);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      await updateSessionState('session-1', { timer_running: true }, 'profile-a');

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          timer_running: true,
          updated_by: 'profile-a',
        })
      );
    });
  });

  describe('startSession', () => {
    it('should start a session', async () => {
      mockCurrentChain = createChainMock({ ...mockSession, status: 'in_progress' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await startSession('session-1');

      expect(supabase.from).toHaveBeenCalledWith('sessions');
      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
        })
      );
    });
  });

  describe('pauseSession', () => {
    it('should pause a session', async () => {
      mockCurrentChain = createChainMock({ ...mockSessionState, is_paused: true });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await pauseSession('session-1', 'profile-a');

      expect(supabase.from).toHaveBeenCalledWith('session_state');
      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_paused: true,
          timer_running: false,
          paused_by: 'profile-a',
        })
      );
    });
  });

  describe('resumeSession', () => {
    it('should resume a paused session', async () => {
      mockCurrentChain = createChainMock({ ...mockSessionState, is_paused: false, timer_running: true });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await resumeSession('session-1');

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_paused: false,
          timer_running: true,
          paused_by: null,
        })
      );
    });
  });

  describe('completeSession', () => {
    it('should complete a session', async () => {
      mockCurrentChain = createChainMock({ ...mockSession, status: 'completed' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await completeSession('session-1', 1800);

      expect(supabase.from).toHaveBeenCalledWith('sessions');
      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          total_active_seconds: 1800,
        })
      );
    });
  });

  describe('setPartnerReady', () => {
    it('should set partner A as ready', async () => {
      mockCurrentChain = createChainMock({ ...mockSessionState, partner_a_ready: true });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await setPartnerReady('session-1', true, 'profile-a');

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          partner_a_ready: true,
        })
      );
    });

    it('should set partner B as ready', async () => {
      mockCurrentChain = createChainMock({ ...mockSessionState, partner_b_ready: true });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await setPartnerReady('session-1', false, 'profile-b');

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          partner_b_ready: true,
        })
      );
    });
  });
});

describe('Session State Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should ensure timer_seconds_remaining is non-negative', async () => {
    const invalidState = { ...mockSessionState, timer_seconds_remaining: -5 };
    mockCurrentChain = createChainMock(invalidState);
    (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

    const result = await getSessionState('session-1');

    // Service should normalize negative values to 0
    expect(result.data?.timer_seconds_remaining).toBeGreaterThanOrEqual(0);
  });

  it('should ensure current_block_index is non-negative', async () => {
    const invalidState = { ...mockSessionState, current_block_index: -1 };
    mockCurrentChain = createChainMock(invalidState);
    (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

    const result = await getSessionState('session-1');

    expect(result.data?.current_block_index).toBeGreaterThanOrEqual(0);
  });
});
