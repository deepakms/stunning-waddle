# Task Breakdown - Couples Workout App MVP

## Overview

This document breaks down each MVP feature into granular, actionable tasks, functional requirements, and test cases.

**Legend:**
- 🔵 Backend task
- 🟢 Frontend task
- 🟡 Full-stack task
- 🟣 Content/Data task
- ⚪ DevOps/Config task
- ✅ Automated Test (code-testable)
- 👤 User Test (manual testing required)

---

## Feature 1: Project Setup & Configuration

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR1.1 | App must launch without errors on iOS and Android |
| FR1.2 | Environment variables must be loaded correctly |
| FR1.3 | Supabase connection must be established on app start |
| FR1.4 | Navigation must route to correct screens based on URL |
| FR1.5 | TypeScript compilation must pass with no errors |

### Tasks

#### 1.1 Expo Project Setup
- [ ] ⚪ Initialize Expo project with TypeScript template
- [ ] ⚪ Configure `app.json` with app name, scheme, and bundle ID
- [ ] ⚪ Set up folder structure (app/, components/, hooks/, lib/, types/, utils/)
- [ ] ⚪ Install core dependencies (expo-router, react-native-svg, zustand)
- [ ] ⚪ Configure TypeScript (`tsconfig.json`)
- [ ] ⚪ Set up ESLint and Prettier
- [ ] ⚪ Create `.env.local` template with required variables

#### 1.2 Supabase Setup
- [ ] ⚪ Create Supabase project
- [ ] ⚪ Configure auth settings (email/password, magic link)
- [ ] ⚪ Set up Supabase client in `lib/supabase.ts`
- [ ] ⚪ Install @supabase/supabase-js
- [ ] ⚪ Configure environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] ⚪ Test connection from app to Supabase

#### 1.3 Navigation Setup
- [ ] 🟢 Set up Expo Router with file-based routing
- [ ] 🟢 Create root layout (`app/_layout.tsx`)
- [ ] 🟢 Create auth group layout (`app/(auth)/_layout.tsx`)
- [ ] 🟢 Create main group layout with tabs (`app/(main)/_layout.tsx`)
- [ ] 🟢 Create onboarding group layout (`app/(onboarding)/_layout.tsx`)
- [ ] 🟢 Implement auth state redirect logic

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC1.1 | Run `npm run build` | Build completes without errors |
| TC1.2 | Run `npm test` | All tests pass |
| TC1.3 | Import supabase client | Client is defined and has auth property |
| TC1.4 | Validate environment variables | All required env vars present |
| TC1.5 | Test path aliases (@/) | Imports resolve correctly |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT1.1 | App launches on iOS | Open app on iOS device/simulator | App loads without crash |
| UT1.2 | App launches on Android | Open app on Android device/emulator | App loads without crash |
| UT1.3 | Deep link handling | Tap a couplesworkout:// link | App opens to correct screen |
| UT1.4 | Cold start performance | Kill app, reopen | App loads in < 3 seconds |

---

## Feature 2: Authentication

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR2.1 | Users must be able to create account with email/password |
| FR2.2 | Users must be able to sign in with existing credentials |
| FR2.3 | Users must be able to reset forgotten password via email |
| FR2.4 | Invalid credentials must show clear error message |
| FR2.5 | Session must persist across app restarts |
| FR2.6 | Users must be able to sign out |
| FR2.7 | Profile must be created automatically on signup |
| FR2.8 | Email validation must prevent invalid formats |
| FR2.9 | Password must be minimum 8 characters |
| FR2.10 | Authenticated users must not see login screen |

### Tasks

#### 2.1 Database Schema
- [ ] 🔵 Create `profiles` table migration
- [ ] 🔵 Create `couples` table migration
- [ ] 🔵 Set up RLS policy: users can read own profile
- [ ] 🔵 Set up RLS policy: users can update own profile
- [ ] 🔵 Set up RLS policy: users can read partner's profile
- [ ] 🔵 Create trigger: auto-create profile on user signup
- [ ] 🔵 Create indexes on profiles(user_id) and profiles(couple_id)

#### 2.2 Sign Up Flow
- [ ] 🟢 Create Sign Up screen UI (`app/(auth)/signup.tsx`)
- [ ] 🟢 Build email input with validation
- [ ] 🟢 Build password input with show/hide toggle
- [ ] 🟢 Build display name input
- [ ] 🟢 Add "Already have an account?" link
- [ ] 🟡 Implement signUp function with Supabase Auth
- [ ] 🟡 Handle signup errors (email exists, weak password)
- [ ] 🟡 Create profile record after successful signup
- [ ] 🟡 Navigate to onboarding after signup

