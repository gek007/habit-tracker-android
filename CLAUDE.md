# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Expo APIs change between versions. Always read the exact versioned docs at **https://docs.expo.dev/versions/v54.0.0/** before writing any code that touches Expo packages.

## Commands

```bash
# Start dev server (from project root)
npx expo start

# Start with cleared Metro cache
npx expo start --clear

# Type-check without emitting
npx tsc --noEmit

# Deploy edge functions to Supabase (requires CLI linked to project)
supabase functions deploy generate-coaching
supabase functions deploy generate-summary

# Set OpenAI API key in Supabase (for edge functions)
supabase secrets set OPENAI_API_KEY=sk-proj-...

# Link Supabase CLI to project (one-time setup)
supabase link --project-ref <project-ref>
```

There is no test suite. There is no build script — the app is run via Expo Go on device.

**Windows note:** The Metro file watcher has a known crash on Windows with Expo devtools temp dirs. `metro.config.js` already has a `blockList` fix for this. If Metro crashes on startup, kill any process on port 8081 first.

## Supabase Edge Functions

Edge functions are serverless Deno functions deployed to Supabase. They're used for AI Coaching (calling OpenAI API, querying DB). **Local development** does not require running functions locally — the mobile app calls them on your Supabase project in the cloud.

**Before deploying edge functions:**
1. Ensure Supabase CLI is installed and linked: `supabase status`
2. Set `OPENAI_API_KEY` as a Supabase secret (visible in dashboard → Edge Functions → Secrets)
3. Verify `ai_insights` table exists in your Supabase DB

**Debugging edge function errors:**
- Supabase Dashboard → Edge Functions → click function name → Logs tab shows execution logs and errors
- Invocations tab shows HTTP request/response status and metadata
- `EarlyDrop` reason usually means the function crashed with an uncaught error
- Common issues: missing secrets, DB query failures, API call failures (check OpenAI API key)
- Redeploy after code changes: `supabase functions deploy <function-name>`

## Architecture

### Authentication & Routing

The app uses **Supabase Auth** (email + password) with session persistence in AsyncStorage. Routing is gate-kept by `AuthGate` in `_layout.tsx`:

1. **No session** → redirect to `/(auth)/login`
2. **Session exists** → check `onboarding_complete` flag → route to `/(tabs)` or `/onboarding`

