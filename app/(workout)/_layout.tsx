/**
 * Workout Flow Layout
 *
 * Stack navigation for the workout flow screens.
 * Handles preview, active session, and completion.
 */

import { Stack } from 'expo-router';
import { COLORS } from '@/constants/app';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="preview" />
      <Stack.Screen name="ready" />
      <Stack.Screen
        name="session"
        options={{
          gestureEnabled: false, // Prevent accidental back swipe during workout
        }}
      />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
