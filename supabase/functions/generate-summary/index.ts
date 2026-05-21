import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HabitEntry {
  date: string;
  count: number;
}

interface Habit {
  name: string;
  goal: number;
  entries: HabitEntry[];
}

interface PeriodStats {
  habitName: string;
  completionPercent: number;
}

function getDaysForPeriod(period: 'weekly' | 'monthly'): number {
  return period === 'weekly' ? 7 : 30;
}

function getPeriodDates(period: 'weekly' | 'monthly'): { start: string; end: string } {
  const today = new Date();
  const days = getDaysForPeriod(period);
  const start = new Date(today);
  start.setDate(start.getDate() - days + 1);

  return {
    start: start.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  };
}

function calculatePeriodCompletion(
  habit: Habit,
  startDate: string,
  endDate: string
): number {
  let completed = 0;
  let total = 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const entry = habit.entries.find((e) => e.date === dateStr);
    total++;
    if (entry && entry.count >= habit.goal) {
      completed++;
    }
  }

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function getBestDayOfWeek(habits: Habit[], startDate: string, endDate: string): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();

    for (const habit of habits) {
      const entry = habit.entries.find((e) => e.date === dateStr);
      dayTotals[dayOfWeek]++;
      if (entry && entry.count >= habit.goal) {
        dayCounts[dayOfWeek]++;
      }
    }
  }

  let bestDay = 0;
  let bestPercent = 0;

  for (let i = 0; i < 7; i++) {
    if (dayTotals[i] > 0) {
      const percent = (dayCounts[i] / dayTotals[i]) * 100;
      if (percent > bestPercent) {
        bestPercent = percent;
        bestDay = i;
      }
    }
  }

  return dayNames[bestDay];
}

async function generateSummary(userId: string, period: 'weekly' | 'monthly'): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  // Fetch habits with entries
  const { data: habitRows, error: habitError } = await supabase
    .from('habits')
    .select('*, habit_entries(*)')
    .eq('user_id', userId);

  if (habitError) throw new Error(`Failed to fetch habits: ${habitError.message}`);

  if (!habitRows || habitRows.length === 0) {
    return 'You have no habits tracked yet. Start creating habits to see your reflection summary!';
  }

  const { start: periodStart, end: periodEnd } = getPeriodDates(period);

  // Map to Habit interface
  const habits: Habit[] = (habitRows || []).map((row: any) => ({
    name: row.name,
    goal: row.goal,
    entries: (row.habit_entries || []).map((e: any) => ({
      date: e.date,
      count: e.count,
    })),
  }));

  // Calculate stats
  const periodStats: PeriodStats[] = habits.map((h) => ({
    habitName: h.name,
    completionPercent: calculatePeriodCompletion(h, periodStart, periodEnd),
  }));

  const overallCompletion =
    Math.round(periodStats.reduce((acc, s) => acc + s.completionPercent, 0) / periodStats.length) ||
    0;
  const bestDay = getBestDayOfWeek(habits, periodStart, periodEnd);

  // Sort for achievements and improvements
  periodStats.sort((a, b) => b.completionPercent - a.completionPercent);
  const topHabits = periodStats.slice(0, 3);
  const bottomHabits = periodStats.slice(-2);

  const systemPrompt = `You are a personal habit coach writing a reflection report. Write 150-200 words.
Structure: (1) One sentence on overall consistency with %. (2) 2-3 achievements with specific numbers. (3) 1-2 areas needing attention with trend context. (4) One forward-looking encouragement.
Plain text, warm tone, paragraph format, no markdown, no bullet points.`;

  const userMessage = JSON.stringify({
    period,
    periodStart,
    periodEnd,
    overallCompletion,
    bestDay,
    topHabits: topHabits.map((h) => ({ name: h.habitName, percent: h.completionPercent })),
    bottomHabits: bottomHabits.map((h) => ({ name: h.habitName, percent: h.completionPercent })),
  });

  // Call OpenAI GPT-4o mini
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  const result = await response.json() as any;

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${result.error?.message || 'Unknown error'}`);
  }

  const content = result.choices[0].message.content;

  // Delete old summary record and insert new one
  await supabase
    .from('ai_insights')
    .delete()
    .eq('user_id', userId)
    .eq('type', period);

  const { error: insertError } = await supabase
    .from('ai_insights')
    .insert({
      user_id: userId,
      type: period,
      content,
      period_start: periodStart,
      period_end: periodEnd,
      generated_at: new Date().toISOString(),
    });

  if (insertError) {
    throw new Error(`Failed to save insight: ${insertError.message}`);
  }

  return content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as any;
    const period = body.period as 'weekly' | 'monthly';

    if (!period || !['weekly', 'monthly'].includes(period)) {
      return new Response(JSON.stringify({ error: 'Invalid period' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await generateSummary(user.id, period);

    // Fetch the inserted row to return full object
    const { data: insight } = await createClient(
      supabaseUrl!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', period)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
