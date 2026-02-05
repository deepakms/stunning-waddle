# Exercise Pairing Logic System

## Overview

The Pairing Logic System is the "mini AI" that intelligently matches and pairs exercises for couples based on their individual fitness levels, goals, injuries, and preferences. It adapts over time as users progress.

## Core Principles

1. **Safety First** - Never prescribe exercises that could cause injury
2. **Equal Relative Effort** - Both partners work at the same relative intensity
3. **Progressive Overload** - Gradually increase challenge over time
4. **Connection Focus** - Maximize opportunities for partner interaction
5. **Personalization** - Learn and adapt to individual and couple preferences

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PAIRING LOGIC SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   User A     │    │   User B     │    │   Couple     │       │
│  │   Profile    │    │   Profile    │    │   Profile    │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └─────────┬─────────┴─────────┬─────────┘                │
│                   │                   │                          │
│                   ▼                   ▼                          │
│         ┌─────────────────┐  ┌─────────────────┐                │
│         │  Constraint     │  │   Optimization  │                │
│         │  Checker        │  │   Engine        │                │
│         └────────┬────────┘  └────────┬────────┘                │
│                  │                    │                          │
│                  └──────────┬─────────┘                          │
│                             │                                    │
│                             ▼                                    │
│                   ┌─────────────────┐                           │
│                   │  Pairing        │                           │
│                   │  Generator      │                           │
│                   └────────┬────────┘                           │
│                            │                                     │
│                            ▼                                     │
│                   ┌─────────────────┐                           │
│                   │  Workout        │                           │
│                   │  Output         │                           │
│                   └────────┬────────┘                           │
│                            │                                     │
│                            ▼                                     │
│                   ┌─────────────────┐                           │
│                   │  Progress       │◄──── Feedback Loop        │
│                   │  Tracker        │                           │
│                   └─────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. User Progress Profile

Tracks individual fitness metrics, exercise mastery, and preferences.

```typescript
UserProgressProfile {
  - estimatedAbilities (strength, cardio, flexibility by area)
  - progressionRate (improving, plateau, declining)
  - exerciseMastery (per-exercise performance history)
  - consistency (streak, frequency)
  - recoveryStatus (fatigue levels by muscle group)
}
```

### 2. Couple Progress Profile

Tracks the relationship between partners' fitness levels and shared progress.

```typescript
CoupleProgressProfile {
  - fitnessGapHistory (how gap changes over time)
  - gapTrend (widening, stable, closing)
  - sharedMilestones
  - pairingHistory (what strategies worked)
  - partnerExerciseComfort (contact level progression)
  - competitionPreference (learned over time)
}
```

### 3. Workout Log

Raw data from each completed workout.

```typescript
WorkoutLog {
  - exerciseLogs (per-exercise: reps, RIR, form quality, feedback)
  - physiological data (HR, calories if available)
  - subjective feedback (RPE, enjoyment, connection)
}
```

---

## Pairing Strategies

### Category A: Same Exercise Variations
- **Identical** - Both do exact same exercise
- **Different Reps** - Same exercise, different rep counts
- **Different Tempo** - Same exercise, different speeds
- **Different Load** - Same exercise, different weights

### Category B: Progression Chain Pairing
- **Adjacent Variations** - One step apart (knee push-up + standard)
- **Distant Variations** - Multiple steps apart (wall push-up + decline)

### Category C: Same Target, Different Exercise
- **Same Muscle** - Both target same muscle group
- **Same Pattern** - Both use same movement pattern
- **Same Position** - Both in same body position

### Category D: Complementary Pairing
- **Agonist/Antagonist** - Opposite muscle groups
- **Upper/Lower Split** - Different body regions

### Category E: Partner-Specific Pairing
- **Cooperative** - Must work together
- **Assisted** - One helps the other
- **Mirror** - Same exercise, facing each other
- **Competitive** - Race or compare performance
- **Alternating** - Take turns

### Category F: Physiological Matching
- **HR Zone Match** - Both reach same relative heart rate zone
- **RPE/RIR Match** - Both finish at same perceived effort
- **Calorie Match** - Equal energy expenditure
- **Time Under Tension Match** - Same total muscle work time

---

## Progression Rules

### When to Progress (make harder)
1. RIR consistently > 3 (exercise feels too easy)
2. Form quality is "good" or "perfect"
3. No pain reported in last 3 sessions
4. At least 2 consecutive successful sessions
5. User explicitly marks as "too easy"

### When to Regress (make easier)
1. Cannot complete prescribed reps (2+ times)
2. RIR consistently 0 (going to failure)
3. Form quality is "poor" (2+ times)
4. Pain reported (immediate regression)
5. User explicitly marks as "too hard"

