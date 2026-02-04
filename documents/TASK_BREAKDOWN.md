# Task Breakdown - Couples Workout App MVP

## Overview

This document breaks down each MVP feature into granular, actionable tasks. Each task is designed to be completable in 1-4 hours.

**Legend:**
- 🔵 Backend task
- 🟢 Frontend task
- 🟡 Full-stack task
- 🟣 Content/Data task
- ⚪ DevOps/Config task

---

## Feature 1: Project Setup & Configuration

### 1.1 Expo Project Setup
- [ ] ⚪ Initialize Expo project with TypeScript template
- [ ] ⚪ Configure `app.json` with app name, scheme, and bundle ID
- [ ] ⚪ Set up folder structure (app/, components/, hooks/, lib/, types/, utils/)
- [ ] ⚪ Install core dependencies (expo-router, react-native-svg, zustand)
- [ ] ⚪ Configure TypeScript (`tsconfig.json`)
- [ ] ⚪ Set up ESLint and Prettier
- [ ] ⚪ Create `.env.local` template with required variables

### 1.2 Supabase Setup
- [ ] ⚪ Create Supabase project
- [ ] ⚪ Configure auth settings (email/password, magic link)
- [ ] ⚪ Set up Supabase client in `lib/supabase.ts`
- [ ] ⚪ Install @supabase/supabase-js
- [ ] ⚪ Configure environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] ⚪ Test connection from app to Supabase

### 1.3 Navigation Setup
- [ ] 🟢 Set up Expo Router with file-based routing
- [ ] 🟢 Create root layout (`app/_layout.tsx`)
- [ ] 🟢 Create auth group layout (`app/(auth)/_layout.tsx`)
- [ ] 🟢 Create main group layout with tabs (`app/(main)/_layout.tsx`)
- [ ] 🟢 Create onboarding group layout (`app/(onboarding)/_layout.tsx`)
- [ ] 🟢 Implement auth state redirect logic

---

## Feature 2: Authentication

### 2.1 Database Schema
- [ ] 🔵 Create `profiles` table migration
- [ ] 🔵 Create `couples` table migration
- [ ] 🔵 Set up RLS policy: users can read own profile
- [ ] 🔵 Set up RLS policy: users can update own profile
- [ ] 🔵 Set up RLS policy: users can read partner's profile
- [ ] 🔵 Create trigger: auto-create profile on user signup
- [ ] 🔵 Create indexes on profiles(user_id) and profiles(couple_id)

### 2.2 Sign Up Flow
- [ ] 🟢 Create Sign Up screen UI (`app/(auth)/signup.tsx`)
- [ ] 🟢 Build email input with validation
- [ ] 🟢 Build password input with show/hide toggle
- [ ] 🟢 Build display name input
- [ ] 🟢 Add "Already have an account?" link
- [ ] 🟡 Implement signUp function with Supabase Auth
- [ ] 🟡 Handle signup errors (email exists, weak password)
- [ ] 🟡 Create profile record after successful signup
- [ ] 🟡 Navigate to onboarding after signup

### 2.3 Login Flow
- [ ] 🟢 Create Login screen UI (`app/(auth)/login.tsx`)
- [ ] 🟢 Build email/password form
- [ ] 🟢 Add "Forgot password?" link
- [ ] 🟢 Add "Create account" link
- [ ] 🟡 Implement signIn function with Supabase Auth
- [ ] 🟡 Handle login errors (invalid credentials)
- [ ] 🟡 Navigate to dashboard or onboarding based on profile state

### 2.4 Forgot Password
- [ ] 🟢 Create Forgot Password screen UI
- [ ] 🟢 Build email input form
- [ ] 🟡 Implement password reset email function
- [ ] 🟢 Create success confirmation screen

### 2.5 Auth State Management
- [ ] 🟡 Create `useAuth` hook
- [ ] 🟡 Implement session persistence
- [ ] 🟡 Handle token refresh
- [ ] 🟡 Implement logout function
- [ ] 🟢 Create AuthProvider context
- [ ] 🟢 Implement protected route wrapper

---

## Feature 3: Partner Invite Flow

