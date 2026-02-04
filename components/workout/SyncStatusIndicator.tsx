/**
 * Sync Status Indicator Component
 *
 * Shows the real-time connection status between workout partners.
 * Provides visual feedback for connected/reconnecting states.
 *
 * Principles:
 * - Clear visual feedback for connection state
 * - Accessible with proper labels
 * - Minimalist design to not distract from workout
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface SyncStatusIndicatorProps {
  isConnected: boolean;
  partnerName?: string;
}

export function SyncStatusIndicator({
  isConnected,
  partnerName = 'Partner',
}: SyncStatusIndicatorProps) {
  const statusText = isConnected
    ? `${partnerName} connected`
    : 'Reconnecting...';

  const accessibilityLabel = `Partner connection status: ${isConnected ? 'connected' : 'reconnecting'}`;

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="status"
    >
      <View
        testID="sync-status-dot"
        style={[
          styles.dot,
          { backgroundColor: isConnected ? COLORS.success : COLORS.error },
        ]}
      />
      <Text style={styles.text}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
