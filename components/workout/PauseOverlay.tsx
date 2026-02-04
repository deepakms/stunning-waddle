/**
 * Pause Overlay Component
 *
 * Displays when workout is paused, showing who paused and options to resume/quit.
 *
 * Principles:
 * - Clear indication of paused state
 * - Shows who paused the workout
 * - Simple resume/quit options
 */

import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface PauseOverlayProps {
  visible: boolean;
  pausedBy?: string;
  onResume: () => void;
  onQuit: () => void;
  isResuming?: boolean;
}

export function PauseOverlay({
  visible,
  pausedBy,
  onResume,
  onQuit,
  isResuming = false,
}: PauseOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      testID="pause-overlay"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.icon}>⏸️</Text>
          <Text style={styles.title}>Workout Paused</Text>
          {pausedBy && (
            <Text style={styles.pausedBy}>
              Paused by {pausedBy}
            </Text>
          )}

          <View style={styles.buttons}>
            <Button
              title="Resume"
              onPress={onResume}
              loading={isResuming}
              size="lg"
              style={styles.resumeButton}
              testID="resume-button"
            />
            <Button
              title="Quit Workout"
              onPress={onQuit}
              variant="ghost"
              size="md"
              testID="quit-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  content: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pausedBy: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  buttons: {
    width: '100%',
    gap: SPACING.md,
  },
  resumeButton: {
    width: '100%',
  },
});
