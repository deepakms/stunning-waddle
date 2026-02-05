/**
 * Error Monitoring Service
 *
 * Centralized error tracking and reporting.
 * Uses Sentry for production error monitoring.
 */

import { Platform } from 'react-native';

// ============================================
// TYPES
// ============================================

export interface ErrorContext {
  userId?: string;
  coupleId?: string;
  screen?: string;
  action?: string;
  extra?: Record<string, any>;
}

export interface BreadcrumbData {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

// ============================================
// SENTRY INTEGRATION
// ============================================

let Sentry: any = null;
let isInitialized = false;

/**
 * Initialize error monitoring
 * Call this early in app startup (e.g., in _layout.tsx)
 */
export async function initializeMonitoring(options?: {
  dsn?: string;
  environment?: string;
  enableInDev?: boolean;
}): Promise<boolean> {
  if (isInitialized) return true;

  const {
    dsn = process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment = __DEV__ ? 'development' : 'production',
    enableInDev = false,
  } = options || {};

  // Skip in development unless explicitly enabled
  if (__DEV__ && !enableInDev) {
    console.log('[Monitoring] Skipped in development mode');
    isInitialized = true;
    return true;
  }

  // Skip if no DSN configured
  if (!dsn) {
    console.warn('[Monitoring] No Sentry DSN configured');
    isInitialized = true;
    return false;
  }

  try {
    // Dynamic import to avoid errors if not installed
    Sentry = require('@sentry/react-native');

    Sentry.init({
      dsn,
      environment,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
      attachStacktrace: true,
      debug: __DEV__,
      beforeSend(event: any) {
        // Scrub sensitive data
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
        }
        return event;
      },
    });

    isInitialized = true;
    console.log('[Monitoring] Sentry initialized successfully');
    return true;
  } catch (error) {
    console.warn('[Monitoring] Failed to initialize Sentry:', error);
    isInitialized = true;
    return false;
  }
}

/**
 * Set user context for error reports
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
} | null): void {
  if (Sentry) {
    Sentry.setUser(user);
  }
}

/**
 * Set additional context tags
 */
export function setTags(tags: Record<string, string>): void {
  if (Sentry) {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value);
    });
  }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: BreadcrumbData): void {
  if (Sentry) {
    Sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000,
    });
  }

  // Also log to console in dev
  if (__DEV__) {
    console.log(`[Breadcrumb] ${breadcrumb.category}: ${breadcrumb.message}`);
  }
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error | string,
  context?: ErrorContext
): string | null {
  const errorObj = typeof error === 'string' ? new Error(error) : error;

  // Always log to console
  console.error('[Error]', errorObj.message, context);

  if (Sentry) {
    return Sentry.captureException(errorObj, {
      extra: {
        ...context?.extra,
        screen: context?.screen,
        action: context?.action,
      },
      tags: {
        userId: context?.userId,
        coupleId: context?.coupleId,
      },
    });
  }

  return null;
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: ErrorContext
): string | null {
  if (__DEV__) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }

  if (Sentry) {
    return Sentry.captureMessage(message, {
      level,
      extra: context?.extra,
      tags: {
        userId: context?.userId,
        coupleId: context?.coupleId,
        screen: context?.screen,
      },
    });
  }

  return null;
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  operation: string
): { finish: () => void } | null {
  if (Sentry) {
    const transaction = Sentry.startTransaction({
      name,
      op: operation,
    });
    return {
      finish: () => transaction.finish(),
    };
  }
  return null;
}

/**
 * Wrap a function with error boundary
 */
export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // Handle promises
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          captureException(error, context);
          throw error;
        });
      }

      return result;
    } catch (error) {
      captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

// ============================================
// REACT ERROR BOUNDARY HELPER
// ============================================

/**
 * Create error handler for React Error Boundaries
 */
export function createErrorHandler(screenName: string) {
  return (error: Error, errorInfo: { componentStack: string }) => {
    captureException(error, {
      screen: screenName,
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  };
}

// ============================================
// NETWORK ERROR TRACKING
// ============================================

/**
 * Track API errors with context
 */
export function trackApiError(
  endpoint: string,
  method: string,
  statusCode: number,
  errorMessage: string,
  context?: ErrorContext
): void {
  addBreadcrumb({
    category: 'api',
    message: `${method} ${endpoint} failed with ${statusCode}`,
    level: 'error',
    data: { statusCode, errorMessage },
  });

  if (statusCode >= 500) {
    captureMessage(`API Error: ${method} ${endpoint}`, 'error', {
      ...context,
      extra: {
        ...context?.extra,
        endpoint,
        method,
        statusCode,
        errorMessage,
      },
    });
  }
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

/**
 * Track screen load time
 */
export function trackScreenLoad(screenName: string, loadTimeMs: number): void {
  addBreadcrumb({
    category: 'navigation',
    message: `Screen loaded: ${screenName}`,
    data: { loadTimeMs },
  });

  if (loadTimeMs > 3000) {
    captureMessage(`Slow screen load: ${screenName}`, 'warning', {
      screen: screenName,
      extra: { loadTimeMs },
    });
  }
}

/**
 * Track workout completion
 */
export function trackWorkoutComplete(
  workoutId: string,
  durationMinutes: number,
  completionRate: number,
  context?: ErrorContext
): void {
  addBreadcrumb({
    category: 'workout',
    message: 'Workout completed',
    data: { workoutId, durationMinutes, completionRate },
  });
}

// ============================================
// EXPORT SENTRY COMPONENTS (if available)
// ============================================

export function getSentryErrorBoundary(): React.ComponentType<any> | null {
  if (Sentry?.ErrorBoundary) {
    return Sentry.ErrorBoundary;
  }
  return null;
}

export function wrapWithSentry<T extends React.ComponentType<any>>(
  component: T,
  name?: string
): T {
  if (Sentry?.wrap) {
    return Sentry.wrap(component, { name });
  }
  return component;
}
