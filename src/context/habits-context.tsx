import React, { createContext, useContext, ReactNode } from 'react';
import { useHabits, Habit, HabitType } from '@/hooks/use-habits';
import { useChallenges, Challenge } from '@/hooks/use-challenges';

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
  const habits = useHabits();
  const challenges = useChallenges();

  const value: HabitsContextValue = {
    habits: habits.habits,
    challenges: challenges.challenges,
    loading: habits.loading || challenges.loading,
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
