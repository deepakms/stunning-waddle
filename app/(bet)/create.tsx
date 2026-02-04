/**
 * Create Bet Screen
 *
 * Form for creating a new bet with partner.
 * Modern, clean interface for setting up friendly competitions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import type { BetMetric } from '@/types/database';

const METRICS: Array<{ id: BetMetric; name: string; icon: string; description: string }> = [
  {
    id: 'total_reps',
    name: 'Total Reps',
    icon: '🔥',
    description: 'Who can complete more reps?',
  },
  {
    id: 'total_sessions',
    name: 'Total Sessions',
    icon: '📅',
    description: 'Who works out more often?',
  },
  {
    id: 'total_minutes',
    name: 'Total Minutes',
    icon: '⏱️',
    description: 'Who spends more time training?',
  },
  {
    id: 'streak_days',
    name: 'Streak Days',
    icon: '🔥',
    description: 'Who can maintain the longest streak?',
  },
  {
    id: 'xp_earned',
    name: 'XP Earned',
    icon: '⭐',
    description: 'Who earns the most XP?',
  },
];

const DURATIONS = [
  { days: 3, label: '3 Days' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
];

export default function CreateBetScreen() {
  const { profile } = useProfile();

  const [selectedMetric, setSelectedMetric] = useState<BetMetric | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [myStake, setMyStake] = useState('');
  const [partnerStake, setPartnerStake] = useState('');

  const handleCreate = async () => {
    if (!selectedMetric) {
      Alert.alert('Missing Info', 'Please select what you want to compete on.');
      return;
    }
    if (!myStake.trim() || !partnerStake.trim()) {
      Alert.alert('Missing Stakes', 'Please enter what both partners will stake.');
      return;
    }

    // TODO: Create bet via service
    Alert.alert(
      'Bet Created!',
      'Your bet has been sent to your partner for acceptance.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create a Bet</Text>
          <Text style={styles.subtitle}>
            Challenge your partner to a friendly competition
          </Text>
        </View>

        {/* Metric Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you competing on?</Text>
          <View style={styles.metricsGrid}>
            {METRICS.map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={[
                  styles.metricCard,
                  selectedMetric === metric.id && styles.metricCardSelected,
                ]}
                onPress={() => setSelectedMetric(metric.id)}
              >
                <Text style={styles.metricIcon}>{metric.icon}</Text>
                <Text
                  style={[
                    styles.metricName,
                    selectedMetric === metric.id && styles.metricNameSelected,
                  ]}
                >
                  {metric.name}
                </Text>
                <Text style={styles.metricDescription}>{metric.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How long?</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((duration) => (
              <TouchableOpacity
                key={duration.days}
                style={[
                  styles.durationButton,
                  selectedDuration === duration.days && styles.durationButtonSelected,
                ]}
                onPress={() => setSelectedDuration(duration.days)}
              >
                <Text
                  style={[
                    styles.durationText,
                    selectedDuration === duration.days && styles.durationTextSelected,
                  ]}
                >
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stakes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stakes</Text>

          <View style={styles.stakeCard}>
            <Text style={styles.stakeLabel}>If you lose, you will...</Text>
            <TextInput
              style={styles.stakeInput}
              value={myStake}
              onChangeText={setMyStake}
              placeholder="e.g., Cook dinner for a week"
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
          </View>

          <View style={styles.stakeCard}>
            <Text style={styles.stakeLabel}>If partner loses, they will...</Text>
            <TextInput
              style={styles.stakeInput}
              value={partnerStake}
              onChangeText={setPartnerStake}
              placeholder="e.g., Give you a massage"
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
          </View>
        </View>

        {/* Preview */}
        {selectedMetric && myStake && partnerStake && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Bet Preview</Text>
            <Text style={styles.previewText}>
              Compete for <Text style={styles.previewBold}>
                {METRICS.find((m) => m.id === selectedMetric)?.name}
              </Text>{' '}
              over <Text style={styles.previewBold}>{selectedDuration} days</Text>
            </Text>
            <View style={styles.previewStakes}>
              <View style={styles.previewStake}>
                <Text style={styles.previewStakeLabel}>You lose:</Text>
                <Text style={styles.previewStakeValue}>{myStake}</Text>
              </View>
              <View style={styles.previewStake}>
                <Text style={styles.previewStakeLabel}>Partner loses:</Text>
                <Text style={styles.previewStakeValue}>{partnerStake}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (!selectedMetric || !myStake || !partnerStake) && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!selectedMetric || !myStake || !partnerStake}
        >
          <Text style={styles.createButtonIcon}>🎯</Text>
          <Text style={styles.createButtonText}>Send Challenge</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your partner will need to accept the bet before it becomes active.
        </Text>
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
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
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

  // Metrics Grid
  metricsGrid: {
    gap: SPACING.sm,
  },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metricCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  metricName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  metricNameSelected: {
    color: COLORS.primary,
  },
  metricDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Duration
  durationRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  durationButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  durationText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  durationTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Stakes
  stakeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  stakeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  stakeInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Preview
  previewCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  previewTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  previewText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  previewBold: {
    fontWeight: '600',
  },
  previewStakes: {
    gap: SPACING.sm,
  },
  previewStake: {
    flexDirection: 'row',
  },
  previewStakeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    width: 100,
  },
  previewStakeValue: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Create Button
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
  createButtonIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  createButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: '#ffffff',
  },
  disclaimer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
