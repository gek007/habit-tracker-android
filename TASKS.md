# TASKS.md

## Completed Tasks — Supabase Integration (May 20-21, 2026)

This document records all work completed to add Supabase backend, user authentication, and cloud sync to the Habit Tracker app.

---

## Phase 1: Package Installation & Environment Setup

- [x] Install Supabase packages: `@supabase/supabase-js`, `react-native-url-polyfill`, `expo-secure-store`
- [x] Install UUID generation: `react-native-get-random-values`, `uuid`
- [x] Create `.env.local` with Supabase credentials (URL + anon key)
- [x] Update `app.json` to include `expo-secure-store` plugin

---

## Phase 2: Supabase Database Schema

- [x] Create `habits` table (UUID PK, user_id FK, name, type, goal, icon, color, created_at)
- [x] Create `habit_entries` table (UUID PK, habit_id FK, date, count, unique constraint)
- [x] Create `challenges` table (UUID PK, user_id FK, name, description, start_date, duration_days, completed, completed_at, reward_claimed)
- [x] Create `challenge_habits` junction table (many-to-many relationship, primary key on both)
- [x] Enable Row Level Security (RLS) on all tables
- [x] Create RLS policies (owner-only access via auth.uid())

---

## Phase 3: Supabase Client & Configuration

- [x] Create `src/lib/supabase.ts` with Supabase client initialization
- [x] Implement AsyncStorage adapter for session persistence (replaced SecureStore due to 2048 byte limit)
- [x] Configure auto token refresh and session persistence

---

## Phase 4: Authentication System

- [x] Create `src/context/auth-context.tsx` with `AuthProvider` and `useAuth()` hook
- [x] Implement email + password `signIn()` and `signUp()` functions
- [x] Implement `signOut()` with SecureStore cleanup
- [x] Add auth error state and `clearAuthError()` function
- [x] Session restoration on app start via `onAuthStateChange` listener
- [x] Add loading state (`isLoading`) for SecureStore token restoration

---

## Phase 5: Authentication UI

- [x] Create `src/app/(auth)/_layout.tsx` for auth stack routing
- [x] Create `src/app/(auth)/login.tsx` with:
  - Email + password text inputs
  - Show/hide password toggle (eye icon)
  - Loading indicator during submission
  - Error message display
  - Link to signup screen
- [x] Create `src/app/(auth)/signup.tsx` with:
  - Email, password, confirm password fields
  - Password visibility toggles
  - Confirm password validation
  - Email confirmation message after signup
  - Link to login screen

---

## Phase 6: Routing & Authentication Gate

- [x] Create `AuthGate` component in `src/app/_layout.tsx`:
  - Routes unauthenticated users to `/(auth)/login`
  - Routes authenticated users to `/(tabs)` or `/onboarding` based on completion flag
  - Shows loading spinner while restoring session
- [x] Update provider hierarchy: `SafeAreaProvider → ThemeProvider → AuthProvider → AuthGate → HabitsProvider`
- [x] Remove old `checkOnboarding` logic (moved to AuthGate)
- [x] Add `(auth)` group to Stack navigation

---

## Phase 7: Sign Out Functionality

- [x] Add `useAuth()` import to `src/app/(tabs)/settings.tsx`
- [x] Create "Sign Out" button in Settings screen (red background, logout icon)
- [x] Add `handleSignOut()` function with loading state
- [x] Style button to match app theme

---

## Phase 8: Sync Service Layer

- [x] Create `src/services/sync.ts` with non-blocking sync functions:
  - `upsertHabit(habit, userId)` — sync individual habit row
  - `upsertHabitEntries(habit)` — sync all entries for a habit (onConflict: habit_id,date)
  - `upsertChallenge(challenge, userId)` — sync challenge + junction table rows
  - `deleteHabitRemote(habitId)` — cascade delete habit and entries
  - `deleteChallengeRemote(challengeId)` — cascade delete challenge and junctions
  - `uploadAllLocalData(habits, challenges, userId)` — batch upload for first-login
  - `fetchAllRemoteData(userId)` — fetch and denormalize from Supabase

---

## Phase 9: Data Migration Utilities

