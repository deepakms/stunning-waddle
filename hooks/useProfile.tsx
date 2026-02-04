/**
 * useProfile Hook
 *
 * Fetches and manages the current user's profile data.
 * Uses React Query for caching and automatic refetching.
 *
 * Principles:
 * - React Query for server state management
 * - Automatic profile creation if missing
 * - Optimistic updates for better UX
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  getProfileByUserId,
  createProfile,
  updateProfile,
  getProfileWithCouple,
} from '@/services/profile';
import type { Profile, ProfileUpdate } from '@/types/database';

/**
 * Profile query keys for React Query
 */
export const profileKeys = {
  all: ['profiles'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
  byId: (id: string) => [...profileKeys.all, 'detail', id] as const,
  withCouple: () => [...profileKeys.all, 'withCouple'] as const,
};

/**
 * Hook to fetch and manage the current user's profile
 */
export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Fetch current user's profile
   */
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const result = await getProfileByUserId(user.id);

      if (result.error) {
        // If profile doesn't exist, it might need to be created
        if (result.error.message.includes('not found') || result.error.message.includes('no rows')) {
          return null;
        }
        throw new Error(result.error.message);
      }

      return result.data;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  /**
   * Fetch profile with couple data
   */
  const {
    data: profileWithCouple,
    isLoading: isLoadingWithCouple,
  } = useQuery({
    queryKey: profileKeys.withCouple(),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const result = await getProfileWithCouple(user.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    enabled: isAuthenticated && !!user?.id && !!profile,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  /**
   * Create profile mutation
   */
  const createProfileMutation = useMutation({
    mutationFn: async (data: { display_name: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const result = await createProfile({
        user_id: user.id,
        display_name: data.display_name,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (newProfile) => {
      queryClient.setQueryData(profileKeys.current(), newProfile);
    },
  });

  /**
   * Update profile mutation with optimistic updates
   */
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!profile?.id) {
        throw new Error('No profile to update');
      }

      const result = await updateProfile(profile.id, updates);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.current() });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<Profile>(profileKeys.current());

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData(profileKeys.current(), {
          ...previousProfile,
          ...updates,
        });
      }

      return { previousProfile };
    },
    onError: (err, updates, context) => {
      // Rollback to the previous value on error
      if (context?.previousProfile) {
        queryClient.setQueryData(profileKeys.current(), context.previousProfile);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });

  return {
    // Profile data
    profile,
    profileWithCouple,

    // Loading states
    isLoading,
    isLoadingWithCouple,
    isUpdating: updateProfileMutation.isPending,
    isCreating: createProfileMutation.isPending,

    // Error state
    error: error as Error | null,

    // Actions
    createProfile: createProfileMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    refetch,

    // Computed values
    hasProfile: !!profile,
    hasCouple: !!profileWithCouple?.couple,
    isOnboarded: !!profile?.onboarding_completed_at,
  };
}

/**
 * Hook to check if user needs onboarding
 */
export function useNeedsOnboarding() {
  const { profile, isLoading, hasProfile } = useProfile();

  return {
    needsOnboarding: hasProfile && !profile?.onboarding_completed_at,
    needsProfile: !hasProfile && !isLoading,
    isLoading,
  };
}
