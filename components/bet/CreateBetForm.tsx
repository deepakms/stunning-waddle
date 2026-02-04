/**
 * Create Bet Form Component
 *
 * Form for creating a new bet between partners.
 *
 * Principles:
 * - Clear input fields
 * - Metric selection
 * - Date range picker support
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';
import { getBetMetricLabel } from '@/services/bet';
import type { BetMetric } from '@/types/database';

interface CreateBetFormProps {
  partnerName: string;
  onSubmit: (data: BetFormData) => void;
  isLoading?: boolean;
}

export interface BetFormData {
  challengerStake: string;
  challengedStake: string;
  metric: BetMetric;
  customMetricDescription?: string;
  durationDays: number;
}

const METRICS: BetMetric[] = [
  'total_reps',
  'total_sessions',
  'total_minutes',
  'xp_earned',
  'streak_days',
  'custom',
];

const DURATION_OPTIONS = [
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
];

export function CreateBetForm({ partnerName, onSubmit, isLoading }: CreateBetFormProps) {
  const [challengerStake, setChallengerStake] = useState('');
  const [challengedStake, setChallengedStake] = useState('');
  const [metric, setMetric] = useState<BetMetric>('total_reps');
  const [customDescription, setCustomDescription] = useState('');
  const [durationDays, setDurationDays] = useState(7);

  const handleSubmit = () => {
    if (!challengerStake || !challengedStake) return;
    if (metric === 'custom' && !customDescription) return;

    onSubmit({
      challengerStake,
      challengedStake,
      metric,
      customMetricDescription: metric === 'custom' ? customDescription : undefined,
      durationDays,
    });
  };

  const isValid =
    challengerStake.trim() !== '' &&
    challengedStake.trim() !== '' &&
    (metric !== 'custom' || customDescription.trim() !== '');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create a Bet</Text>
      <Text style={styles.subtitle}>Challenge {partnerName} to a friendly competition!</Text>

      {/* Metric Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What are you competing on?</Text>
        <View style={styles.metricGrid}>
          {METRICS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.metricOption, metric === m && styles.metricSelected]}
              onPress={() => setMetric(m)}
            >
              <Text style={[styles.metricText, metric === m && styles.metricTextSelected]}>
                {getBetMetricLabel(m)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {metric === 'custom' && (
          <Input
            label="Describe the competition"
            value={customDescription}
            onChangeText={setCustomDescription}
            placeholder="e.g., Most burpees in a single session"
            style={styles.input}
          />
        )}
      </View>

      {/* Duration Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.days}
              style={[styles.durationOption, durationDays === option.days && styles.durationSelected]}
              onPress={() => setDurationDays(option.days)}
            >
              <Text
                style={[
                  styles.durationText,
                  durationDays === option.days && styles.durationTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stakes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's at stake?</Text>

        <Input
          label="If you lose, you..."
          value={challengerStake}
          onChangeText={setChallengerStake}
          placeholder="e.g., Make dinner for a week"
          style={styles.input}
        />

        <Input
          label={`If ${partnerName} loses, they...`}
          value={challengedStake}
          onChangeText={setChallengedStake}
          placeholder="e.g., Do the dishes for a week"
          style={styles.input}
        />
      </View>

      {/* Submit */}
      <Button
        title="Send Challenge"
        onPress={handleSubmit}
        disabled={!isValid}
        loading={isLoading}
        size="lg"
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
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
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metricOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  metricText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  metricTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  durationOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  durationSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  durationTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    marginTop: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
});
