import { isAdmin } from '@/lib/server/admin';
import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 7));
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [{ data: funnel }, leads, paid, { data: teams }] = await Promise.all([
    sb.rpc('funnel_summary', { since }),
    sb.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', since).not('consent_at', 'is', null),
    sb.from('customers').select('id', { count: 'exact', head: true }).gte('paid_at', since),
    sb.from('funnel_events').select('meta').eq('event', 'TimeNaoEncontrado').gte('created_at', since).limit(500),
  ]);
  const teamCount: Record<string, number> = {};
  for (const t of teams ?? []) {
    const n = String((t.meta as { time?: string } | null)?.time ?? '').trim();
    if (n) teamCount[n] = (teamCount[n] ?? 0) + 1;
  }
  return json({
    days,
    funnel: funnel ?? [],
    leads: leads.count ?? 0,
    paid: paid.count ?? 0,
    missingTeams: Object.entries(teamCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15),
  });
}