#### 2.3 Login Flow
- [ ] 🟢 Create Login screen UI (`app/(auth)/login.tsx`)
- [ ] 🟢 Build email/password form
- [ ] 🟢 Add "Forgot password?" link
- [ ] 🟢 Add "Create account" link
- [ ] 🟡 Implement signIn function with Supabase Auth
- [ ] 🟡 Handle login errors (invalid credentials)
- [ ] 🟡 Navigate to dashboard or onboarding based on profile state

#### 2.4 Forgot Password
- [ ] 🟢 Create Forgot Password screen UI
- [ ] 🟢 Build email input form
- [ ] 🟡 Implement password reset email function
- [ ] 🟢 Create success confirmation screen

#### 2.5 Auth State Management
- [ ] 🟡 Create `useAuth` hook
- [ ] 🟡 Implement session persistence
- [ ] 🟡 Handle token refresh
- [ ] 🟡 Implement logout function
- [ ] 🟢 Create AuthProvider context
- [ ] 🟢 Implement protected route wrapper

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC2.1 | signUp with valid email/password | Returns user object, no error |
| TC2.2 | signUp with existing email | Returns error "email already registered" |
| TC2.3 | signUp with weak password (<8 chars) | Returns error "password too short" |
| TC2.4 | signIn with valid credentials | Returns session, user object |
| TC2.5 | signIn with invalid credentials | Returns error "invalid credentials" |
| TC2.6 | signOut clears session | session is null after signOut |
| TC2.7 | isValidEmail rejects invalid formats | Returns false for "notanemail" |
| TC2.8 | isValidEmail accepts valid formats | Returns true for "test@example.com" |
| TC2.9 | isValidPassword rejects short passwords | Returns false for "1234567" |
| TC2.10 | isValidPassword accepts valid passwords | Returns true for "12345678" |
| TC2.11 | useAuth provides user when authenticated | user object is available |
| TC2.12 | useAuth provides null when not authenticated | user is null |
| TC2.13 | getAuthErrorMessage returns friendly message | Maps error codes to readable strings |
| TC2.14 | Profile service creates profile | Returns created profile with id |
| TC2.15 | Profile service fetches by user_id | Returns profile for given user |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT2.1 | Sign up happy path | 1. Open app 2. Tap "Sign Up" 3. Enter name, email, password 4. Tap "Create Account" | Account created, redirected to onboarding |
| UT2.2 | Sign up with existing email | Enter email that already exists | Error message shown, stays on signup |
| UT2.3 | Login happy path | 1. Enter valid email/password 2. Tap "Sign In" | Logged in, redirected to home |
| UT2.4 | Login with wrong password | Enter wrong password | Error "Invalid credentials" shown |
| UT2.5 | Password visibility toggle | Tap eye icon in password field | Password text toggles visible/hidden |
| UT2.6 | Forgot password flow | 1. Tap "Forgot password" 2. Enter email 3. Submit | Success message, email received |
| UT2.7 | Session persistence | 1. Login 2. Kill app 3. Reopen | Still logged in, see home screen |
| UT2.8 | Sign out | 1. Go to settings 2. Tap "Sign Out" | Logged out, see login screen |
| UT2.9 | Keyboard dismisses | Tap outside input fields | Keyboard closes |
| UT2.10 | Form validation on empty fields | Tap submit with empty fields | Field-level error messages shown |

---

## Feature 3: Partner Invite Flow

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR3.1 | User must be able to generate invite code |
| FR3.2 | Invite code must be 8 characters, no ambiguous chars (0/O, 1/l) |
| FR3.3 | Invite code must expire after 7 days |
| FR3.4 | User must be able to share invite via system share sheet |
| FR3.5 | User must be able to copy invite link to clipboard |
| FR3.6 | Partner must be able to join via deep link |
| FR3.7 | Partner must be able to enter code manually |
| FR3.8 | User cannot join own couple |
| FR3.9 | User already in a couple cannot join another |
| FR3.10 | Expired codes must show clear error |
| FR3.11 | Both partners see confirmation when connected |

### Tasks

#### 3.1 Couple Creation
- [ ] 🔵 Create Edge Function: `create-couple`
- [ ] 🔵 Implement invite code generation (8 chars, no ambiguous chars)
- [ ] 🔵 Set invite expiration (7 days)
- [ ] 🔵 Link creator's profile to new couple
- [ ] 🔵 Return invite code and shareable URL

