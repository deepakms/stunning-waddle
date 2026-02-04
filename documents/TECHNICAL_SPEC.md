# Technical Specification: Couples Workout App MVP

## Overview

This document provides detailed technical specifications for the MVP (Minimum Viable Product) of the Couples Workout App. The MVP focuses on Tier 1 (Core) and Tier 2 (High Value) features.

**Target:** 10K users (5K couples) in year one
**Stack:** React Native (Expo) + Supabase
**Timeline:** 8 weeks

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [Feature Specs](#3-feature-specs)
   - 3.1 Auth + Couple Pairing
   - 3.2 Partner Invite Flow
   - 3.3 Asymmetric Workout Engine
   - 3.4 Exercise Library
   - 3.5 Real-Time Session Sync
   - 3.6 Basic Workout UI
   - 3.7 Couple Profile/Dashboard
   - 3.8 Streaks & XP System
   - 3.9 Bet System
4. [API Reference](#4-api-reference)
5. [Week-by-Week Implementation Plan](#5-week-by-week-implementation-plan)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                   React Native (Expo)                            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Auth      │  │  Workout    │  │    Real-Time Sync       │  │
│  │   Screens   │  │  Screens    │  │    (Supabase Client)    │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │  Database   │  │       Realtime          │  │
│  │  (GoTrue)   │  │ (PostgreSQL)│  │    (WebSocket)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Storage   │  │    Edge     │  │     Row Level           │  │
│  │   (Audio)   │  │  Functions  │  │     Security            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Supabase as Backend**: Single platform for auth, database, real-time, and storage
2. **Edge Functions for Logic**: Complex operations (workout generation, bet resolution) run server-side
3. **Row Level Security (RLS)**: Authorization at database level, not application level
4. **Optimistic UI**: Client assumes success, syncs with server, handles conflicts gracefully

---

## 2. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   couples    │       │   profiles   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │    ┌──│ id (PK)      │
│ email        │  │    │ created_at   │    │  │ user_id (FK) │──┐
│ created_at   │  │    │ invite_code  │    │  │ couple_id(FK)│──┼──┐
└──────────────┘  │    │ status       │    │  │ display_name │  │  │
                  │    └──────────────┘    │  │ fitness_level│  │  │
                  │           ▲            │  │ ...          │  │  │
                  │           │            │  └──────────────┘  │  │
                  └───────────┴────────────┘                    │  │
                                                                │  │
┌──────────────┐       ┌──────────────┐       ┌──────────────┐  │  │
│  exercises   │       │   sessions   │       │    bets      │  │  │
├──────────────┤       ├──────────────┤       ├──────────────┤  │  │
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │  │  │
│ name         │       │ couple_id(FK)│◄──────│ couple_id(FK)│◄─┼──┘
│ muscle_group │       │ status       │       │ challenger_id│◄─┘
│ difficulty   │       │ started_at   │       │ stake_text   │
│ instructions │       │ completed_at │       │ metric       │
│ video_url    │       │ workout_data │       │ winner_id    │
│ ...          │       │ ...          │       │ ...          │
└──────────────┘       └──────────────┘       └──────────────┘
        ▲
        │
┌──────────────┐
│exercise_pairs│
├──────────────┤
│ id (PK)      │
│ exercise_a_id│
│ exercise_b_id│
│ muscle_group │
│ ...          │
└──────────────┘
```

### Table Definitions

```sql
-- ============================================
-- USERS & COUPLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,

    -- Basic info
    display_name TEXT NOT NULL,
    avatar_url TEXT,

    -- Fitness profile (from onboarding)
    fitness_level INTEGER CHECK (fitness_level BETWEEN 1 AND 5), -- 1=beginner, 5=advanced
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    biological_sex TEXT CHECK (biological_sex IN ('male', 'female', 'other', 'prefer_not_to_say')),
    birth_year INTEGER,

    -- Fitness assessment
    can_do_pushups_10 BOOLEAN DEFAULT FALSE,
    can_hold_plank_30s BOOLEAN DEFAULT FALSE,
    can_do_full_squat BOOLEAN DEFAULT FALSE,
    cardio_capacity TEXT CHECK (cardio_capacity IN ('under_5min', '5_15min', '15_30min', 'over_30min')),

    -- Injuries (stored as array)
    injuries TEXT[] DEFAULT '{}',

    -- Preferences
    primary_goal TEXT CHECK (primary_goal IN ('lose_weight', 'build_muscle', 'get_toned', 'flexibility', 'general_fitness', 'stress_relief')),
    preferred_workout_length INTEGER DEFAULT 30, -- minutes
    preferred_activities TEXT[] DEFAULT '{}',
    disliked_activities TEXT[] DEFAULT '{}',
    available_equipment TEXT[] DEFAULT '{}',

    -- Couple preferences (answered once per couple)
    comfort_with_contact TEXT CHECK (comfort_with_contact IN ('full', 'light', 'none')),
    dynamic_preference TEXT CHECK (dynamic_preference IN ('competitive', 'collaborative', 'mix')),

    -- Timestamps
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Couples table
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Invite system
    invite_code TEXT UNIQUE NOT NULL,
    invite_expires_at TIMESTAMPTZ,

    -- Status
    status TEXT CHECK (status IN ('pending', 'active', 'paused', 'uncoupled')) DEFAULT 'pending',

    -- Shared preferences
    workouts_per_week INTEGER DEFAULT 3,
    preferred_workout_days TEXT[] DEFAULT '{}',

    -- Progression
    total_xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_workout_at TIMESTAMPTZ,

    -- Timestamps
    activated_at TIMESTAMPTZ, -- when second partner joined
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EXERCISES & WORKOUT ENGINE
-- ============================================

-- Exercise library
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT[], -- step by step

    -- Classification
    muscle_group TEXT NOT NULL CHECK (muscle_group IN (
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'core',
        'quadriceps', 'hamstrings', 'glutes', 'calves', 'full_body', 'cardio'
    )),
    exercise_type TEXT CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'balance')),
    movement_pattern TEXT CHECK (movement_pattern IN ('push', 'pull', 'squat', 'hinge', 'lunge', 'rotation', 'cardio', 'isometric')),

    -- Difficulty & scaling
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5), -- 1=easiest, 5=hardest
    difficulty_label TEXT CHECK (difficulty_label IN ('beginner', 'easy', 'moderate', 'hard', 'advanced')),

    -- Equipment & space
    equipment_required TEXT[] DEFAULT '{}',
    space_required TEXT CHECK (space_required IN ('minimal', 'small', 'medium', 'large')),

    -- Timing
    default_duration_seconds INTEGER, -- for timed exercises
    default_reps INTEGER, -- for rep-based exercises
    is_timed BOOLEAN DEFAULT FALSE, -- true = duration, false = reps

    -- Partner info
    is_partner_exercise BOOLEAN DEFAULT FALSE, -- requires partner
    requires_contact BOOLEAN DEFAULT FALSE,
    contact_level TEXT CHECK (contact_level IN ('none', 'light', 'full')),

    -- Media
    video_url TEXT,
    thumbnail_url TEXT,

    -- Metadata
    calories_per_minute DECIMAL(4,2),
    met_value DECIMAL(4,2), -- metabolic equivalent

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise pairs for asymmetric workouts
CREATE TABLE exercise_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The two exercises (A is easier, B is harder)
    exercise_a_id UUID REFERENCES exercises(id) NOT NULL,
    exercise_b_id UUID REFERENCES exercises(id) NOT NULL,

    -- Must match
    muscle_group TEXT NOT NULL,

    -- Timing (shared between both)
    duration_seconds INTEGER NOT NULL,

    -- Scaling info
    difficulty_gap INTEGER CHECK (difficulty_gap BETWEEN 1 AND 4), -- how far apart A and B are

    -- Tags for selection
    tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT different_exercises CHECK (exercise_a_id != exercise_b_id)
);

