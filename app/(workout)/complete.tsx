/**
 * Workout Complete Screen
 *
 * Summary after completing a workout.
 * Shows stats, XP earned, and celebration.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { WorkoutSummary } from '@/components/workout/WorkoutSummary';
import { analytics } from '@/services/analytics';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

export default function WorkoutCompleteScreen() {
  const params = useLocalSearchParams<{
    workoutId: string;
    early: string;
    xpEarned: string;
    enjoyment: string;
    difficulty: string;
    connection: string;
    duration: string;
    completedBlocks: string;
    totalBlocks: string;
    recommendations: string;
  }>();
  const wasEarly = params.early === 'true';

  // Parse feedback data from params or use defaults
  const results = useMemo(() => {
    const xpEarned = parseInt(params.xpEarned ?? '250', 10);
    const duration = parseInt(params.duration ?? '25', 10);
    const completedBlocks = parseInt(params.completedBlocks ?? '6', 10);
    const totalBlocks = parseInt(params.totalBlocks ?? '6', 10);
    const enjoyment = parseInt(params.enjoyment ?? '4', 10);
    const connection = parseInt(params.connection ?? '4', 10);

    let recommendations: string[] = [];
    try {
      if (params.recommendations) {
        recommendations = JSON.parse(params.recommendations);
      }
    } catch {}

    return {
      duration,
      totalBlocks,
      completedBlocks,
      xpEarned,
      streakBonus: xpEarned > duration * 5,
      newStreak: 5, // Would come from user profile
      muscleGroups: ['Chest', 'Legs', 'Core'],
      calories: duration * 7,
      enjoyment,
      connection,
      recommendations,
    };
  }, [params]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Track workout completed
    analytics.trackWorkout.completed(
      params.workoutId || 'demo',
      results.duration,
      Math.round((results.completedBlocks / results.totalBlocks) * 100),
      results.xpEarned
    );

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation
    if (!wasEarly) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const handleViewHistory = () => {
    router.replace('/(tabs)/history');
  };

  const completionRate = (results.completedBlocks / results.totalBlocks) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <Animated.View
          style={[
            styles.celebrationSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.celebrationEmoji}>
            {wasEarly ? '💪' : '🎉'}
          </Text>
          <Text style={styles.celebrationTitle}>
            {wasEarly ? 'Good Effort!' : 'Workout Complete!'}
          </Text>
          <Text style={styles.celebrationSubtitle}>
            {wasEarly
              ? 'Every step counts. Keep pushing!'
              : "Amazing work! You and your partner crushed it!"}
          </Text>
        </Animated.View>

        {/* XP Earned Card */}
        <Animated.View
          style={[
            styles.xpCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.xpBadge}>
            <Text style={styles.xpIcon}>⭐</Text>
            <Text style={styles.xpAmount}>+{results.xpEarned}</Text>
            <Text style={styles.xpLabel}>XP Earned</Text>
          </View>
          {results.streakBonus && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>🔥 Streak Bonus Applied!</Text>
            </View>
          )}
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>{results.duration}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{results.calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{Math.round(completionRate)}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{results.newStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Muscle Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscles Worked</Text>
          <View style={styles.muscleChips}>
            {results.muscleGroups.map((group) => (
              <View key={group} style={styles.muscleChip}>
                <Text style={styles.muscleChipText}>{group}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Progression Recommendations */}
        {results.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Level Up Tips</Text>
            <View style={styles.recommendationsCard}>
              {results.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationIcon}>⬆️</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Partner Connection */}
        {results.connection >= 4 && (
          <View style={styles.connectionCard}>
            <Text style={styles.connectionEmoji}>💕</Text>
            <Text style={styles.connectionText}>
              Great partner workout! Your connection rating: {results.connection}/5
            </Text>
          </View>
        )}

        {/* Motivational Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "The only bad workout is the one that didn't happen."
          </Text>
          <Text style={styles.quoteAuthor}>— Keep going! 💪</Text>
        </View>

        {/* Share Section */}
        <View style={styles.shareSection}>
          <Text style={styles.shareTitle}>Share Your Achievement</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>📸 Save Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleViewHistory}
        >
          <Text style={styles.historyButtonText}>View History</Text>
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

  // Celebration Section
  celebrationSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },

  // XP Card
  xpCard: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  xpBadge: {
    alignItems: 'center',
  },
  xpIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  xpAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  xpLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bonusBadge: {
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    marginTop: SPACING.md,
  },
  bonusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
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

  // Recommendations
  recommendationsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },

  // Connection Card
  connectionCard: {
    backgroundColor: `${COLORS.secondary}15`,
    borderRadius: 12,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  connectionEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  connectionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.secondary,
    fontWeight: '500',
  },

  // Quote Card
  quoteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  quoteText: {
    fontSize: FONT_SIZES.md,
    fontStyle: 'italic',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  quoteAuthor: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Share Section
  shareSection: {
    marginBottom: SPACING.xl,
  },
  shareTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  shareButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Action Buttons
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  doneButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },
  historyButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  historyButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