#### 3.2 Invite UI
- [ ] 🟢 Create "Invite Partner" screen
- [ ] 🟢 Display invite code prominently
- [ ] 🟢 Build "Copy Link" button
- [ ] 🟢 Build "Share" button (native share sheet)
- [ ] 🟢 Show invite expiration countdown
- [ ] 🟢 Add "Regenerate Code" option
- [ ] 🟢 Create "Waiting for Partner" state UI

#### 3.3 Deep Link Handling
- [ ] ⚪ Configure URL scheme in `app.json`
- [ ] 🟢 Set up Expo Linking listener
- [ ] 🟢 Parse invite code from deep link URL
- [ ] 🟢 Handle app opened from link (cold start)
- [ ] 🟢 Handle link while app is open (warm start)
- [ ] 🟢 Navigate to signup/login with invite code pre-filled

#### 3.4 Join Couple Flow
- [ ] 🔵 Create Edge Function: `join-couple`
- [ ] 🔵 Validate invite code exists and not expired
- [ ] 🔵 Check user doesn't already have a couple
- [ ] 🔵 Link joining user's profile to couple
- [ ] 🔵 Update couple status to 'active'
- [ ] 🔵 Set couple's `activated_at` timestamp
- [ ] 🟢 Create "Join Couple" confirmation screen
- [ ] 🟢 Show partner's name before confirming
- [ ] 🟡 Send push notification to original partner

#### 3.5 Edge Cases
- [ ] 🟢 Handle expired invite code UI
- [ ] 🟢 Handle already-used invite code UI
- [ ] 🟢 Handle user already in couple UI
- [ ] 🔵 Create Edge Function: `regenerate-invite`
- [ ] 🔵 Create Edge Function: `uncouple` (leave couple)

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC3.1 | Generate invite code | Returns 8-char code with no ambiguous chars |
| TC3.2 | isValidInviteCode validates format | Returns true for valid, false for invalid |
| TC3.3 | generateInviteCode excludes 0,O,1,l | Generated codes never contain these |
| TC3.4 | Join with valid code | Links profiles to couple |
| TC3.5 | Join with expired code | Returns error "invite expired" |
| TC3.6 | Join with non-existent code | Returns error "invalid code" |
| TC3.7 | Join when already in couple | Returns error "already in couple" |
| TC3.8 | Parse deep link URL | Extracts invite code correctly |
| TC3.9 | Couple status updates to 'active' | Status field equals 'active' after join |
| TC3.10 | formatExpirationTime shows days/hours | Returns "5 days" or "3 hours" etc |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT3.1 | Generate and view invite | 1. Go to invite screen 2. Tap "Generate Code" | See invite code displayed |
| UT3.2 | Copy invite link | Tap "Copy Link" | Toast shows "Copied", can paste elsewhere |
| UT3.3 | Share invite | Tap "Share" | System share sheet opens with link |
| UT3.4 | Partner joins via link | 1. User A shares link 2. User B taps link | User B sees join confirmation |
| UT3.5 | Partner joins manually | 1. User B opens app 2. Taps "Enter Code" 3. Types code | User B sees join confirmation |
| UT3.6 | Join confirmation shows name | User B opens join screen | Shows "Join [Partner Name]?" |
| UT3.7 | Both see connected state | After successful join | Both users see "Connected" status |
| UT3.8 | Expired code error | Enter expired code | Clear error "Code has expired" |
| UT3.9 | Already in couple error | Try to join when in couple | Clear error "Already in a couple" |
| UT3.10 | Regenerate code | Tap "Regenerate" | New code appears, old code invalid |
| UT3.11 | Expiration countdown | View invite code | See countdown updating |

---

## Feature 4: Onboarding Questionnaire

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR4.1 | User must complete onboarding before using main app features |
| FR4.2 | Progress must be saved if user closes app mid-onboarding |
| FR4.3 | User must be able to go back to previous steps |
| FR4.4 | All required fields must be validated before proceeding |
| FR4.5 | Fitness level (1-5) must be calculated from answers |
| FR4.6 | User can select "None" for injuries/equipment |
| FR4.7 | Onboarding completion timestamp must be recorded |
| FR4.8 | Unit preferences (metric/imperial) must persist |

### Tasks

#### 4.1 Onboarding Flow Setup
- [ ] 🟢 Create onboarding progress indicator component
- [ ] 🟢 Create onboarding layout with back/next navigation
- [ ] 🟡 Create onboarding state management (zustand store)
- [ ] 🟡 Implement save progress on each step

#### 4.2 Basics Screen
- [ ] 🟢 Create Basics screen UI (`app/(onboarding)/basics.tsx`)
- [ ] 🟢 Build age/birth year picker
- [ ] 🟢 Build height input (cm or ft/in toggle)
- [ ] 🟢 Build weight input (kg or lbs toggle)
- [ ] 🟢 Build biological sex selector
- [ ] 🟢 Add unit preference toggle (metric/imperial)

