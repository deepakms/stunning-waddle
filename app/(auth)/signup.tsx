/**
 * Sign Up Screen
 *
 * Allows users to create a new account with email and password.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isValidEmail, isValidPassword, isValidDisplayName } from '@/utils/validation';
import { getAuthErrorMessage } from '@/utils/auth';
import { createProfile } from '@/services/profile';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { inviteCode } = useLocalSearchParams<{ inviteCode?: string }>();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!displayName) {
      newErrors.displayName = 'Display name is required';
    } else if (!isValidDisplayName(displayName)) {
      newErrors.displayName = 'Display name must be 2-50 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Create auth account
      const { data, error: authError } = await signUp(email.trim(), password);

      if (authError) {
        setErrors({ general: getAuthErrorMessage(authError) });
        return;
      }

      if (data?.user) {
        // Create profile
        const { error: profileError } = await createProfile({
          user_id: data.user.id,
          display_name: displayName.trim(),
        });

        if (profileError) {
          // Profile creation failed but auth succeeded
          // User can sign in and we'll handle missing profile in the app
          setErrors({
            general: 'Account created. Please sign in to complete your profile setup.'
          });
          // Redirect to login after a short delay so user can read the message
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
          return;
        }

        // Navigate based on invite code
        if (inviteCode) {
          router.replace({
            pathname: '/(main)/join-couple',
            params: { code: inviteCode },
          });
        } else {
          router.replace('/(onboarding)/basics');
        }
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join Couples Workout and start your fitness journey together
            </Text>
          </View>

          {/* Invite Code Banner */}
          {inviteCode && (
            <View style={styles.inviteBanner}>
              <Text style={styles.inviteBannerText}>
                You've been invited to join a couple!
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label="Display Name"
              placeholder="What should we call you?"
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              autoComplete="name"
              testID="signup-name-input"
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
              testID="signup-email-input"
            />

            <Input
              label="Password"
              placeholder="Create a password (8+ characters)"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              showPasswordToggle
              autoComplete="new-password"
              testID="signup-password-input"
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              secureTextEntry
              autoComplete="new-password"
              testID="signup-confirm-password-input"
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
              testID="signup-submit-button"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
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
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  header: {
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
  inviteBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  inviteBannerText: {
    color: '#15803d',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
