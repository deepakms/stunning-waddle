/**
 * Tests for Supabase client configuration
 *
 * TDD Approach: These tests define the expected behavior of the Supabase client
 * before implementation.
 */

// Mock expo-secure-store before importing supabase
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock environment variables
const mockEnv = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

jest.mock('@/lib/env', () => ({
  env: mockEnv,
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export a supabase client instance', () => {
      const { supabase } = require('@/lib/supabase');
      expect(supabase).toBeDefined();
    });

    it('should have auth methods available', () => {
      const { supabase } = require('@/lib/supabase');
      expect(supabase.auth).toBeDefined();
      expect(typeof supabase.auth.signUp).toBe('function');
      expect(typeof supabase.auth.signInWithPassword).toBe('function');
      expect(typeof supabase.auth.signOut).toBe('function');
    });

    it('should have database methods available', () => {
      const { supabase } = require('@/lib/supabase');
      expect(typeof supabase.from).toBe('function');
    });

    it('should have realtime methods available', () => {
      const { supabase } = require('@/lib/supabase');
      expect(typeof supabase.channel).toBe('function');
    });
  });
});

describe('SecureStorage Adapter', () => {
  it('should use expo-secure-store for getItem', async () => {
    const SecureStore = require('expo-secure-store');
    const { ExpoSecureStoreAdapter } = require('@/lib/supabase');

    SecureStore.getItemAsync.mockResolvedValue('test-value');

    const adapter = new ExpoSecureStoreAdapter();
    const result = await adapter.getItem('test-key');

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('test-key');
    expect(result).toBe('test-value');
  });

  it('should use expo-secure-store for setItem', async () => {
    const SecureStore = require('expo-secure-store');
    const { ExpoSecureStoreAdapter } = require('@/lib/supabase');

    SecureStore.setItemAsync.mockResolvedValue(undefined);

    const adapter = new ExpoSecureStoreAdapter();
    await adapter.setItem('test-key', 'test-value');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
  });

  it('should use expo-secure-store for removeItem', async () => {
    const SecureStore = require('expo-secure-store');
    const { ExpoSecureStoreAdapter } = require('@/lib/supabase');

    SecureStore.deleteItemAsync.mockResolvedValue(undefined);

    const adapter = new ExpoSecureStoreAdapter();
    await adapter.removeItem('test-key');

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('test-key');
  });
});
