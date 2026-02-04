/**
 * Tests for Exercise Service
 *
 * TDD Approach: Define expected exercise query behavior before implementation.
 */

// Mock data
const mockExercises = [
  { id: '1', name: 'Push-up', muscle_group: 'chest', difficulty: 2 },
  { id: '2', name: 'Pull-up', muscle_group: 'back', difficulty: 3 },
  { id: '3', name: 'Squat', muscle_group: 'quadriceps', difficulty: 2 },
];

const mockChestExercises = [
  { id: '1', name: 'Push-up', muscle_group: 'chest', difficulty: 2 },
  { id: '4', name: 'Bench Press', muscle_group: 'chest', difficulty: 3 },
];

const mockPairs = [
  { id: '1', exercise_a_id: 'ex1', exercise_b_id: 'ex2', muscle_group: 'chest' },
  { id: '2', exercise_a_id: 'ex3', exercise_b_id: 'ex4', muscle_group: 'back' },
];

// Create chainable mock
const createChainMock = (data: any, error: any = null) => {
  const mock: any = {};
  const chainMethods = ['select', 'eq', 'lte', 'gte', 'or', 'order'];

  chainMethods.forEach(method => {
    mock[method] = jest.fn(() => mock);
  });

  mock.single = jest.fn().mockResolvedValue({ data, error });

  // Make it thenable for non-single queries
  mock.then = (resolve: Function) => Promise.resolve({ data, error }).then(resolve);
  mock.catch = () => mock;

  return mock;
};

// Mock supabase - must use 'mock' prefix for hoisting
let mockCurrentChain = createChainMock([]);
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockCurrentChain),
  },
}));

import { supabase } from '@/lib/supabase';
import {
  getExercises,
  getExerciseById,
  getExercisesByMuscleGroup,
  getExercisesByDifficulty,
  getExercisePairs,
  getExercisePairsByMuscleGroup,
  searchExercises,
} from '@/services/exercise';