### 3.1 Couple Creation
- [ ] 🔵 Create Edge Function: `create-couple`
- [ ] 🔵 Implement invite code generation (8 chars, no ambiguous chars)
- [ ] 🔵 Set invite expiration (7 days)
- [ ] 🔵 Link creator's profile to new couple
- [ ] 🔵 Return invite code and shareable URL

### 3.2 Invite UI
- [ ] 🟢 Create "Invite Partner" screen
- [ ] 🟢 Display invite code prominently
- [ ] 🟢 Build "Copy Link" button
- [ ] 🟢 Build "Share" button (native share sheet)
- [ ] 🟢 Show invite expiration countdown
- [ ] 🟢 Add "Regenerate Code" option
- [ ] 🟢 Create "Waiting for Partner" state UI

### 3.3 Deep Link Handling
- [ ] ⚪ Configure URL scheme in `app.json`
- [ ] 🟢 Set up Expo Linking listener
- [ ] 🟢 Parse invite code from deep link URL
- [ ] 🟢 Handle app opened from link (cold start)
- [ ] 🟢 Handle link while app is open (warm start)
- [ ] 🟢 Navigate to signup/login with invite code pre-filled

### 3.4 Join Couple Flow
- [ ] 🔵 Create Edge Function: `join-couple`
- [ ] 🔵 Validate invite code exists and not expired
- [ ] 🔵 Check user doesn't already have a couple
- [ ] 🔵 Link joining user's profile to couple
- [ ] 🔵 Update couple status to 'active'
- [ ] 🔵 Set couple's `activated_at` timestamp
- [ ] 🟢 Create "Join Couple" confirmation screen
- [ ] 🟢 Show partner's name before confirming
- [ ] 🟡 Send push notification to original partner

### 3.5 Edge Cases
- [ ] 🟢 Handle expired invite code UI
- [ ] 🟢 Handle already-used invite code UI
- [ ] 🟢 Handle user already in couple UI
- [ ] 🔵 Create Edge Function: `regenerate-invite`
- [ ] 🔵 Create Edge Function: `uncouple` (leave couple)

---

## Feature 4: Onboarding Questionnaire

### 4.1 Onboarding Flow Setup
- [ ] 🟢 Create onboarding progress indicator component
- [ ] 🟢 Create onboarding layout with back/next navigation
- [ ] 🟡 Create onboarding state management (zustand store)
- [ ] 🟡 Implement save progress on each step

### 4.2 Basics Screen
- [ ] 🟢 Create Basics screen UI (`app/(onboarding)/basics.tsx`)
- [ ] 🟢 Build age/birth year picker
- [ ] 🟢 Build height input (cm or ft/in toggle)
- [ ] 🟢 Build weight input (kg or lbs toggle)
- [ ] 🟢 Build biological sex selector
- [ ] 🟢 Add unit preference toggle (metric/imperial)

### 4.3 Fitness Level Screen
- [ ] 🟢 Create Fitness Level screen UI
- [ ] 🟢 Build activity level selector (sedentary to very active)
- [ ] 🟢 Build "Can you do 10 pushups?" yes/no toggle
- [ ] 🟢 Build "Can you hold plank 30s?" yes/no toggle
- [ ] 🟢 Build "Can you do full squat?" yes/no toggle
- [ ] 🟢 Build cardio capacity selector

### 4.4 Injuries Screen
- [ ] 🟢 Create Injuries screen UI
- [ ] 🟢 Build injury checkbox list (knee, shoulder, back, etc.)
- [ ] 🟢 Build chronic conditions checkbox list
- [ ] 🟢 Build "movements to avoid" free text input
- [ ] 🟢 Add "None" quick select option

### 4.5 Goals Screen
- [ ] 🟢 Create Goals screen UI
- [ ] 🟢 Build primary goal selector (lose weight, build muscle, etc.)
- [ ] 🟢 Build secondary goal selector
- [ ] 🟢 Add goal descriptions/icons

### 4.6 Equipment & Space Screen
- [ ] 🟢 Create Equipment screen UI
- [ ] 🟢 Build location selector (home, gym, outdoor, mix)
- [ ] 🟢 Build equipment checklist with icons
- [ ] 🟢 Build space availability selector
- [ ] 🟢 Add "No equipment" quick select

