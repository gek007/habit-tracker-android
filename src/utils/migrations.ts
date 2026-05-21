import { v4 as uuidv4 } from 'uuid';
import type { Habit } from '@/hooks/use-habits';
import type { Challenge } from '@/hooks/use-challenges';

function isLegacyId(id: string): boolean {
  return /^\d+$/.test(id);
}

export function runUUIDMigration(
  habits: Habit[],
  challenges: Challenge[]
): { habits: Habit[]; challenges: Challenge[] } {
  const idMap: Record<string, string> = {};

  const migratedHabits = habits.map((h) => {
    if (isLegacyId(h.id)) {
      const newId = uuidv4();
      idMap[h.id] = newId;
      return { ...h, id: newId };
    }
    return h;
  });

  const migratedChallenges = challenges.map((c) => ({
    ...c,
    habitIds: c.habitIds.map((hid) => idMap[hid] ?? hid),
  }));

  return { habits: migratedHabits, challenges: migratedChallenges };
}
