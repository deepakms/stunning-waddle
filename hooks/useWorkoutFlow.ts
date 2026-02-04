/**
 * Workout Flow Hook
 *
 * Manages workout block navigation and state tracking.
 * Handles transitions between warmup, exercise, rest, and cooldown blocks.
 *
 * Principles:
 * - Immutable state updates
 * - Clear block navigation
 * - Progress tracking
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { WorkoutData, WorkoutBlock, ExerciseSlot } from '@/types/database';

interface UseWorkoutFlowReturn {
  // Current state
  currentBlockIndex: number;
  currentBlock: WorkoutBlock;
  slotA: ExerciseSlot;
  slotB: ExerciseSlot;
  isComplete: boolean;

  // Counts
  totalBlocks: number;
  completedBlocks: number;
  totalDurationSeconds: number;

  // Progress
  progressPercent: number;

  // Actions
  nextBlock: () => void;
  completeSlot: (slot: 'a' | 'b', completedReps?: number) => void;
  reset: () => void;
}

export function useWorkoutFlow(workoutData: WorkoutData): UseWorkoutFlowReturn {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [blocks, setBlocks] = useState<WorkoutBlock[]>(workoutData.blocks);
  const [isComplete, setIsComplete] = useState(false);

  const totalBlocks = workoutData.blocks.length;

  // Keep a ref to current block index for use in callbacks
  const currentBlockIndexRef = useRef(currentBlockIndex);
  useEffect(() => {
    currentBlockIndexRef.current = currentBlockIndex;
  }, [currentBlockIndex]);

  // Ensure we never go out of bounds
  const safeBlockIndex = useMemo(() => {
    return Math.min(currentBlockIndex, totalBlocks - 1);
  }, [currentBlockIndex, totalBlocks]);

  const currentBlock = useMemo(() => {
    return blocks[safeBlockIndex];
  }, [blocks, safeBlockIndex]);

  const slotA = useMemo(() => {
    return blocks[safeBlockIndex]?.slot_a ?? currentBlock.slot_a;
  }, [blocks, safeBlockIndex, currentBlock]);

  const slotB = useMemo(() => {
    return blocks[safeBlockIndex]?.slot_b ?? currentBlock.slot_b;
  }, [blocks, safeBlockIndex, currentBlock]);

  const completedBlocks = useMemo(() => {
    return currentBlockIndex;
  }, [currentBlockIndex]);

  const progressPercent = useMemo(() => {
    return Math.round((completedBlocks / totalBlocks) * 100);
  }, [completedBlocks, totalBlocks]);

  const totalDurationSeconds = useMemo(() => {
    return workoutData.blocks.reduce((sum, block) => sum + block.duration_seconds, 0);
  }, [workoutData.blocks]);

  const nextBlock = useCallback(() => {
    setCurrentBlockIndex((prev) => {
      if (prev >= totalBlocks - 1) {
        setIsComplete(true);
        return prev; // Stay at last block
      }
      const newIndex = prev + 1;
      currentBlockIndexRef.current = newIndex; // Update ref synchronously
      return newIndex;
    });
  }, [totalBlocks]);

  const completeSlot = useCallback(
    (slot: 'a' | 'b', completedReps?: number) => {
      setBlocks((prevBlocks) => {
        const blockIndex = currentBlockIndexRef.current;
        const newBlocks = [...prevBlocks];
        const currentBlockCopy = { ...newBlocks[blockIndex] };

        if (slot === 'a') {
          currentBlockCopy.slot_a = {
            ...currentBlockCopy.slot_a,
            completed: true,
            completed_reps: completedReps,
          };
        } else {
          currentBlockCopy.slot_b = {
            ...currentBlockCopy.slot_b,
            completed: true,
            completed_reps: completedReps,
          };
        }

        newBlocks[blockIndex] = currentBlockCopy;
        return newBlocks;
      });
    },
    []
  );

  const reset = useCallback(() => {
    setCurrentBlockIndex(0);
    setBlocks(workoutData.blocks);
    setIsComplete(false);
  }, [workoutData.blocks]);

  return {
    currentBlockIndex,
    currentBlock,
    slotA,
    slotB,
    isComplete,
    totalBlocks,
    completedBlocks,
    totalDurationSeconds,
    progressPercent,
    nextBlock,
    completeSlot,
    reset,
  };
}