-- ============================================
-- WORKOUT SESSIONS
-- ============================================

-- Workout sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) NOT NULL,

    -- Session info
    name TEXT,
    description TEXT,

    -- Status tracking
    status TEXT CHECK (status IN ('scheduled', 'ready', 'in_progress', 'paused', 'completed', 'abandoned')) DEFAULT 'ready',

    -- The full workout structure (denormalized for performance)
    workout_data JSONB NOT NULL,
    /*
    workout_data structure:
    {
        "blocks": [
            {
                "id": "uuid",
                "type": "warmup|exercise|rest|cooldown",
                "duration_seconds": 45,
                "slot_a": {
                    "exercise_id": "uuid",
                    "exercise_name": "Wall Pushups",
                    "reps": 10,
                    "completed": false,
                    "completed_reps": null
                },
                "slot_b": {
                    "exercise_id": "uuid",
                    "exercise_name": "Diamond Pushups",
                    "reps": 10,
                    "completed": false,
                    "completed_reps": null
                }
            }
        ],
        "total_duration_minutes": 30,
        "muscle_groups": ["chest", "core", "legs"],
        "difficulty_a": 2,
        "difficulty_b": 4
    }
    */

    -- Progress tracking
    current_block_index INTEGER DEFAULT 0,

    -- Partner assignments
    partner_a_id UUID REFERENCES profiles(id),
    partner_b_id UUID REFERENCES profiles(id),

    -- Timing
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_active_seconds INTEGER, -- actual workout time (excludes pauses)

    -- Scoring
    xp_earned INTEGER DEFAULT 0,

    -- Metadata
    is_solo BOOLEAN DEFAULT FALSE, -- one partner doing it alone

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time session state (separate table for frequent updates)
CREATE TABLE session_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,

    -- Current position
    current_block_index INTEGER DEFAULT 0,
    block_started_at TIMESTAMPTZ,

    -- Timer state
    timer_running BOOLEAN DEFAULT FALSE,
    timer_seconds_remaining INTEGER,

    -- Pause state
    is_paused BOOLEAN DEFAULT FALSE,
    paused_by UUID REFERENCES profiles(id),

    -- Partner readiness
    partner_a_ready BOOLEAN DEFAULT FALSE,
    partner_b_ready BOOLEAN DEFAULT FALSE,

    -- Sync timestamp (for conflict resolution)
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- ============================================
-- PROGRESSION & GAMIFICATION
-- ============================================