### 4.7 Preferences Screen
- [ ] 🟢 Create Preferences screen UI
- [ ] 🟢 Build workout length selector (15/20/30/45 min)
- [ ] 🟢 Build enjoyable activities multi-select
- [ ] 🟢 Build disliked activities multi-select
- [ ] 🟢 Build music preference selector

### 4.8 Couple Preferences Screen
- [ ] 🟢 Create Couple Preferences screen UI (shown once per couple)
- [ ] 🟢 Build "worked out together before" selector
- [ ] 🟢 Build contact comfort level selector
- [ ] 🟢 Build dynamic preference selector (competitive/collaborative/mix)
- [ ] 🟢 Build "days per week together" selector

### 4.9 Onboarding Completion
- [ ] 🟡 Save all onboarding data to profile
- [ ] 🟡 Calculate initial fitness level (1-5) from answers
- [ ] 🟡 Set `onboarding_completed_at` timestamp
- [ ] 🟢 Create completion celebration screen
- [ ] 🟢 Navigate to dashboard or invite partner screen

---

## Feature 5: Exercise Library

### 5.1 Database Schema
- [ ] 🔵 Create `exercises` table migration
- [ ] 🔵 Create `exercise_pairs` table migration
- [ ] 🔵 Set up RLS: anyone can read exercises
- [ ] 🔵 Create indexes on exercises(muscle_group, difficulty)
- [ ] 🔵 Create index on exercise_pairs(muscle_group)

### 5.2 Exercise Data - Chest
- [ ] 🟣 Create chest exercises (beginner): wall pushups, knee pushups, incline pushups
- [ ] 🟣 Create chest exercises (intermediate): standard pushups, wide pushups
- [ ] 🟣 Create chest exercises (advanced): diamond pushups, decline pushups, archer pushups
- [ ] 🟣 Create chest exercise pairs (6 pairs)

### 5.3 Exercise Data - Back
- [ ] 🟣 Create back exercises (beginner): superman holds, prone Y raises
- [ ] 🟣 Create back exercises (intermediate): inverted rows, resistance band rows
- [ ] 🟣 Create back exercises (advanced): pull-ups, chin-ups
- [ ] 🟣 Create back exercise pairs (6 pairs)

### 5.4 Exercise Data - Shoulders
- [ ] 🟣 Create shoulder exercises (beginner): arm circles, wall slides
- [ ] 🟣 Create shoulder exercises (intermediate): pike pushups, lateral raises
- [ ] 🟣 Create shoulder exercises (advanced): handstand holds, handstand pushups
- [ ] 🟣 Create shoulder exercise pairs (5 pairs)

### 5.5 Exercise Data - Core
- [ ] 🟣 Create core exercises (beginner): dead bugs, bird dogs, plank holds
- [ ] 🟣 Create core exercises (intermediate): mountain climbers, Russian twists, leg raises
- [ ] 🟣 Create core exercises (advanced): dragon flags, L-sits, ab wheel rollouts
- [ ] 🟣 Create core exercise pairs (8 pairs)

### 5.6 Exercise Data - Legs (Quads)
- [ ] 🟣 Create quad exercises (beginner): bodyweight squats, wall sits
- [ ] 🟣 Create quad exercises (intermediate): jump squats, lunges
- [ ] 🟣 Create quad exercises (advanced): pistol squat progressions, Bulgarian split squats
- [ ] 🟣 Create quad exercise pairs (6 pairs)

### 5.7 Exercise Data - Legs (Glutes/Hamstrings)
- [ ] 🟣 Create glute/ham exercises (beginner): glute bridges, donkey kicks
- [ ] 🟣 Create glute/ham exercises (intermediate): single-leg glute bridges, Romanian deadlifts
- [ ] 🟣 Create glute/ham exercises (advanced): Nordic curls, single-leg deadlifts
- [ ] 🟣 Create glute/ham exercise pairs (5 pairs)

### 5.8 Exercise Data - Full Body & Cardio
- [ ] 🟣 Create full body exercises (all levels): burpees, sprawls, bear crawls
- [ ] 🟣 Create cardio exercises (all levels): jumping jacks, high knees, mountain climbers
- [ ] 🟣 Create full body/cardio exercise pairs (14 pairs)

