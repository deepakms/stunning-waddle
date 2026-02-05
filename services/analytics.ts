/**
 * Analytics Service
 *
 * User behavior tracking and event analytics.
 * Supports multiple providers (Mixpanel, Amplitude, custom).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface UserProperties {
  userId?: string;
  coupleId?: string;
  fitnessLevel?: string;
  hasPartner?: boolean;
  signupDate?: string;
  platform?: string;
  appVersion?: string;
  [key: string]: any;
}

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export type AnalyticsProvider = 'mixpanel' | 'amplitude' | 'custom' | 'console';

// ============================================
// ANALYTICS EVENTS - TYPE SAFE
// ============================================

export const AnalyticsEvents = {
  // Auth Events
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  SIGN_IN_COMPLETED: 'sign_in_completed',
  SIGN_OUT: 'sign_out',

  // Onboarding Events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Partner Events
  PARTNER_INVITE_SENT: 'partner_invite_sent',
  PARTNER_INVITE_ACCEPTED: 'partner_invite_accepted',
  PARTNER_CONNECTED: 'partner_connected',
  PARTNER_DISCONNECTED: 'partner_disconnected',

  // Workout Events
  WORKOUT_STARTED: 'workout_started',
  WORKOUT_PAUSED: 'workout_paused',
  WORKOUT_RESUMED: 'workout_resumed',
  WORKOUT_COMPLETED: 'workout_completed',
  WORKOUT_ABANDONED: 'workout_abandoned',
  EXERCISE_COMPLETED: 'exercise_completed',
  EXERCISE_SKIPPED: 'exercise_skipped',

  // Feedback Events
  FEEDBACK_STARTED: 'feedback_started',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  FEEDBACK_SKIPPED: 'feedback_skipped',
  EXERCISE_RATED: 'exercise_rated',

  // Health Events
  HEALTH_PERMISSION_REQUESTED: 'health_permission_requested',
  HEALTH_PERMISSION_GRANTED: 'health_permission_granted',
  HEALTH_PERMISSION_DENIED: 'health_permission_denied',
  HEART_RATE_CONNECTED: 'heart_rate_connected',

  // Engagement Events
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  SCREEN_VIEWED: 'screen_viewed',
  BUTTON_PRESSED: 'button_pressed',
  FEATURE_USED: 'feature_used',

  // Bet Events
  BET_CREATED: 'bet_created',
  BET_ACCEPTED: 'bet_accepted',
  BET_COMPLETED: 'bet_completed',

  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  CRASH_RECOVERED: 'crash_recovered',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

// ============================================
// ANALYTICS SERVICE
// ============================================

class AnalyticsService {
  private isInitialized = false;
  private provider: AnalyticsProvider = 'console';
  private userId: string | null = null;
  private userProperties: UserProperties = {};
  private sessionId: string | null = null;
  private sessionStartTime: number = 0;
  private eventQueue: Array<{ event: string; properties: EventProperties; timestamp: number }> = [];

  // Provider instances
  private mixpanel: any = null;
  private amplitude: any = null;

  /**
   * Initialize analytics with a provider
   */
  async initialize(options: {
    provider?: AnalyticsProvider;
    mixpanelToken?: string;
    amplitudeApiKey?: string;
    enableInDev?: boolean;
  } = {}): Promise<boolean> {
    if (this.isInitialized) return true;

    const {
      provider = 'console',
      mixpanelToken = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
      amplitudeApiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
      enableInDev = false,
    } = options;

    // Skip in dev unless explicitly enabled
    if (__DEV__ && !enableInDev) {
      this.provider = 'console';
      this.isInitialized = true;
      console.log('[Analytics] Using console provider in development');
      return true;
    }

    this.provider = provider;

    try {
      // Initialize based on provider
      if (provider === 'mixpanel' && mixpanelToken) {
        await this.initMixpanel(mixpanelToken);
      } else if (provider === 'amplitude' && amplitudeApiKey) {
        await this.initAmplitude(amplitudeApiKey);
      }

      // Start session
      this.startSession();

      // Flush any queued events
      await this.flushQueue();

      this.isInitialized = true;
      console.log(`[Analytics] Initialized with ${provider}`);
      return true;
    } catch (error) {
      console.warn('[Analytics] Initialization failed:', error);
      this.provider = 'console';
      this.isInitialized = true;
      return false;
    }
  }

  private async initMixpanel(token: string): Promise<void> {
    try {
      const { Mixpanel } = require('mixpanel-react-native');
      this.mixpanel = new Mixpanel(token, true);
      await this.mixpanel.init();
    } catch (error) {
      console.warn('[Analytics] Mixpanel not available');
      throw error;
    }
  }

  private async initAmplitude(apiKey: string): Promise<void> {
    try {
      const amplitude = require('@amplitude/analytics-react-native');
      await amplitude.init(apiKey);
      this.amplitude = amplitude;
    } catch (error) {
      console.warn('[Analytics] Amplitude not available');
      throw error;
    }
  }

  /**
   * Identify user
   */
  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    this.userProperties = {
      ...this.userProperties,
      ...properties,
      userId,
      platform: Platform.OS,
    };

    switch (this.provider) {
      case 'mixpanel':
        this.mixpanel?.identify(userId);
        if (properties) {
          this.mixpanel?.getPeople().set(properties);
        }
        break;

      case 'amplitude':
        this.amplitude?.setUserId(userId);
        if (properties) {
          const identify = new this.amplitude.Identify();
          Object.entries(properties).forEach(([key, value]) => {
            identify.set(key, value);
          });
          this.amplitude?.identify(identify);
        }
        break;

      case 'console':
      default:
        console.log('[Analytics] Identify:', userId, properties);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };

    switch (this.provider) {
      case 'mixpanel':
        this.mixpanel?.getPeople().set(properties);
        break;

      case 'amplitude':
        const identify = new this.amplitude.Identify();
        Object.entries(properties).forEach(([key, value]) => {
          identify.set(key, value);
        });
        this.amplitude?.identify(identify);
        break;

      case 'console':
      default:
        console.log('[Analytics] Set Properties:', properties);
    }
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEvent | string, properties?: EventProperties): void {
    const enrichedProperties: EventProperties = {
      ...properties,
      sessionId: this.sessionId,
      platform: Platform.OS,
      timestamp: Date.now(),
    };

    // Queue if not initialized
    if (!this.isInitialized) {
      this.eventQueue.push({
        event,
        properties: enrichedProperties,
        timestamp: Date.now(),
      });
      return;
    }

    switch (this.provider) {
      case 'mixpanel':
        this.mixpanel?.track(event, enrichedProperties);
        break;

      case 'amplitude':
        this.amplitude?.track(event, enrichedProperties);
        break;

      case 'console':
      default:
        console.log(`[Analytics] ${event}:`, enrichedProperties);
    }
  }

  /**
   * Track screen view
   */
  trackScreen(screenName: string, properties?: EventProperties): void {
    this.track(AnalyticsEvents.SCREEN_VIEWED, {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Start a new session
   */
  private startSession(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = Date.now();

    this.track(AnalyticsEvents.APP_OPENED, {
      session_id: this.sessionId,
    });
  }

  /**
   * End current session
   */
  endSession(): void {
    if (!this.sessionId) return;

    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);

    this.track(AnalyticsEvents.APP_BACKGROUNDED, {
      session_duration_seconds: sessionDuration,
    });

    this.sessionId = null;
  }

  /**
   * Flush queued events
   */
  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const { event, properties } of events) {
      this.track(event, properties);
    }
  }

  /**
   * Reset analytics (on logout)
   */
  reset(): void {
    this.userId = null;
    this.userProperties = {};

    switch (this.provider) {
      case 'mixpanel':
        this.mixpanel?.reset();
        break;

      case 'amplitude':
        this.amplitude?.reset();
        break;
    }

    console.log('[Analytics] Reset');
  }

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Track workout events
   */
  trackWorkout = {
    started: (workoutId: string, duration: number, focusArea: string) => {
      this.track(AnalyticsEvents.WORKOUT_STARTED, {
        workout_id: workoutId,
        duration_minutes: duration,
        focus_area: focusArea,
      });
    },

    completed: (
      workoutId: string,
      durationMinutes: number,
      completionRate: number,
      xpEarned: number
    ) => {
      this.track(AnalyticsEvents.WORKOUT_COMPLETED, {
        workout_id: workoutId,
        duration_minutes: durationMinutes,
        completion_rate: completionRate,
        xp_earned: xpEarned,
      });
    },

    abandoned: (workoutId: string, completedBlocks: number, totalBlocks: number) => {
      this.track(AnalyticsEvents.WORKOUT_ABANDONED, {
        workout_id: workoutId,
        completed_blocks: completedBlocks,
        total_blocks: totalBlocks,
        completion_rate: Math.round((completedBlocks / totalBlocks) * 100),
      });
    },

    exerciseCompleted: (exerciseId: string, rir: number, formQuality: string) => {
      this.track(AnalyticsEvents.EXERCISE_COMPLETED, {
        exercise_id: exerciseId,
        rir,
        form_quality: formQuality,
      });
    },
  };

  /**
   * Track onboarding events
   */
  trackOnboarding = {
    started: () => {
      this.track(AnalyticsEvents.ONBOARDING_STARTED);
    },

    stepCompleted: (step: string, stepNumber: number) => {
      this.track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, {
        step_name: step,
        step_number: stepNumber,
      });
    },

    completed: (totalSteps: number, durationSeconds: number) => {
      this.track(AnalyticsEvents.ONBOARDING_COMPLETED, {
        total_steps: totalSteps,
        duration_seconds: durationSeconds,
      });
    },

    skipped: (atStep: string) => {
      this.track(AnalyticsEvents.ONBOARDING_SKIPPED, {
        skipped_at_step: atStep,
      });
    },
  };

  /**
   * Track health integration events
   */
  trackHealth = {
    permissionRequested: (platform: string) => {
      this.track(AnalyticsEvents.HEALTH_PERMISSION_REQUESTED, { platform });
    },

    permissionGranted: (platform: string) => {
      this.track(AnalyticsEvents.HEALTH_PERMISSION_GRANTED, { platform });
    },

    permissionDenied: (platform: string) => {
      this.track(AnalyticsEvents.HEALTH_PERMISSION_DENIED, { platform });
    },

    heartRateConnected: () => {
      this.track(AnalyticsEvents.HEART_RATE_CONNECTED);
    },
  };

  /**
   * Track feedback events
   */
  trackFeedback = {
    submitted: (
      workoutId: string,
      overallDifficulty: number,
      enjoyment: number,
      partnerConnection: number
    ) => {
      this.track(AnalyticsEvents.FEEDBACK_SUBMITTED, {
        workout_id: workoutId,
        overall_difficulty: overallDifficulty,
        enjoyment_rating: enjoyment,
        partner_connection: partnerConnection,
      });
    },

    skipped: (workoutId: string) => {
      this.track(AnalyticsEvents.FEEDBACK_SKIPPED, { workout_id: workoutId });
    },
  };

  /**
   * Track partner events
   */
  trackPartner = {
    inviteSent: (method: string) => {
      this.track(AnalyticsEvents.PARTNER_INVITE_SENT, { invite_method: method });
    },

    connected: () => {
      this.track(AnalyticsEvents.PARTNER_CONNECTED);
    },

    disconnected: (reason?: string) => {
      this.track(AnalyticsEvents.PARTNER_DISCONNECTED, { reason });
    },
  };

  /**
   * Track errors
   */
  trackError(errorType: string, message: string, context?: Record<string, any>): void {
    this.track(AnalyticsEvents.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: message,
      ...context,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export types for external use
export type { AnalyticsService };
