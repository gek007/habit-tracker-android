import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabits, Habit, HabitType } from '@/hooks/use-habits';
import { useChallenges, Challenge } from '@/hooks/use-challenges';
import { useAuth } from '@/context/auth-context';
import { uploadAllLocalData, fetchAllRemoteData } from '@/services/sync';

interface HabitsContextValue {
  habits: Habit[];
  challenges: Challenge[];
  loading: boolean;
  addHabit: (name: string, type?: HabitType, goal?: number, icon?: string, color?: string) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<void>;
  updateHabitEntry: (id: string, date: string, count: number) => Promise<void>;
  getHabitEntry: (id: string, date: string) => number;
  getStreak: (id: string) => number;
  createChallenge: (name: string, description: string, durationDays: number, habitIds: string[]) => Promise<Challenge>;
  deleteChallenge: (id: string) => Promise<void>;
  completeChallenge: (id: string) => Promise<void>;
  claimReward: (id: string) => Promise<void>;
  getActiveChallenge: () => Challenge | undefined;
  getChallengeProgress: (id: string, habitCompletionMap: Record<string, boolean>) => number;
  getDaysRemaining: (id: string) => number;
}

const HabitsContext = createContext<HabitsContextValue | undefined>(undefined);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const habits = useHabits(userId);
  const challenges = useChallenges(userId);
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    if (!user || migrationDone) return;

    const runFirstLoginMigration = async () => {
      if (!userId) {
        setMigrationDone(true);
        return;
      }

      const migrationKey = `supabase_migrated_${userId}`;
      const alreadyMigrated = await AsyncStorage.getItem(migrationKey);
      if (alreadyMigrated === 'true') {
        setMigrationDone(true);
        return;
      }

      try {
        const localHabitsRaw = await AsyncStorage.getItem('habits');
        const localChallengesRaw = await AsyncStorage.getItem('challenges');

        if (!localHabitsRaw && !localChallengesRaw) {
          // No local data — fetch from Supabase and populate local cache
          const remote = await fetchAllRemoteData(userId);
          if (remote) {
            await AsyncStorage.setItem('habits', JSON.stringify(remote.habits));
            await AsyncStorage.setItem('challenges', JSON.stringify(remote.challenges));
            habits.setHabits(remote.habits);
            challenges.setChallenges(remote.challenges);
          }
          await AsyncStorage.setItem(migrationKey, 'true');
          setMigrationDone(true);
          return;
        }

        // Local data exists — upload it
        const localHabits: Habit[] = localHabitsRaw ? JSON.parse(localHabitsRaw) : [];
        const localChallenges: Challenge[] = localChallengesRaw ? JSON.parse(localChallengesRaw) : [];

        const result = await uploadAllLocalData(localHabits, localChallenges, userId);

        if (result.success) {
          await AsyncStorage.setItem(migrationKey, 'true');
        } else {
          console.warn('First-login migration failed:', result.error);
        }
        setMigrationDone(true);
      } catch (e) {
        console.error('First-login migration error:', e);
        setMigrationDone(true);
      }
    };

    runFirstLoginMigration();
  }, [user, migrationDone, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: HabitsContextValue = {
    habits: habits.habits,
    challenges: challenges.challenges,
    loading: habits.loading || challenges.loading || !migrationDone,
    addHabit: habits.addHabit,
    deleteHabit: habits.deleteHabit,
    updateHabitEntry: habits.updateHabitEntry,
    getHabitEntry: habits.getHabitEntry,
    getStreak: habits.getStreak,
    createChallenge: challenges.createChallenge,
    deleteChallenge: challenges.deleteChallenge,
    completeChallenge: challenges.completeChallenge,
    claimReward: challenges.claimReward,
    getActiveChallenge: challenges.getActiveChallenge,
    getChallengeProgress: challenges.getChallengeProgress,
    getDaysRemaining: challenges.getDaysRemaining,
  };

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabitsContext() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabitsContext must be used within HabitsProvider');
  }
  return context;
}
