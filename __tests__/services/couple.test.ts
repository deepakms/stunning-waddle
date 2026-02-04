/**
 * Tests for Couple Service
 *
 * TDD Approach: Define expected couple operations before implementation.
 */

// Create mock functions first
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }));
const mockEq = jest.fn(() => ({ single: mockSingle, select: mockSelect, maybeSingle: mockMaybeSingle }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockUpdate = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({
  select: () => ({ eq: mockEq, single: mockSingle }),
  insert: mockInsert,
  update: mockUpdate,
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

import {
  createCouple,
  getCoupleByInviteCode,
  joinCouple,
  getCouple,
  regenerateInviteCode,
  leaveCouple,
} from '@/services/couple';

describe('Couple Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCouple', () => {
    it('should create a new couple with invite code', async () => {
      const mockCouple = {
        id: 'couple-123',
        invite_code: 'ABCD5678',
        invite_expires_at: '2024-01-08T00:00:00Z',
        status: 'pending',
        partner_a_id: 'profile-123',
      };

      mockSingle.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const result = await createCouple('profile-123');

      expect(mockFrom).toHaveBeenCalledWith('couples');
      expect(result.data).toEqual(mockCouple);
      expect(result.error).toBeNull();
    });

    it('should set invite expiration to 7 days', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'couple-123' },
        error: null,
      });

      await createCouple('profile-123');

      expect(mockInsert).toHaveBeenCalled();
      const insertCall = mockInsert.mock.calls[0][0];

      // Check that expires_at is approximately 7 days from now
      const expiresAt = new Date(insertCall.invite_expires_at);
      const now = new Date();
      const daysDiff = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('should return error if user already in couple', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'User already in a couple' },
      });

      const result = await createCouple('profile-123');

      expect(result.error).toBeTruthy();
    });
  });

  describe('getCoupleByInviteCode', () => {
    it('should find couple by valid invite code', async () => {
      const mockCouple = {
        id: 'couple-123',
        invite_code: 'ABCD5678',
        status: 'pending',
        partner_a: { id: 'profile-123', display_name: 'John' },
      };

      mockMaybeSingle.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const result = await getCoupleByInviteCode('ABCD5678');

      expect(result.data).toEqual(mockCouple);
    });

    it('should return null for non-existent code', async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getCoupleByInviteCode('INVALID1');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('joinCouple', () => {
    it('should link joining user to couple', async () => {
      const mockCouple = {
        id: 'couple-123',
        status: 'active',
        partner_a_id: 'profile-123',
        partner_b_id: 'profile-456',
        activated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const result = await joinCouple('couple-123', 'profile-456');

      expect(mockFrom).toHaveBeenCalledWith('couples');
      expect(result.data?.status).toBe('active');
      expect(result.data?.partner_b_id).toBe('profile-456');
    });

    it('should set activated_at timestamp', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'couple-123', activated_at: expect.any(String) },
        error: null,
      });

      await joinCouple('couple-123', 'profile-456');

      expect(mockUpdate).toHaveBeenCalled();
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.activated_at).toBeDefined();
    });

    it('should return error if couple already full', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Couple already has two partners' },
      });

      const result = await joinCouple('couple-123', 'profile-456');

      expect(result.error).toBeTruthy();
    });
  });

  describe('getCouple', () => {
    it('should fetch couple with both partner profiles', async () => {
      const mockCouple = {
        id: 'couple-123',
        status: 'active',
        partner_a: { id: 'profile-123', display_name: 'John' },
        partner_b: { id: 'profile-456', display_name: 'Jane' },
        total_xp: 500,
        current_streak: 7,
      };

      mockSingle.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const result = await getCouple('couple-123');

      expect(result.data).toEqual(mockCouple);
    });
  });

  describe('regenerateInviteCode', () => {
    it('should generate new invite code', async () => {
      const mockCouple = {
        id: 'couple-123',
        invite_code: 'NEWCODE1',
        invite_expires_at: '2024-01-15T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const result = await regenerateInviteCode('couple-123');

      expect(result.data?.invite_code).toBeDefined();
      expect(result.data?.invite_code).toHaveLength(8);
    });

    it('should reset expiration to 7 days', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'couple-123' },
        error: null,
      });

      await regenerateInviteCode('couple-123');

      const updateCall = mockUpdate.mock.calls[0][0];
      const expiresAt = new Date(updateCall.invite_expires_at);
      const now = new Date();
      const daysDiff = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });
  });

  describe('leaveCouple', () => {
    it('should remove user from couple', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'couple-123', partner_b_id: null },
        error: null,
      });

      const result = await leaveCouple('couple-123', 'profile-456', 'partner_b');

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should deactivate couple if last person leaves', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'couple-123', status: 'inactive' },
        error: null,
      });

      const result = await leaveCouple('couple-123', 'profile-123', 'partner_a');

      expect(result.data?.status).toBe('inactive');
    });
  });
});
