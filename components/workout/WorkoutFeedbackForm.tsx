/**
 * Workout Feedback Form
 *
 * Collects post-workout feedback including:
 * - Per-exercise ratings (RIR, form, difficulty)
 * - Overall workout difficulty
 * - Enjoyment and partner connection ratings
 * - Favorite/least favorite exercises
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import { ExerciseFeedbackCard, type ExerciseFeedbackData } from './ExerciseFeedbackCard';

interface ExerciseInfo {
  id: string;
  name: string;
  wasCompleted: boolean;
}

interface WorkoutFeedbackFormProps {
  exercises: ExerciseInfo[];
  onSubmit: (feedback: WorkoutFeedbackResult) => void;
  onSkip?: () => void;
}

export interface WorkoutFeedbackResult {
  overallDifficulty: 1 | 2 | 3 | 4 | 5;
  enjoymentRating: 1 | 2 | 3 | 4 | 5;
  partnerConnectionRating: 1 | 2 | 3 | 4 | 5;
  wouldRepeat: boolean;
  favoriteExercise: string | null;
  leastFavoriteExercise: string | null;
  comments: string | null;
  energyLevelAfter: 'depleted' | 'tired' | 'good' | 'energized';
  exerciseFeedback: ExerciseFeedbackData[];
}

const DIFFICULTY_OPTIONS = [
  { value: 1, label: 'Too Easy', emoji: '😴' },
  { value: 2, label: 'Easy', emoji: '😌' },
  { value: 3, label: 'Just Right', emoji: '💪' },
  { value: 4, label: 'Hard', emoji: '😤' },
  { value: 5, label: 'Too Hard', emoji: '🥵' },
];

const RATING_OPTIONS = [1, 2, 3, 4, 5];

const ENERGY_OPTIONS = [
  { value: 'depleted' as const, label: 'Depleted', emoji: '😵' },
  { value: 'tired' as const, label: 'Tired', emoji: '😴' },
  { value: 'good' as const, label: 'Good', emoji: '😊' },
  { value: 'energized' as const, label: 'Energized', emoji: '⚡' },
];

export function WorkoutFeedbackForm({
  exercises,
  onSubmit,
  onSkip,
}: WorkoutFeedbackFormProps) {
  const [step, setStep] = useState<'exercises' | 'overall'>('exercises');
  const [exerciseFeedback, setExerciseFeedback] = useState<Map<string, ExerciseFeedbackData>>(
    new Map(
      exercises.map(ex => [
        ex.id,
        {
          exerciseId: ex.id,
          completed: ex.wasCompleted,
          actualReps: null,
          actualRIR: 2,
          formQuality: 'good' as const,
          feltTooEasy: false,
          feltTooHard: false,
          feltPain: false,
          notes: null,
        },
      ])
    )
  );

  const [overallDifficulty, setOverallDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [enjoymentRating, setEnjoymentRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [partnerConnectionRating, setPartnerConnectionRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [wouldRepeat, setWouldRepeat] = useState(true);
  const [energyLevel, setEnergyLevel] = useState<'depleted' | 'tired' | 'good' | 'energized'>('good');
  const [favoriteExercise, setFavoriteExercise] = useState<string | null>(null);
  const [leastFavoriteExercise, setLeastFavoriteExercise] = useState<string | null>(null);

  const handleExerciseFeedback = useCallback((feedback: ExerciseFeedbackData) => {
    setExerciseFeedback(prev => {
      const newMap = new Map(prev);
      newMap.set(feedback.exerciseId, feedback);
      return newMap;
    });
  }, []);

  const handleNext = () => {
    setStep('overall');
  };

  const handleBack = () => {
    setStep('exercises');
  };

  const handleSubmit = () => {
    const result: WorkoutFeedbackResult = {
      overallDifficulty,
      enjoymentRating,
      partnerConnectionRating,
      wouldRepeat,
      favoriteExercise,
      leastFavoriteExercise,
      comments: null,
      energyLevelAfter: energyLevel,
      exerciseFeedback: Array.from(exerciseFeedback.values()),
    };
    onSubmit(result);
  };

  if (step === 'exercises') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Rate Your Exercises</Text>
          <Text style={styles.subtitle}>
            Tap each exercise to rate your effort and form
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {exercises.map((exercise) => (
            <ExerciseFeedbackCard
              key={exercise.id}
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              wasCompleted={exercise.wasCompleted}
              onFeedbackChange={handleExerciseFeedback}
            />
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Skip Feedback</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How Was Your Workout?</Text>
        <Text style={styles.subtitle}>
          Help us personalize your future workouts
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Difficulty</Text>
          <View style={styles.difficultyOptions}>
            {DIFFICULTY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.difficultyOption,
                  overallDifficulty === option.value && styles.difficultyOptionSelected,
                ]}
                onPress={() => setOverallDifficulty(option.value as 1 | 2 | 3 | 4 | 5)}
              >
                <Text style={styles.difficultyEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.difficultyLabel,
                    overallDifficulty === option.value && styles.difficultyLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enjoyment Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How much did you enjoy it?</Text>
          <View style={styles.starRating}>
            {RATING_OPTIONS.map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setEnjoymentRating(value as 1 | 2 | 3 | 4 | 5)}
              >
                <Text
                  style={[
                    styles.star,
                    value <= enjoymentRating && styles.starActive,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Partner Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner Connection</Text>
          <View style={styles.starRating}>
            {RATING_OPTIONS.map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setPartnerConnectionRating(value as 1 | 2 | 3 | 4 | 5)}
              >
                <Text
                  style={[
                    styles.star,
                    value <= partnerConnectionRating && styles.starActive,
                  ]}
                >
                  ❤️
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Energy Level After */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy Level After</Text>
          <View style={styles.energyOptions}>
            {ENERGY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.energyOption,
                  energyLevel === option.value && styles.energyOptionSelected,
                ]}
                onPress={() => setEnergyLevel(option.value)}
              >
                <Text style={styles.energyEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.energyLabel,
                    energyLevel === option.value && styles.energyLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Would Repeat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Would you do this workout again?</Text>
          <View style={styles.yesNoOptions}>
            <TouchableOpacity
              style={[styles.yesNoOption, wouldRepeat && styles.yesNoOptionSelected]}
              onPress={() => setWouldRepeat(true)}
            >
              <Text style={styles.yesNoEmoji}>👍</Text>
              <Text
                style={[
                  styles.yesNoLabel,
                  wouldRepeat && styles.yesNoLabelSelected,
                ]}
              >
                Yes!
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoOption, !wouldRepeat && styles.yesNoOptionSelected]}
              onPress={() => setWouldRepeat(false)}
            >
              <Text style={styles.yesNoEmoji}>👎</Text>
              <Text
                style={[
                  styles.yesNoLabel,
                  !wouldRepeat && styles.yesNoLabelSelected,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Favorite Exercise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Exercise (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.exerciseChips}>
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.exerciseChip,
                    favoriteExercise === ex.id && styles.exerciseChipFavorite,
                  ]}
                  onPress={() =>
                    setFavoriteExercise(favoriteExercise === ex.id ? null : ex.id)
                  }
                >
                  <Text
                    style={[
                      styles.exerciseChipText,
                      favoriteExercise === ex.id && styles.exerciseChipTextSelected,
                    ]}
                  >
                    {favoriteExercise === ex.id ? '⭐ ' : ''}{ex.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Least Favorite Exercise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Least Favorite Exercise (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.exerciseChips}>
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.exerciseChip,
                    leastFavoriteExercise === ex.id && styles.exerciseChipLeast,
                  ]}
                  onPress={() =>
                    setLeastFavoriteExercise(leastFavoriteExercise === ex.id ? null : ex.id)
                  }
                >
                  <Text
                    style={[
                      styles.exerciseChipText,
                      leastFavoriteExercise === ex.id && styles.exerciseChipTextLeast,
                    ]}
                  >
                    {leastFavoriteExercise === ex.id ? '👎 ' : ''}{ex.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    paddingBottom: SPACING.xl,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Difficulty Options
  difficultyOptions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  difficultyOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  difficultyOptionSelected: {
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  difficultyEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  difficultyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  difficultyLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Star Rating
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  star: {
    fontSize: 36,
    color: COLORS.border,
  },
  starActive: {
    color: '#FFD700',
  },

  // Energy Options
  energyOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  energyOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  energyOptionSelected: {
    backgroundColor: `${COLORS.success}20`,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  energyEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  energyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  energyLabelSelected: {
    color: COLORS.success,
    fontWeight: '600',
  },

  // Yes/No Options
  yesNoOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  yesNoOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  yesNoOptionSelected: {
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  yesNoEmoji: {
    fontSize: 24,
  },
  yesNoLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  yesNoLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Exercise Chips
  exerciseChips: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  exerciseChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  exerciseChipFavorite: {
    backgroundColor: `${COLORS.success}20`,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  exerciseChipLeast: {
    backgroundColor: `${COLORS.error}20`,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  exerciseChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  exerciseChipTextSelected: {
    color: COLORS.success,
    fontWeight: '500',
  },
  exerciseChipTextLeast: {
    color: COLORS.error,
    fontWeight: '500',
  },

  // Footer
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  backButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#fff',
  },
});
