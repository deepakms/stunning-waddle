/**
 * Tests for useProfile hook
 *
 * TDD Approach: Define expected profile fetching behavior.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock useAuth
const mockUser = { id: 'user-123', email: 'test@example.com' };
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

// Mock profile service
const mockGetProfileByUserId = jest.fn();
const mockGetProfileWithCouple = jest.fn();
const mockCreateProfile = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('@/services/profile', () => ({
  getProfileByUserId: (userId: string) => mockGetProfileByUserId(userId),
  getProfileWithCouple: (userId: string) => mockGetProfileWithCouple(userId),
  createProfile: (data: unknown) => mockCreateProfile(data),
  updateProfile: (id: string, data: unknown) => mockUpdateProfile(id, data),
}));

import { useProfile, useNeedsOnboarding, profileKeys } from '@/hooks/useProfile';

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

describe('useProfile Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Fetching', () => {
    it('should fetch user profile on mount', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
        fitness_level: 3,
      };

      mockGetProfileByUserId.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetProfileByUserId).toHaveBeenCalledWith('user-123');
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.hasProfile).toBe(true);
    });

    it('should return null profile when not found', async () => {
      mockGetProfileByUserId.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.hasProfile).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Errors like "not found" result in null profile, not thrown errors
      mockGetProfileByUserId.mockResolvedValue({
        data: null,
        error: { message: 'no rows returned' },
      });

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).toBeNull();
      });

      // "no rows" is treated as missing profile, not an error
      expect(result.current.hasProfile).toBe(false);
    });
  });

  describe('Profile with Couple', () => {
    it('should set hasCouple based on couple data in profileWithCouple', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
      };

      mockGetProfileByUserId.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      // The hasCouple check happens when profileWithCouple query runs
      // For this test, we just verify the initial state
      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull();
      });

      // Initially hasCouple is false until couple data is fetched
      expect(result.current.hasCouple).toBe(false);
    });
  });

  describe('Computed Values', () => {
    it('should compute isOnboarded correctly', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
        onboarding_completed_at: '2024-01-01T00:00:00Z',
      };

      mockGetProfileByUserId.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isOnboarded).toBe(true);
      });
    });

    it('should return isOnboarded false when not completed', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
        onboarding_completed_at: null,
      };

      mockGetProfileByUserId.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull();
      });

      expect(result.current.isOnboarded).toBe(false);
    });
  });

  describe('profileKeys', () => {
    it('should generate correct query keys', () => {
      expect(profileKeys.all).toEqual(['profiles']);
      expect(profileKeys.current()).toEqual(['profiles', 'current']);
      expect(profileKeys.byId('123')).toEqual(['profiles', 'detail', '123']);
      expect(profileKeys.withCouple()).toEqual(['profiles', 'withCouple']);
    });
  });
});

describe('useNeedsOnboarding Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return needsOnboarding true when profile exists but not onboarded', async () => {
    const mockProfile = {
      id: 'profile-123',
      user_id: 'user-123',
      display_name: 'John Doe',
      onboarding_completed_at: null,
    };

    mockGetProfileByUserId.mockResolvedValue({
      data: mockProfile,
      error: null,
    });

    const { result } = renderHook(() => useNeedsOnboarding(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.needsProfile).toBe(false);
  });

  it('should return needsProfile true when no profile exists', async () => {
    mockGetProfileByUserId.mockResolvedValue({
      data: null,
      error: { message: 'Profile not found' },
    });

    const { result } = renderHook(() => useNeedsOnboarding(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.needsProfile).toBe(true);
    expect(result.current.needsOnboarding).toBe(false);
  });
});
