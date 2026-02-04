/**
 * Tests for Profile Service
 *
 * TDD Approach: Define expected profile operations before implementation.
 */

// Create mock functions first
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockEq = jest.fn(() => ({ single: mockSingle, select: mockSelect }));
const mockInsert = jest.fn(() => ({ select: mockSelect }));
const mockUpdate = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({
  select: () => ({ eq: mockEq }),
  insert: mockInsert,
  update: mockUpdate,
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

import {
  getProfile,
  createProfile,
  updateProfile,
  getProfileByUserId,
} from '@/services/profile';

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch profile by ID', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
        couple_id: null,
      };

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await getProfile('profile-123');

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
    });

    it('should return error when profile not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      const result = await getProfile('non-existent');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('getProfileByUserId', () => {
    it('should fetch profile by user ID', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
      };

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await getProfileByUserId('user-123');

      expect(result.data).toEqual(mockProfile);
    });
  });

  describe('createProfile', () => {
    it('should create a new profile', async () => {
      const newProfile = {
        user_id: 'user-123',
        display_name: 'John Doe',
      };

      const createdProfile = {
        id: 'profile-123',
        ...newProfile,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: createdProfile,
        error: null,
      });

      const result = await createProfile(newProfile);

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(result.data).toEqual(createdProfile);
      expect(result.error).toBeNull();
    });

    it('should return error on duplicate user_id', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key violation' },
      });

      const result = await createProfile({
        user_id: 'existing-user',
        display_name: 'Test',
      });

      expect(result.error).toBeTruthy();
    });
  });

  describe('updateProfile', () => {
    it('should update an existing profile', async () => {
      const updates = {
        display_name: 'Jane Doe',
        fitness_level: 3,
      };

      const updatedProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        ...updates,
      };

      mockSingle.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      const result = await updateProfile('profile-123', updates);

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(result.data).toEqual(updatedProfile);
    });

    it('should handle partial updates', async () => {
      const updates = { fitness_level: 4 };

      mockSingle.mockResolvedValue({
        data: { id: 'profile-123', ...updates },
        error: null,
      });

      const result = await updateProfile('profile-123', updates);

      expect(result.error).toBeNull();
    });
  });
});