#### 4.3 Fitness Level Screen
- [ ] 🟢 Create Fitness Level screen UI
- [ ] 🟢 Build activity level selector (sedentary to very active)
- [ ] 🟢 Build "Can you do 10 pushups?" yes/no toggle
- [ ] 🟢 Build "Can you hold plank 30s?" yes/no toggle
- [ ] 🟢 Build "Can you do full squat?" yes/no toggle
- [ ] 🟢 Build cardio capacity selector

#### 4.4 Injuries Screen
- [ ] 🟢 Create Injuries screen UI
- [ ] 🟢 Build injury checkbox list (knee, shoulder, back, etc.)
- [ ] 🟢 Build chronic conditions checkbox list
- [ ] 🟢 Build "movements to avoid" free text input
- [ ] 🟢 Add "None" quick select option

#### 4.5 Goals Screen
- [ ] 🟢 Create Goals screen UI
- [ ] 🟢 Build primary goal selector (lose weight, build muscle, etc.)
- [ ] 🟢 Build secondary goal selector
- [ ] 🟢 Add goal descriptions/icons

#### 4.6 Equipment & Space Screen
- [ ] 🟢 Create Equipment screen UI
- [ ] 🟢 Build location selector (home, gym, outdoor, mix)
- [ ] 🟢 Build equipment checklist with icons
- [ ] 🟢 Build space availability selector
- [ ] 🟢 Add "No equipment" quick select

#### 4.7 Preferences Screen
- [ ] 🟢 Create Preferences screen UI
- [ ] 🟢 Build workout length selector (15/20/30/45 min)
- [ ] 🟢 Build enjoyable activities multi-select
- [ ] 🟢 Build disliked activities multi-select
- [ ] 🟢 Build music preference selector

#### 4.8 Couple Preferences Screen
- [ ] 🟢 Create Couple Preferences screen UI (shown once per couple)
- [ ] 🟢 Build "worked out together before" selector
- [ ] 🟢 Build contact comfort level selector
- [ ] 🟢 Build dynamic preference selector (competitive/collaborative/mix)
- [ ] 🟢 Build "days per week together" selector

#### 4.9 Onboarding Completion
- [ ] 🟡 Save all onboarding data to profile
- [ ] 🟡 Calculate initial fitness level (1-5) from answers
- [ ] 🟡 Set `onboarding_completed_at` timestamp
- [ ] 🟢 Create completion celebration screen
- [ ] 🟢 Navigate to dashboard or invite partner screen

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC4.1 | calculateFitnessLevel with beginner answers | Returns 1 or 2 |
| TC4.2 | calculateFitnessLevel with advanced answers | Returns 4 or 5 |
| TC4.3 | convertHeightToMetric(5, 10) | Returns approximately 178 cm |
| TC4.4 | convertWeightToMetric(150) | Returns approximately 68 kg |
| TC4.5 | validateBasicsForm with missing fields | Returns validation errors |
| TC4.6 | validateBasicsForm with valid data | Returns no errors |
| TC4.7 | onboarding store persists data | Data survives app reload |
| TC4.8 | completeOnboarding sets timestamp | onboarding_completed_at is set |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT4.1 | Complete full onboarding | Fill all screens, tap "Complete" | Reach home screen |
| UT4.2 | Navigate back | Tap back button on step 3 | Return to step 2, data preserved |
| UT4.3 | Progress indicator | Navigate through steps | Progress bar updates correctly |
| UT4.4 | Resume after close | 1. Start onboarding 2. Kill app 3. Reopen | Resume from last step |
| UT4.5 | Metric/Imperial toggle | Toggle units | Values convert correctly |
| UT4.6 | Select "None" for injuries | Tap "None" | All checkboxes unchecked |
| UT4.7 | Multi-select equipment | Tap multiple items | All selected items highlighted |
| UT4.8 | Required field validation | Try to proceed with empty field | Error message shown |
| UT4.9 | Celebration screen | Complete onboarding | See celebration animation |
| UT4.10 | Couple preferences | Complete with partner connected | Show couple preferences step |

---

## Feature 5: Exercise Library

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR5.1 | Each exercise must have name, instructions, muscle group, difficulty |
| FR5.2 | Each exercise must have a demo video URL |
| FR5.3 | Exercises must be searchable by muscle group |
| FR5.4 | Exercises must be filterable by difficulty (1-5) |
| FR5.5 | Exercise pairs must match muscle group |
| FR5.6 | Partners in a pair can have different difficulties |
| FR5.7 | At least 60 exercises across all muscle groups |
| FR5.8 | At least 40 exercise pairs |