### 5.9 Exercise Data - Warmup & Cooldown
- [ ] 🟣 Create warmup exercises (10): arm circles, leg swings, hip circles, etc.
- [ ] 🟣 Create cooldown/stretch exercises (10): quad stretch, hamstring stretch, etc.

### 5.10 Exercise Data - Partner Exercises
- [ ] 🟣 Create partner resistance exercises (5): partner band rows, wheelbarrow pushups
- [ ] 🟣 Create partner cardio exercises (5): high-five burpees, mirror drill
- [ ] 🟣 Create partner core exercises (5): sit-up ball pass, plank reach

### 5.11 Seed Script
- [ ] 🔵 Create exercise seed script (`supabase/seed/exercises.ts`)
- [ ] 🔵 Create exercise pairs seed script
- [ ] 🔵 Add video URLs (YouTube unlisted) for each exercise
- [ ] 🔵 Run seed script and verify data

---

## Feature 6: Asymmetric Workout Engine

### 6.1 Workout Generation - Core Algorithm
- [ ] 🔵 Create Edge Function: `generate-workout`
- [ ] 🔵 Implement difficulty calculation from profile
- [ ] 🔵 Implement equipment intersection (both partners)
- [ ] 🔵 Implement disliked activities exclusion
- [ ] 🔵 Implement contact level filtering

### 6.2 Workout Structure
- [ ] 🔵 Implement workout duration configs (15/20/30/45 min)
- [ ] 🔵 Calculate block counts per duration
- [ ] 🔵 Implement muscle group selection algorithm
- [ ] 🔵 Implement muscle group rotation (no consecutive same group)

### 6.3 Block Generation
- [ ] 🔵 Implement warmup block generation (same exercise both partners)
- [ ] 🔵 Implement exercise block generation (asymmetric pairs)
- [ ] 🔵 Implement rest block insertion logic
- [ ] 🔵 Implement cooldown block generation
- [ ] 🔵 Implement workout name generation

### 6.4 Exercise Pair Selection
- [ ] 🔵 Query pairs by muscle group
- [ ] 🔵 Filter by difficulty range (±1 from target)
- [ ] 🔵 Filter by equipment requirements
- [ ] 🔵 Filter by contact level
- [ ] 🔵 Implement random selection from valid pairs
- [ ] 🔵 Handle no valid pair found (fallback logic)

### 6.5 Workout Data Structure
- [ ] 🔵 Define workout JSON schema
- [ ] 🔵 Define block JSON schema
- [ ] 🔵 Define slot JSON schema
- [ ] 🔵 Create TypeScript types for all schemas

### 6.6 Testing
- [ ] 🔵 Test workout generation with beginner couple
- [ ] 🔵 Test workout generation with advanced couple
- [ ] 🔵 Test workout generation with mismatched couple
- [ ] 🔵 Test equipment filtering
- [ ] 🔵 Test contact level filtering

---

## Feature 7: Real-Time Session Sync

### 7.1 Database Schema
- [ ] 🔵 Create `sessions` table migration
- [ ] 🔵 Create `session_state` table migration
- [ ] 🔵 Set up RLS: couple members can manage their sessions
- [ ] 🔵 Create indexes on sessions(couple_id, status)

### 7.2 Session Creation
- [ ] 🔵 Create Edge Function: `start-session`
- [ ] 🔵 Create session record with workout_data
- [ ] 🔵 Create session_state record with initial values
- [ ] 🔵 Assign partner_a and partner_b based on who started
- [ ] 🔵 Return session ID and initial state

### 7.3 Realtime Channel Setup
- [ ] 🟡 Create `useSessionSync` hook
- [ ] 🟡 Subscribe to session_state postgres changes
- [ ] 🟡 Subscribe to broadcast channel for high-frequency updates
- [ ] 🟡 Implement connection status tracking
- [ ] 🟡 Implement reconnection logic

### 7.4 State Synchronization
- [ ] 🟡 Sync current block index
- [ ] 🟡 Sync timer running state
- [ ] 🟡 Sync timer seconds remaining
- [ ] 🟡 Sync pause state
- [ ] 🟡 Sync partner ready states

### 7.5 Timer Sync
- [ ] 🟡 Implement timer tick broadcast (every second)
- [ ] 🟡 Implement timer start/stop sync
- [ ] 🟡 Handle timer drift correction
- [ ] 🟡 Implement local timer with server sync

