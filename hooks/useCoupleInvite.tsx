/**
 * useCoupleInvite Hook
 *
 * Manages the couple invite flow - creating invites and joining couples.
 *
 * Principles:
 * - Separate hooks for invite creation and joining
 * - Clear validation before join
 * - React Query for state management
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile, profileKeys } from './useProfile';
import {
  createCouple,
  joinCouple,
  validateJoinCouple,
  regenerateInviteCode,
  CoupleWithPartners,
} from '@/services/couple';
import {
  getInviteShareUrl,
  formatExpirationTime,
  isInviteExpired,
} from '@/utils/invite';
import type { Couple } from '@/types/database';

/**
 * Hook for creating and managing invites
 * Used by the user who wants to invite their partner
 */
export function useCoupleInvite() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [couple, setCouple] = useState<Couple | null>(null);

  /**
   * Create a new couple/invite
   */
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('Profile not found');
      }

      const result = await createCouple(profile.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      setCouple(data);
      // Invalidate profile queries to reflect new couple
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });

  /**
   * Regenerate the invite code
   */
  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      if (!couple?.id) {
        throw new Error('No couple to regenerate code for');
      }

      const result = await regenerateInviteCode(couple.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      setCouple(data);
    },
  });

  // Computed values
  const inviteCode = couple?.invite_code ?? null;
  const shareUrl = inviteCode ? getInviteShareUrl(inviteCode) : null;
  const expiresIn = couple?.invite_expires_at
    ? formatExpirationTime(couple.invite_expires_at)
    : null;
  const isExpired = couple?.invite_expires_at
    ? isInviteExpired(couple.invite_expires_at)
    : false;

  return {
    // State
    couple,
    inviteCode,
    shareUrl,
    expiresIn,
    isExpired,

    // Loading states
    isCreating: createInviteMutation.isPending,
    isRegenerating: regenerateCodeMutation.isPending,

    // Error state
    error: createInviteMutation.error ?? regenerateCodeMutation.error,

    // Actions
    createInvite: createInviteMutation.mutateAsync,
    regenerateCode: regenerateCodeMutation.mutateAsync,
  };
}

/**
 * Validation result from validateJoinCouple
 */
interface ValidationResult {
  canJoin: boolean;
  reason?: string;
  couple?: CoupleWithPartners;
}

/**
 * Hook for joining an existing couple
 * Used by the user who received an invite code
 */
export function useJoinCouple() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  /**
   * Validate an invite code
   */
  const validateCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!profile?.id) {
        throw new Error('Profile not found');
      }

      const result = await validateJoinCouple(code, profile.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (data) => {
      setValidationResult(data);
    },
  });

  /**
   * Join the validated couple
   */
  const joinCoupleMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('Profile not found');
      }

      if (!validationResult?.canJoin || !validationResult?.couple?.id) {
        throw new Error('No valid couple to join');
      }

      const result = await joinCouple(validationResult.couple.id, profile.id);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      setHasJoined(true);
      // Invalidate profile queries to reflect joined couple
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });

  /**
   * Reset the validation state
   */
  const reset = useCallback(() => {
    setValidationResult(null);
    setHasJoined(false);
  }, []);

  // Computed values
  const partnerName = validationResult?.couple?.partner_a?.display_name ?? null;

  return {
    // State
    validationResult,
    hasJoined,
    partnerName,

    // Loading states
    isValidating: validateCodeMutation.isPending,
    isJoining: joinCoupleMutation.isPending,

    // Error state
    error: validateCodeMutation.error ?? joinCoupleMutation.error,

    // Actions
    validateCode: validateCodeMutation.mutateAsync,
    join: joinCoupleMutation.mutateAsync,
    reset,
  };
}
