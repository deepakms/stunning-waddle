/**
 * Exercise Feedback Card
 *
 * Individual exercise feedback capture.
 * Collects RIR, form quality, and difficulty feedback.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface ExerciseFeedbackCardProps {
  exerciseId: string;
  exerciseName: string;
  wasCompleted: boolean;
  onFeedbackChange: (feedback: ExerciseFeedbackData) => void;
}

export interface ExerciseFeedbackData {
  exerciseId: string;
  completed: boolean;
  actualReps: number | null;
  actualRIR: number;
  formQuality: 'poor' | 'okay' | 'good' | 'perfect';
  feltTooEasy: boolean;
  feltTooHard: boolean;
  feltPain: boolean;
  notes: string | null;
}

const RIR_OPTIONS = [
  { value: 0, label: '0', desc: 'Failed' },
  { value: 1, label: '1', desc: 'Max effort' },
  { value: 2, label: '2', desc: 'Hard' },
  { value: 3, label: '3', desc: 'Challenging' },
  { value: 4, label: '4+', desc: 'Easy' },
];

const FORM_OPTIONS: { value: ExerciseFeedbackData['formQuality']; label: string; emoji: string }[] = [
  { value: 'poor', label: 'Poor', emoji: '😓' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'perfect', label: 'Perfect', emoji: '🌟' },
];

export function ExerciseFeedbackCard({
  exerciseId,
  exerciseName,
  wasCompleted,
  onFeedbackChange,
}: ExerciseFeedbackCardProps) {
  const [completed, setCompleted] = useState(wasCompleted);
  const [rir, setRir] = useState(2);
  const [formQuality, setFormQuality] = useState<ExerciseFeedbackData['formQuality']>('good');
  const [feltTooEasy, setFeltTooEasy] = useState(false);
  const [feltTooHard, setFeltTooHard] = useState(false);
  const [feltPain, setFeltPain] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const updateFeedback = (updates: Partial<ExerciseFeedbackData>) => {
    const feedback: ExerciseFeedbackData = {
      exerciseId,
      completed,
      actualReps: null,
      actualRIR: rir,
      formQuality,
      feltTooEasy,
      feltTooHard,
      feltPain,
      notes: null,
      ...updates,
    };
    onFeedbackChange(feedback);
  };

  const handleRirChange = (value: number) => {
    setRir(value);
    const tooEasy = value >= 4;
    const tooHard = value <= 1;
    setFeltTooEasy(tooEasy);
    setFeltTooHard(tooHard);
    updateFeedback({ actualRIR: value, feltTooEasy: tooEasy, feltTooHard: tooHard });
  };

  const handleFormChange = (value: ExerciseFeedbackData['formQuality']) => {
    setFormQuality(value);
    updateFeedback({ formQuality: value });
  };

  const handlePainToggle = () => {
    const newValue = !feltPain;
    setFeltPain(newValue);
    updateFeedback({ feltPain: newValue });
  };

  const handleCompletedToggle = () => {
    const newValue = !completed;
    setCompleted(newValue);
    updateFeedback({ completed: newValue });
  };

  return (
    <View style={styles.container}>
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.checkbox, completed && styles.checkboxChecked]}
            onPress={handleCompletedToggle}
          >
            {completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={[styles.exerciseName, !completed && styles.exerciseNameSkipped]}>
            {exerciseName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.quickBadge, { backgroundColor: getRirColor(rir) }]}>
            <Text style={styles.quickBadgeText}>RIR {rir}</Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.details}>
          {/* RIR Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Reps in Reserve (how many more could you do?)
            </Text>
            <View style={styles.rirOptions}>
              {RIR_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.rirOption,
                    rir === option.value && styles.rirOptionSelected,
                  ]}
                  onPress={() => handleRirChange(option.value)}
                >
                  <Text
                    style={[
                      styles.rirValue,
                      rir === option.value && styles.rirValueSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.rirDesc,
                      rir === option.value && styles.rirDescSelected,
                    ]}
                  >
                    {option.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form Quality */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Form Quality</Text>
            <View style={styles.formOptions}>
              {FORM_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.formOption,
                    formQuality === option.value && styles.formOptionSelected,
                  ]}
                  onPress={() => handleFormChange(option.value)}
                >
                  <Text style={styles.formEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.formLabel,
                      formQuality === option.value && styles.formLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pain Warning */}
          <TouchableOpacity
            style={[styles.painToggle, feltPain && styles.painToggleActive]}
            onPress={handlePainToggle}
          >
            <Text style={styles.painIcon}>⚠️</Text>
            <Text style={[styles.painText, feltPain && styles.painTextActive]}>
              I felt pain during this exercise
            </Text>
            <View style={[styles.painCheckbox, feltPain && styles.painCheckboxActive]}>
              {feltPain && <Text style={styles.painCheckmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getRirColor(rir: number): string {
  if (rir >= 4) return `${COLORS.success}30`;
  if (rir >= 2) return `${COLORS.primary}30`;
  if (rir >= 1) return `${COLORS.warning}30`;
  return `${COLORS.error}30`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  exerciseNameSkipped: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  quickBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Details
  details: {
    padding: SPACING.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  // RIR Options
  rirOptions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  rirOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  rirOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  rirValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  rirValueSelected: {
    color: '#fff',
  },
  rirDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rirDescSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Form Options
  formOptions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  formOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  formOptionSelected: {
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  formEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  formLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  formLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Pain Toggle
  painToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  painToggleActive: {
    backgroundColor: `${COLORS.error}15`,
  },
  painIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  painText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  painTextActive: {
    color: COLORS.error,
    fontWeight: '500',
  },
  painCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  painCheckboxActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  painCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
