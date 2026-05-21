import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { normalizeHabitIcon } from '@/utils/habit-icon';
import { runUUIDMigration } from '@/utils/migrations';
import {
  upsertHabit,
  upsertHabitEntries,
  deleteHabitRemote,
} from '@/services/sync';

export type HabitType = 'daily' | 'volume';

export interface HabitEntry {
  date: string;
  count: number;
}

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  goal: number;
  icon: string;
  color: string;
  createdAt: number;
  entries: HabitEntry[];
  challengeId?: string;
}

const STORAGE_KEY = 'habits';

export function useHabits(userId: string | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        let needsSave = false;
        const migrated: Habit[] = parsed.map((h: any) => {
          const base = h.entries
            ? h
            : {
                ...h,
                type: 'daily',
                goal: 1,
                icon: 'check-circle',
                color: '#d4af37',
                entries: (h.completedDates || []).map((date: string) => ({
                  date,
                  count: 1,
                })),
              };
          const normalizedIcon = normalizeHabitIcon(base.icon ?? 'check-circle');
          if (normalizedIcon !== base.icon) {
            needsSave = true;
          }
          return { ...base, icon: normalizedIcon };
        });

        // UUID migration
        const uuidMigrated = await AsyncStorage.getItem('uuid_migration_v1');
        let finalHabits = migrated;
        if (!uuidMigrated) {
          const stored2 = await AsyncStorage.getItem('challenges');
          const challenges = stored2 ? JSON.parse(stored2) : [];
          const { habits: newHabits, challenges: newChallenges } = runUUIDMigration(
            migrated,
            challenges
          );
          finalHabits = newHabits;
          needsSave = true;
          // Update challenges with remapped ids
          await AsyncStorage.setItem('challenges', JSON.stringify(newChallenges));
          await AsyncStorage.setItem('uuid_migration_v1', 'done');
        }

        setHabits(finalHabits);
        if (needsSave) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalHabits));
        }
      }
    } catch (error) {
      console.error('Failed to load habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHabits)).catch((error) =>
      console.error('Failed to save habits:', error)
    );
  };

  const addHabit = async (
    name: string,
    type: HabitType = 'daily',
    goal: number = 1,
    icon: string = 'check-circle',
    color: string = '#d4af37'
  ) => {
    const newHabit: Habit = {
      id: uuidv4(),
      name,
      type,
      goal,
      icon: normalizeHabitIcon(icon),
      color,
      createdAt: Date.now(),
      entries: [],
    };
    const updated = [...habits, newHabit];
    saveHabits(updated);
    if (userId) {
      upsertHabit(newHabit, userId).catch(console.error);
    }
    return newHabit;
  };

  const deleteHabit = async (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    saveHabits(updated);
    if (userId) {
      deleteHabitRemote(id).catch(console.error);
    }
  };

  const updateHabitEntry = async (id: string, date: string, count: number) => {
    console.log(`[habits] updateHabitEntry: id=${id}, date=${date}, count=${count}, userId=${userId}`);
    const updated = habits.map((h) => {
      if (h.id === id) {
        const entryIndex = h.entries.findIndex((e) => e.date === date);
        if (entryIndex >= 0) {
          if (count === 0) {
            return { ...h, entries: h.entries.filter((e) => e.date !== date) };
          }
          const newEntries = [...h.entries];
          newEntries[entryIndex].count = count;
          return { ...h, entries: newEntries };
        } else if (count > 0) {
          return { ...h, entries: [...h.entries, { date, count }] };
        }
      }
      return h;
    });
    saveHabits(updated);
    if (userId) {
      const updatedHabit = updated.find((h) => h.id === id);
      if (updatedHabit) {
        console.log(`[habits] Syncing ${updatedHabit.entries.length} entries for habit ${id}`);
        upsertHabitEntries(updatedHabit).catch((e) => console.error('[habits] Sync error:', e));
      }
    } else {
      console.log('[habits] No userId, skipping sync');
    }
  };

  const getHabitEntry = (id: string, date: string): number => {
    const habit = habits.find((h) => h.id === id);
    const entry = habit?.entries.find((e) => e.date === date);
    return entry?.count ?? 0;
  };

  const getStreak = (id: string): number => {
    const habit = habits.find((h) => h.id === id);
    if (!habit || habit.entries.length === 0) return 0;

    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const entry = habit.entries.find((e) => e.date === dateStr);
      if (!entry || entry.count < habit.goal) break;
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  return {
    habits,
    loading,
    setHabits,
    addHabit,
    deleteHabit,
    updateHabitEntry,
    getHabitEntry,
    getStreak,
  };
}
