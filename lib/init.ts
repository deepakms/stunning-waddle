/**
 * App Initialization
 *
 * Centralized initialization for monitoring, analytics, and other services.
 * Call initializeApp() early in the app lifecycle (e.g., _layout.tsx).
 */

import { env, validateEnv } from './env';
import { initializeMonitoring, setUser as setMonitoringUser, setTags } from '@/services/monitoring';
import { analytics } from '@/services/analytics';
import { Platform } from 'react-native';

let isInitialized = false;

/**
 * Initialize all app services
 */
export async function initializeApp(): Promise<void> {
  if (isInitialized) return;

  console.log('[Init] Starting app initialization...');

  // Validate environment
  validateEnv();

  // Initialize error monitoring (Sentry)
  if (env.EXPO_PUBLIC_SENTRY_DSN || env.EXPO_PUBLIC_ENABLE_MONITORING) {
    await initializeMonitoring({
      dsn: env.EXPO_PUBLIC_SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',
      enableInDev: false,
    });
  }

  // Initialize analytics
  const analyticsProvider = env.EXPO_PUBLIC_MIXPANEL_TOKEN
    ? 'mixpanel'
    : env.EXPO_PUBLIC_AMPLITUDE_API_KEY
    ? 'amplitude'
    : 'console';

  await analytics.initialize({
    provider: analyticsProvider,
    mixpanelToken: env.EXPO_PUBLIC_MIXPANEL_TOKEN,
    amplitudeApiKey: env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
    enableInDev: env.EXPO_PUBLIC_ENABLE_ANALYTICS,
  });

  // Set global tags
  setTags({
    platform: Platform.OS,
    appVersion: '1.0.0',
  });

  isInitialized = true;
  console.log('[Init] App initialization complete');
}

/**
 * Set user context for monitoring and analytics
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  coupleId?: string;
  fitnessLevel?: string;
  hasPartner?: boolean;
}): void {
  // Set monitoring user
  setMonitoringUser({
    id: user.id,
    email: user.email,
  });

  // Set analytics user
  analytics.identify(user.id, {
    userId: user.id,
    coupleId: user.coupleId,
    fitnessLevel: user.fitnessLevel,
    hasPartner: user.hasPartner,
    platform: Platform.OS,
  });

  // Set tags for error reports
  setTags({
    userId: user.id,
    coupleId: user.coupleId || 'none',
    hasPartner: user.hasPartner ? 'true' : 'false',
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  setMonitoringUser(null);
  analytics.reset();
}

/**
 * Handle app state changes (background/foreground)
 */
export function handleAppStateChange(state: 'active' | 'background' | 'inactive'): void {
  if (state === 'background' || state === 'inactive') {
    analytics.endSession();
  } else if (state === 'active') {
    // Session is started automatically on initialize
  }
}

// Re-export for convenience
export { analytics } from '@/services/analytics';
export { captureException, captureMessage, addBreadcrumb } from '@/services/monitoring';
