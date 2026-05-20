import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: string;
  durationDays: number;
  habitIds: string[];
  completed: boolean;
  completedAt?: string;
  rewardClaimed: boolean;
}

const STORAGE_KEY = 'challenges';

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setChallenges(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveChallenges = async (updatedChallenges: Challenge[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChallenges));
      setChallenges(updatedChallenges);
    } catch (error) {
      console.error('Failed to save challenges:', error);
    }
  };

  const createChallenge = async (
    name: string,
    description: string,
    durationDays: number,
    habitIds: string[]
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newChallenge: Challenge = {
      id: Date.now().toString(),
      name,
      description,
      startDate: today,
      durationDays,
      habitIds,
      completed: false,
      rewardClaimed: false,
    };
    const updated = [...challenges, newChallenge];
    await saveChallenges(updated);
    return newChallenge;
  };

  const deleteChallenge = async (id: string) => {
    const updated = challenges.filter((c) => c.id !== id);
    await saveChallenges(updated);
  };

  const completeChallenge = async (id: string) => {
    const updated = challenges.map((c) =>
      c.id === id ? { ...c, completed: true, completedAt: new Date().toISOString() } : c
    );
    await saveChallenges(updated);
  };

  const claimReward = async (id: string) => {
    const updated = challenges.map((c) => (c.id === id ? { ...c, rewardClaimed: true } : c));
    await saveChallenges(updated);
  };

  const getActiveChallenge = (): Challenge | undefined => {
    const today = new Date();
    return challenges.find((c) => {
      if (c.completed) return false;
      const endDate = new Date(c.startDate);
      endDate.setDate(endDate.getDate() + c.durationDays);
      return today <= endDate;
    });
  };

  const getChallengeProgress = (id: string, habitCompletionMap: Record<string, boolean>): number => {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge) return 0;
    const completed = challenge.habitIds.filter((hid) => habitCompletionMap[hid]).length;
    return Math.round((completed / challenge.habitIds.length) * 100);
  };

  const getDaysRemaining = (id: string): number => {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge) return 0;
    const endDate = new Date(challenge.startDate);
    endDate.setDate(endDate.getDate() + challenge.durationDays);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  };

  return {
    challenges,
    loading,
    createChallenge,
    deleteChallenge,
    completeChallenge,
    claimReward,
    getActiveChallenge,
    getChallengeProgress,
    getDaysRemaining,
  };
}
