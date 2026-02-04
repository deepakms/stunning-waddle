/**
 * Ready Check Screen
 *
 * Both partners confirm they're ready before starting the workout.
 * Shows partner readiness status in real-time.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { ReadyCheck } from '@/components/workout/ReadyCheck';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function ReadyCheckScreen() {
  const params = useLocalSearchParams<{ workoutId: string }>();
  const { profile } = useProfile();

  const [myReady, setMyReady] = useState(false);
  const [partnerReady, setPartnerReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation for waiting state
  useEffect(() => {
    if (myReady && !partnerReady) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [myReady, partnerReady]);

  // Simulate partner becoming ready (for demo)
  useEffect(() => {
    if (myReady) {
      const timer = setTimeout(() => {
        setPartnerReady(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [myReady]);

  // Start countdown when both ready
  useEffect(() => {
    if (myReady && partnerReady) {
      setCountdown(3);
    }
  }, [myReady, partnerReady]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      router.replace({
        pathname: '/(workout)/session',
        params: { workoutId: params.workoutId },
      });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleReady = () => {
    setMyReady(true);
  };

  const handleCancel = () => {
    router.back();
  };

  // Countdown screen
  if (countdown !== null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownTitle}>Get Ready!</Text>
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>{countdown || 'GO!'}</Text>
          </View>
          <Text style={styles.countdownSubtitle}>
            Starting in {countdown}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Ready Check</Text>
          <Text style={styles.subtitle}>
            Both partners must be ready to begin
          </Text>
        </View>

        {/* Ready Status Cards */}
        <View style={styles.statusSection}>
          {/* My Status */}
          <Animated.View
            style={[
              styles.statusCard,
              myReady && styles.statusCardReady,
              { transform: [{ scale: myReady && !partnerReady ? pulseAnim : 1 }] },
            ]}
          >
            <View style={styles.statusIcon}>
              <Text style={styles.statusIconText}>
                {myReady ? '✓' : '👤'}
              </Text>
            </View>
            <Text style={styles.statusName}>You</Text>
            <Text style={[styles.statusText, myReady && styles.statusTextReady]}>
              {myReady ? 'Ready!' : 'Tap to confirm'}
            </Text>
          </Animated.View>

          {/* Divider */}
          <View style={styles.statusDivider}>
            <Text style={styles.dividerText}>+</Text>
          </View>

          {/* Partner Status */}
          <View style={[styles.statusCard, partnerReady && styles.statusCardReady]}>
            <View style={styles.statusIcon}>
              <Text style={styles.statusIconText}>
                {partnerReady ? '✓' : '👤'}
              </Text>
            </View>
            <Text style={styles.statusName}>Partner</Text>
            <Text style={[styles.statusText, partnerReady && styles.statusTextReady]}>
              {partnerReady ? 'Ready!' : 'Waiting...'}
            </Text>
          </View>
        </View>

        {/* Ready Button */}
        <View style={styles.buttonSection}>
          {!myReady ? (
            <TouchableOpacity
              style={styles.readyButton}
              onPress={handleReady}
            >
              <Text style={styles.readyButtonIcon}>✋</Text>
              <Text style={styles.readyButtonText}>I'm Ready!</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingIcon}>⏳</Text>
              <Text style={styles.waitingText}>
                Waiting for your partner to confirm...
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>💧</Text>
            <Text style={styles.tipText}>Have water nearby</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🧘</Text>
            <Text style={styles.tipText}>Clear space to move</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>Keep phone visible</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: SPACING.lg,
  },
  cancelButton: {
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Status Section
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    width: 140,
  },
  statusCardReady: {
    backgroundColor: `${COLORS.success}15`,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusIconText: {
    fontSize: 28,
  },
  statusName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusTextReady: {
    color: COLORS.success,
    fontWeight: '600',
  },
  statusDivider: {
    paddingHorizontal: SPACING.md,
  },
  dividerText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },

  // Button Section
  buttonSection: {
    marginBottom: SPACING.xl,
  },
  readyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyButtonIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  readyButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },
  waitingCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  waitingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    flex: 1,
  },

  // Tips
  tipsSection: {
    marginTop: 'auto',
  },
  tipsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Countdown
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  countdownTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  countdownCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: '700',
    color: '#ffffff',
  },
  countdownSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
});
