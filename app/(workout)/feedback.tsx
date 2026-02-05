/**
 * Workout Feedback Screen
 *
 * Collects post-workout feedback before showing results.
 * Captures per-exercise ratings and overall workout feedback.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutFeedbackForm, type WorkoutFeedbackResult } from '@/components/workout/WorkoutFeedbackForm';
import {
  getActiveWorkout,
  getExercisesForFeedback,
  endWorkoutSession,
  submitWorkoutFeedback,
  type WorkoutFeedback,
} from '@/services/workout-service';
import { progressTracker } from '@/services/pairing';
import { analytics } from '@/services/analytics';
import { COLORS, SPACING } from '@/constants/app';

export default function WorkoutFeedbackScreen() {
  const params = useLocalSearchParams<{ workoutId: string; early: string }>();
  const wasEarly = params.early === 'true';

  const [exercises, setExercises] = useState<
    { id: string; name: string; wasCompleted: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<{
    completedBlocks: number;
    totalBlocks: number;
    durationMinutes: number;
  } | null>(null);

  useEffect(() => {
    // Get exercises from the active workout
    const exerciseList = getExercisesForFeedback();

    if (exerciseList.length === 0) {
      // No active workout, use mock data for demo
      setExercises([
        { id: 'push-up', name: 'Push-ups', wasCompleted: true },
        { id: 'squat', name: 'Squats', wasCompleted: true },
        { id: 'plank', name: 'Plank', wasCompleted: true },
        { id: 'lunges', name: 'Lunges', wasCompleted: false },
      ]);
    } else {
      setExercises(exerciseList);
    }

    // Get workout summary
    const summary = endWorkoutSession();
    if (summary) {
      setWorkoutSummary({
        completedBlocks: summary.completedBlocks,
        totalBlocks: summary.totalBlocks,
        durationMinutes: summary.durationMinutes,
      });
    }

    setLoading(false);
  }, []);

  const handleSubmit = async (feedback: WorkoutFeedbackResult) => {
    setSubmitting(true);

    try {
      // Convert to WorkoutFeedback format
      const workoutFeedback: WorkoutFeedback = {
        overallDifficulty: feedback.overallDifficulty,
        enjoymentRating: feedback.enjoymentRating,
        partnerConnectionRating: feedback.partnerConnectionRating,
        wouldRepeat: feedback.wouldRepeat,
        favoriteExercise: feedback.favoriteExercise,
        leastFavoriteExercise: feedback.leastFavoriteExercise,
        comments: feedback.comments,
        energyLevelAfter: feedback.energyLevelAfter,
        exerciseFeedback: feedback.exerciseFeedback.map(ef => ({
          exerciseId: ef.exerciseId,
          completed: ef.completed,
          actualReps: ef.actualReps,
          actualRIR: ef.actualRIR,
          formQuality: ef.formQuality,
          feltTooEasy: ef.feltTooEasy,
          feltTooHard: ef.feltTooHard,
          feltPain: ef.feltPain,
          notes: ef.notes,
        })),
      };

      // Calculate XP based on feedback
      const baseXP = workoutSummary ? workoutSummary.durationMinutes * 5 : 100;
      const completionBonus = workoutSummary
        ? Math.round((workoutSummary.completedBlocks / workoutSummary.totalBlocks) * 50)
        : 50;
      const enjoymentBonus = feedback.enjoymentRating * 10;
      const xpEarned = baseXP + completionBonus + enjoymentBonus;

      // Check for progression recommendations
      const progressionRecommendations: string[] = [];
      for (const ef of feedback.exerciseFeedback) {
        if (ef.feltTooEasy && ef.actualRIR >= 4) {
          progressionRecommendations.push(`Ready to progress on ${getExerciseName(ef.exerciseId)}`);
        }
        if (ef.feltPain) {
          progressionRecommendations.push(`Consider easier variation for ${getExerciseName(ef.exerciseId)}`);
        }
      }

      // Track feedback submitted
      analytics.trackFeedback.submitted(
        params.workoutId || 'demo',
        feedback.overallDifficulty,
        feedback.enjoymentRating,
        feedback.partnerConnectionRating
      );

      // Navigate to complete screen with results
      router.replace({
        pathname: '/(workout)/complete',
        params: {
          workoutId: params.workoutId,
          early: params.early,
          xpEarned: xpEarned.toString(),
          enjoyment: feedback.enjoymentRating.toString(),
          difficulty: feedback.overallDifficulty.toString(),
          connection: feedback.partnerConnectionRating.toString(),
          duration: workoutSummary?.durationMinutes.toString() || '25',
          completedBlocks: workoutSummary?.completedBlocks.toString() || '6',
          totalBlocks: workoutSummary?.totalBlocks.toString() || '6',
          recommendations: JSON.stringify(progressionRecommendations),
        },
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Still navigate to complete screen
      router.replace({
        pathname: '/(workout)/complete',
        params: {
          workoutId: params.workoutId,
          early: params.early,
        },
      });
    }
  };

  const handleSkip = () => {
    // Track feedback skipped
    analytics.trackFeedback.skipped(params.workoutId || 'demo');

    router.replace({
      pathname: '/(workout)/complete',
      params: {
        workoutId: params.workoutId,
        early: params.early,
      },
    });
  };

  const getExerciseName = (exerciseId: string): string => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || exerciseId;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading feedback form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (submitting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Saving your feedback...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <WorkoutFeedbackForm
        exercises={exercises}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