### 7.6 Conflict Resolution
- [ ] 🔵 Implement last-write-wins with timestamps
- [ ] 🟡 Handle concurrent updates gracefully
- [ ] 🟡 Implement optimistic updates with rollback
- [ ] 🟡 Handle stale state detection

### 7.7 Connection Status UI
- [ ] 🟢 Create SyncStatusIndicator component
- [ ] 🟢 Show "Connected" state (green dot)
- [ ] 🟢 Show "Reconnecting" state (yellow dot, spinner)
- [ ] 🟢 Show "Disconnected" state (red dot, retry button)

---

## Feature 8: Workout UI & Flow

### 8.1 Workout Preview Screen
- [ ] 🟢 Create Workout Preview screen (`app/(main)/workout/preview.tsx`)
- [ ] 🟢 Build workout header (name, duration)
- [ ] 🟢 Build partner difficulty badges
- [ ] 🟢 Build muscle group chips
- [ ] 🟢 Build block list preview
- [ ] 🟢 Build BlockPreviewCard component
- [ ] 🟢 Build "Start Workout" button

### 8.2 Ready Check Screen
- [ ] 🟢 Create Ready Check screen
- [ ] 🟢 Build "I'm Ready" button
- [ ] 🟢 Build partner ready indicator
- [ ] 🟢 Build waiting animation
- [ ] 🟡 Implement ready state sync
- [ ] 🟡 Auto-navigate when both ready

### 8.3 Timer Component
- [ ] 🟢 Create CircularTimer component
- [ ] 🟢 Implement SVG circle progress
- [ ] 🟢 Implement time formatting (MM:SS)
- [ ] 🟢 Add color change when time low (<10s)
- [ ] 🟢 Add pulse animation on completion

### 8.4 Exercise Screen
- [ ] 🟢 Create Exercise screen (`app/(main)/workout/session.tsx`)
- [ ] 🟢 Build progress bar (current block / total)
- [ ] 🟢 Build my exercise card (large)
- [ ] 🟢 Build partner exercise card (small)
- [ ] 🟢 Build exercise name and rep count display
- [ ] 🟢 Build pause button
- [ ] 🟢 Add haptic feedback on block transition

### 8.5 Exercise Card Component
- [ ] 🟢 Create ExerciseCard component
- [ ] 🟢 Display exercise name
- [ ] 🟢 Display reps or duration
- [ ] 🟢 Display exercise thumbnail/icon
- [ ] 🟢 Add "View Demo" button (opens video modal)
- [ ] 🟢 Add completion checkmark animation

### 8.6 Rest Screen
- [ ] 🟢 Create Rest block UI variant
- [ ] 🟢 Show "Rest" label
- [ ] 🟢 Show countdown timer
- [ ] 🟢 Show next exercise preview
- [ ] 🟢 Add "Skip Rest" button

### 8.7 Pause Screen
- [ ] 🟢 Create Pause overlay
- [ ] 🟢 Show "Paused by [name]" message
- [ ] 🟢 Build "Resume" button
- [ ] 🟢 Build "End Workout" button
- [ ] 🟡 Sync pause state between partners

### 8.8 Block Transitions
- [ ] 🟢 Implement warmup → exercise transition
- [ ] 🟢 Implement exercise → rest transition
- [ ] 🟢 Implement rest → exercise transition
- [ ] 🟢 Implement exercise → cooldown transition
- [ ] 🟢 Add transition animations
- [ ] 🟢 Add audio cue on transition (optional)

### 8.9 Workout Completion
- [ ] 🔵 Create Edge Function: `complete-session`
- [ ] 🔵 Calculate total active time
- [ ] 🔵 Save completion data to session
- [ ] 🔵 Trigger XP award
- [ ] 🔵 Trigger streak update
- [ ] 🟢 Create Workout Complete screen
- [ ] 🟢 Show celebration animation
- [ ] 🟢 Show workout stats (time, blocks completed)
- [ ] 🟢 Show XP earned
- [ ] 🟢 Build "Back to Home" button

---

## Feature 9: Couple Dashboard

