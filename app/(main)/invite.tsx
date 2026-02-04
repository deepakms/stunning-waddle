/**
 * Invite Partner Screen
 *
 * Allows user to create and share an invite code for their partner.
 * Handles code generation, display, sharing, and regeneration.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCoupleInvite } from '@/hooks/useCoupleInvite';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function InvitePartnerScreen() {
  const { hasCouple } = useProfile();
  const {
    couple,
    inviteCode,
    shareUrl,
    expiresIn,
    isExpired,
    isCreating,
    isRegenerating,
    error,
    createInvite,
    regenerateCode,
  } = useCoupleInvite();

  // Create invite on mount if user doesn't have one
  useEffect(() => {
    if (!couple && !isCreating && !hasCouple) {
      createInvite().catch(() => {
        // Error is handled by the hook
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCouple]); // Only trigger when hasCouple changes, createInvite is stable from useMutation

  // If user already has a couple, show different UI
  if (hasCouple) {
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
            <Text style={styles.title}>You're Connected!</Text>
            <Text style={styles.subtitle}>
              You're already connected with a partner. Start working out together!
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

  const handleShare = async () => {
    if (!shareUrl || !inviteCode) return;

    try {
      await Share.share({
        message: `Join me on Couples Workout! Use my invite code: ${inviteCode}\n\nOr tap this link: ${shareUrl}`,
        title: 'Join me on Couples Workout!',
      });
    } catch (err) {
      // User cancelled or share failed silently
    }
  };

  const handleCopyCode = useCallback(async () => {
    if (!inviteCode) return;

    await ExpoClipboard.setStringAsync(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  }, [inviteCode]);

  const handleRegenerate = async () => {
    Alert.alert(
      'Regenerate Code?',
      'This will invalidate the current invite code. Your partner will need the new code to join.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            try {
              await regenerateCode();
            } catch (err) {
              Alert.alert('Error', 'Failed to regenerate code. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isCreating || (!couple && !error)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Creating your invite code...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !couple) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Button
            title="Try Again"
            onPress={() => createInvite()}
            style={styles.retryButton}
          />
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButtonBottom}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.title}>Invite Your Partner</Text>
          <Text style={styles.subtitle}>
            Share this code with your partner so they can join you for workouts
          </Text>
        </View>

        {/* Invite Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Invite Code</Text>
          <TouchableOpacity
            style={styles.codeContainer}
            onPress={handleCopyCode}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Invite code ${inviteCode}. Tap to copy.`}
          >
            <Text style={styles.code}>{inviteCode}</Text>
          </TouchableOpacity>
          <Text style={styles.tapToCopy}>Tap to copy</Text>

          {/* Expiration */}
          <View style={styles.expirationContainer}>
            {isExpired ? (
              <Text style={styles.expiredText}>Code expired</Text>
            ) : (
              <Text style={styles.expiresText}>Expires in {expiresIn}</Text>
            )}
          </View>
        </View>

        {/* Share Actions */}
        <View style={styles.actions}>
          <Button
            title="Share Invite"
            onPress={handleShare}
            style={styles.shareButton}
            disabled={!inviteCode}
          />

          <Button
            title={isRegenerating ? 'Regenerating...' : 'Regenerate Code'}
            onPress={handleRegenerate}
            variant="outline"
            style={styles.regenerateButton}
            disabled={isRegenerating}
            loading={isRegenerating}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How it works</Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Share your invite code with your partner
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              They enter the code in the app to join
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Start working out together and earn XP!
            </Text>
          </View>
        </View>

        {/* Join Couple Link */}
        <View style={styles.joinSection}>
          <Text style={styles.joinText}>Have an invite code from your partner?</Text>
          <Button
            title="Join with Code"
            onPress={() => router.push('/(main)/join-couple')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    minWidth: 120,
  },
  backButtonBottom: {
    marginTop: SPACING.md,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  codeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  codeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  codeContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  tapToCopy: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  expirationContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
    alignItems: 'center',
  },
  expiresText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  expiredText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  actions: {
    marginBottom: SPACING.xl,
  },
  shareButton: {
    marginBottom: SPACING.md,
  },
  regenerateButton: {},
  primaryButton: {
    minWidth: 200,
  },
  instructions: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  instructionsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  joinSection: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  joinText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
});