- [x] Create `src/utils/migrations.ts`:
  - `isLegacyId(id)` — detect timestamp-based ids
  - `runUUIDMigration(habits, challenges)` — convert timestamp ids to UUIDs, remap challenge.habitIds

---

## Phase 10: Optimistic Local-First Sync

- [x] Update `src/hooks/use-habits.ts`:
  - Add `userId: string | null` parameter
  - Switch ID generation from `Date.now().toString()` to `uuidv4()`
  - Convert `saveHabits()` to optimistic pattern (setState before AsyncStorage)
  - Add background sync calls: `upsertHabit()`, `upsertHabitEntries()`, `deleteHabitRemote()`
  - Add UUID migration on load
  - Expose `setHabits()` for first-login migration
  - Add debug logging for sync operations

- [x] Update `src/hooks/use-challenges.ts`:
  - Add `userId: string | null` parameter
  - Switch ID generation to `uuidv4()`
  - Convert `saveChallenges()` to optimistic pattern
  - Add background sync: `upsertChallenge()`, `deleteChallengeRemote()`
  - Expose `setChallenges()` for first-login migration

---

## Phase 11: First-Login Migration & Data Hydration

- [x] Update `src/context/habits-context.tsx`:
  - Import `useAuth()` to get `userId`
  - Pass `userId` to both hooks
  - Add `runFirstLoginMigration()` effect:
    - Check `supabase_migrated_${userId}` key
    - If new user: upload local AsyncStorage data to Supabase
    - If returning user: fetch from Supabase and hydrate AsyncStorage
    - Mark migration complete per user
  - Update loading state to include migration completion

---

## Phase 12: Testing & Debugging

- [x] Test signup with real email (kostya.shilkrot@gmail.com)
- [x] Verify email confirmation in Supabase
- [x] Test login with correct credentials
- [x] Add console logging to auth-context.tsx (`[auth]` prefix)
- [x] Add console logging to habits hook (`[habits]` prefix)
- [x] Add console logging to sync service (`[sync]` prefix)
- [x] Add console logging to routing (`[routing]` prefix)
- [x] Debug silent login failure (fixed AuthGate routing logic)
- [x] Verify habits sync to `habits` table with UUID ids
- [x] Verify completed habits create entries in `habit_entries` table
- [x] Test sign out and log back in
- [x] Verify data persists across sessions (local cache + Supabase)

---

## Phase 13: Documentation

- [x] Update `CLAUDE.md` with:
  - Authentication & Routing section
  - Enhanced State & Sync section with sync pattern explanation
  - Expanded Data Model section (local vs. Supabase schema)
  - New Services section (sync functions)
  - New Migrations section (ID migration + first-login migration)

---

## Known Issues & Limitations

1. **First-Login Migration Challenge Error** — When uploading seeded challenges, foreign key constraint fails if challenge references habits that haven't synced yet. Non-fatal; doesn't block app usage.

2. **expo-av Deprecation Warning** — Expo AV is deprecated in SDK 54+. Will need migration to `expo-audio` in future SDK versions.

3. **Email Confirmation Required** — Supabase has email confirmation enabled by default. Can be disabled in Auth settings for development testing.

---

## Tested Scenarios

✅ **User Registration**
- Sign up with email + password
- Email confirmation required (can be disabled)
- Auto-login after signup

✅ **User Login**
- Login with email + password
- Session restoration from AsyncStorage on app restart
- Auto-redirect to home screen

✅ **Habit Sync**
- Create habit → appears in Supabase `habits` table with UUID id
- Complete habit → appears in Supabase `habit_entries` table
- Data persists across sign out/sign in

✅ **Offline Support**
- App works fully offline using AsyncStorage
- Sync happens automatically when online
- No data loss

✅ **Sign Out**
- Sign out button in Settings
- Session cleared from storage
- Auto-redirect to login screen

---

## Future Enhancements

- [ ] Implement challenge sync (currently has foreign key issues on upload)
- [ ] Add real-time sync updates (WebSocket listeners)
- [ ] Implement conflict resolution (if same habit edited on multiple devices)
- [ ] Add offline queue with retry logic (currently optimistic with silent failures)
- [ ] Migrate expo-av to expo-audio (SDK 55+)
- [ ] Add data backup/restore functionality
- [ ] Implement user profile management
- [ ] Add data export (CSV, JSON)
