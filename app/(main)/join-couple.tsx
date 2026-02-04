/**
 * Join Couple Screen
 *
 * Allows user to enter an invite code to join their partner's couple.
 * Handles code validation, partner preview, and joining flow.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useJoinCouple } from '@/hooks/useCoupleInvite';
import { useProfile } from '@/hooks/useProfile';
import { isValidInviteCode } from '@/utils/invite';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS, SPACING, FONT_SIZES, INVITE_CODE_LENGTH } from '@/constants/app';

export default function JoinCoupleScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { hasCouple } = useProfile();
  const {
    validationResult,
    hasJoined,
    partnerName,
    isValidating,
    isJoining,
    error,
    validateCode,
    join,
    reset,
  } = useJoinCouple();

  const [code, setCode] = useState(params.code ?? '');
  const [inputError, setInputError] = useState<string | null>(null);

  // Handle deep link with code - validate on mount if code is in params
  useEffect(() => {
    const codeFromParams = params.code;
    if (codeFromParams && isValidInviteCode(codeFromParams)) {
      validateCode(codeFromParams).catch(() => {
        // Error is handled by the hook
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]); // Only run when params.code changes

  // Redirect after successful join
  useEffect(() => {
    if (hasJoined) {
      // Short delay to show success message
      const timeout = setTimeout(() => {
        router.replace('/(main)/home');
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [hasJoined]);

  // If user already has a couple, show different UI
  if (hasCouple && !hasJoined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Already Connected</Text>
            <Text style={styles.subtitle}>
              You're already connected with a partner. You can only be in one couple at a time.
            </Text>
            <Button
              title="Go to Home"
              onPress={() => router.replace('/(main)/home')}
              style={styles.primaryButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleCodeChange = (text: string) => {
    // Convert to uppercase and remove invalid characters
    const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(formatted);
    setInputError(null);
    reset();
  };

  const handleValidate = async (codeToValidate?: string) => {
    const codeValue = codeToValidate ?? code;

    // Client-side validation
    if (!codeValue || codeValue.length !== INVITE_CODE_LENGTH) {
      setInputError(`Code must be ${INVITE_CODE_LENGTH} characters`);
      return;
    }

    if (!isValidInviteCode(codeValue)) {
      setInputError('Invalid code format');
      return;
    }

    setInputError(null);

    try {
      await validateCode(codeValue);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleJoin = async () => {
    if (!validationResult?.canJoin) return;

    try {
      await join();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  // Success state
  if (hasJoined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>You're Connected!</Text>
          <Text style={styles.successText}>
            You and {partnerName} are now workout partners. Let's get started!
          </Text>
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.redirectLoader}
          />
          <Text style={styles.redirectText}>Redirecting to home...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Join Your Partner</Text>
            <Text style={styles.subtitle}>
              Enter the invite code your partner shared with you
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.inputSection}>
            <Input
              label="Invite Code"
              value={code}
              onChangeText={handleCodeChange}
              placeholder="ABCD5678"
              maxLength={INVITE_CODE_LENGTH}
              autoCapitalize="characters"
              autoCorrect={false}
              error={inputError ?? undefined}
              testID="invite-code-input"
            />

            <Button
              title={isValidating ? 'Checking...' : 'Check Code'}
              onPress={() => handleValidate()}
              loading={isValidating}
              disabled={code.length !== INVITE_CODE_LENGTH || isValidating}
              style={styles.validateButton}
            />
          </View>

          {/* Validation Result */}
          {validationResult && (
            <View style={styles.resultSection}>
              {validationResult.canJoin ? (
                <View style={styles.successCard}>
                  <Text style={styles.successCardTitle}>Partner Found!</Text>
                  <View style={styles.partnerInfo}>
                    <View style={styles.partnerAvatar}>
                      <Text style={styles.partnerInitial}>
                        {partnerName?.charAt(0).toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <Text style={styles.partnerName}>{partnerName}</Text>
                  </View>
                  <Text style={styles.confirmText}>
                    Do you want to join as their workout partner?
                  </Text>
                  <Button
                    title={isJoining ? 'Joining...' : 'Join Partner'}
                    onPress={handleJoin}
                    loading={isJoining}
                    disabled={isJoining}
                    style={styles.joinButton}
                  />
                </View>
              ) : (
                <View style={styles.errorCard}>
                  <Text style={styles.errorCardTitle}>Cannot Join</Text>
                  <Text style={styles.errorCardMessage}>
                    {validationResult.reason}
                  </Text>
                  <Button
                    title="Try Different Code"
                    onPress={() => {
                      setCode('');
                      reset();
                    }}
                    variant="outline"
                    style={styles.tryAgainButton}
                  />
                </View>
              )}
            </View>
          )}

          {/* Error from API */}
          {error && !validationResult && (
            <View style={styles.errorCard}>
              <Text style={styles.errorCardTitle}>Something went wrong</Text>
              <Text style={styles.errorCardMessage}>{error.message}</Text>
            </View>
          )}

          {/* Create Invite Link */}
          <View style={styles.createSection}>
            <Text style={styles.createText}>
              Don't have an invite code? Create your own!
            </Text>
            <Button
              title="Create Invite"
              onPress={() => router.push('/(main)/invite')}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    paddingVertical: SPACING.sm,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: SPACING.lg,
  },
  validateButton: {
    marginTop: SPACING.sm,
  },
  resultSection: {
    marginBottom: SPACING.lg,
  },
  successCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  successCardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#059669',
    marginBottom: SPACING.md,
  },
  partnerInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  partnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  partnerInitial: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: '#ffffff',
  },
  partnerName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  joinButton: {
    minWidth: 160,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  errorCardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  errorCardMessage: {
    fontSize: FONT_SIZES.md,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  tryAgainButton: {
    minWidth: 160,
  },
  createSection: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  primaryButton: {
    minWidth: 200,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successIconText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  redirectLoader: {
    marginBottom: SPACING.sm,
  },
  redirectText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
