/**
 * Environment configuration
 *
 * Centralizes access to environment variables with type safety.
 * All EXPO_PUBLIC_ prefixed variables are available at runtime.
 */

export const env = {
  // Supabase
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  EXPO_PUBLIC_APP_URL: process.env.EXPO_PUBLIC_APP_URL ?? 'https://app.couplesworkout.com',

  // Error Monitoring (Sentry)
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',

  // Analytics
  EXPO_PUBLIC_MIXPANEL_TOKEN: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '',
  EXPO_PUBLIC_AMPLITUDE_API_KEY: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? '',

  // Feature Flags
  EXPO_PUBLIC_ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  EXPO_PUBLIC_ENABLE_MONITORING: process.env.EXPO_PUBLIC_ENABLE_MONITORING === 'true',
} as const;

/**
 * Validates that required environment variables are set
 * Call this during app initialization
 */
export function validateEnv(): void {
  const required = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'] as const;

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
}
