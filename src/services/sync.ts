import { supabase } from '@/lib/supabase';
import type { Habit } from '@/hooks/use-habits';
import type { Challenge } from '@/hooks/use-challenges';

export interface SyncResult {
  success: boolean;
  error?: string;
}

export async function upsertHabit(habit: Habit, userId: string): Promise<SyncResult> {
  try {
    const { error } = await supabase
      .from('habits')
      .upsert(
        {
          id: habit.id,
          user_id: userId,
          name: habit.name,
          type: habit.type,
          goal: habit.goal,
          icon: habit.icon,
          color: habit.color,
          created_at: habit.createdAt,
        },
        { onConflict: 'id' }
      );

    return error ? { success: false, error: error.message } : { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function upsertHabitEntries(habit: Habit): Promise<SyncResult> {
  try {
    if (habit.entries.length === 0) {
      console.log(`[sync] No entries to sync for habit ${habit.id}`);
      return { success: true };
    }

    console.log(`[sync] Syncing ${habit.entries.length} entries for habit ${habit.id}`);

    const rows = habit.entries.map((e) => ({
      habit_id: habit.id,
      date: e.date,
      count: e.count,
    }));

    const { error } = await supabase
      .from('habit_entries')
      .upsert(rows, { onConflict: 'habit_id,date' });

    if (error) {
      console.error(`[sync] Error syncing entries: ${error.message}`);
      return { success: false, error: error.message };
    }
    console.log(`[sync] Successfully synced ${habit.entries.length} entries`);
    return { success: true };
  } catch (e: any) {
    console.error(`[sync] Exception syncing entries: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export async function upsertChallenge(challenge: Challenge, userId: string): Promise<SyncResult> {
  try {
    const { error: challengeError } = await supabase
      .from('challenges')
      .upsert(
        {
          id: challenge.id,
          user_id: userId,
          name: challenge.name,
          description: challenge.description,
          start_date: challenge.startDate,
          duration_days: challenge.durationDays,
          completed: challenge.completed,
          completed_at: challenge.completedAt ?? null,
          reward_claimed: challenge.rewardClaimed,
        },
        { onConflict: 'id' }
      );

    if (challengeError)
      return { success: false, error: challengeError.message };

    await supabase
      .from('challenge_habits')
      .delete()
      .eq('challenge_id', challenge.id);

    if (challenge.habitIds.length > 0) {
      const junctionRows = challenge.habitIds.map((hid) => ({
        challenge_id: challenge.id,
        habit_id: hid,
      }));
      const { error: junctionError } = await supabase
        .from('challenge_habits')
        .insert(junctionRows);

      if (junctionError)
        return { success: false, error: junctionError.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteHabitRemote(habitId: string): Promise<SyncResult> {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    return error ? { success: false, error: error.message } : { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteChallengeRemote(challengeId: string): Promise<SyncResult> {
  try {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    return error ? { success: false, error: error.message } : { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function uploadAllLocalData(
  habits: Habit[],
  challenges: Challenge[],
  userId: string
): Promise<SyncResult> {
  try {
    for (const habit of habits) {
      const r1 = await upsertHabit(habit, userId);
      if (!r1.success) return r1;
      const r2 = await upsertHabitEntries(habit);
      if (!r2.success) return r2;
    }
    for (const challenge of challenges) {
      const r = await upsertChallenge(challenge, userId);
      if (!r.success) return r;
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function fetchAllRemoteData(
  userId: string
): Promise<{ habits: Habit[]; challenges: Challenge[] } | null> {
  try {
    const { data: habitRows, error: habitError } = await supabase
      .from('habits')
      .select('*, habit_entries(*)')
      .eq('user_id', userId);

    if (habitError) throw habitError;

    const habits: Habit[] = (habitRows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      goal: row.goal,
      icon: row.icon,
      color: row.color,
      createdAt: row.created_at,
      entries: (row.habit_entries || []).map((e: any) => ({
        date: e.date,
        count: e.count,
      })),
    }));

    const { data: challengeRows, error: challengeError } = await supabase
      .from('challenges')
      .select('*, challenge_habits(habit_id)')
      .eq('user_id', userId);

    if (challengeError) throw challengeError;

    const challenges: Challenge[] = (challengeRows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      durationDays: row.duration_days,
      habitIds: (row.challenge_habits || []).map((ch: any) => ch.habit_id),
      completed: row.completed,
      completedAt: row.completed_at,
      rewardClaimed: row.reward_claimed,
    }));

    return { habits, challenges };
  } catch (e: any) {
    console.error('Failed to fetch remote data:', e);
    return null;
  }
}
