/**
 * Forgot Password Screen
 *
 * Allows users to request a password reset email.
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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isValidEmail } from '@/utils/validation';
import { getAuthErrorMessage } from '@/utils/auth';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: 'couplesworkout://reset-password',
        }
      );

      if (resetError) {
        setError(getAuthErrorMessage(resetError));
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Check Your Email</Text>

          <Text style={styles.successMessage}>
            We've sent password reset instructions to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          <Text style={styles.successNote}>
            If you don't see the email, check your spam folder.
          </Text>

          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.backButton}
          />
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
          {/* Back button */}
          <TouchableOpacity
            style={styles.backNav}
            onPress={() => router.back()}
          >
            <Text style={styles.backNavText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoComplete="email"
              testID="forgot-email-input"
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={isLoading}
              disabled={isLoading}
              style={styles.submitButton}
              testID="forgot-submit-button"
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
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  backNav: {
    marginBottom: SPACING.lg,
  },
  backNavText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  header: {
    marginBottom: SPACING.xxl,
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

  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  successIconText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  emailHighlight: {
    color: COLORS.text,
    fontWeight: '600',
  },
  successNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  backButton: {
    minWidth: 200,
  },
});