-- XP ledger (append-only for auditability)
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) NOT NULL,

    -- Transaction details
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN (
        'workout_completed', 'streak_bonus', 'bet_won',
        'challenge_completed', 'referral', 'milestone'
    )),

    -- Optional references
    session_id UUID REFERENCES sessions(id),
    bet_id UUID REFERENCES bets(id),

    -- Multiplier applied (for streaks)
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    base_amount INTEGER, -- before multiplier

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bets between partners
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) NOT NULL,

    -- Who initiated
    challenger_id UUID REFERENCES profiles(id) NOT NULL,

    -- Stakes (free text)
    challenger_stake TEXT NOT NULL,
    challenged_stake TEXT NOT NULL,

    -- What's being measured
    metric TEXT NOT NULL CHECK (metric IN (
        'total_reps', 'total_sessions', 'total_minutes',
        'streak_days', 'xp_earned', 'custom'
    )),
    custom_metric_description TEXT, -- if metric = 'custom'

    -- Time period
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'cancelled')) DEFAULT 'pending',

    -- Results
    challenger_score INTEGER,
    challenged_score INTEGER,
    winner_id UUID REFERENCES profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX idx_sessions_couple_id ON sessions(couple_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercise_pairs_muscle_group ON exercise_pairs(muscle_group);
CREATE INDEX idx_xp_transactions_couple_id ON xp_transactions(couple_id);
CREATE INDEX idx_bets_couple_id ON bets(couple_id);
CREATE INDEX idx_bets_status ON bets(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own, read their partner's
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view partner profile" ON profiles
    FOR SELECT USING (
        couple_id IN (
            SELECT couple_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Couples: members can read/update their couple
CREATE POLICY "Couple members can view couple" ON couples
    FOR SELECT USING (
        id IN (SELECT couple_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Couple members can update couple" ON couples
    FOR UPDATE USING (
        id IN (SELECT couple_id FROM profiles WHERE user_id = auth.uid())
    );

-- Sessions: couple members can CRUD their sessions
CREATE POLICY "Couple members can manage sessions" ON sessions
    FOR ALL USING (
        couple_id IN (SELECT couple_id FROM profiles WHERE user_id = auth.uid())
    );

-- Exercises: everyone can read
CREATE POLICY "Anyone can view exercises" ON exercises
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view exercise pairs" ON exercise_pairs
    FOR SELECT USING (true);
```

---

## 3. Feature Specs

### 3.1 Auth + Couple Pairing

#### Overview
Users sign up individually, then pair with their partner using an invite link. The couple entity is the core unit for workouts, XP, and bets.

#### User Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User A        │     │    Server       │     │    User B       │
│   (Initiator)   │     │                 │     │   (Invitee)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. Sign up            │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 2. Create couple      │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 3. Generate invite    │                       │
         │<──────────────────────│                       │
         │    link + code        │                       │
         │                       │                       │
         │ 4. Share link ────────┼──────────────────────>│
         │    (SMS/WhatsApp)     │                       │
         │                       │                       │
         │                       │ 5. Open link          │
         │                       │<──────────────────────│
         │                       │                       │
         │                       │ 6. Sign up (or login) │
         │                       │<──────────────────────│
         │                       │                       │
         │                       │ 7. Join couple        │
         │                       │<──────────────────────│
         │                       │                       │
         │ 8. Notify: Partner    │                       │
         │    joined!            │                       │
         │<──────────────────────│                       │
         │                       │                       │
         ▼                       ▼                       ▼
    ┌─────────────────────────────────────────────────────────┐
    │              Both proceed to onboarding                  │
    └─────────────────────────────────────────────────────────┘
```

#### Implementation Details

**Sign Up Options:**
1. Email + Password (Supabase default)
2. Magic Link (email-based, passwordless)
3. Google OAuth (optional, Phase 2)
4. Apple Sign In (required for iOS App Store)

**Invite Link Structure:**
```
https://app.couplesworkout.com/invite/{invite_code}

Example: https://app.couplesworkout.com/invite/ABC123XYZ
```

**Invite Code Generation:**
```typescript
// Generate a readable, unique code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 (confusing)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

**Edge Cases:**
- Invite link expires after 7 days
- User B already has a couple → Show error, offer to uncouple first
- User A tries to use their own invite → Show error
- Invite code already used → Show error with option to request new link

#### API Endpoints

```typescript
// POST /functions/v1/auth/signup
// Creates user + profile + new couple (if not joining existing)
{
  email: string,
  password: string,
  display_name: string,
  invite_code?: string // If joining existing couple
}

// POST /functions/v1/couples/create-invite
// Generates new invite link (authenticated)
Response: {
  invite_code: string,
  invite_url: string,
  expires_at: string
}

// POST /functions/v1/couples/join
// Join existing couple via invite code (authenticated)
{
  invite_code: string
}

// POST /functions/v1/couples/uncouple
// Leave current couple (authenticated)
// Preserves user account, sets couple_id to null
```

---

### 3.2 Partner Invite Flow

#### Deep Link Handling

**React Native (Expo) Setup:**

```typescript
// app.json
{
  "expo": {
    "scheme": "couplesworkout",
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-linking",
        {
          "scheme": "couplesworkout"
        }
      ]
    ]
  }
}

// App.tsx - Deep link handler
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Handle app opened via link
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === 'invite' && queryParams?.code) {
        // Navigate to signup/login with invite code
        router.push({
          pathname: '/auth/signup',
          params: { inviteCode: queryParams.code }
        });
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle app opened from closed state
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);
}
```

#### Share Sheet Implementation

```typescript
import { Share } from 'react-native';

async function shareInviteLink(inviteUrl: string, partnerName: string) {
  try {
    await Share.share({
      message: `Hey! I want us to work out together. Join me on Couples Workout! ${inviteUrl}`,
      title: 'Join me on Couples Workout',
      url: inviteUrl, // iOS only
    });
  } catch (error) {
    console.error('Error sharing:', error);
  }
}
```

#### Invite Status UI States

```typescript
type InviteStatus =
  | 'no_couple'        // User hasn't created a couple yet
  | 'pending_invite'   // Waiting for partner to join
  | 'coupled';         // Both partners present

// UI for each state
function PartnerStatusCard({ status }: { status: InviteStatus }) {
  switch (status) {
    case 'no_couple':
      return <InvitePartnerPrompt />;
    case 'pending_invite':
      return <WaitingForPartnerCard />;
    case 'coupled':
      return <PartnerConnectedCard />;
  }
}
```

---

### 3.3 Asymmetric Workout Engine

#### Overview
The core algorithm that generates workouts for two people with different fitness levels. Each block has two "slots" with exercises matched by muscle group but differing in difficulty.

#### Workout Structure

```typescript
interface Workout {
  id: string;
  name: string;
  totalDurationMinutes: number;
  blocks: WorkoutBlock[];
  muscleGroups: MuscleGroup[];
  difficultyA: number; // 1-5
  difficultyB: number; // 1-5
}

interface WorkoutBlock {
  id: string;
  type: 'warmup' | 'exercise' | 'rest' | 'cooldown';
  durationSeconds: number;
  slotA: ExerciseSlot;
  slotB: ExerciseSlot;
}

interface ExerciseSlot {
  exerciseId: string;
  exerciseName: string;
  reps?: number;
  durationSeconds?: number;
  completed: boolean;
  completedReps?: number;
}
```

#### Generation Algorithm

```typescript
// Edge function: generate-workout

interface GenerateWorkoutInput {
  coupleId: string;
  durationMinutes: 15 | 20 | 30 | 45;
  muscleGroupFocus?: MuscleGroup[];
  excludeEquipment?: string[];
}

async function generateWorkout(input: GenerateWorkoutInput): Promise<Workout> {
  // 1. Fetch both partner profiles
  const [partnerA, partnerB] = await fetchPartnerProfiles(input.coupleId);

  // 2. Determine difficulty levels
  const difficultyA = calculateDifficulty(partnerA);
  const difficultyB = calculateDifficulty(partnerB);

  // 3. Determine available equipment (intersection of both)
  const equipment = intersect(
    partnerA.available_equipment,
    partnerB.available_equipment
  );

  // 4. Filter out disliked activities
  const excludedTypes = union(
    partnerA.disliked_activities,
    partnerB.disliked_activities
  );

  // 5. Get contact comfort level (minimum of both)
  const contactLevel = minContactLevel(
    partnerA.comfort_with_contact,
    partnerB.comfort_with_contact
  );

  // 6. Calculate block counts based on duration
  const structure = calculateWorkoutStructure(input.durationMinutes);
  /*
    15 min: 1 warmup, 4 exercise, 1 cooldown
    20 min: 1 warmup, 6 exercise, 1 cooldown
    30 min: 2 warmup, 8 exercise, 2 cooldown
    45 min: 2 warmup, 12 exercise, 2 cooldown
  */

  // 7. Select muscle groups for the workout
  const muscleGroups = selectMuscleGroups(
    input.muscleGroupFocus,
    structure.exerciseBlocks
  );

  // 8. Build blocks
  const blocks: WorkoutBlock[] = [];

  // Warmup blocks (same exercise for both, easy difficulty)
  for (let i = 0; i < structure.warmupBlocks; i++) {
    const warmupExercise = await selectWarmupExercise(equipment);
    blocks.push({
      id: generateId(),
      type: 'warmup',
      durationSeconds: 60,
      slotA: { ...warmupExercise, completed: false },
      slotB: { ...warmupExercise, completed: false },
    });
  }

  // Exercise blocks (asymmetric)
  for (let i = 0; i < structure.exerciseBlocks; i++) {
    const muscleGroup = muscleGroups[i % muscleGroups.length];

    // Find matching pair
    const pair = await selectExercisePair({
      muscleGroup,
      difficultyA,
      difficultyB,
      equipment,
      contactLevel,
      excludedTypes,
    });

    blocks.push({
      id: generateId(),
      type: 'exercise',
      durationSeconds: pair.duration_seconds,
      slotA: {
        exerciseId: pair.exercise_a_id,
        exerciseName: pair.exercise_a_name,
        reps: pair.reps_a,
        completed: false,
      },
      slotB: {
        exerciseId: pair.exercise_b_id,
        exerciseName: pair.exercise_b_name,
        reps: pair.reps_b,
        completed: false,
      },
    });

    // Add rest block every 2-3 exercises
    if ((i + 1) % 3 === 0 && i < structure.exerciseBlocks - 1) {
      blocks.push({
        id: generateId(),
        type: 'rest',
        durationSeconds: 30,
        slotA: { exerciseId: 'rest', exerciseName: 'Rest', completed: false },
        slotB: { exerciseId: 'rest', exerciseName: 'Rest', completed: false },
      });
    }
  }

  // Cooldown blocks (same exercise for both)
  for (let i = 0; i < structure.cooldownBlocks; i++) {
    const cooldownExercise = await selectCooldownExercise(muscleGroups);
    blocks.push({
      id: generateId(),
      type: 'cooldown',
      durationSeconds: 90,
      slotA: { ...cooldownExercise, completed: false },
      slotB: { ...cooldownExercise, completed: false },
    });
  }

  return {
    id: generateId(),
    name: generateWorkoutName(muscleGroups),
    totalDurationMinutes: input.durationMinutes,
    blocks,
    muscleGroups,
    difficultyA,
    difficultyB,
  };
}

// Difficulty calculation from profile
function calculateDifficulty(profile: Profile): number {
  let score = 0;

  // Base from fitness level
  score += profile.fitness_level || 2;

  // Adjust from assessment
  if (profile.can_do_pushups_10) score += 0.5;
  if (profile.can_hold_plank_30s) score += 0.5;
  if (profile.can_do_full_squat) score += 0.5;

  if (profile.cardio_capacity === 'over_30min') score += 0.5;
  else if (profile.cardio_capacity === '15_30min') score += 0.25;

  // Clamp to 1-5 range
  return Math.min(5, Math.max(1, Math.round(score)));
}
```

#### Exercise Pair Selection

```typescript
async function selectExercisePair(criteria: {
  muscleGroup: MuscleGroup;
  difficultyA: number;
  difficultyB: number;
  equipment: string[];
  contactLevel: 'none' | 'light' | 'full';
  excludedTypes: string[];
}): Promise<ExercisePair> {
  const { data: pairs } = await supabase
    .from('exercise_pairs')
    .select(`
      *,
      exercise_a:exercises!exercise_a_id(*),
      exercise_b:exercises!exercise_b_id(*)
    `)
    .eq('muscle_group', criteria.muscleGroup)
    .lte('exercise_a.difficulty', criteria.difficultyA)
    .gte('exercise_a.difficulty', criteria.difficultyA - 1)
    .lte('exercise_b.difficulty', criteria.difficultyB)
    .gte('exercise_b.difficulty', criteria.difficultyB - 1);

  // Filter by equipment
  const validPairs = pairs.filter(pair => {
    const reqEquipmentA = pair.exercise_a.equipment_required || [];
    const reqEquipmentB = pair.exercise_b.equipment_required || [];

    const hasEquipmentA = reqEquipmentA.every(e =>
      criteria.equipment.includes(e) || e === 'none'
    );
    const hasEquipmentB = reqEquipmentB.every(e =>
      criteria.equipment.includes(e) || e === 'none'
    );

    return hasEquipmentA && hasEquipmentB;
  });

  // Filter by contact level
  const contactFiltered = validPairs.filter(pair => {
    if (criteria.contactLevel === 'none') {
      return !pair.exercise_a.requires_contact && !pair.exercise_b.requires_contact;
    }
    if (criteria.contactLevel === 'light') {
      return pair.exercise_a.contact_level !== 'full' && pair.exercise_b.contact_level !== 'full';
    }
    return true;
  });

  // Random selection from valid pairs
  if (contactFiltered.length === 0) {
    throw new Error(`No valid exercise pair found for ${criteria.muscleGroup}`);
  }

  return contactFiltered[Math.floor(Math.random() * contactFiltered.length)];
}
```

---

### 3.4 Exercise Library

#### Data Structure

Each exercise needs:
- Metadata (name, description, muscle group, difficulty)
- Instructions (step-by-step text)
- Media (video URL, thumbnail)
- Scaling info (how to make easier/harder)
- Partner info (requires contact, contact level)

#### MVP Exercise Count

Target: **50 exercise pairs** covering:

| Muscle Group | Pairs | Example Pair |
|--------------|-------|--------------|
| Chest | 6 | Wall pushup / Diamond pushup |
| Back | 6 | Resistance band row / Pull-up |
| Shoulders | 5 | Pike pushup / Handstand pushup |
| Core | 8 | Dead bug / Dragon flag |
| Legs (Quads) | 6 | Bodyweight squat / Jump squat |
| Legs (Glutes/Hams) | 5 | Glute bridge / Single-leg deadlift |
| Full Body | 6 | Burpee (step back) / Burpee (full) |
| Cardio | 8 | March in place / High knees |

**Plus:**
- 10 warmup exercises (dynamic stretches)
- 10 cooldown exercises (static stretches)
- 15 partner-specific exercises (requires two people)

**Total: ~100 unique exercises**

#### Exercise Seeding Script

```typescript
// supabase/seed/exercises.ts

const exercises = [
  // CHEST - Beginner
  {
    name: 'Wall Pushups',
    description: 'Pushups performed against a wall for reduced resistance',
    instructions: [
      'Stand facing a wall, about arm\'s length away',
      'Place palms flat on the wall at shoulder height',
      'Bend elbows to bring chest toward wall',
      'Push back to starting position'
    ],
    muscle_group: 'chest',
    exercise_type: 'strength',
    movement_pattern: 'push',
    difficulty: 1,
    difficulty_label: 'beginner',
    equipment_required: [],
    space_required: 'minimal',
    default_reps: 12,
    is_timed: false,
    is_partner_exercise: false,
    requires_contact: false,
    video_url: 'https://youtube.com/embed/xxx',
  },
  // CHEST - Intermediate
  {
    name: 'Standard Pushups',
    description: 'Classic pushup from the floor',
    instructions: [
      'Start in plank position, hands shoulder-width apart',
      'Keep body in straight line from head to heels',
      'Lower chest to the floor by bending elbows',
      'Push back up to starting position'
    ],
    muscle_group: 'chest',
    exercise_type: 'strength',
    movement_pattern: 'push',
    difficulty: 3,
    difficulty_label: 'moderate',
    equipment_required: [],
    space_required: 'small',
    default_reps: 10,
    is_timed: false,
    is_partner_exercise: false,
    requires_contact: false,
    video_url: 'https://youtube.com/embed/xxx',
  },
  // ... more exercises
];

const exercisePairs = [
  {
    exercise_a_name: 'Wall Pushups', // Will be resolved to ID
    exercise_b_name: 'Standard Pushups',
    muscle_group: 'chest',
    duration_seconds: 45,
    difficulty_gap: 2,
    tags: ['push', 'no_equipment'],
  },
  {
    exercise_a_name: 'Standard Pushups',
    exercise_b_name: 'Diamond Pushups',
    muscle_group: 'chest',
    duration_seconds: 45,
    difficulty_gap: 1,
    tags: ['push', 'no_equipment'],
  },
  // ... more pairs
];
```

---

### 3.5 Real-Time Session Sync

#### Overview
Both partners see the same workout state: current block, timer, exercise completion. Uses Supabase Realtime with Postgres changes.

#### Sync Architecture

```
┌─────────────────┐                     ┌─────────────────┐
│   Partner A     │                     │   Partner B     │
│   Phone         │                     │   Phone         │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         │ Subscribe to session_state changes   │
         │ ─────────────────┬───────────────────│
         │                  │                   │
         │                  ▼                   │
         │        ┌─────────────────┐           │
         │        │    Supabase     │           │
         │        │    Realtime     │           │
         │        │                 │           │
         │        │  Channel:       │           │
         │        │  session:{id}   │           │
         │        └────────┬────────┘           │
         │                 │                    │
         │     ┌───────────┴───────────┐        │
         │     ▼                       ▼        │
         │ Broadcast                Postgres    │
         │ (timer ticks)            Changes     │
         │                          (state)     │
         │                                      │
         ▼                                      ▼
    ┌─────────────────────────────────────────────┐
    │           session_state table               │
    │  - current_block_index                      │
    │  - timer_running                            │
    │  - timer_seconds_remaining                  │
    │  - is_paused                                │
    │  - partner_a_ready                          │
    │  - partner_b_ready                          │
    │  - last_updated_at                          │
    └─────────────────────────────────────────────┘
```

#### Client Implementation

```typescript
// hooks/useSessionSync.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SessionState {
  currentBlockIndex: number;
  timerRunning: boolean;
  timerSecondsRemaining: number;
  isPaused: boolean;
  partnerAReady: boolean;
  partnerBReady: boolean;
  lastUpdatedAt: string;
}

export function useSessionSync(sessionId: string, myProfileId: string) {
  const [state, setState] = useState<SessionState | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Subscribe to session state changes
  useEffect(() => {
    if (!sessionId) return;

    const channelName = `session:${sessionId}`;

    const newChannel = supabase
      .channel(channelName)
      // Listen for database changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_state',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('State change:', payload);
          if (payload.new) {
            setState(mapDbStateToClient(payload.new));
          }
        }
      )
      // Listen for broadcast messages (high-frequency timer updates)
      .on('broadcast', { event: 'timer_tick' }, (payload) => {
        setState(prev => prev ? {
          ...prev,
          timerSecondsRemaining: payload.payload.seconds,
        } : null);
      })
      .on('broadcast', { event: 'exercise_complete' }, (payload) => {
        // Handle partner completing their exercise
        console.log('Partner completed:', payload);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(newChannel);

    // Initial state fetch
    fetchSessionState(sessionId).then(setState);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [sessionId]);

  // Update state (with optimistic update)
  const updateState = useCallback(async (updates: Partial<SessionState>) => {
    if (!sessionId) return;

    // Optimistic update
    setState(prev => prev ? { ...prev, ...updates } : null);

    // Persist to database
    const { error } = await supabase
      .from('session_state')
      .update({
        ...mapClientStateToDb(updates),
        last_updated_at: new Date().toISOString(),
        updated_by: myProfileId,
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to update state:', error);
      // Revert optimistic update
      const freshState = await fetchSessionState(sessionId);
      setState(freshState);
    }
  }, [sessionId, myProfileId]);

  // Broadcast timer tick (high frequency, not persisted)
  const broadcastTimerTick = useCallback((seconds: number) => {
    channel?.send({
      type: 'broadcast',
      event: 'timer_tick',
      payload: { seconds },
    });
  }, [channel]);

  // Signal exercise completion
  const signalExerciseComplete = useCallback((blockIndex: number, reps: number) => {
    channel?.send({
      type: 'broadcast',
      event: 'exercise_complete',
      payload: { blockIndex, reps, profileId: myProfileId },
    });
  }, [channel, myProfileId]);

  return {
    state,
    isConnected,
    updateState,
    broadcastTimerTick,
    signalExerciseComplete,
  };
}

// Helper functions
function mapDbStateToClient(dbState: any): SessionState {
  return {
    currentBlockIndex: dbState.current_block_index,
    timerRunning: dbState.timer_running,
    timerSecondsRemaining: dbState.timer_seconds_remaining,
    isPaused: dbState.is_paused,
    partnerAReady: dbState.partner_a_ready,
    partnerBReady: dbState.partner_b_ready,
    lastUpdatedAt: dbState.last_updated_at,
  };
}

function mapClientStateToDb(clientState: Partial<SessionState>): any {
  const mapping: Record<string, string> = {
    currentBlockIndex: 'current_block_index',
    timerRunning: 'timer_running',
    timerSecondsRemaining: 'timer_seconds_remaining',
    isPaused: 'is_paused',
    partnerAReady: 'partner_a_ready',
    partnerBReady: 'partner_b_ready',
  };

  return Object.entries(clientState).reduce((acc, [key, value]) => {
    if (mapping[key]) acc[mapping[key]] = value;
    return acc;
  }, {} as any);
}

async function fetchSessionState(sessionId: string): Promise<SessionState | null> {
  const { data, error } = await supabase
    .from('session_state')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) return null;
  return mapDbStateToClient(data);
}
```

#### Conflict Resolution

When both partners update simultaneously, use "last write wins" with timestamp comparison:

```typescript
// In updateState function, check for conflicts
const updateState = useCallback(async (updates: Partial<SessionState>) => {
  // Optimistic update with timestamp
  const updateTime = new Date().toISOString();
  setState(prev => prev ? {
    ...prev,
    ...updates,
    lastUpdatedAt: updateTime
  } : null);

  const { data, error } = await supabase
    .from('session_state')
    .update({
      ...mapClientStateToDb(updates),
      last_updated_at: updateTime,
      updated_by: myProfileId,
    })
    .eq('session_id', sessionId)
    // Only update if we have the latest version
    .lt('last_updated_at', updateTime)
    .select()
    .single();

  if (error || !data) {
    // Conflict detected or error - fetch fresh state
    const freshState = await fetchSessionState(sessionId);
    setState(freshState);
  }
}, [sessionId, myProfileId]);
```

#### Connection Status UI

```typescript
// components/SyncStatusIndicator.tsx

export function SyncStatusIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <View style={styles.container}>
      <View style={[
        styles.dot,
        { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }
      ]} />
      <Text style={styles.text}>
        {isConnected ? 'Partner connected' : 'Reconnecting...'}
      </Text>
    </View>
  );
}
```

---

### 3.6 Basic Workout UI

#### Screen Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Workout    │     │   Ready     │     │  Exercise   │
│  Preview    │────>│   Check     │────>│  Screen     │
│             │     │ (Both tap)  │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┤
                    │                          │
                    ▼                          ▼
             ┌─────────────┐           ┌─────────────┐
             │    Rest     │           │  Cooldown   │
             │   Screen    │           │   Screen    │
             └─────────────┘           └──────┬──────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  Complete   │
                                       │   Summary   │
                                       └─────────────┘
```

