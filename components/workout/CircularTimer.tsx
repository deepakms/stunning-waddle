/**
 * Circular Timer Component
 *
 * Displays a countdown timer with a circular progress indicator.
 * Used during workout blocks to show remaining time.
 *
 * Principles:
 * - Clear visual representation of time remaining
 * - Smooth progress animation
 * - Accessible time display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONT_SIZES } from '@/constants/app';

interface CircularTimerProps {
  seconds: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

export function CircularTimer({
  seconds,
  total,
  size = 160,
  strokeWidth = 8,
  color = COLORS.primary,
  backgroundColor = COLORS.border,
}: CircularTimerProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, seconds / total));
  const strokeDashoffset = circumference * (1 - progress);

  /**
   * Formats seconds into MM:SS display
   */
  const formatTime = (secs: number): string => {
    const safeSecs = Math.max(0, Math.floor(secs));
    const mins = Math.floor(safeSecs / 60);
    const remainingSecs = safeSecs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const timeDisplay = formatTime(seconds);

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityLabel={`Timer: ${timeDisplay} remaining`}
      accessibilityRole="timer"
    >
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.timeContainer}>
        <Text style={styles.time} testID="timer-display">
          {timeDisplay}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  time: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
});
