/**
 * Workout Session Screen
 *
 * Active workout experience with timer, exercises, and sync.
 * Shows current exercise, timer, and progress.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CircularTimer } from '@/components/workout/CircularTimer';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { BlockProgress } from '@/components/workout/BlockProgress';
import { PauseOverlay } from '@/components/workout/PauseOverlay';
import { HeartRateBadge, HeartRateMonitor } from '@/components/workout/HeartRateMonitor';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import {
  getActiveWorkout,
  completeBlock,
  skipBlock,
  advanceToNextBlock,
  prepareSimpleWorkout,
  startWorkout,
  type WorkoutBlock,
  type ActiveWorkoutState,
} from '@/services/workout-service';
import { useHealth, type HeartRateZone, type HeartRateSample, getZoneColor, getZoneName } from '@/services/health';

// Live Heart Rate Display Component
function LiveHeartRate({
  heartRate,
  zone,
  isMonitoring,
}: {
  heartRate: number | null;
  zone: HeartRateZone | null;
  isMonitoring: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (heartRate && isMonitoring) {
      const duration = Math.max(250, 60000 / heartRate / 2);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => pulseAnim.stopAnimation();
  }, [heartRate, isMonitoring]);

  const zoneColor = zone ? getZoneColor(zone) : COLORS.textSecondary;

  return (
    <View style={[liveHrStyles.container, { borderColor: zoneColor }]}>
      <Animated.Text style={[liveHrStyles.heart, { transform: [{ scale: pulseAnim }] }]}>
        ❤️
      </Animated.Text>
      <Text style={[liveHrStyles.value, { color: zoneColor }]}>
        {heartRate || '--'}
      </Text>
      <Text style={liveHrStyles.unit}>BPM</Text>
      {zone && (
        <View style={[liveHrStyles.zoneBadge, { backgroundColor: zoneColor }]}>
          <Text style={liveHrStyles.zoneText}>{getZoneName(zone)}</Text>
        </View>
      )}
      {!heartRate && isMonitoring && (
        <Text style={liveHrStyles.connecting}>Connecting...</Text>
      )}
    </View>
  );
}

const liveHrStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 2,
    minWidth: 100,
  },
  heart: {
    fontSize: 32,
    marginBottom: 4,
  },
  value: {
    fontSize: 36,
    fontWeight: '700',
  },
  unit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: -4,
  },
  zoneBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoneText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  connecting: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default function WorkoutSessionScreen() {
  const params = useLocalSearchParams<{ workoutId: string }>();

  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [isPartnerA] = useState(true); // For demo, assume user is partner A
  const [loading, setLoading] = useState(true);

  // Heart rate monitoring
  const {
    isAvailable: hrAvailable,
    hasPermission: hrPermission,
    heartRate,
    heartRateZone,
    startMonitoring,
    stopMonitoring,
  } = useHealth(190);
  const heartRateSamples = useRef<HeartRateSample[]>([]);

  // Start heart rate monitoring when workout starts
  useEffect(() => {
    if (hrAvailable && hrPermission && !loading) {
      startMonitoring();
    }
    return () => {
      stopMonitoring();
    };
  }, [hrAvailable, hrPermission, loading]);

  // Collect heart rate samples during workout
  useEffect(() => {
    if (heartRate) {
      heartRateSamples.current.push({
        value: heartRate,
        timestamp: new Date(),
      });
    }
  }, [heartRate]);

  // Initialize workout blocks
  useEffect(() => {
    // Try to get active workout first
    const activeWorkout = getActiveWorkout();
    if (activeWorkout) {
      setBlocks(activeWorkout.preparedWorkout.blocks);
      setCurrentBlockIndex(activeWorkout.currentBlockIndex);
      setTimeRemaining(activeWorkout.preparedWorkout.blocks[0]?.duration || 60);
      setLoading(false);
      return;
    }

    // Otherwise generate a simple workout for demo
    const workout = prepareSimpleWorkout({
      duration: 30,
      focusArea: 'full-body',
      fitnessLevelA: 'beginner',
      fitnessLevelB: 'intermediate',
    });

    // Start the workout session
    startWorkout(workout, 'couple-1', 'user-a', 'user-b', true);

    setBlocks(workout.blocks);
    setTimeRemaining(workout.blocks[0]?.duration || 60);
    setLoading(false);
  }, []);

  if (loading || blocks.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Starting workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentBlock = blocks[currentBlockIndex];
  const myExercise = isPartnerA ? currentBlock.exerciseA : currentBlock.exerciseB;
  const partnerExercise = isPartnerA ? currentBlock.exerciseB : currentBlock.exerciseA;
  const totalBlocks = blocks.length;
  const progress = ((currentBlockIndex + 1) / totalBlocks) * 100;

  // Timer effect
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Block complete
          handleBlockComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, currentBlockIndex]);

  const handleBlockComplete = useCallback(() => {
    // Mark block as completed
    completeBlock(currentBlockIndex);

    if (currentBlockIndex >= totalBlocks - 1) {
      // Workout complete - go to feedback first
      router.replace({
        pathname: '/(workout)/feedback',
        params: { workoutId: params.workoutId },
      });
      return;
    }

    // Move to next block
    const nextIndex = currentBlockIndex + 1;
    advanceToNextBlock();
    setCurrentBlockIndex(nextIndex);
    setTimeRemaining(blocks[nextIndex].duration);
  }, [currentBlockIndex, totalBlocks, blocks]);

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleQuit = () => {
    Alert.alert(
      'End Workout',
      'Are you sure you want to end this workout early?',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'End Workout',
          style: 'destructive',
          onPress: () => {
            // Mark remaining blocks as skipped
            for (let i = currentBlockIndex; i < totalBlocks; i++) {
              skipBlock(i);
            }
            router.replace({
              pathname: '/(workout)/feedback',
              params: { workoutId: params.workoutId, early: 'true' },
            });
          },
        },
      ]
    );
  };

  const handleSkipBlock = () => {
    handleBlockComplete();
  };

  const getBlockTypeLabel = (type: string) => {
    switch (type) {
      case 'warmup':
        return { label: 'Warm Up', icon: '🔥', color: '#f59e0b' };
      case 'exercise':
        return { label: 'Exercise', icon: '💪', color: COLORS.primary };
      case 'rest':
        return { label: 'Rest', icon: '😮‍💨', color: COLORS.success };
      case 'cooldown':
        return { label: 'Cool Down', icon: '❄️', color: '#3b82f6' };
      default:
        return { label: 'Exercise', icon: '💪', color: COLORS.primary };
    }
  };

  const blockInfo = getBlockTypeLabel(currentBlock.type);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressInfo}>
            <Text style={styles.blockCounter}>
              {currentBlockIndex + 1} / {totalBlocks}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
          {/* Heart Rate Badge */}
          {hrAvailable && (
            <HeartRateBadge heartRate={heartRate} zone={heartRateZone} />
          )}
          <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
            <Text style={styles.pauseButtonText}>⏸</Text>
          </TouchableOpacity>
        </View>

        {/* Block Type Indicator */}
        <View style={[styles.blockTypeCard, { backgroundColor: `${blockInfo.color}15` }]}>
          <Text style={styles.blockTypeIcon}>{blockInfo.icon}</Text>
          <Text style={[styles.blockTypeLabel, { color: blockInfo.color }]}>
            {blockInfo.label}
          </Text>
        </View>

        {/* Timer with Heart Rate */}
        <View style={styles.timerSection}>
          <View style={styles.timerRow}>
            <CircularTimer
              seconds={timeRemaining}
              totalSeconds={currentBlock.duration}
              size={160}
            />
            {/* Live Heart Rate Display */}
            {hrAvailable && (
              <View style={styles.liveHrContainer}>
                <LiveHeartRate
                  heartRate={heartRate}
                  zone={heartRateZone}
                  isMonitoring={!isPaused}
                />
              </View>
            )}
          </View>
        </View>

        {/* My Exercise Card */}
        <View style={styles.exerciseSection}>
          <Text style={styles.exerciseLabel}>Your Exercise</Text>
          <View style={styles.myExerciseCard}>
            <Text style={styles.exerciseName}>{myExercise.name}</Text>
            {myExercise.reps && (
              <Text style={styles.exerciseReps}>{myExercise.reps} reps</Text>
            )}
            {myExercise.duration && (
              <Text style={styles.exerciseReps}>{myExercise.duration}s</Text>
            )}
          </View>
        </View>

        {/* Partner Exercise Preview */}
        <View style={styles.partnerSection}>
          <Text style={styles.partnerLabel}>Partner's Exercise</Text>
          <View style={styles.partnerExerciseCard}>
            <Text style={styles.partnerExerciseName}>{partnerExercise.name}</Text>
            {partnerExercise.reps && (
              <Text style={styles.partnerExerciseReps}>{partnerExercise.reps} reps</Text>
            )}
          </View>
        </View>

        {/* Skip Button (for demo/testing) */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipBlock}>
          <Text style={styles.skipButtonText}>Skip Block →</Text>
        </TouchableOpacity>
      </View>

      {/* Pause Overlay */}
      {isPaused && (
        <PauseOverlay
          onResume={handleResume}
          onQuit={handleQuit}
          currentBlock={currentBlockIndex + 1}
          totalBlocks={totalBlocks}
        />
      )}
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressInfo: {
    flex: 1,
  },
  blockCounter: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  pauseButtonText: {
    fontSize: 20,
  },

  // Block Type
  blockTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  blockTypeIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  blockTypeLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },

  // Timer Section
  timerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  liveHrContainer: {
    marginLeft: SPACING.md,
  },

  // Exercise Section
  exerciseSection: {
    marginBottom: SPACING.lg,
  },
  exerciseLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  myExerciseCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  exerciseReps: {
    fontSize: FONT_SIZES.lg,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Partner Section
  partnerSection: {
    marginBottom: SPACING.lg,
  },
  partnerLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  partnerExerciseCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerExerciseName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  partnerExerciseReps: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },

  // Skip Button
  skipButton: {
    marginTop: 'auto',
    padding: SPACING.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