### 9.1 Dashboard Layout
- [ ] 🟢 Create Dashboard screen (`app/(main)/index.tsx`)
- [ ] 🟢 Build CoupleHeader component (both avatars, names)
- [ ] 🟢 Build StatsRow component (streak, XP, workouts)
- [ ] 🟢 Build StartWorkoutCard CTA
- [ ] 🟢 Implement pull-to-refresh

### 9.2 Couple Data Hook
- [ ] 🟡 Create `useCouple` hook
- [ ] 🟡 Fetch current user's profile
- [ ] 🟡 Fetch couple data
- [ ] 🟡 Fetch partner's profile
- [ ] 🟡 Handle no couple state
- [ ] 🟡 Implement data caching (React Query)

### 9.3 Stats Display
- [ ] 🟢 Create streak display with fire emoji
- [ ] 🟢 Create XP display with star emoji
- [ ] 🟢 Create total workouts display
- [ ] 🟢 Add streak multiplier indicator (if active)

### 9.4 Start Workout Flow
- [ ] 🟢 Create "New Workout" screen
- [ ] 🟢 Build duration selector (15/20/30/45 min)
- [ ] 🟢 Build muscle group focus selector (optional)
- [ ] 🟡 Call workout generation on confirm
- [ ] 🟢 Show loading state during generation
- [ ] 🟢 Navigate to preview on success

### 9.5 Recent Workouts
- [ ] 🟢 Create RecentWorkoutsList component
- [ ] 🟢 Build RecentWorkoutCard component
- [ ] 🟢 Display date, name, duration, completion status
- [ ] 🟡 Create `useRecentSessions` hook
- [ ] 🟢 Add "View All" link to history

### 9.6 No Couple State
- [ ] 🟢 Create NoCoupleScreen component
- [ ] 🟢 Show "Invite Partner" CTA
- [ ] 🟢 Show "Join Partner" option (enter code manually)

---

## Feature 10: Streaks System

### 10.1 Streak Logic
- [ ] 🔵 Create streak update function
- [ ] 🔵 Calculate days since last workout
- [ ] 🔵 Increment streak if consecutive day
- [ ] 🔵 Reset streak if gap > 1 day
- [ ] 🔵 Update longest_streak if current exceeds
- [ ] 🔵 Call streak update on workout completion

### 10.2 Streak Display
- [ ] 🟢 Create StreakBadge component
- [ ] 🟢 Show current streak count
- [ ] 🟢 Show fire animation for active streak
- [ ] 🟢 Show streak multiplier (1.5x at 7 days, 2x at 30 days)
- [ ] 🟢 Show "streak at risk" warning if no workout today

### 10.3 Streak Notifications
- [ ] 🔵 Create daily streak reminder notification
- [ ] 🔵 Create "streak at risk" notification (evening)
- [ ] 🔵 Create "streak lost" notification
- [ ] 🟡 Implement notification scheduling

---

## Feature 11: XP System

### 11.1 Database Schema
- [ ] 🔵 Create `xp_transactions` table migration
- [ ] 🔵 Set up RLS: couple members can read their transactions
- [ ] 🔵 Create index on xp_transactions(couple_id)
- [ ] 🔵 Create `increment_couple_xp` SQL function

### 11.2 XP Calculation
- [ ] 🔵 Calculate base XP (10 XP per minute)
- [ ] 🔵 Apply solo penalty (0.25x for solo workouts)
- [ ] 🔵 Apply streak multiplier
- [ ] 🔵 Create XP transaction record
- [ ] 🔵 Update couple total_xp

### 11.3 XP Display
- [ ] 🟢 Create XPBadge component
- [ ] 🟢 Show total XP
- [ ] 🟢 Show XP earned animation after workout
- [ ] 🟢 Show level/tier based on XP thresholds

### 11.4 XP History
- [ ] 🟢 Create XP history screen
- [ ] 🟢 Show XP transactions list
- [ ] 🟢 Show transaction reason and amount
- [ ] 🟡 Create `useXPHistory` hook

---

## Feature 12: Bet System

### 12.1 Database Schema
- [ ] 🔵 Create `bets` table migration
- [ ] 🔵 Set up RLS: couple members can manage their bets
- [ ] 🔵 Create index on bets(couple_id, status)