describe('Exercise Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExercises', () => {
    it('should return all exercises', async () => {
      mockCurrentChain = createChainMock(mockExercises);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercises();

      expect(supabase.from).toHaveBeenCalledWith('exercises');
      expect(result.data).toEqual(mockExercises);
      expect(result.error).toBeNull();
    });

    it('should handle errors', async () => {
      mockCurrentChain = createChainMock(null, { message: 'Database error' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercises();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'Database error' });
    });
  });

  describe('getExerciseById', () => {
    it('should return a single exercise by ID', async () => {
      const mockExercise = {
        id: '1',
        name: 'Push-up',
        muscle_group: 'chest',
        difficulty: 2,
        instructions: ['Get into plank position', 'Lower your body', 'Push back up'],
      };
      mockCurrentChain = createChainMock(mockExercise);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExerciseById('1');

      expect(supabase.from).toHaveBeenCalledWith('exercises');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('id', '1');
      expect(result.data).toEqual(mockExercise);
    });

    it('should return error for non-existent exercise', async () => {
      mockCurrentChain = createChainMock(null, { message: 'Exercise not found' });
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExerciseById('non-existent');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('getExercisesByMuscleGroup', () => {
    it('should return exercises filtered by muscle group', async () => {
      mockCurrentChain = createChainMock(mockChestExercises);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercisesByMuscleGroup('chest');

      expect(supabase.from).toHaveBeenCalledWith('exercises');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('muscle_group', 'chest');
      expect(result.data).toEqual(mockChestExercises);
      expect(result.data?.length).toBe(2);
    });

    it('should return empty array for muscle group with no exercises', async () => {
      mockCurrentChain = createChainMock([]);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercisesByMuscleGroup('calves');

      expect(result.data).toEqual([]);
    });
  });

  describe('getExercisesByDifficulty', () => {
    it('should return exercises with difficulty <= specified level', async () => {
      const mockBeginnerExercises = [
        { id: '1', name: 'Push-up', muscle_group: 'chest', difficulty: 1 },
        { id: '2', name: 'Knee Push-up', muscle_group: 'chest', difficulty: 1 },
      ];
      mockCurrentChain = createChainMock(mockBeginnerExercises);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercisesByDifficulty(2);

      expect(supabase.from).toHaveBeenCalledWith('exercises');
      expect(mockCurrentChain.lte).toHaveBeenCalledWith('difficulty', 2);
      expect(result.data).toEqual(mockBeginnerExercises);
    });

    it('should accept difficulty range', async () => {
      const mockModerateExercises = [
        { id: '1', name: 'Diamond Push-up', muscle_group: 'chest', difficulty: 3 },
      ];
      mockCurrentChain = createChainMock(mockModerateExercises);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercisesByDifficulty(3, 2);

      expect(mockCurrentChain.lte).toHaveBeenCalledWith('difficulty', 3);
      expect(mockCurrentChain.gte).toHaveBeenCalledWith('difficulty', 2);
    });
  });

  describe('getExercisePairs', () => {
    it('should return all exercise pairs', async () => {
      mockCurrentChain = createChainMock(mockPairs);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercisePairs();

      expect(supabase.from).toHaveBeenCalledWith('exercise_pairs');
      expect(result.data).toEqual(mockPairs);
    });
  });

  describe('getExercisePairsByMuscleGroup', () => {
    it('should return pairs filtered by muscle group', async () => {
      const mockChestPairs = [
        { id: '1', exercise_a_id: 'ex1', exercise_b_id: 'ex2', muscle_group: 'chest' },
      ];
      mockCurrentChain = createChainMock(mockChestPairs);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await getExercisePairsByMuscleGroup('chest');

      expect(supabase.from).toHaveBeenCalledWith('exercise_pairs');
      expect(mockCurrentChain.eq).toHaveBeenCalledWith('muscle_group', 'chest');
      expect(result.data).toEqual(mockChestPairs);
    });
  });

  describe('searchExercises', () => {
    it('should search exercises by name', async () => {
      const mockResults = [
        { id: '1', name: 'Push-up', muscle_group: 'chest', difficulty: 2 },
        { id: '2', name: 'Diamond Push-up', muscle_group: 'chest', difficulty: 3 },
      ];
      mockCurrentChain = createChainMock(mockResults);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await searchExercises('push');

      expect(supabase.from).toHaveBeenCalledWith('exercises');
      expect(result.data).toEqual(mockResults);
    });

    it('should return empty array for no matches', async () => {
      mockCurrentChain = createChainMock([]);
      (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

      const result = await searchExercises('nonexistent');

      expect(result.data).toEqual([]);
    });
  });
});

describe('Exercise Data Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify exercise has all required fields', async () => {
    const completeExercise = {
      id: '1',
      name: 'Push-up',
      description: 'A classic bodyweight exercise',
      instructions: ['Get into plank position', 'Lower your body', 'Push back up'],
      muscle_group: 'chest',
      difficulty: 2,
      video_url: 'https://youtube.com/watch?v=123',
    };
    mockCurrentChain = createChainMock(completeExercise);
    (supabase.from as jest.Mock).mockReturnValue(mockCurrentChain);

    const result = await getExerciseById('1');

    expect(result.data).not.toBeNull();
    expect(result.data?.name).toBeDefined();
    expect(result.data?.instructions).toBeDefined();
    expect(result.data?.muscle_group).toBeDefined();
    expect(result.data?.difficulty).toBeDefined();
    expect(result.data?.video_url).toBeDefined();
  });

  it('should verify video URL is valid YouTube format', () => {
    const validUrls = [
      'https://youtube.com/watch?v=abc123',
      'https://www.youtube.com/watch?v=abc123',
      'https://youtu.be/abc123',
    ];

    const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;

    validUrls.forEach((url) => {
      expect(url).toMatch(youtubePattern);
    });
  });
});
