import { db } from '@/lib/server/supabase';

export const runtime = 'nodejs';

/** Registro próprio das etapas do funil (para ver onde as pessoas desistem). */
export async function POST(req: Request) {
  const sb = db();
  if (!sb) return new Response(null, { status: 204 });
  try {
    const b = await req.json();
    const event = typeof b.event === 'string' ? b.event.slice(0, 40) : '';
    if (!event) return new Response(null, { status: 204 });
    await sb.from('funnel_events').insert({
      session_id: typeof b.sessionId === 'string' ? b.sessionId.slice(0, 64) : null,
      event,
      step: Number.isInteger(b.step) ? b.step : null,
      meta: b.meta && typeof b.meta === 'object' ? b.meta : null,
      utms: b.utms && typeof b.utms === 'object' ? b.utms : null,
      path: typeof b.path === 'string' ? b.path.slice(0, 80) : null,
    });
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 204 });
}