### 12.2 Create Bet Flow
- [ ] 🟢 Create "Create Bet" screen (`app/(main)/bets/create.tsx`)
- [ ] 🟢 Build metric selector (reps, sessions, minutes, streak)
- [ ] 🟢 Build duration selector (3 days, 1 week, 2 weeks, 1 month)
- [ ] 🟢 Build "my stake" text input
- [ ] 🟢 Build "their stake" text input
- [ ] 🟡 Create bet record on submit
- [ ] 🟡 Send notification to partner

### 12.3 Accept Bet Flow
- [ ] 🟢 Create bet acceptance notification handler
- [ ] 🟢 Create "Accept Bet" screen
- [ ] 🟢 Show bet details (metric, stakes, duration)
- [ ] 🟡 Update bet status to 'active' on accept
- [ ] 🟡 Update bet status to 'cancelled' on decline

### 12.4 Active Bet Display
- [ ] 🟢 Create ActiveBetCard component
- [ ] 🟢 Show current scores
- [ ] 🟢 Show time remaining
- [ ] 🟢 Show stakes
- [ ] 🟢 Add progress bar visualization

### 12.5 Bet Score Tracking
- [ ] 🔵 Track reps metric from workout_data
- [ ] 🔵 Track sessions metric (count completions)
- [ ] 🔵 Track minutes metric (sum active time)
- [ ] 🔵 Update scores on workout completion

### 12.6 Bet Resolution
- [ ] 🔵 Create Edge Function: `resolve-bets` (cron)
- [ ] 🔵 Find bets past end date
- [ ] 🔵 Calculate final scores
- [ ] 🔵 Determine winner
- [ ] 🔵 Update bet status and winner_id
- [ ] 🔵 Send winner/loser notifications

### 12.7 Bet History
- [ ] 🟢 Create Bet History screen (`app/(main)/bets/index.tsx`)
- [ ] 🟢 Show active bets section
- [ ] 🟢 Show completed bets section
- [ ] 🟢 Build BetHistoryCard component
- [ ] 🟡 Create `useBets` hook

---

## Feature 13: Workout History

### 13.1 History Screen
- [ ] 🟢 Create History screen (`app/(main)/history.tsx`)
- [ ] 🟢 Build workout list grouped by date/week
- [ ] 🟢 Build WorkoutHistoryCard component
- [ ] 🟢 Show workout name, date, duration, XP earned
- [ ] 🟡 Create `useWorkoutHistory` hook with pagination

### 13.2 Workout Detail Screen
- [ ] 🟢 Create Workout Detail screen
- [ ] 🟢 Show workout summary stats
- [ ] 🟢 Show exercise list with completion status
- [ ] 🟢 Show XP breakdown

### 13.3 Progress Stats
- [ ] 🟢 Create basic stats view
- [ ] 🟢 Show total workouts this week/month
- [ ] 🟢 Show total time this week/month
- [ ] 🟢 Show favorite muscle groups

---

## Feature 14: Settings & Profile

### 14.1 Settings Screen
- [ ] 🟢 Create Settings screen (`app/(main)/settings.tsx`)
- [ ] 🟢 Build profile section (name, avatar)
- [ ] 🟢 Build notification preferences toggles
- [ ] 🟢 Build unit preferences (metric/imperial)
- [ ] 🟢 Build "Edit Fitness Profile" link
- [ ] 🟢 Build "Logout" button
- [ ] 🟢 Build "Delete Account" button

### 14.2 Edit Profile
- [ ] 🟢 Create Edit Profile screen
- [ ] 🟢 Build display name editor
- [ ] 🟢 Build avatar picker/upload
- [ ] 🟡 Save profile changes

### 14.3 Edit Fitness Profile
- [ ] 🟢 Create Edit Fitness Profile screen
- [ ] 🟢 Allow editing all onboarding fields
- [ ] 🟡 Recalculate fitness level on save

### 14.4 Uncouple Flow
- [ ] 🟢 Create "Leave Couple" confirmation screen
- [ ] 🟢 Show warning about data
- [ ] 🔵 Implement uncouple Edge Function
- [ ] 🟡 Preserve user account after uncoupling

---

## Feature 15: Push Notifications

### 15.1 Setup
- [ ] ⚪ Configure Firebase Cloud Messaging
- [ ] ⚪ Add expo-notifications package
- [ ] 🟡 Request notification permissions
- [ ] 🟡 Store device push token in profile
- [ ] 🔵 Set up notification sending function

