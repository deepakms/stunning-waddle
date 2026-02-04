/**
 * Supabase Client Configuration
 *
 * Provides a configured Supabase client for the application.
 * Uses expo-secure-store for secure token storage on mobile devices.
 *
 * Principles:
 * - Single instance (singleton pattern)
 * - Secure token storage using platform-native secure storage
 * - Type-safe configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { env } from '@/lib/env';

/**
 * Custom storage adapter using Expo SecureStore
 * Provides secure, encrypted storage for auth tokens on mobile devices
 */
export class ExpoSecureStoreAdapter {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

/**
 * Supabase client instance
 * Configured with:
 * - Secure storage for auth tokens
 * - Auto token refresh
 * - Persistent sessions
 */
export const supabase: SupabaseClient = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: new ExpoSecureStoreAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