### Tasks

#### 5.1 Database Schema
- [ ] 🔵 Create `exercises` table migration
- [ ] 🔵 Create `exercise_pairs` table migration
- [ ] 🔵 Set up RLS: anyone can read exercises
- [ ] 🔵 Create indexes on exercises(muscle_group, difficulty)
- [ ] 🔵 Create index on exercise_pairs(muscle_group)

#### 5.2-5.10 Exercise Data
*(Tasks unchanged - see original)*

#### 5.11 Seed Script
- [ ] 🔵 Create exercise seed script (`supabase/seed/exercises.ts`)
- [ ] 🔵 Create exercise pairs seed script
- [ ] 🔵 Add video URLs (YouTube unlisted) for each exercise
- [ ] 🔵 Run seed script and verify data

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC5.1 | Query exercises by muscle_group | Returns only matching exercises |
| TC5.2 | Query exercises by difficulty | Returns exercises with difficulty ≤ specified |
| TC5.3 | Each exercise has required fields | All fields non-null |
| TC5.4 | Exercise pairs have valid exercise IDs | Both IDs exist in exercises table |
| TC5.5 | Count exercises ≥ 60 | At least 60 records |
| TC5.6 | Count pairs ≥ 40 | At least 40 records |
| TC5.7 | Video URLs are valid format | All URLs match YouTube pattern |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT5.1 | View exercise demo | Tap "View Demo" on exercise | Video plays correctly |
| UT5.2 | Exercise has instructions | View any exercise | Instructions text visible |
| UT5.3 | Difficulty badge shown | View exercise | Difficulty level displayed |

---

## Feature 6: Asymmetric Workout Engine

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR6.1 | Generated workout must respect both partners' fitness levels |
| FR6.2 | Generated workout must respect equipment intersection |
| FR6.3 | Generated workout must exclude disliked activities |
| FR6.4 | Generated workout must respect contact level preference |
| FR6.5 | Workout duration must match requested (15/20/30/45 min) |
| FR6.6 | No consecutive blocks of same muscle group |
| FR6.7 | Workout must include warmup and cooldown |
| FR6.8 | Exercise difficulty must be within ±1 of user level |
| FR6.9 | Must have fallback if no perfect pair found |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC6.1 | Generate 30-min workout | Returns workout with ~30 min duration |
| TC6.2 | Generate for beginner couple | All exercises difficulty ≤ 3 |
| TC6.3 | Generate for advanced couple | All exercises difficulty ≥ 3 |
| TC6.4 | Generate for mismatched couple | Partner A gets easier, Partner B harder |
| TC6.5 | Equipment filtering | Only exercises with available equipment |
| TC6.6 | No consecutive same muscle group | Adjacent blocks have different muscle groups |
| TC6.7 | Includes warmup | First block type is "warmup" |
| TC6.8 | Includes cooldown | Last block type is "cooldown" |
| TC6.9 | Excludes disliked activities | No burpees if burpees in disliked |
| TC6.10 | Contact level filtering | No partner exercises if contact = "none" |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT6.1 | Generate workout | Tap "New Workout", select 30 min | See workout preview |
| UT6.2 | Preview shows partner exercises | View workout preview | See both partner's exercises |
| UT6.3 | Workout feels appropriate | Complete generated workout | Difficulty feels right for level |
| UT6.4 | Variety in workouts | Generate 5 workouts | No identical workouts |

---

## Feature 7: Real-Time Session Sync

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR7.1 | Both partners must see same current block |
| FR7.2 | Timer must be synchronized within 1 second |
| FR7.3 | Pause state must sync immediately |
| FR7.4 | Connection status must be displayed |
| FR7.5 | Reconnection must happen automatically |
| FR7.6 | Session can continue if partner disconnects briefly |
| FR7.7 | Session state must persist through brief disconnection |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC7.1 | Create session | Returns session ID, initial state |
| TC7.2 | Subscribe to session changes | Callback fires on state change |
| TC7.3 | Broadcast timer tick | Partner receives tick |
| TC7.4 | Sync block change | Both clients see same block |
| TC7.5 | Sync pause state | Both clients see paused |
| TC7.6 | Handle disconnect/reconnect | State consistent after reconnect |
| TC7.7 | Last-write-wins conflict | Latest timestamp wins |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT7.1 | Start workout together | Both partners tap "Ready" | Both see workout begin |
| UT7.2 | Timer synced | Watch timers on both devices | Timers within 1 second |
| UT7.3 | Partner pauses | One partner taps pause | Both see "Paused by [name]" |
| UT7.4 | Connection indicator | View during workout | Green dot when connected |
| UT7.5 | Brief disconnection | Turn off WiFi for 5s | Reconnects, continues workout |
| UT7.6 | Block transition sync | Wait for block to end | Both transition simultaneously |
| UT7.7 | Resume after pause | Tap resume | Both continue together |

