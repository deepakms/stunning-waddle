/**
 * Ready Check Component
 *
 * Displays partner readiness status before starting a workout block.
 * Both partners must tap "Ready" before the block begins.
 *
 * Principles:
 * - Clear visual feedback for both partners' status
 * - Simple interaction (one button)
 * - Real-time state updates
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface ReadyCheckProps {
  myName: string;
  partnerName: string;
  myReady: boolean;
  partnerReady: boolean;
  onReady: () => void;
  isLoading?: boolean;
}

interface ReadyIndicatorProps {
  name: string;
  ready: boolean;
}

function ReadyIndicator({ name, ready }: ReadyIndicatorProps) {
  return (
    <View
      style={styles.indicator}
      accessibilityLabel={`${name}: ${ready ? 'ready' : 'not ready'}`}
    >
      <View
        style={[
          styles.statusDot,
          { backgroundColor: ready ? COLORS.success : COLORS.border },
        ]}
        testID={`ready-indicator-${name.toLowerCase().replace(' ', '-')}`}
      />
      <Text style={styles.name}>{name}</Text>
      <Text style={[styles.status, ready && styles.statusReady]}>
        {ready ? 'Ready!' : 'Waiting...'}
      </Text>
    </View>
  );
}

export function ReadyCheck({
  myName,
  partnerName,
  myReady,
  partnerReady,
  onReady,
  isLoading = false,
}: ReadyCheckProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ready to start?</Text>
      <Text style={styles.subtitle}>
        Both partners need to be ready to begin
      </Text>

      <View style={styles.indicators}>
        <ReadyIndicator name={myName} ready={myReady} />
        <View style={styles.divider} />
        <ReadyIndicator name={partnerName} ready={partnerReady} />
      </View>

      {!myReady ? (
        <Button
          title="I'm Ready!"
          onPress={onReady}
          loading={isLoading}
          size="lg"
          style={styles.button}
          testID="ready-button"
        />
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            Waiting for {partnerName}...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  indicator: {
    alignItems: 'center',
    minWidth: 100,
  },
  statusDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  status: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusReady: {
    color: COLORS.success,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  button: {
    minWidth: 200,
  },
  waitingContainer: {
    paddingVertical: SPACING.lg,
  },
  waitingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
