/**
 * Tests for Streak Service
 *
 * TDD Approach: Define expected streak calculation and update behavior.
 */

// Mock data
const mockCoupleData = {
  id: 'couple-1',
  current_streak: 5,
  longest_streak: 10,
  last_workout_at: '2024-01-05T10:00:00Z',
};

// Create chainable mock
const createChainMock = (data: any, error: any = null) => {
  const mock: any = {};
  const chainMethods = ['select', 'eq', 'update', 'single'];

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
  calculateStreakUpdate,
  getStreakData,
  updateStreak,
  isStreakActive,
} from '@/services/streak';

describe('Streak Calculation', () => {
  describe('calculateStreakUpdate', () => {
    it('should increment streak when workout is next day', () => {
      const lastWorkout = new Date('2024-01-05T10:00:00Z');
      const currentDate = new Date('2024-01-06T15:00:00Z');

      const result = calculateStreakUpdate(5, lastWorkout, currentDate, 10);

      expect(result.newStreak).toBe(6);
      expect(result.isNewRecord).toBe(false);
    });

    it('should maintain streak when workout is same day', () => {
      const lastWorkout = new Date('2024-01-05T10:00:00Z');
      const currentDate = new Date('2024-01-05T20:00:00Z');

      const result = calculateStreakUpdate(5, lastWorkout, currentDate);

      expect(result.newStreak).toBe(5);
      expect(result.streakMaintained).toBe(true);
    });

    it('should reset streak when more than 1 day has passed', () => {
      const lastWorkout = new Date('2024-01-05T10:00:00Z');
      const currentDate = new Date('2024-01-08T15:00:00Z');

      const result = calculateStreakUpdate(5, lastWorkout, currentDate);

      expect(result.newStreak).toBe(1);
      expect(result.streakBroken).toBe(true);
    });

    it('should start streak at 1 when no previous workout', () => {
      const result = calculateStreakUpdate(0, null, new Date());

      expect(result.newStreak).toBe(1);
    });

    it('should detect new record', () => {
      const lastWorkout = new Date('2024-01-05T10:00:00Z');
      const currentDate = new Date('2024-01-06T15:00:00Z');

      const result = calculateStreakUpdate(10, lastWorkout, currentDate, 10);

      expect(result.newStreak).toBe(11);
      expect(result.isNewRecord).toBe(true);
    });

    it('should handle timezone differences correctly', () => {
      // User completed workout at 11 PM on day 1
      const lastWorkout = new Date('2024-01-05T23:00:00Z');
      // User completes next workout at 6 AM on day 2
      const currentDate = new Date('2024-01-06T06:00:00Z');

      const result = calculateStreakUpdate(5, lastWorkout, currentDate);

      expect(result.newStreak).toBe(6);
    });
  });

  describe('isStreakActive', () => {
    it('should return true when workout was yesterday', () => {
      const lastWorkout = new Date();
      lastWorkout.setDate(lastWorkout.getDate() - 1);

      expect(isStreakActive(lastWorkout)).toBe(true);
    });

    it('should return true when workout was today', () => {
      const lastWorkout = new Date();

      expect(isStreakActive(lastWorkout)).toBe(true);
    });

    it('should return false when workout was 2+ days ago', () => {
      const lastWorkout = new Date();
      lastWorkout.setDate(lastWorkout.getDate() - 2);

      expect(isStreakActive(lastWorkout)).toBe(false);
    });

    it('should return false when no last workout', () => {
      expect(isStreakActive(null)).toBe(false);
    });
  });
});

describe('Streak Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStreakData', () => {
    it('should fetch streak data for a couple', async () => {
      mockCurrentChain = createChainMock(mockCoupleData);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getStreakData('couple-1');

      expect(supabase.from).toHaveBeenCalledWith('couples');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('id', 'couple-1');
      expect(result.data?.currentStreak).toBe(5);
      expect(result.data?.longestStreak).toBe(10);
    });

    it('should handle missing couple', async () => {
      mockCurrentChain = createChainMock(null, { message: 'Not found' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getStreakData('nonexistent');

      expect(result.error).toBeDefined();
    });
  });

  describe('updateStreak', () => {
    it('should update streak in database', async () => {
      mockCurrentChain = createChainMock({ ...mockCoupleData, current_streak: 6 });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await updateStreak('couple-1', 6);

      expect(supabase.from).toHaveBeenCalledWith('couples');
      expect(mockCurrentChain.update).toHaveBeenCalled();
    });

    it('should update longest streak when new record', async () => {
      mockCurrentChain = createChainMock({ ...mockCoupleData, current_streak: 11, longest_streak: 11 });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await updateStreak('couple-1', 11, true);

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_streak: 11,
          longest_streak: 11,
        })
      );
    });
  });
});
