/**
 * Tests for useAuth hook
 *
 * TDD Approach: Define expected auth behavior before implementation.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Create mock functions that can be referenced in the mock
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) =>
        mockOnAuthStateChange(callback),
      signUp: (params: { email: string; password: string }) => mockSignUp(params),
      signInWithPassword: (params: { email: string; password: string }) =>
        mockSignInWithPassword(params),
      signOut: () => mockSignOut(),
    },
  },
}));

// Import after mocking
import { useAuth, AuthProvider } from '@/hooks/useAuth';

// Wrapper component for testing hooks with context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should set isLoading to false after checking session', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Session Management', () => {
    it('should load existing session on mount', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.user).toEqual(mockSession.user);
      });
    });

    it('should update state when auth state changes', async () => {
      let authCallback: (event: string, session: unknown) => void = () => {};

      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate sign in event
      const newSession = {
        user: { id: 'user-456', email: 'new@example.com' },
        access_token: 'token-456',
      };

      act(() => {
        authCallback('SIGNED_IN', newSession);
      });

      expect(result.current.session).toEqual(newSession);
      expect(result.current.user).toEqual(newSession.user);
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with email and password', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'new-user' }, session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error on signUp failure', async () => {
      const mockError = { message: 'Email already registered' };
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signUpResult: { error?: { message: string } } = {};
      await act(async () => {
        signUpResult = await result.current.signUp('test@example.com', 'password123');
      });

      expect(signUpResult.error).toEqual(mockError);
    });
  });

  describe('signIn', () => {
    it('should call supabase signInWithPassword', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
      };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error on invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let signInResult: { error?: { message: string } } = {};
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrong');
      });

      expect(signInResult.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should clear user and session on signOut', async () => {
      // Start with a session
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      let authCallback: (event: string, session: unknown) => void = () => {};
      mockOnAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      mockSignOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      await act(async () => {
        await result.current.signOut();
        // Simulate the auth state change event
        authCallback('SIGNED_OUT', null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no session', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return true when session exists', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
      };

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });
});
