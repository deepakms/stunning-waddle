/**
 * Workout Preview Screen
 *
 * Shows workout details before starting.
 * Displays exercise list, duration, and partner info.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, SPACING, FONT_SIZES, WORKOUT_STRUCTURE, type WorkoutDuration } from '@/constants/app';
import {
  prepareSimpleWorkout,
  type PreparedWorkout,
} from '@/services/workout-service';

export default function WorkoutPreviewScreen() {
  const params = useLocalSearchParams<{ duration: string; type: string }>();
  const { profile, profileWithCouple } = useProfile();
  const [workout, setWorkout] = useState<PreparedWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  const duration = (parseInt(params.duration ?? '30', 10) || 30) as WorkoutDuration;
  const type = params.type ?? 'full-body';

  useEffect(() => {
    // Generate workout using the pairing service
    const generatedWorkout = prepareSimpleWorkout({
      duration,
      focusArea: type,
      fitnessLevelA: profile?.fitnessLevel || 'beginner',
      fitnessLevelB: profileWithCouple?.partner?.fitnessLevel || 'intermediate',
    });
    setWorkout(generatedWorkout);
    setLoading(false);
  }, [duration, type, profile?.fitnessLevel, profileWithCouple?.partner?.fitnessLevel]);

  const handleStart = () => {
    if (!workout) return;
    router.push({
      pathname: '/(workout)/ready',
      params: { workoutId: workout.id },
    });
  };

  if (loading || !workout) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Generating your workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Convert blocks to exercise preview format
  const exercises = workout.blocks.map((block, index) => ({
    name: block.exerciseA.name,
    type: block.type,
    duration: block.duration,
    reps: block.exerciseA.reps,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Workout Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{workout.name}</Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⏱️ {workout.duration} min</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔥 {workout.estimatedCalories} cal</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>📊 {workout.totalBlocks} blocks</Text>
            </View>
          </View>
        </View>

        {/* Partner Difficulties */}
        <View style={styles.partnerSection}>
          <Text style={styles.sectionTitle}>Your Workout Levels</Text>
          <View style={styles.partnerCards}>
            <View style={styles.partnerCard}>
              <Text style={styles.partnerName}>You</Text>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyNumber}>{workout.difficultyA}</Text>
                <Text style={styles.difficultyLabel}>
                  {workout.difficultyA <= 2 ? 'Beginner' : 'Moderate'}
                </Text>
              </View>
            </View>
            <View style={styles.partnerDivider}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.partnerCard}>
              <Text style={styles.partnerName}>Partner</Text>
              <View style={[styles.difficultyBadge, styles.difficultyBadgeB]}>
                <Text style={[styles.difficultyNumber, styles.difficultyNumberB]}>
                  {workout.difficultyB}
                </Text>
                <Text style={[styles.difficultyLabel, styles.difficultyLabelB]}>
                  {workout.difficultyB >= 4 ? 'Advanced' : 'Moderate'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Muscle Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Areas</Text>
          <View style={styles.muscleChips}>
            {workout.muscleGroups.map((group) => (
              <View key={group} style={styles.muscleChip}>
                <Text style={styles.muscleChipText}>
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Exercise List Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Preview</Text>
          <View style={styles.exerciseList}>
            {exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseNumber}>
                  <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {exercise.reps
                      ? `${exercise.reps} reps`
                      : `${exercise.duration}s`}
                    {' • '}
                    {exercise.type}
                  </Text>
                </View>
                <Text style={styles.exerciseType}>
                  {exercise.type === 'warmup'
                    ? '🔥'
                    : exercise.type === 'cooldown'
                    ? '❄️'
                    : exercise.type === 'rest'
                    ? '😮‍💨'
                    : '💪'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Both partners will receive exercises matched to their fitness level.
            Stay in sync with the timer!
          </Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonIcon}>🚀</Text>
          <Text style={styles.startButtonText}>Ready to Start</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
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
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    marginBottom: SPACING.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Title Section
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Partner Section
  partnerSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  partnerCards: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  partnerName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  difficultyBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  difficultyBadgeB: {
    backgroundColor: `${COLORS.secondary}20`,
  },
  difficultyNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  difficultyNumberB: {
    color: COLORS.secondary,
  },
  difficultyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  difficultyLabelB: {
    color: COLORS.secondary,
  },
  partnerDivider: {
    paddingHorizontal: SPACING.md,
  },
  vsText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },

  // Muscle Chips
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  muscleChip: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  muscleChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
  },

  // Exercise List
  exerciseList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  exerciseNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  exerciseMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  exerciseType: {
    fontSize: 20,
    marginLeft: SPACING.sm,
  },

  // Info Card
  infoCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },

  // Start Button
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  startButtonIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  startButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Cancel Button
  cancelButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
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
