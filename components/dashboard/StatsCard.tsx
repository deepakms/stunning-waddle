/**
 * Stats Card Component
 *
 * Displays a single statistic with icon, value, and optional subtitle.
 *
 * Principles:
 * - Clean, card-based design
 * - Optional accent color for emphasis
 * - Flexible layout
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

interface StatsCardProps {
  title: string;
  value: string;
  icon?: string;
  subtitle?: string;
  accentColor?: string;
  testID?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  subtitle,
  accentColor,
  testID,
}: StatsCardProps) {
  return (
    <View
      style={[
        styles.container,
        accentColor && { borderLeftColor: accentColor, borderLeftWidth: 4 },
      ]}
      testID={testID}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, accentColor && { color: accentColor }]}>
          {value}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
