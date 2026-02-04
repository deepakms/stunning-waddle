/**
 * Block Progress Component
 *
 * Shows progress through workout blocks with a visual progress bar.
 *
 * Principles:
 * - Clear progress indication
 * - Shows current/total blocks
 * - Optional block type display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/app';

type BlockType = 'warmup' | 'exercise' | 'rest' | 'cooldown';

interface BlockProgressProps {
  currentBlock: number;
  totalBlocks: number;
  blockType?: BlockType;
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  warmup: 'Warm Up',
  exercise: 'Exercise',
  rest: 'Rest',
  cooldown: 'Cool Down',
};

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  warmup: COLORS.warning,
  exercise: COLORS.primary,
  rest: COLORS.textSecondary,
  cooldown: COLORS.success,
};

export function BlockProgress({
  currentBlock,
  totalBlocks,
  blockType,
}: BlockProgressProps) {
  const progressPercent = Math.round((currentBlock / totalBlocks) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.blockInfo}>
          <Text style={styles.blockNumber}>
            <Text style={styles.currentBlock}>{currentBlock}</Text>
            <Text style={styles.separator}>/</Text>
            <Text style={styles.totalBlocks}>{totalBlocks}</Text>
          </Text>
          {blockType && (
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${BLOCK_TYPE_COLORS[blockType]}20` },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: BLOCK_TYPE_COLORS[blockType] },
                ]}
              >
                {BLOCK_TYPE_LABELS[blockType]}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.percentText}>{progressPercent}%</Text>
      </View>

      <View style={styles.progressTrack} testID="progress-bar-track">
        <View
          testID="progress-bar-fill"
          style={[
            styles.progressFill,
            { width: `${progressPercent}%` },
            blockType && { backgroundColor: BLOCK_TYPE_COLORS[blockType] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  blockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  blockNumber: {
    fontSize: FONT_SIZES.md,
  },
  currentBlock: {
    fontWeight: '700',
    color: COLORS.text,
  },
  separator: {
    color: COLORS.textSecondary,
  },
  totalBlocks: {
    color: COLORS.textSecondary,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  typeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
