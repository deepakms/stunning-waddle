/**
 * Tests for Bet Service
 *
 * TDD Approach: Define expected bet creation and resolution behavior.
 */

// Mock data
const mockBet = {
  id: 'bet-1',
  couple_id: 'couple-1',
  challenger_id: 'profile-a',
  challenger_stake: 'Loser makes dinner',
  challenged_stake: 'Loser does dishes',
  metric: 'total_reps',
  starts_at: '2024-01-01T00:00:00Z',
  ends_at: '2024-01-07T23:59:59Z',
  status: 'pending',
  challenger_score: null,
  challenged_score: null,
  winner_id: null,
  created_at: '2024-01-01T00:00:00Z',
};

const mockActiveBet = {
  ...mockBet,
  status: 'active',
  challenger_score: 150,
  challenged_score: 120,
};

// Create chainable mock
const createChainMock = (data: any, error: any = null) => {
  const mock: any = {};
  const chainMethods = ['select', 'eq', 'insert', 'update', 'single', 'order', 'in'];

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
  createBet,
  acceptBet,
  getBetById,
  getActiveBet,
  getBetHistory,
  updateBetScore,
  resolveBet,
  cancelBet,
  getBetMetricLabel,
} from '@/services/bet';

describe('Bet Helpers', () => {
  describe('getBetMetricLabel', () => {
    it('should return label for total_reps', () => {
      expect(getBetMetricLabel('total_reps')).toBe('Total Reps');
    });

    it('should return label for total_sessions', () => {
      expect(getBetMetricLabel('total_sessions')).toBe('Total Sessions');
    });

    it('should return label for total_minutes', () => {
      expect(getBetMetricLabel('total_minutes')).toBe('Total Minutes');
    });

    it('should return label for streak_days', () => {
      expect(getBetMetricLabel('streak_days')).toBe('Streak Days');
    });

    it('should return label for xp_earned', () => {
      expect(getBetMetricLabel('xp_earned')).toBe('XP Earned');
    });

    it('should return Custom for custom metric', () => {
      expect(getBetMetricLabel('custom')).toBe('Custom');
    });
  });
});

describe('Bet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBet', () => {
    it('should create a new bet', async () => {
      mockCurrentChain = createChainMock(mockBet);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await createBet({
        coupleId: 'couple-1',
        challengerId: 'profile-a',
        challengerStake: 'Loser makes dinner',
        challengedStake: 'Loser does dishes',
        metric: 'total_reps',
        startsAt: '2024-01-01T00:00:00Z',
        endsAt: '2024-01-07T23:59:59Z',
      });

      expect(supabase.from).toHaveBeenCalledWith('bets');
      expect(mockCurrentChain.insert).toHaveBeenCalled();
      expect(result.data).not.toBeNull();
    });

    it('should set status to pending on creation', async () => {
      mockCurrentChain = createChainMock(mockBet);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      await createBet({
        coupleId: 'couple-1',
        challengerId: 'profile-a',
        challengerStake: 'Test',
        challengedStake: 'Test',
        metric: 'total_reps',
        startsAt: '2024-01-01T00:00:00Z',
        endsAt: '2024-01-07T23:59:59Z',
      });

      expect(mockCurrentChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });
  });

  describe('acceptBet', () => {
    it('should update bet status to accepted', async () => {
      mockCurrentChain = createChainMock({ ...mockBet, status: 'accepted' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await acceptBet('bet-1');

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'accepted' })
      );
    });
  });

  describe('getBetById', () => {
    it('should fetch a bet by ID', async () => {
      mockCurrentChain = createChainMock(mockBet);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getBetById('bet-1');

      expect(supabase.from).toHaveBeenCalledWith('bets');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('id', 'bet-1');
      expect(result.data).toEqual(mockBet);
    });
  });

  describe('getActiveBet', () => {
    it('should fetch active bet for couple', async () => {
      mockCurrentChain = createChainMock(mockActiveBet);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getActiveBet('couple-1');

      expect(supabase.from).toHaveBeenCalledWith('bets');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('couple_id', 'couple-1');
      expect(mockCurrentChain.in).toHaveBeenCalledWith('status', ['pending', 'accepted', 'active']);
    });

    it('should return null when no active bet', async () => {
      mockCurrentChain = createChainMock(null);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getActiveBet('couple-1');

      expect(result.data).toBeNull();
    });
  });

  describe('getBetHistory', () => {
    it('should fetch bet history for couple', async () => {
      const mockBets = [mockBet, { ...mockBet, id: 'bet-2' }];
      mockCurrentChain = createChainMock(mockBets);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getBetHistory('couple-1');

      expect(supabase.from).toHaveBeenCalledWith('bets');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('couple_id', 'couple-1');
      expect(mockCurrentChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('updateBetScore', () => {
    it('should update challenger score', async () => {
      mockCurrentChain = createChainMock({ ...mockActiveBet, challenger_score: 200 });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await updateBetScore('bet-1', 'challenger', 200);

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ challenger_score: 200 })
      );
    });

    it('should update challenged score', async () => {
      mockCurrentChain = createChainMock({ ...mockActiveBet, challenged_score: 180 });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await updateBetScore('bet-1', 'challenged', 180);

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ challenged_score: 180 })
      );
    });
  });

  describe('resolveBet', () => {
    it('should resolve bet with winner', async () => {
      mockCurrentChain = createChainMock({ ...mockActiveBet, status: 'completed', winner_id: 'profile-a' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await resolveBet('bet-1', 'profile-a');

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          winner_id: 'profile-a',
        })
      );
    });
  });

  describe('cancelBet', () => {
    it('should cancel a bet', async () => {
      mockCurrentChain = createChainMock({ ...mockBet, status: 'cancelled' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await cancelBet('bet-1');

      expect(mockCurrentChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' })
      );
    });
  });
});