---

## Feature 8: Workout UI & Flow

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR8.1 | User must see their exercise clearly (large card) |
| FR8.2 | User must see partner's exercise (smaller card) |
| FR8.3 | Timer must show time remaining |
| FR8.4 | Timer must change color when <10 seconds |
| FR8.5 | Progress bar must show current position in workout |
| FR8.6 | User must be able to pause workout |
| FR8.7 | User must be able to view exercise demo during workout |
| FR8.8 | Rest blocks must show next exercise preview |
| FR8.9 | Completion screen must show XP earned |
| FR8.10 | Haptic feedback on block transition |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC8.1 | CircularTimer renders | Component mounts without error |
| TC8.2 | Timer formats MM:SS | formatTime(125) returns "2:05" |
| TC8.3 | Progress calculation | (3/10 blocks) shows 30% |
| TC8.4 | Block transition logic | Fires after timer completes |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT8.1 | See my exercise | Start workout | Large card shows my exercise |
| UT8.2 | See partner exercise | Start workout | Smaller card shows partner's |
| UT8.3 | Timer counts down | Watch timer | Decrements each second |
| UT8.4 | Timer turns red | Wait until <10s | Timer color changes |
| UT8.5 | Tap exercise for demo | Tap exercise card | Video plays |
| UT8.6 | Pause workout | Tap pause button | Workout pauses, overlay shown |
| UT8.7 | Resume workout | Tap resume | Workout continues |
| UT8.8 | End workout early | Tap "End Workout" | Confirmation, partial completion |
| UT8.9 | Rest shows next | During rest block | See "Next: [exercise]" |
| UT8.10 | Skip rest | Tap "Skip Rest" | Immediately go to next block |
| UT8.11 | Feel haptic | Block transitions | Phone vibrates briefly |
| UT8.12 | Complete workout | Finish all blocks | See celebration + XP |
| UT8.13 | Progress bar updates | Progress through blocks | Bar fills progressively |

---

## Feature 9: Couple Dashboard

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR9.1 | Dashboard must show both partner names |
| FR9.2 | Dashboard must show current streak |
| FR9.3 | Dashboard must show total XP |
| FR9.4 | Dashboard must show recent workouts |
| FR9.5 | User must be able to start new workout from dashboard |
| FR9.6 | Pull-to-refresh must update all data |
| FR9.7 | No-couple state must show invite option |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC9.1 | useCouple returns couple data | couple object with both profiles |
| TC9.2 | useCouple returns null if no couple | Returns null, loading false |
| TC9.3 | useRecentSessions returns last 5 | Array with ≤5 sessions |
| TC9.4 | formatStreakDisplay(7) | Returns "7 🔥" |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT9.1 | See partner name | Open dashboard | Shows both names |
| UT9.2 | See streak | Have active streak | Shows streak count with fire |
| UT9.3 | See XP | View dashboard | Shows total XP |
| UT9.4 | Start workout | Tap "New Workout" | Opens workout config |
| UT9.5 | Pull to refresh | Pull down on dashboard | Data refreshes |
| UT9.6 | See recent workouts | Have past workouts | Shows workout cards |
| UT9.7 | No couple state | Not in couple | Shows "Invite Partner" |
| UT9.8 | Tap recent workout | Tap workout card | Opens workout detail |

---

## Feature 10: Streaks System

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR10.1 | Streak increments on consecutive daily workouts |
| FR10.2 | Streak resets to 0 if gap > 1 day |
| FR10.3 | Longest streak record must be maintained |
| FR10.4 | Streak multiplier: 1.5x at 7+ days, 2x at 30+ days |
| FR10.5 | "Streak at risk" warning if no workout today |
| FR10.6 | Daily reminder notification |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC10.1 | Increment streak consecutive day | streak = previous + 1 |
| TC10.2 | Reset streak after gap | streak = 1 |
| TC10.3 | Update longest_streak if beaten | longest_streak = max(current, longest) |
| TC10.4 | getStreakMultiplier(5) | Returns 1.0 |
| TC10.5 | getStreakMultiplier(10) | Returns 1.5 |
| TC10.6 | getStreakMultiplier(35) | Returns 2.0 |
| TC10.7 | isStreakAtRisk() | True if no workout today |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT10.1 | Build streak | Workout 3 consecutive days | Streak shows 3 |
| UT10.2 | Streak with fire | Have 3+ day streak | Fire emoji visible |
| UT10.3 | Break streak | Miss 2 days, then workout | Streak shows 1 |
| UT10.4 | Streak at risk | No workout today, evening | Warning badge visible |
| UT10.5 | Streak multiplier visible | Have 7+ day streak | Shows "1.5x" badge |
| UT10.6 | Streak reminder | Wait for scheduled time | Push notification received |