#### Key Components

**1. Workout Preview Screen**

```typescript
// screens/WorkoutPreview.tsx

interface WorkoutPreviewProps {
  workout: Workout;
  partnerAName: string;
  partnerBName: string;
  onStart: () => void;
}

export function WorkoutPreviewScreen({
  workout,
  partnerAName,
  partnerBName,
  onStart
}: WorkoutPreviewProps) {
  return (
    <ScrollView>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{workout.name}</Text>
        <Text style={styles.duration}>{workout.totalDurationMinutes} min</Text>
      </View>

      {/* Partner difficulty indicators */}
      <View style={styles.difficultyRow}>
        <DifficultyBadge
          name={partnerAName}
          level={workout.difficultyA}
        />
        <DifficultyBadge
          name={partnerBName}
          level={workout.difficultyB}
        />
      </View>

      {/* Muscle groups */}
      <View style={styles.muscleGroups}>
        {workout.muscleGroups.map(group => (
          <Chip key={group} label={group} />
        ))}
      </View>

      {/* Block preview */}
      <View style={styles.blockList}>
        {workout.blocks.map((block, index) => (
          <BlockPreviewCard
            key={block.id}
            block={block}
            index={index}
          />
        ))}
      </View>

      {/* Start button */}
      <Button
        title="Start Workout"
        onPress={onStart}
        style={styles.startButton}
      />
    </ScrollView>
  );
}
```

