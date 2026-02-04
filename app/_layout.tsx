/**
 * Root Layout
 *
 * The root layout component for the app using Expo Router.
 * Provides global providers and navigation structure.
 *
 * Principles:
 * - Single responsibility: only handles app-wide setup
 * - Provider composition at the root level
 * - Consistent theming and styling
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(workout)" />
          <Stack.Screen name="(bet)" />
          <Stack.Screen name="(settings)" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