---

## Feature 11: XP System

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR11.1 | XP earned = 10 XP per minute of workout |
| FR11.2 | Solo workout penalty = 0.25x XP |
| FR11.3 | Streak multiplier applied to XP |
| FR11.4 | XP transaction recorded with reason |
| FR11.5 | Couple total XP updated after each workout |
| FR11.6 | XP animation shown after workout |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC11.1 | calculateXP(30, false, 1) | Returns 300 (30*10) |
| TC11.2 | calculateXP(30, true, 1) | Returns 75 (30*10*0.25) |
| TC11.3 | calculateXP(30, false, 2) | Returns 600 (30*10*2) |
| TC11.4 | XP transaction created | Record in xp_transactions |
| TC11.5 | Couple total_xp updated | total_xp increases by amount |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT11.1 | See XP after workout | Complete 30 min workout | Shows "300 XP earned" |
| UT11.2 | XP animation | Complete workout | XP number animates |
| UT11.3 | Streak multiplier applied | Complete with 7-day streak | Shows 1.5x bonus |
| UT11.4 | View XP history | Go to XP history | See transaction list |
| UT11.5 | Total XP updates | Check dashboard after workout | Total increased |

---

## Feature 12: Bet System

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR12.1 | User can create bet with metrics: reps, sessions, minutes, streak |
| FR12.2 | User can set bet duration: 3 days, 1 week, 2 weeks, 1 month |
| FR12.3 | User can set stakes (text) |
| FR12.4 | Partner receives notification to accept/decline |
| FR12.5 | Both partners can see progress |
| FR12.6 | Winner determined automatically at end |
| FR12.7 | Both notified of result |
| FR12.8 | Can only have 1 active bet at a time |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC12.1 | Create bet | Bet record created with status 'pending' |
| TC12.2 | Accept bet | Status changes to 'active' |
| TC12.3 | Decline bet | Status changes to 'cancelled' |
| TC12.4 | Track reps metric | Score updated from workout |
| TC12.5 | Track sessions metric | Score incremented on completion |
| TC12.6 | Track minutes metric | Score updated with duration |
| TC12.7 | Resolve bet - determine winner | winner_id set to higher score |
| TC12.8 | Resolve tie | Status = 'tie', no winner_id |
| TC12.9 | Cannot create if active exists | Error returned |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT12.1 | Create bet | Fill form, submit | Partner gets notification |
| UT12.2 | Accept bet | Tap accept in notification | Bet becomes active |
| UT12.3 | Decline bet | Tap decline | Bet cancelled, creator notified |
| UT12.4 | View active bet | Go to bets | See current scores and time left |
| UT12.5 | Progress updates | Complete workout | Score increases |
| UT12.6 | Win bet | Beat partner's score | Winner notification |
| UT12.7 | Lose bet | Partner beats you | Loser notification with stakes |
| UT12.8 | Bet history | View completed bets | See past bets with results |

---

## Feature 13: Workout History

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR13.1 | All completed workouts shown in chronological order |
| FR13.2 | Each entry shows date, name, duration, XP |
| FR13.3 | User can tap to see workout details |
| FR13.4 | Statistics summary (week/month totals) |
| FR13.5 | Infinite scroll with pagination |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC13.1 | Fetch history paginated | Returns page of workouts |
| TC13.2 | Fetch workout detail | Returns full workout data |
| TC13.3 | Calculate weekly stats | Returns correct totals |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT13.1 | View history | Go to history tab | See workout list |
| UT13.2 | Workouts in order | Scroll through | Newest first |
| UT13.3 | Tap for detail | Tap workout card | See exercise breakdown |
| UT13.4 | Scroll for more | Scroll to bottom | More workouts load |
| UT13.5 | See stats | View history | Week/month totals shown |

---