**2. Ready Check Screen**

```typescript
// screens/ReadyCheck.tsx

export function ReadyCheckScreen({
  sessionId,
  myProfileId,
  isPartnerA,
  partnerAReady,
  partnerBReady,
  partnerName,
  onBothReady,
}: ReadyCheckProps) {
  const { updateState } = useSessionSync(sessionId, myProfileId);

  const myReady = isPartnerA ? partnerAReady : partnerBReady;
  const theirReady = isPartnerA ? partnerBReady : partnerAReady;

  const handleReady = () => {
    updateState({
      [isPartnerA ? 'partnerAReady' : 'partnerBReady']: true,
    });
  };

  // Navigate when both ready
  useEffect(() => {
    if (partnerAReady && partnerBReady) {
      onBothReady();
    }
  }, [partnerAReady, partnerBReady]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ready to start?</Text>

      {/* Partner status */}
      <View style={styles.statusRow}>
        <ReadyIndicator
          name="You"
          ready={myReady}
        />
        <ReadyIndicator
          name={partnerName}
          ready={theirReady}
        />
      </View>

      {/* Ready button */}
      {!myReady ? (
        <Button
          title="I'm Ready!"
          onPress={handleReady}
        />
      ) : (
        <Text style={styles.waiting}>
          Waiting for {partnerName}...
        </Text>
      )}
    </View>
  );
}
```