### Progression Methods
1. Move to harder variation in progression chain
2. Add reps (2-5 more per set)
3. Add weight (2.5-5 lbs)
4. Add sets
5. Reduce rest time
6. Slow down tempo (more TUT)
7. Increase range of motion

---

## Periodization

### Phases (4-6 week cycles)

| Phase | Focus | Intensity | Volume | Progression |
|-------|-------|-----------|--------|-------------|
| **Adaptation** | Learn movements, build consistency | 50-70% | Low | Slow |
| **Building** | Progressive overload | 70-85% | Medium | Normal |
| **Peak** | Challenge, test limits | 85-95% | Medium-High | Fast |
| **Deload** | Recovery, maintain | 40-60% | Low | None |

### Auto-Deload Triggers
- 6 weeks without deload
- 3 weeks of plateau
- Overtraining signals (declining performance, high RPE, poor sleep)
- User requested

---

## Feedback Loops

### Explicit Feedback (User Input)
- Post-workout difficulty rating (1-5)
- Enjoyment rating (1-5)
- Partner connection rating (1-5)
- Per-exercise: too easy / just right / too hard
- Pain/injury reports

### Implicit Feedback (Observed)
- Workout completion rate
- Exercises skipped
- Performance vs prescription (exceeded or underperformed)
- Rest time taken (longer = harder workout)
- Historical patterns

---

## Pairing Algorithm

### Step 1: Apply Hard Constraints
Filter out exercises that violate:
- Injury contraindications (for either partner)
- Equipment availability
- Space requirements
- Contact comfort level
- Ability threshold

### Step 2: Generate Candidate Pairs
For each target muscle group/movement:
- Generate progression chain pairs
- Generate partner exercise pairs (if comfort allows)
- Generate physiologically matched pairs

### Step 3: Score Candidates

```
Score =
  (SafetyScore × 1000) +        // Must pass
  (AbilityMatchScore × 100) +   // Both can do it
  (HRZoneMatchScore × 50) +     // Same relative intensity
  (RIRMatchScore × 40) +        // Same perceived effort
  (TimeSyncScore × 30) +        // Finish together
  (GoalAlignmentScore × 25) +   // Supports their goals
  (EnjoymentScore × 20) +       // They like these exercises
  (VarietyScore × 15) +         // Not repetitive
  (ConnectionScore × 10)        // Partner interaction opportunity
```

### Step 4: Select Optimal Pairs
Pick highest-scoring pairs that:
- Cover required muscle groups
- Fit within session duration
- Maintain variety
- Balance partner vs independent exercises

---

## Special Scenarios

| Scenario | Pairing Approach |
|----------|------------------|
| **Extreme Fitness Gap** | Different exercises, HR zone matching, assisted exercises |
| **Both Beginners** | Same easy exercises, form focus, lower intensity |
| **Both Advanced** | Same hard exercises, competitive options |
| **One Injured** | Modified exercises, complementary muscles |
| **Time Crunch** | Supersets, alternating stations, HIIT |
| **Recovery Day** | Low intensity, mobility, partner stretching |
| **First Workout Together** | Simple exercises, low contact, cooperative |

---

## File Structure

```
data/
  exercises/
    exercise-catalog.ts      # Exercise definitions
    training-knowledge.ts    # Educational content

services/
  pairing/
    types.ts                 # All type definitions
    workout-logger.ts        # Log workout data
    progress-tracker.ts      # Track user progress
    couple-tracker.ts        # Track couple progress
    progression-rules.ts     # When to progress/regress
    pairing-engine.ts        # Main pairing algorithm
    periodization.ts         # Long-term planning
    feedback-processor.ts    # Process feedback
    index.ts                 # Public API
```

---

## Usage Example

```typescript
import { PairingEngine } from '@/services/pairing';

// Generate workout for couple
const workout = await PairingEngine.generateWorkout({
  personA: userAProfile,
  personB: userBProfile,
  coupleProfile: coupleProfile,
  sessionContext: {
    duration: 30,
    equipment: ['dumbbells_medium', 'yoga_mat'],
    space: 'medium',
    workoutType: 'strength',
    focus: ['chest', 'back'],
  },
});

// After workout, log results
await PairingEngine.logWorkout(workoutLog);

// System automatically updates profiles and adjusts future pairings
```

---

## Metrics & Success Indicators

### User-Level
- Progression rate (exercises getting harder over time)
- Consistency (workout frequency)
- Completion rate
- Enjoyment scores

### Couple-Level
- Fitness gap trend (ideally closing or stable)
- Connection ratings
- Shared milestone achievements
- Partner exercise adoption

### System-Level
- Pairing satisfaction scores
- Skip/modification rates
- Injury reports (should be near zero)
