/**
 * Authentication Hook & Provider
 *
 * Provides authentication state and methods throughout the app.
 *
 * Principles:
 * - Single source of truth for auth state
 * - React Context for global access
 * - Automatic session management
 * - Type-safe auth operations
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

/**
 * Auth context state interface
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Auth context methods interface
 */
interface AuthMethods {
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
}

/**
 * Result type for auth operations
 */
interface AuthResult {
  data: { user: User | null; session: Session | null } | null;
  error: AuthError | null;
}

/**
 * Combined auth context type
 */
type AuthContextType = AuthState & AuthMethods;

/**
 * Auth context
 * Using undefined as default to properly detect missing provider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 *
 * Wraps the app and provides authentication state and methods.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      return {
        data: data ? { user: data.user, session: data.session } : null,
        error: error as AuthError | null,
      };
    } catch (error) {
      return {
        data: null,
        error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
      };
    }
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return {
        data: data ? { user: data.user, session: data.session } : null,
        error: error as AuthError | null,
      };
    } catch (error) {
      return {
        data: null,
        error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
      };
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signOut();

      return {
        data: { user: null, session: null },
        error: error as AuthError | null,
      };
    } catch (error) {
      return {
        data: null,
        error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
      };
    }
  }, []);

  /**
   * Computed authentication status
   */
  const isAuthenticated = useMemo(() => {
    return session !== null && user !== null;
  }, [session, user]);

  /**
   * Memoized context value
   */
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated,
      signUp,
      signIn,
      signOut,
    }),
    [user, session, isLoading, isAuthenticated, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