**3. Exercise Screen**

```typescript
// screens/ExerciseScreen.tsx

export function ExerciseScreen({
  sessionId,
  myProfileId,
  isPartnerA,
  workout,
  currentBlockIndex,
  timerSecondsRemaining,
  timerRunning,
}: ExerciseScreenProps) {
  const {
    updateState,
    broadcastTimerTick,
    signalExerciseComplete
  } = useSessionSync(sessionId, myProfileId);

  const block = workout.blocks[currentBlockIndex];
  const mySlot = isPartnerA ? block.slotA : block.slotB;
  const partnerSlot = isPartnerA ? block.slotB : block.slotA;

  // Timer logic (only one partner runs the timer, broadcasts to other)
  const [localTimer, setLocalTimer] = useState(timerSecondsRemaining);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setLocalTimer(prev => {
        const newValue = prev - 1;

        // Broadcast every second
        broadcastTimerTick(newValue);

        // Block complete
        if (newValue <= 0) {
          clearInterval(interval);
          handleBlockComplete();
        }

        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  // Sync timer from partner broadcasts
  useEffect(() => {
    setLocalTimer(timerSecondsRemaining);
  }, [timerSecondsRemaining]);

  const handleBlockComplete = async () => {
    // Move to next block
    const nextIndex = currentBlockIndex + 1;

    if (nextIndex >= workout.blocks.length) {
      // Workout complete
      await completeWorkout(sessionId);
      return;
    }

    // Update state for next block
    await updateState({
      currentBlockIndex: nextIndex,
      timerSecondsRemaining: workout.blocks[nextIndex].durationSeconds,
      timerRunning: true,
      partnerAReady: false,
      partnerBReady: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* Block progress */}
      <ProgressBar
        current={currentBlockIndex + 1}
        total={workout.blocks.length}
      />

      {/* Timer */}
      <CircularTimer
        seconds={localTimer}
        total={block.durationSeconds}
      />

      {/* My exercise */}
      <View style={styles.myExercise}>
        <Text style={styles.label}>Your exercise</Text>
        <ExerciseCard exercise={mySlot} large />
      </View>

      {/* Partner's exercise (smaller) */}
      <View style={styles.partnerExercise}>
        <Text style={styles.label}>Partner's exercise</Text>
        <ExerciseCard exercise={partnerSlot} small />
      </View>

      {/* Pause button */}
      <Button
        title="Pause"
        onPress={() => updateState({ isPaused: true, timerRunning: false })}
      />
    </View>
  );
}
```

**4. Circular Timer Component**

```typescript
// components/CircularTimer.tsx

import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularTimerProps {
  seconds: number;
  total: number;
}

export function CircularTimer({ seconds, total }: CircularTimerProps) {
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / total;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
        {/* Background circle */}
        <Circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          stroke="#6366f1"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
        />
      </Svg>
      <Text style={styles.time}>{formatTime(seconds)}</Text>
    </View>
  );
}
```

---

### 3.7 Couple Profile/Dashboard

#### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [Avatar A]  ❤️  [Avatar B]                                │
│   Alex & Sam                                                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  🔥 12 day streak    ⭐ 2,450 XP    💪 47 workouts │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │   [ Start Workout ]                                 │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Active Bet                                                │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Alex: 45 reps  vs  Sam: 38 reps                    │   │
│   │  Loser cooks dinner 🍳                              │   │
│   │  3 days left                                        │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Recent Workouts                                           │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Today - Upper Body Blast - 25 min ✓                │   │
│   │  Yesterday - Core Crusher - 20 min ✓                │   │
│   │  Mon - Leg Day - 30 min ✓                           │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation

```typescript
// screens/Dashboard.tsx

export function DashboardScreen() {
  const { couple, partnerA, partnerB, isLoading } = useCouple();
  const { activeBet } = useActiveBet(couple?.id);
  const { recentSessions } = useRecentSessions(couple?.id, 5);

  if (isLoading) return <LoadingScreen />;
  if (!couple) return <NoCoupleScreen />;

  return (
    <ScrollView style={styles.container}>
      {/* Couple header */}
      <CoupleHeader
        partnerA={partnerA}
        partnerB={partnerB}
      />

      {/* Stats row */}
      <StatsRow
        streak={couple.current_streak}
        xp={couple.total_xp}
        totalWorkouts={recentSessions?.length || 0}
      />

      {/* Start workout CTA */}
      <StartWorkoutCard
        onPress={() => router.push('/workout/new')}
      />

      {/* Active bet (if exists) */}
      {activeBet && (
        <ActiveBetCard bet={activeBet} />
      )}

      {/* Recent workouts */}
      <RecentWorkoutsList sessions={recentSessions} />
    </ScrollView>
  );
}

// hooks/useCouple.ts
export function useCouple() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['couple', user?.id],
    queryFn: async () => {
      // Get my profile with couple
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('*, couple:couples(*)')
        .eq('user_id', user!.id)
        .single();

      if (!myProfile?.couple) return { couple: null };

      // Get partner profile
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', myProfile.couple.id)
        .neq('user_id', user!.id)
        .single();

      return {
        couple: myProfile.couple,
        partnerA: myProfile,
        partnerB: partnerProfile,
      };
    },
    enabled: !!user,
  });
}
```

---

### 3.8 Streaks & XP System

#### Streak Logic

```typescript
// Edge function: update-streak

async function updateStreakAfterWorkout(coupleId: string) {
  const { data: couple } = await supabase
    .from('couples')
    .select('current_streak, longest_streak, last_workout_at')
    .eq('id', coupleId)
    .single();

  const now = new Date();
  const lastWorkout = couple.last_workout_at
    ? new Date(couple.last_workout_at)
    : null;

  let newStreak = 1;

  if (lastWorkout) {
    const daysSinceLastWorkout = differenceInCalendarDays(now, lastWorkout);

    if (daysSinceLastWorkout === 0) {
      // Same day - no streak change
      newStreak = couple.current_streak;
    } else if (daysSinceLastWorkout === 1) {
      // Consecutive day - increment streak
      newStreak = couple.current_streak + 1;
    } else {
      // Streak broken - reset to 1
      newStreak = 1;
    }
  }

  const newLongestStreak = Math.max(newStreak, couple.longest_streak);

  await supabase
    .from('couples')
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_workout_at: now.toISOString(),
    })
    .eq('id', coupleId);

  return { newStreak, newLongestStreak };
}
```

#### XP Calculation

