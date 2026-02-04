/**
 * Workout Tab Screen
 *
 * Entry point for starting and managing workouts.
 * Shows workout options, duration picker, and quick start.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, SPACING, FONT_SIZES, WORKOUT_DURATIONS, type WorkoutDuration } from '@/constants/app';

const WORKOUT_TYPES = [
  {
    id: 'full-body',
    name: 'Full Body',
    icon: '🏋️',
    description: 'Complete workout for all muscle groups',
    color: '#6366f1',
  },
  {
    id: 'upper-body',
    name: 'Upper Body',
    icon: '💪',
    description: 'Arms, chest, shoulders, and back',
    color: '#ec4899',
  },
  {
    id: 'lower-body',
    name: 'Lower Body',
    icon: '🦵',
    description: 'Legs, glutes, and calves',
    color: '#22c55e',
  },
  {
    id: 'core',
    name: 'Core',
    icon: '🧘',
    description: 'Abs and core stability',
    color: '#f59e0b',
  },
  {
    id: 'cardio',
    name: 'Cardio',
    icon: '❤️',
    description: 'Get your heart pumping',
    color: '#ef4444',
  },
];

export default function WorkoutTabScreen() {
  const { hasCouple, profile } = useProfile();
  const [selectedDuration, setSelectedDuration] = useState<WorkoutDuration>(
    (profile?.preferred_workout_length as WorkoutDuration) ?? 30
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleStartWorkout = () => {
    if (!hasCouple) {
      router.push('/(main)/invite');
      return;
    }

    router.push({
      pathname: '/(workout)/preview',
      params: {
        duration: selectedDuration,
        type: selectedType ?? 'full-body',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Start Workout</Text>
          <Text style={styles.subtitle}>
            Choose your duration and focus area
          </Text>
        </View>

        {/* Duration Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationContainer}>
            {WORKOUT_DURATIONS.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  selectedDuration === duration && styles.durationButtonSelected,
                ]}
                onPress={() => setSelectedDuration(duration)}
              >
                <Text
                  style={[
                    styles.durationText,
                    selectedDuration === duration && styles.durationTextSelected,
                  ]}
                >
                  {duration}
                </Text>
                <Text
                  style={[
                    styles.durationLabel,
                    selectedDuration === duration && styles.durationLabelSelected,
                  ]}
                >
                  min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Workout Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Area</Text>
          <View style={styles.typesGrid}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardSelected,
                  selectedType === type.id && { borderColor: type.color },
                ]}
                onPress={() =>
                  setSelectedType(selectedType === type.id ? null : type.id)
                }
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Partner Status */}
        {!hasCouple && (
          <View style={styles.partnerWarning}>
            <Text style={styles.partnerWarningIcon}>👥</Text>
            <Text style={styles.partnerWarningText}>
              Connect with a partner to start working out together
            </Text>
          </View>
        )}

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, !hasCouple && styles.startButtonDisabled]}
          onPress={handleStartWorkout}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonIcon}>🚀</Text>
          <Text style={styles.startButtonText}>
            {hasCouple ? 'Generate Workout' : 'Invite Partner First'}
          </Text>
        </TouchableOpacity>

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Workouts are customized based on both partners' fitness levels
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🔥</Text>
            <Text style={styles.tipText}>
              Keep your streak going for XP multipliers
            </Text>
          </View>
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
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
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

  // Duration Selector
  durationContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  durationButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationButtonSelected: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  durationTextSelected: {
    color: COLORS.primary,
  },
  durationLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  durationLabelSelected: {
    color: COLORS.primary,
  },

  // Workout Types
  typesGrid: {
    gap: SPACING.sm,
  },
  typeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    backgroundColor: '#ffffff',
  },
  typeIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  typeName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  typeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 2,
    textAlign: 'right',
  },

  // Partner Warning
  partnerWarning: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  partnerWarningIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  partnerWarningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#92400e',
  },

  // Start Button
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
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

  // Tips
  tipsSection: {
    marginTop: SPACING.md,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
