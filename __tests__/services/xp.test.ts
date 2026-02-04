/**
 * Tests for XP Service
 *
 * TDD Approach: Define expected XP calculation and recording behavior.
 */

import { XP_PER_MINUTE, SOLO_XP_MULTIPLIER, STREAK_MULTIPLIERS } from '@/constants/app';

// Mock data
const mockXpTransaction = {
  id: 'xp-1',
  couple_id: 'couple-1',
  amount: 300,
  reason: 'workout_completed',
  session_id: 'session-1',
  multiplier: 1.0,
  base_amount: 300,
  created_at: '2024-01-01T10:00:00Z',
};

const mockCoupleData = {
  id: 'couple-1',
  total_xp: 1500,
  current_streak: 5,
  longest_streak: 10,
  last_workout_at: '2024-01-01T10:00:00Z',
};

// Create chainable mock
const createChainMock = (data: any, error: any = null) => {
  const mock: any = {};
  const chainMethods = ['select', 'eq', 'insert', 'update', 'single', 'order', 'limit'];

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
  calculateWorkoutXp,
  applyStreakMultiplier,
  recordXpTransaction,
  getXpHistory,
  getTotalXp,
  updateCoupleXp,
} from '@/services/xp';

describe('XP Calculation', () => {
  describe('calculateWorkoutXp', () => {
    it('should calculate base XP from workout duration', () => {
      const xp = calculateWorkoutXp({ durationMinutes: 30, isSolo: false });
      expect(xp).toBe(30 * XP_PER_MINUTE);
    });

    it('should apply solo multiplier for solo workouts', () => {
      const xp = calculateWorkoutXp({ durationMinutes: 30, isSolo: true });
      expect(xp).toBe(Math.round(30 * XP_PER_MINUTE * SOLO_XP_MULTIPLIER));
    });

    it('should handle zero duration', () => {
      const xp = calculateWorkoutXp({ durationMinutes: 0, isSolo: false });
      expect(xp).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 7 minutes * 10 XP/min * 0.25 = 17.5 -> 18
      const xp = calculateWorkoutXp({ durationMinutes: 7, isSolo: true });
      expect(Number.isInteger(xp)).toBe(true);
    });
  });

  describe('applyStreakMultiplier', () => {
    it('should apply 1.5x multiplier for 7+ day streak', () => {
      const xp = applyStreakMultiplier(100, 7);
      expect(xp).toBe(150);
    });

    it('should apply 2.0x multiplier for 30+ day streak', () => {
      const xp = applyStreakMultiplier(100, 30);
      expect(xp).toBe(200);
    });

    it('should not apply multiplier for less than 7 days', () => {
      const xp = applyStreakMultiplier(100, 5);
      expect(xp).toBe(100);
    });

    it('should handle exactly 7 days', () => {
      const xp = applyStreakMultiplier(100, 7);
      expect(xp).toBe(150);
    });

    it('should use highest applicable multiplier', () => {
      const xp = applyStreakMultiplier(100, 35);
      expect(xp).toBe(200); // 30+ day multiplier
    });
  });
});

describe('XP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordXpTransaction', () => {
    it('should record XP transaction to database', async () => {
      mockCurrentChain = createChainMock(mockXpTransaction);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await recordXpTransaction({
        coupleId: 'couple-1',
        amount: 300,
        reason: 'workout_completed',
        sessionId: 'session-1',
        multiplier: 1.0,
        baseAmount: 300,
      });

      expect(supabase.from).toHaveBeenCalledWith('xp_transactions');
      expect(mockCurrentChain.insert).toHaveBeenCalled();
      expect(result.data).not.toBeNull();
    });

    it('should handle database errors', async () => {
      mockCurrentChain = createChainMock(null, { message: 'Database error' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await recordXpTransaction({
        coupleId: 'couple-1',
        amount: 300,
        reason: 'workout_completed',
      });

      expect(result.error).toBeDefined();
    });
  });

  describe('getXpHistory', () => {
    it('should fetch XP transactions for a couple', async () => {
      const mockTransactions = [mockXpTransaction];
      mockCurrentChain = createChainMock(mockTransactions);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getXpHistory('couple-1');

      expect(supabase.from).toHaveBeenCalledWith('xp_transactions');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('couple_id', 'couple-1');
      expect(result.data).toEqual(mockTransactions);
    });

    it('should order by created_at descending', async () => {
      mockCurrentChain = createChainMock([]);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      await getXpHistory('couple-1');

      expect(mockCurrentChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should respect limit parameter', async () => {
      mockCurrentChain = createChainMock([]);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      await getXpHistory('couple-1', 10);

      expect(mockCurrentChain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getTotalXp', () => {
    it('should fetch total XP for a couple', async () => {
      mockCurrentChain = createChainMock(mockCoupleData);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getTotalXp('couple-1');

      expect(supabase.from).toHaveBeenCalledWith('couples');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('id', 'couple-1');
      expect(result.data).toBe(1500);
    });
  });

  describe('updateCoupleXp', () => {
    it('should update couple total XP', async () => {
      mockCurrentChain = createChainMock({ ...mockCoupleData, total_xp: 1800 });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await updateCoupleXp('couple-1', 300);

      expect(supabase.from).toHaveBeenCalledWith('couples');
      expect(mockCurrentChain.update).toHaveBeenCalled();
    });
  });
});