```typescript
// Edge function: award-xp

interface AwardXPInput {
  coupleId: string;
  sessionId: string;
  isSolo: boolean;
}

async function awardXPForWorkout(input: AwardXPInput) {
  const { data: session } = await supabase
    .from('sessions')
    .select('workout_data, total_active_seconds')
    .eq('id', input.sessionId)
    .single();

  const { data: couple } = await supabase
    .from('couples')
    .select('current_streak')
    .eq('id', input.coupleId)
    .single();

  // Base XP: 10 XP per minute of workout
  const minutes = Math.floor(session.total_active_seconds / 60);
  let baseXP = minutes * 10;

  // Solo penalty: 0.25x
  if (input.isSolo) {
    baseXP = Math.floor(baseXP * 0.25);
  }

  // Streak multiplier
  let multiplier = 1.0;
  if (couple.current_streak >= 30) {
    multiplier = 2.0;
  } else if (couple.current_streak >= 7) {
    multiplier = 1.5;
  }

  const finalXP = Math.floor(baseXP * multiplier);

  // Record transaction
  await supabase.from('xp_transactions').insert({
    couple_id: input.coupleId,
    amount: finalXP,
    reason: 'workout_completed',
    session_id: input.sessionId,
    multiplier,
    base_amount: baseXP,
  });

  // Update couple total
  await supabase.rpc('increment_couple_xp', {
    couple_id: input.coupleId,
    amount: finalXP,
  });

  return { xpEarned: finalXP, multiplier };
}

// SQL function for atomic increment
/*
CREATE OR REPLACE FUNCTION increment_couple_xp(couple_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE couples
  SET total_xp = total_xp + amount
  WHERE id = couple_id;
END;
$$ LANGUAGE plpgsql;
*/
```

---

### 3.9 Bet System

#### Bet Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Create     │     │   Accept    │     │   Active    │
│  Bet        │────>│   Bet       │────>│   Bet       │
│ (Partner A) │     │ (Partner B) │     │ (Tracking)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               │ End date reached
                                               ▼
                                        ┌─────────────┐
                                        │  Resolve    │
                                        │  Winner     │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Notify     │
                                        │  Both       │
                                        └─────────────┘
```

#### Implementation

```typescript
// screens/CreateBet.tsx

export function CreateBetScreen() {
  const { couple, myProfile, partnerProfile } = useCouple();
  const [metric, setMetric] = useState<BetMetric>('total_reps');
  const [duration, setDuration] = useState(7); // days
  const [myStake, setMyStake] = useState('');
  const [theirStake, setTheirStake] = useState('');

  const handleCreate = async () => {
    const startsAt = new Date();
    const endsAt = addDays(startsAt, duration);

    await supabase.from('bets').insert({
      couple_id: couple.id,
      challenger_id: myProfile.id,
      challenger_stake: myStake,
      challenged_stake: theirStake,
      metric,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'pending',
    });

    // Notify partner
    await sendPushNotification(partnerProfile.user_id, {
      title: `${myProfile.display_name} challenged you!`,
      body: `Accept the bet: Loser ${theirStake}`,
    });

    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a Bet</Text>

      {/* Metric selection */}
      <Text style={styles.label}>What are you competing on?</Text>
      <SegmentedControl
        values={['Total Reps', 'Sessions', 'Minutes', 'Streak']}
        selectedIndex={METRICS.indexOf(metric)}
        onChange={(index) => setMetric(METRICS[index])}
      />

      {/* Duration */}
      <Text style={styles.label}>How long?</Text>
      <SegmentedControl
        values={['3 days', '1 week', '2 weeks', '1 month']}
        selectedIndex={DURATIONS.indexOf(duration)}
        onChange={(index) => setDuration(DURATIONS[index])}
      />

      {/* Stakes */}
      <Text style={styles.label}>If you lose, you will...</Text>
      <TextInput
        value={myStake}
        onChangeText={setMyStake}
        placeholder="Cook dinner for a week"
        style={styles.input}
      />

      <Text style={styles.label}>If {partnerProfile.display_name} loses, they will...</Text>
      <TextInput
        value={theirStake}
        onChangeText={setTheirStake}
        placeholder="Give you a massage"
        style={styles.input}
      />

      <Button title="Send Challenge" onPress={handleCreate} />
    </ScrollView>
  );
}

// Edge function: resolve-bets (runs daily via cron)

async function resolveBets() {
  const now = new Date();

  // Find bets that have ended
  const { data: endedBets } = await supabase
    .from('bets')
    .select('*')
    .eq('status', 'active')
    .lte('ends_at', now.toISOString());

  for (const bet of endedBets) {
    // Calculate scores based on metric
    const scores = await calculateBetScores(bet);

    // Determine winner
    const winnerId = scores.challenger > scores.challenged
      ? bet.challenger_id
      : scores.challenged > scores.challenger
        ? await getPartnerId(bet.couple_id, bet.challenger_id)
        : null; // tie

    // Update bet
    await supabase
      .from('bets')
      .update({
        status: 'completed',
        challenger_score: scores.challenger,
        challenged_score: scores.challenged,
        winner_id: winnerId,
        resolved_at: now.toISOString(),
      })
      .eq('id', bet.id);

    // Send notifications
    await notifyBetResult(bet, winnerId, scores);
  }
}

async function calculateBetScores(bet: Bet) {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, workout_data')
    .eq('couple_id', bet.couple_id)
    .eq('status', 'completed')
    .gte('completed_at', bet.starts_at)
    .lte('completed_at', bet.ends_at);

  let challengerScore = 0;
  let challengedScore = 0;

  for (const session of sessions) {
    switch (bet.metric) {
      case 'total_reps':
        // Sum reps from workout_data
        const reps = countRepsFromWorkout(session.workout_data);
        if (session.partner_a_id === bet.challenger_id) {
          challengerScore += reps.a;
          challengedScore += reps.b;
        } else {
          challengerScore += reps.b;
          challengedScore += reps.a;
        }
        break;

      case 'total_sessions':
        // Both get credit for joint sessions
        challengerScore += 1;
        challengedScore += 1;
        break;

      case 'total_minutes':
        const minutes = Math.floor(session.total_active_seconds / 60);
        challengerScore += minutes;
        challengedScore += minutes;
        break;
    }
  }

  return { challenger: challengerScore, challenged: challengedScore };
}
```

---

## 4. API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/v1/signup` | POST | Create new user account |
| `/auth/v1/token?grant_type=password` | POST | Login with email/password |
| `/auth/v1/token?grant_type=refresh_token` | POST | Refresh access token |
| `/auth/v1/logout` | POST | Logout current session |

