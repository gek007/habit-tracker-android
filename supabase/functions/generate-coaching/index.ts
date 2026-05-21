import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.106.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Habit {
  id: string;
  name: string;
  goal: number;
  entries: Array<{ date: string; count: number }>;
}

interface HabitStats {
  name: string;
  streak: number;
  consistency_30d: number;
}

function calculateStreak(habit: Habit): number {
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
}

function calculateConsistency30d(habit: Habit): number {
  const today = new Date();
  let count = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const entry = habit.entries.find((e) => e.date === dateStr);
    if (entry && entry.count >= habit.goal) {
      count++;
    }
  }

  return Math.round((count / 30) * 100);
}

async function generateCoaching(userId: string): Promise<string> {
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
    return "You haven't created any habits yet. Start by adding your first habit!";
  }

  // Map to Habit interface and compute stats
  const habits: Habit[] = (habitRows || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    goal: row.goal,
    entries: (row.habit_entries || []).map((e: any) => ({
      date: e.date,
      count: e.count,
    })),
  }));

  const stats: HabitStats[] = habits.map((h) => ({
    name: h.name,
    streak: calculateStreak(h),
    consistency_30d: calculateConsistency30d(h),
  }));

  // Sort by consistency
  stats.sort((a, b) => b.consistency_30d - a.consistency_30d);

  const best = stats[0];
  const worst = stats[stats.length - 1];

  const systemPrompt = `You are a warm, encouraging personal habit coach. Given the user's habit stats, write a 2-3 sentence motivational nudge.
Rules: Lead with their strongest habit and its specific streak/stat. Name the most-struggling habit and its consistency %. End with one concrete, specific actionable tip (not generic advice). Plain text, conversational, no markdown.`;

  const userMessage = JSON.stringify({
    habits: stats,
    best: best.name,
    worst: worst.name,
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
      max_tokens: 250,
      temperature: 0.7,
    }),
  });

  const result = await response.json() as any;

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${result.error?.message || 'Unknown error'}`);
  }

  const content = result.choices[0].message.content;

  // Delete old coaching record and insert new one
  await supabase
    .from('ai_insights')
    .delete()
    .eq('user_id', userId)
    .eq('type', 'coaching');

  const { error: insertError } = await supabase
    .from('ai_insights')
    .insert({
      user_id: userId,
      type: 'coaching',
      content,
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

    const content = await generateCoaching(user.id);

    // Fetch the inserted row to return full object
    const { data: insight } = await createClient(
      supabaseUrl!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'coaching')
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
