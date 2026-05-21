import { supabase } from '@/lib/supabase';

export interface AiInsight {
  id: string;
  user_id: string;
  type: 'coaching' | 'weekly' | 'monthly';
  content: string;
  generated_at: string;
  period_start?: string;
  period_end?: string;
}

export async function generateCoachingNudge(): Promise<AiInsight> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('generate-coaching', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(`Failed to generate coaching: ${error.message}`);
  }

  return data as AiInsight;
}

export async function generateSummary(period: 'weekly' | 'monthly'): Promise<AiInsight> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('generate-summary', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: { period },
  });

  if (error) {
    throw new Error(`Failed to generate summary: ${error.message}`);
  }

  return data as AiInsight;
}

export async function fetchLatestInsights(): Promise<Record<string, AiInsight>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', session.user.id)
    .order('generated_at', { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(`Failed to fetch insights: ${error.message}`);
  }

  const insights: Record<string, AiInsight> = {};

  (data || []).forEach((insight) => {
    if (!insights[insight.type]) {
      insights[insight.type] = insight;
    }
  });

  return insights;
}
