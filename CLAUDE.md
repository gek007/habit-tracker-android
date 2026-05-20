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
```

There is no test suite. There is no build script — the app is run via Expo Go on device.

**Windows note:** The Metro file watcher has a known crash on Windows with Expo devtools temp dirs. `metro.config.js` already has a `blockList` fix for this. If Metro crashes on startup, kill any process on port 8081 first.

## Architecture

### Navigation (expo-router file-based)

```
src/app/
  _layout.tsx          — Root Stack: wraps everything in SafeAreaProvider + HabitsProvider,
                         checks AsyncStorage for 'onboarding_complete', redirects to /onboarding on first launch
  (tabs)/
    _layout.tsx        — Bottom tab bar (4 tabs, gold active tint)
    index.tsx          — Home: today's habits list
    challenges.tsx     — Active + past challenges
    stats.tsx          — 7-day bar chart, streaks
    settings.tsx       — Notification prefs
  onboarding.tsx       — fullScreenModal: 3-step first-launch flow, creates preset habits + challenge
  add-habit.tsx        — modal: habit creation form
  celebrate.tsx        — modal: challenge completion celebration
```

### State — single context pattern

All habit and challenge state lives in `src/context/habits-context.tsx` (`HabitsProvider`), which composes two hooks:

- `src/hooks/use-habits.ts` — CRUD for habits, `updateHabitEntry(id, date, count)`, `getStreak(id)`. Persists to AsyncStorage key `'habits'`. Contains migration logic that converts old `completedDates[]` format to the new `entries: HabitEntry[]` format on load.
- `src/hooks/use-challenges.ts` — CRUD for challenges. Persists to AsyncStorage key `'challenges'`.

Every screen accesses state via `useHabitsContext()` — never call the hooks directly in screens.

### Data model

```ts
// Habit types
type HabitType = 'daily' | 'volume'

interface Habit {
  id: string; type: HabitType; goal: number;   // goal=1 for daily, n for volume
  icon: string; color: string;                  // MaterialCommunityIcons name + hex color
  entries: HabitEntry[];                        // { date: "YYYY-MM-DD", count: number }
}

interface Challenge {
  id: string; habitIds: string[]; durationDays: number;
  startDate: string; completed: boolean; rewardClaimed: boolean;
}
```

### Services

- `src/services/sounds.ts` — loads `assets/sounds/chime.mp3` + `celebration.mp3` via `expo-av`. Play functions silently no-op if sounds failed to load. Call `initializeSounds()` once at app start.
- `src/services/notifications.ts` — schedules morning/evening local notifications via `expo-notifications`. Prefs persisted under AsyncStorage key `'notification_prefs'`.

### Utilities

- `src/utils/habit-icon.ts` — `normalizeHabitIcon(icon)` maps legacy icon names (e.g. `sun` → `weather-sunny`) to valid `MaterialCommunityIcons` names. Always pass icons through this before rendering.

### SafeAreaView

Always import `SafeAreaView` from **`react-native-safe-area-context`**, not from `react-native`. The built-in one does not handle Android status bar insets correctly.