### 15.2 Notification Types
- [ ] 🔵 Implement "Partner joined" notification
- [ ] 🔵 Implement "Bet challenge" notification
- [ ] 🔵 Implement "Bet accepted" notification
- [ ] 🔵 Implement "Bet won/lost" notification
- [ ] 🔵 Implement "Streak reminder" notification
- [ ] 🔵 Implement "Partner started workout" notification

### 15.3 Notification Handling
- [ ] 🟢 Handle notification tap (deep link to relevant screen)
- [ ] 🟢 Handle foreground notifications (in-app banner)

---

## Feature 16: Polish & Error Handling

### 16.1 Loading States
- [ ] 🟢 Create LoadingScreen component
- [ ] 🟢 Create LoadingSpinner component
- [ ] 🟢 Add skeleton loaders for lists
- [ ] 🟢 Add loading states to all async operations

### 16.2 Error Handling
- [ ] 🟢 Create ErrorBoundary component
- [ ] 🟢 Create error toast/alert component
- [ ] 🟢 Handle network errors gracefully
- [ ] 🟢 Handle auth errors (redirect to login)
- [ ] 🟢 Handle API errors with user-friendly messages

### 16.3 Empty States
- [ ] 🟢 Create EmptyState component
- [ ] 🟢 Add empty state for workout history
- [ ] 🟢 Add empty state for bet history
- [ ] 🟢 Add empty state for no partner

### 16.4 Workout Recovery
- [ ] 🟡 Save workout state to local storage
- [ ] 🟡 Detect interrupted workout on app open
- [ ] 🟢 Show "Resume Workout?" prompt
- [ ] 🟡 Restore workout position from saved state

---

## Summary

| Feature | Total Tasks |
|---------|-------------|
| 1. Project Setup | 20 |
| 2. Authentication | 27 |
| 3. Partner Invite | 22 |
| 4. Onboarding | 36 |
| 5. Exercise Library | 30 |
| 6. Workout Engine | 23 |
| 7. Real-Time Sync | 24 |
| 8. Workout UI | 40 |
| 9. Dashboard | 20 |
| 10. Streaks | 12 |
| 11. XP System | 14 |
| 12. Bet System | 26 |
| 13. Workout History | 12 |
| 14. Settings | 14 |
| 15. Push Notifications | 12 |
| 16. Polish | 16 |
| **Total** | **~350 tasks** |

---

## Week-by-Week Task Assignment

### Week 1: Foundation (Features 1, 2, 3)
Focus: Project setup, auth, couple pairing
- All of Feature 1 (Project Setup)
- All of Feature 2 (Authentication)
- Feature 3.1-3.4 (Couple creation, invite UI, deep links, join flow)

### Week 2: Content & Engine (Features 4, 5, 6)
Focus: Onboarding, exercises, workout generation
- Feature 4.1-4.5 (Core onboarding screens)
- Feature 5.1-5.6 (Exercise data - main muscle groups)
- Feature 6.1-6.4 (Workout generation algorithm)

### Week 3: Real-Time Sync (Feature 7)
Focus: Session sync between partners
- All of Feature 7 (Real-Time Sync)
- Feature 5.7-5.11 (Remaining exercises)

### Week 4: Workout Flow (Feature 8)
Focus: Complete workout experience
- All of Feature 8 (Workout UI)
- Feature 4.6-4.9 (Remaining onboarding)

### Week 5: Progression (Features 9, 10, 11)
Focus: Dashboard, streaks, XP
- All of Feature 9 (Dashboard)
- All of Feature 10 (Streaks)
- All of Feature 11 (XP System)

### Week 6: Gamification (Feature 12)
Focus: Bet system
- All of Feature 12 (Bet System)
- Feature 13 (Workout History)

### Week 7: Polish (Features 14, 15, 16)
Focus: Settings, notifications, error handling
- All of Feature 14 (Settings)
- All of Feature 15 (Push Notifications)
- All of Feature 16 (Polish)

### Week 8: Testing & Launch
Focus: Bug fixes, beta testing
- End-to-end testing
- Performance testing
- Beta user onboarding
- Bug fixes