### Edge Functions

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/functions/v1/couples/create` | POST | Required | Create new couple, generate invite |
| `/functions/v1/couples/join` | POST | Required | Join couple via invite code |
| `/functions/v1/couples/uncouple` | POST | Required | Leave current couple |
| `/functions/v1/workouts/generate` | POST | Required | Generate new workout for couple |
| `/functions/v1/sessions/start` | POST | Required | Start workout session |
| `/functions/v1/sessions/complete` | POST | Required | Complete workout, award XP |
| `/functions/v1/bets/create` | POST | Required | Create new bet |
| `/functions/v1/bets/accept` | POST | Required | Accept pending bet |
| `/functions/v1/bets/resolve` | POST | Cron | Resolve ended bets |

### Database (Direct via Supabase Client)

All tables accessible via `supabase.from('table_name')` with RLS policies enforcing authorization.

---

## 5. Week-by-Week Implementation Plan

### Week 1: Foundation

**Goal:** Auth working, couple pairing complete, basic navigation

| Day | Tasks |
|-----|-------|
| 1 | Project setup: Expo + TypeScript + Supabase client |
| 1 | Configure Supabase project: auth, database |
| 2 | Create database schema (users, couples, profiles) |
| 2 | Implement RLS policies |
| 3 | Auth screens: Sign up, Login, Forgot password |
| 3 | Auth context + protected routes |
| 4 | Onboarding flow UI (questionnaire screens) |
| 4 | Profile creation on signup |
| 5 | Couple creation + invite code generation |
| 5 | Partner invite flow (deep links, share sheet) |

**Deliverable:** Two users can sign up, one invites the other, couple is formed.

---

### Week 2: Exercise Library + Workout Engine

**Goal:** Can generate a workout for a couple

| Day | Tasks |
|-----|-------|
| 1 | Create exercises table schema |
| 1 | Seed 30 exercises (basic set) |
| 2 | Create exercise_pairs table |
| 2 | Seed 20 exercise pairs |
| 3 | Workout generation algorithm (Edge Function) |
| 3 | Handle equipment/injury filters |
| 4 | Workout preview screen |
| 4 | Block/exercise card components |
| 5 | Test workout generation with different couple configs |
| 5 | Add 20 more exercises + pairs |

**Deliverable:** Couple can generate a workout tailored to their fitness levels.

---

### Week 3: Real-Time Sync (Core)

**Goal:** Two phones syncing workout state

| Day | Tasks |
|-----|-------|
| 1 | session_state table + RLS |
| 1 | Supabase Realtime channel setup |
| 2 | useSessionSync hook |
| 2 | Connection status indicator |
| 3 | Ready check screen (both tap to start) |
| 3 | Sync current block index |
| 4 | Timer sync (broadcast + database) |
| 4 | Pause/resume sync |
| 5 | Test on two physical devices |
| 5 | Handle edge cases (reconnection, conflicts) |

**Deliverable:** Two phones show same timer, same exercise, in sync.

---

### Week 4: Workout UI + Flow

**Goal:** Complete workout experience from start to finish

| Day | Tasks |
|-----|-------|
| 1 | Exercise screen layout |
| 1 | Circular timer component |
| 2 | Block transitions (warmup → exercise → rest → cooldown) |
| 2 | Exercise completion tracking |
| 3 | Workout completion screen |
| 3 | Session recording (save to database) |
| 4 | Workout summary with stats |
| 4 | Return to dashboard flow |
| 5 | Polish: animations, haptic feedback |
| 5 | Error handling + recovery |

**Deliverable:** Couple can complete a full workout together.

---

### Week 5: XP, Streaks, Dashboard

**Goal:** Progression system working

| Day | Tasks |
|-----|-------|
| 1 | xp_transactions table + ledger |
| 1 | XP calculation Edge Function |
| 2 | Award XP on workout completion |
| 2 | Streak calculation logic |
| 3 | Dashboard screen layout |
| 3 | Stats components (XP, streak, workouts) |
| 4 | Recent workouts list |
| 4 | Workout history screen |
| 5 | Streak multiplier display |
| 5 | XP level thresholds + badges |

**Deliverable:** Couple sees their progress, streaks increment correctly.

---

### Week 6: Bet System

**Goal:** Couples can create and track bets

| Day | Tasks |
|-----|-------|
| 1 | bets table + RLS |
| 1 | Create bet screen UI |
| 2 | Bet acceptance flow |
| 2 | Active bet card on dashboard |
| 3 | Bet score tracking (hook into workout completion) |
| 3 | Bet detail screen |
| 4 | Bet resolution Edge Function (cron) |
| 4 | Winner notification |
| 5 | Bet history screen |
| 5 | Polish bet UI |

**Deliverable:** Couple can create bet, track progress, see winner.

---

### Week 7: Polish + Edge Cases

**Goal:** Production-ready reliability

| Day | Tasks |
|-----|-------|
| 1 | Offline handling (show errors gracefully) |
| 1 | Loading states throughout app |
| 2 | Error boundaries + crash recovery |
| 2 | Workout resume after app kill |
| 3 | Push notification setup (FCM) |
| 3 | Streak reminder notifications |
| 4 | Partner activity notifications |
| 4 | Settings screen (notifications, profile edit) |
| 5 | Uncouple flow |
| 5 | Account deletion |

**Deliverable:** App handles real-world conditions gracefully.

---

### Week 8: Testing + Launch Prep

**Goal:** Ready for beta users

| Day | Tasks |
|-----|-------|
| 1 | Add remaining exercises (total 100) |
| 1 | Add remaining exercise pairs (total 50) |
| 2 | End-to-end testing (full user journey) |
| 2 | Fix critical bugs |
| 3 | Performance testing (workout sync latency) |
| 3 | Fix performance issues |
| 4 | App store assets (screenshots, description) |
| 4 | TestFlight / Play Store internal testing setup |
| 5 | Beta user onboarding (20-30 couples) |
| 5 | Monitoring setup (error tracking, analytics) |

**Deliverable:** App in TestFlight/Play Store internal track, beta users invited.

---

## Appendix A: File Structure

```
couples-workout/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (onboarding)/
│   │   ├── basics.tsx
│   │   ├── fitness-level.tsx
│   │   ├── injuries.tsx
│   │   ├── goals.tsx
│   │   ├── preferences.tsx
│   │   └── complete.tsx
│   ├── (main)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Dashboard
│   │   ├── workout/
│   │   │   ├── new.tsx           # Generate workout
│   │   │   ├── preview.tsx       # Workout preview
│   │   │   ├── session.tsx       # Active workout
│   │   │   └── complete.tsx      # Summary
│   │   ├── bets/
│   │   │   ├── index.tsx         # Bet list
│   │   │   ├── create.tsx        # Create bet
│   │   │   └── [id].tsx          # Bet detail
│   │   ├── history.tsx           # Workout history
│   │   └── settings.tsx
│   ├── invite/
│   │   └── [code].tsx            # Deep link handler
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── workout/                  # Workout-specific components
│   │   ├── CircularTimer.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── BlockPreview.tsx
│   │   └── ProgressBar.tsx
│   ├── dashboard/
│   │   ├── StatsRow.tsx
│   │   ├── ActiveBetCard.tsx
│   │   └── RecentWorkoutsList.tsx
│   └── common/
│       ├── SyncStatusIndicator.tsx
│       └── CoupleHeader.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCouple.ts
│   ├── useSessionSync.ts
│   ├── useWorkout.ts
│   └── useBets.ts
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── notifications.ts          # Push notification helpers
│   └── storage.ts                # Async storage helpers
├── types/
│   ├── database.ts               # Generated from Supabase
│   ├── workout.ts
│   └── bet.ts
├── utils/
│   ├── format.ts                 # Formatters (time, numbers)
│   └── validation.ts
├── constants/
│   ├── muscles.ts
│   └── exercises.ts
├── supabase/
│   ├── migrations/               # SQL migrations
│   ├── functions/                # Edge Functions
│   │   ├── generate-workout/
│   │   ├── complete-session/
│   │   └── resolve-bets/
│   └── seed/                     # Seed data
│       └── exercises.ts
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

---

## Appendix B: Environment Variables

```bash
# .env.local

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Push Notifications (optional for MVP)
EXPO_PUBLIC_FCM_SENDER_ID=123456789

# App Config
EXPO_PUBLIC_APP_URL=https://app.couplesworkout.com
```

---

## Appendix C: Key Dependencies

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "expo-linking": "~6.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.17.0",
    "react-native-svg": "^14.1.0",
    "expo-haptics": "~12.8.0",
    "expo-notifications": "~0.27.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "supabase": "^1.127.0"
  }
}
```