Session restoration happens via `onAuthStateChange` listener in `AuthProvider`. Sessions are stored in AsyncStorage (not SecureStore, due to Supabase's large session payload exceeding 2048 byte limit).

Environment variables (in `.env.local`):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Navigation (expo-router file-based)

```
src/app/
  _layout.tsx          — Root Stack: AuthProvider → AuthGate → HabitsProvider → main navigation
  (auth)/
    _layout.tsx        — Auth stack (headerShown: false)
    login.tsx          — Email + password login with show/hide password toggle
    signup.tsx         — Sign up form with email confirmation handling
  (tabs)/
    _layout.tsx        — Bottom tab bar (5 tabs, gold active tint)
    index.tsx          — Home: today's habits list
    challenges.tsx     — Active + past challenges
    stats.tsx          — 7-day bar chart, streaks
    coach.tsx          — AI coaching nudges + weekly/monthly summaries
    settings.tsx       — Notification prefs + Sign Out button
  onboarding.tsx       — fullScreenModal: 3-step first-launch flow, creates preset habits + challenge
  add-habit.tsx        — modal: habit creation form
  celebrate.tsx        — modal: challenge completion celebration
```

### State & Sync

**Auth Context** (`src/context/auth-context.tsx`):
- Manages Supabase session via `useAuth()` hook
- `session`, `user`, `isLoading`, `signIn()`, `signUp()`, `signOut()`, `authError`
- Session restored from AsyncStorage on app start via `onAuthStateChange` listener

**Data Context** (`src/context/habits-context.tsx` — `HabitsProvider`):
- Composes `useHabits(userId)` and `useChallenges(userId)` hooks
- Runs first-login migration: if user is new to Supabase, uploads local AsyncStorage data; if returning user, fetches remote data
- All screens access via `useHabitsContext()` — never call hooks directly

**Sync Pattern** (optimistic local-first):
- All writes update AsyncStorage + in-memory state **synchronously** (instant UI)
- Background sync to Supabase happens **asynchronously** via `upsertHabit()`, `upsertHabitEntries()`, etc. in `src/services/sync.ts`
- Reads always come from local AsyncStorage (fast, works offline)
- On re-login, data is fetched from Supabase and hydrated into AsyncStorage

**Hooks**:
- `src/hooks/use-habits.ts` — CRUD for habits, `updateHabitEntry(id, date, count)`, `getStreak(id)`. Uses UUID ids (migrated from timestamp ids). Contains migration logic converting old `completedDates[]` format to `entries: HabitEntry[]`.
- `src/hooks/use-challenges.ts` — CRUD for challenges with many-to-many habit relationships.

### Data Model

**TypeScript interfaces** (same for local AsyncStorage and Supabase):

```ts
type HabitType = 'daily' | 'volume'

interface HabitEntry {
  date: string;    // "YYYY-MM-DD"
  count: number;
}

interface Habit {
  id: string;            // UUID v4
  name: string;
  type: HabitType;       // goal=1 for daily, n for volume
  goal: number;
  icon: string;          // MaterialCommunityIcons name
  color: string;         // hex color
  createdAt: number;     // Unix ms timestamp
  entries: HabitEntry[]; // embedded in local, normalized in Supabase
}

interface Challenge {
  id: string;            // UUID v4
  name: string;
  description: string;
  startDate: string;     // "YYYY-MM-DD"
  durationDays: number;
  habitIds: string[];    // foreign keys (normalized as challenge_habits junction table in Supabase)
  completed: boolean;
  completedAt?: string;  // ISO datetime
  rewardClaimed: boolean;
}
```

**Supabase Schema**:
- `habits` (user_id FK, id UUID, name, type, goal, icon, color, created_at)
- `habit_entries` (id UUID, habit_id FK, date, count, unique(habit_id, date))
- `challenges` (user_id FK, id UUID, name, description, start_date, duration_days, completed, completed_at, reward_claimed)
- `challenge_habits` (challenge_id FK, habit_id FK, primary key(both)) — junction table for many-to-many
- `ai_insights` (user_id FK, type: 'coaching'|'weekly'|'monthly', content text, generated_at, period_start, period_end) — stores cached AI-generated insights

Row Level Security (RLS) policies ensure users can only access their own data.

### Services

- `src/services/sync.ts` — Supabase sync functions: `upsertHabit()`, `upsertHabitEntries()`, `upsertChallenge()`, `deleteHabitRemote()`, `deleteChallengeRemote()`, `uploadAllLocalData()`, `fetchAllRemoteData()`. All are non-blocking; errors are logged but do not block local state updates.
- `src/services/sounds.ts` — loads `assets/sounds/chime.mp3` + `celebration.mp3` via `expo-av`. Play functions silently no-op if sounds failed to load. Call `initializeSounds()` once at app start.
- `src/services/notifications.ts` — schedules morning/evening local notifications via `expo-notifications`. Prefs persisted under AsyncStorage key `'notification_prefs'`.
- `src/services/ai-coaching.ts` — calls Supabase Edge Functions: `generateCoachingNudge()` (2-3 sentence personalized message), `generateSummary(period: 'weekly'|'monthly')` (150-200 word reflection), `fetchLatestInsights()` (reads cached insights from `ai_insights` table). Results are cached in Supabase DB; subsequent loads are instant.

### AI Coaching & Supabase Edge Functions

**Architecture**: Mobile App → Supabase Edge Functions (Deno) → OpenAI GPT-4o mini API → Supabase DB

**Edge Functions** (serverless, deployed via `supabase functions deploy`):

- `supabase/functions/generate-coaching/index.ts` — On-demand endpoint:
  - Extracts user from JWT token
  - Queries `habits` + `habit_entries` from Supabase
  - Computes per-habit: streak (consecutive days met goal) + 30-day consistency %
  - Calls OpenAI GPT-4o mini with system prompt for motivational nudge
  - Upserts result into `ai_insights` table (type='coaching', replaces previous)
  - Returns `{ id, type, content, generated_at }`

- `supabase/functions/generate-summary/index.ts` — On-demand endpoint:
  - Accepts `{ period: 'weekly'|'monthly' }` in request body
  - Queries habit data for 7 or 30 days
  - Computes: per-habit completion %, overall %, best day of week, trend (first half vs second half)
  - Calls GPT-4o mini with system prompt for reflection report
  - Upserts into `ai_insights` (type='weekly'|'monthly', includes period_start/period_end dates)
  - Returns `{ id, type, content, generated_at, period_start, period_end }`

**Caching & Offline**:
- Coach tab calls `fetchLatestInsights()` on mount (reads cached `ai_insights` table) → instant display
- User taps Refresh/Generate → invokes edge function → shows spinner → updates cache
- Close/reopen Coach tab → loads from cache (no API call unless button pressed)

**Environment Variables** (in `.env.local`):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-proj-...    # (optional, used in development)
```

**Supabase Secrets** (for edge functions):
```
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

**Deployment**:
```bash
supabase functions deploy generate-coaching
supabase functions deploy generate-summary
```

Both functions use Supabase `SERVICE_ROLE_KEY` to query the DB directly and `OPENAI_API_KEY` to call the API. They validate the user's JWT before processing.

### Migrations

**ID Migration** (`src/utils/migrations.ts`):
- Habits and challenges use UUID v4 ids (previously timestamp-based: `Date.now().toString()`)
- Migration runs on app load if `uuid_migration_v1` flag is absent
- Remaps all habit ids and updates challenge `habitIds` references
- Only runs once; subsequent loads skip via migration key

**First-Login Migration** (in `HabitsProvider`):
- When user session is set and `supabase_migrated_${userId}` key doesn't exist:
  - If local AsyncStorage data exists: upload to Supabase, then mark migrated
  - If no local data: fetch from Supabase and populate local cache
- Per-user key ensures each user's migration runs only once
- Non-fatal: if upload fails, app continues working offline; retry happens on next login

### Utilities

- `src/utils/habit-icon.ts` — `normalizeHabitIcon(icon)` maps legacy icon names (e.g. `sun` → `weather-sunny`) to valid `MaterialCommunityIcons` names. Always pass icons through this before rendering.

### SafeAreaView

Always import `SafeAreaView` from **`react-native-safe-area-context`**, not from `react-native`. The built-in one does not handle Android status bar insets correctly.
