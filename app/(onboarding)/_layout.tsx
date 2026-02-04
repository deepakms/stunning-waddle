/**
 * Onboarding Layout
 *
 * Layout for the onboarding flow screens.
 * Includes progress indicator and consistent navigation.
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="basics" />
      <Stack.Screen name="fitness" />
      <Stack.Screen name="injuries" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="equipment" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
