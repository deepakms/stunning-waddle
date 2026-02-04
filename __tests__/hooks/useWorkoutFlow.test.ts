/**
 * Tests for useWorkoutFlow Hook
 *
 * Tests workout flow state management and transitions.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutFlow } from '@/hooks/useWorkoutFlow';
import type { WorkoutData } from '@/types/database';

const mockWorkoutData: WorkoutData = {
  blocks: [
    {
      id: 'block-1',
      type: 'warmup',
      duration_seconds: 60,
      slot_a: { exercise_id: 'ex-1', exercise_name: 'Jumping Jacks', completed: false },
      slot_b: { exercise_id: 'ex-1', exercise_name: 'Jumping Jacks', completed: false },
    },
    {
      id: 'block-2',
      type: 'exercise',
      duration_seconds: 45,
      slot_a: { exercise_id: 'ex-2', exercise_name: 'Push-ups', reps: 10, completed: false },
      slot_b: { exercise_id: 'ex-3', exercise_name: 'Knee Push-ups', reps: 12, completed: false },
    },
    {
      id: 'block-3',
      type: 'rest',
      duration_seconds: 30,
      slot_a: { exercise_id: 'rest', exercise_name: 'Rest', completed: false },
      slot_b: { exercise_id: 'rest', exercise_name: 'Rest', completed: false },
    },
    {
      id: 'block-4',
      type: 'cooldown',
      duration_seconds: 60,
      slot_a: { exercise_id: 'ex-4', exercise_name: 'Stretch', completed: false },
      slot_b: { exercise_id: 'ex-4', exercise_name: 'Stretch', completed: false },
    },
  ],
  total_duration_minutes: 30,
  muscle_groups: ['chest', 'core'],
  difficulty_a: 2,
  difficulty_b: 3,
};

describe('useWorkoutFlow', () => {
  describe('initialization', () => {
    it('should start at block 0', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      expect(result.current.currentBlockIndex).toBe(0);
    });

    it('should return current block', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      expect(result.current.currentBlock.type).toBe('warmup');
    });

    it('should not be complete initially', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      expect(result.current.isComplete).toBe(false);
    });

    it('should track total blocks', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      expect(result.current.totalBlocks).toBe(4);
    });
  });

  describe('block navigation', () => {
    it('should advance to next block', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));

      act(() => {
        result.current.nextBlock();
      });

      expect(result.current.currentBlockIndex).toBe(1);
      expect(result.current.currentBlock.type).toBe('exercise');
    });

    it('should mark workout complete on last block', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));

      // Advance through all blocks
      act(() => {
        result.current.nextBlock(); // 1
        result.current.nextBlock(); // 2
        result.current.nextBlock(); // 3
        result.current.nextBlock(); // should complete
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('should not advance past last block', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));

      // Advance to end
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.nextBlock();
        }
      });

      expect(result.current.currentBlockIndex).toBe(3);
    });
  });

  describe('exercise slots', () => {
    it('should provide slot A exercise', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      expect(result.current.slotA.exercise_name).toBe('Jumping Jacks');
    });

    it('should provide slot B exercise', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      expect(result.current.slotB.exercise_name).toBe('Jumping Jacks');
    });

    it('should mark slot as completed', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));

      act(() => {
        result.current.completeSlot('a');
      });

      expect(result.current.slotA.completed).toBe(true);
    });

    it('should track completed reps', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));

      act(() => {
        result.current.nextBlock(); // Move to exercise block
        result.current.completeSlot('a', 8);
      });

      expect(result.current.slotA.completed_reps).toBe(8);
    });
  });

  describe('time tracking', () => {
    it('should return current block duration', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      expect(result.current.currentBlock.duration_seconds).toBe(60);
    });

    it('should calculate total workout duration', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));
      // 60 + 45 + 30 + 60 = 195 seconds
      expect(result.current.totalDurationSeconds).toBe(195);
    });
  });

  describe('progress tracking', () => {
    it('should track completed blocks count', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));

      act(() => {
        result.current.nextBlock();
        result.current.nextBlock();
      });

      expect(result.current.completedBlocks).toBe(2);
    });

    it('should calculate progress percentage', () => {
      const { result } = renderHook(() => useWorkoutFlow(mockWorkoutData));

      act(() => {
        result.current.nextBlock();
        result.current.nextBlock();
      });

      expect(result.current.progressPercent).toBe(50);
    });
  });
});