## Feature 14: Settings & Profile

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR14.1 | User can edit display name |
| FR14.2 | User can edit fitness profile (rerun onboarding fields) |
| FR14.3 | User can toggle notifications |
| FR14.4 | User can change unit preferences |
| FR14.5 | User can sign out |
| FR14.6 | User can leave couple |
| FR14.7 | User can delete account |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC14.1 | Update display name | Profile updated |
| TC14.2 | Update fitness level | Profile updated, level recalculated |
| TC14.3 | Update notification prefs | Settings saved |
| TC14.4 | Uncouple | Profile.couple_id set to null |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT14.1 | Edit name | Change name, save | New name appears everywhere |
| UT14.2 | Edit fitness | Change answers, save | Updated fitness level |
| UT14.3 | Toggle notifications | Toggle off | No notifications received |
| UT14.4 | Change units | Switch to imperial | All values converted |
| UT14.5 | Sign out | Tap sign out | Returns to login |
| UT14.6 | Leave couple | Confirm leave | Back to no-couple state |
| UT14.7 | Delete account | Confirm delete | Account removed, logged out |

---

## Feature 15: Push Notifications

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR15.1 | App requests notification permission on first launch |
| FR15.2 | Device token stored in profile |
| FR15.3 | Partner joined notification sent |
| FR15.4 | Bet challenge notification sent |
| FR15.5 | Streak reminder notification sent |
| FR15.6 | Tapping notification opens relevant screen |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC15.1 | Store push token | Token saved to profile |
| TC15.2 | Send notification | FCM API call succeeds |
| TC15.3 | Parse notification data | Deep link extracted |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT15.1 | Permission request | Fresh install, open app | Permission dialog shown |
| UT15.2 | Partner joined notification | Partner joins couple | Notification received |
| UT15.3 | Bet notification | Partner creates bet | Notification received |
| UT15.4 | Streak reminder | Configure reminder time | Daily notification |
| UT15.5 | Tap notification | Tap partner joined | Opens dashboard |
| UT15.6 | Foreground notification | Receive while in app | Banner shown |

---

## Feature 16: Polish & Error Handling

### Functional Requirements
| ID | Requirement |
|----|-------------|
| FR16.1 | Loading states shown for all async operations |
| FR16.2 | Errors shown with user-friendly messages |
| FR16.3 | Network errors handled gracefully |
| FR16.4 | Empty states shown with helpful CTAs |
| FR16.5 | Interrupted workouts can be resumed |
| FR16.6 | App doesn't crash on errors |

### Tasks
*(Tasks unchanged - see original)*

### Test Cases

#### ✅ Automated Tests
| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| TC16.1 | ErrorBoundary catches error | Fallback UI rendered |
| TC16.2 | getErrorMessage maps errors | Returns friendly strings |
| TC16.3 | Workout state persisted | Data in AsyncStorage |
| TC16.4 | Detect interrupted workout | Returns true if incomplete |

#### 👤 User Tests
| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| UT16.1 | Loading spinner | Trigger data fetch | Spinner shown |
| UT16.2 | Skeleton loaders | View list while loading | Skeletons visible |
| UT16.3 | Network error | Turn off internet, try action | Friendly error message |
| UT16.4 | Empty history | New user views history | "No workouts yet" + CTA |
| UT16.5 | Resume workout | Kill app during workout, reopen | "Resume?" prompt |
| UT16.6 | Recover from crash | Force crash, reopen | App works normally |
| UT16.7 | Error toast | Trigger API error | Toast shows error |

---

## Test Coverage Summary

| Feature | Automated Tests | User Tests | Total |
|---------|-----------------|------------|-------|
| 1. Project Setup | 5 | 4 | 9 |
| 2. Authentication | 15 | 10 | 25 |
| 3. Partner Invite | 10 | 11 | 21 |
| 4. Onboarding | 8 | 10 | 18 |
| 5. Exercise Library | 7 | 3 | 10 |
| 6. Workout Engine | 10 | 4 | 14 |
| 7. Real-Time Sync | 7 | 7 | 14 |
| 8. Workout UI | 4 | 13 | 17 |
| 9. Dashboard | 4 | 8 | 12 |
| 10. Streaks | 7 | 6 | 13 |
| 11. XP System | 5 | 5 | 10 |
| 12. Bet System | 9 | 8 | 17 |
| 13. Workout History | 3 | 5 | 8 |
| 14. Settings | 4 | 7 | 11 |
| 15. Push Notifications | 3 | 6 | 9 |
| 16. Polish | 4 | 7 | 11 |
| **Total** | **105** | **114** | **219** |

---

## Week-by-Week Task Assignment

*(Unchanged from original)*

### Week 1: Foundation (Features 1, 2, 3)
### Week 2: Content & Engine (Features 4, 5, 6)
### Week 3: Real-Time Sync (Feature 7)
### Week 4: Workout Flow (Feature 8)
### Week 5: Progression (Features 9, 10, 11)
### Week 6: Gamification (Feature 12)
### Week 7: Polish (Features 14, 15, 16)
### Week 8: Testing & Launch
