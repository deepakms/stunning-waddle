/**
 * Tests for useCoupleInvite hook
 *
 * TDD Approach: Define expected invite flow behavior before implementation.
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock useAuth
const mockUser = { id: 'user-123', email: 'test@example.com' };
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

// Mock useProfile
const mockProfile = { id: 'profile-123', user_id: 'user-123', couple_id: null };
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: mockProfile,
    hasCouple: false,
    refetch: jest.fn(),
  }),
  profileKeys: {
    all: ['profiles'],
    current: () => ['profiles', 'current'],
    byId: (id: string) => ['profiles', 'detail', id],
    withCouple: () => ['profiles', 'withCouple'],
  },
}));

// Mock couple service
const mockCreateCouple = jest.fn();
const mockGetCoupleByInviteCode = jest.fn();
const mockJoinCouple = jest.fn();
const mockValidateJoinCouple = jest.fn();
const mockRegenerateInviteCode = jest.fn();

jest.mock('@/services/couple', () => ({
  createCouple: (profileId: string) => mockCreateCouple(profileId),
  getCoupleByInviteCode: (code: string) => mockGetCoupleByInviteCode(code),
  joinCouple: (coupleId: string, profileId: string) => mockJoinCouple(coupleId, profileId),
  validateJoinCouple: (code: string, profileId: string) => mockValidateJoinCouple(code, profileId),
  regenerateInviteCode: (coupleId: string) => mockRegenerateInviteCode(coupleId),
}));

import { useCoupleInvite, useJoinCouple } from '@/hooks/useCoupleInvite';

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCoupleInvite Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Invite', () => {
    it('should create a new couple and return invite details', async () => {
      const mockCouple = {
        id: 'couple-123',
        partner_a_id: 'profile-123',
        invite_code: 'ABCD5678',
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      };

      mockCreateCouple.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const { result } = renderHook(() => useCoupleInvite(), {
        wrapper: createWrapper(),
      });

      expect(result.current.couple).toBeNull();

      await act(async () => {
        await result.current.createInvite();
      });

      expect(mockCreateCouple).toHaveBeenCalledWith('profile-123');
      expect(result.current.couple).toEqual(mockCouple);
      expect(result.current.inviteCode).toBe('ABCD5678');
    });

    it('should handle create invite error', async () => {
      mockCreateCouple.mockResolvedValue({
        data: null,
        error: { message: 'Failed to create couple' },
      });

      const { result } = renderHook(() => useCoupleInvite(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.createInvite();
        })
      ).rejects.toThrow('Failed to create couple');
    });
  });

  describe('Regenerate Code', () => {
    it('should regenerate invite code for existing couple', async () => {
      const originalCouple = {
        id: 'couple-123',
        invite_code: 'ABCD5678',
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const updatedCouple = {
        ...originalCouple,
        invite_code: 'NEWC8765',
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockCreateCouple.mockResolvedValue({
        data: originalCouple,
        error: null,
      });

      mockRegenerateInviteCode.mockResolvedValue({
        data: updatedCouple,
        error: null,
      });

      const { result } = renderHook(() => useCoupleInvite(), {
        wrapper: createWrapper(),
      });

      // First create a couple
      await act(async () => {
        await result.current.createInvite();
      });

      // Then regenerate code
      await act(async () => {
        await result.current.regenerateCode();
      });

      expect(mockRegenerateInviteCode).toHaveBeenCalledWith('couple-123');
      expect(result.current.inviteCode).toBe('NEWC8765');
    });
  });

  describe('Share URL', () => {
    it('should return the correct share URL', async () => {
      const mockCouple = {
        id: 'couple-123',
        invite_code: 'ABCD5678',
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockCreateCouple.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const { result } = renderHook(() => useCoupleInvite(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createInvite();
      });

      expect(result.current.shareUrl).toBe('couplesworkout://invite/ABCD5678');
    });
  });

  describe('Expiration Time', () => {
    it('should format expiration time correctly', async () => {
      // Set expiration to exactly 5 days + 1 hour from now to ensure we get "5 days"
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 5);
      expiresAt.setHours(expiresAt.getHours() + 1);

      const mockCouple = {
        id: 'couple-123',
        invite_code: 'ABCD5678',
        invite_expires_at: expiresAt.toISOString(),
      };

      mockCreateCouple.mockResolvedValue({
        data: mockCouple,
        error: null,
      });

      const { result } = renderHook(() => useCoupleInvite(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createInvite();
      });

      // Should be 5 days (since we have 5 days + 1 hour)
      expect(result.current.expiresIn).toBe('5 days');
    });
  });
});

describe('useJoinCouple Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validate Code', () => {
    it('should validate a valid invite code', async () => {
      const mockCouple = {
        id: 'couple-123',
        partner_a_id: 'other-profile-456',
        partner_a: { id: 'other-profile-456', display_name: 'Partner A', user_id: 'other-user' },
        invite_code: 'ABCD5678',
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      };

      mockValidateJoinCouple.mockResolvedValue({
        data: { canJoin: true, couple: mockCouple },
        error: null,
      });

      const { result } = renderHook(() => useJoinCouple(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.validateCode('ABCD5678');
      });

      expect(mockValidateJoinCouple).toHaveBeenCalledWith('ABCD5678', 'profile-123');
      expect(result.current.validationResult?.canJoin).toBe(true);
      expect(result.current.partnerName).toBe('Partner A');
    });

    it('should handle invalid code', async () => {
      mockValidateJoinCouple.mockResolvedValue({
        data: { canJoin: false, reason: 'Invalid invite code' },
        error: null,
      });

      const { result } = renderHook(() => useJoinCouple(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.validateCode('INVALID8');
      });

      expect(result.current.validationResult?.canJoin).toBe(false);
      expect(result.current.validationResult?.reason).toBe('Invalid invite code');
    });

    it('should handle expired code', async () => {
      mockValidateJoinCouple.mockResolvedValue({
        data: { canJoin: false, reason: 'This invite code has expired' },
        error: null,
      });

      const { result } = renderHook(() => useJoinCouple(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.validateCode('EXPIRED8');
      });

      expect(result.current.validationResult?.canJoin).toBe(false);
      expect(result.current.validationResult?.reason).toBe('This invite code has expired');
    });
  });

  describe('Join Couple', () => {
    it('should join a couple successfully', async () => {
      const mockCouple = {
        id: 'couple-123',
        partner_a_id: 'other-profile-456',
        partner_a: { id: 'other-profile-456', display_name: 'Partner A', user_id: 'other-user' },
        invite_code: 'ABCD5678',
        status: 'pending',
      };

      const joinedCouple = {
        ...mockCouple,
        partner_b_id: 'profile-123',
        status: 'active',
      };

      mockValidateJoinCouple.mockResolvedValue({
        data: { canJoin: true, couple: mockCouple },
        error: null,
      });

      mockJoinCouple.mockResolvedValue({
        data: joinedCouple,
        error: null,
      });

      const { result } = renderHook(() => useJoinCouple(), {
        wrapper: createWrapper(),
      });

      // First validate
      await act(async () => {
        await result.current.validateCode('ABCD5678');
      });

      // Then join
      await act(async () => {
        await result.current.join();
      });

      expect(mockJoinCouple).toHaveBeenCalledWith('couple-123', 'profile-123');
      expect(result.current.hasJoined).toBe(true);
    });

    it('should not allow join without validation', async () => {
      const { result } = renderHook(() => useJoinCouple(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.join();
        })
      ).rejects.toThrow('No valid couple to join');
    });
  });

  describe('Reset', () => {
    it('should reset validation state', async () => {
      mockValidateJoinCouple.mockResolvedValue({
        data: { canJoin: true, couple: { id: 'couple-123' } },
        error: null,
      });

      const { result } = renderHook(() => useJoinCouple(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.validateCode('ABCD5678');
      });

      expect(result.current.validationResult).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.validationResult).toBeNull();
      expect(result.current.partnerName).toBeNull();
    });
  });
});
