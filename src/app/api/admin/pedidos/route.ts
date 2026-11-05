import { isAdmin } from '@/lib/server/admin';
import { resendCustomer } from '@/lib/server/notify';
import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

/** Lista de pedidos pagos para o suporte. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase();
  let query = sb
    .from('customers')
    .select('id, email, phone, name, paid_at, refunded_at, extra_pet_slots, access_token, pets(id, data, submitted_at, files)')
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: false })
    .limit(60);
  if (q) query = query.ilike('email', `%${q}%`);
  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ orders: data ?? [] });
}

/** Ações: reenviar e-mail ou liberar nova edição. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const { action, customerId } = await req.json().catch(() => ({}));
  const { data: c } = await sb.from('customers').select('email, access_token, bumps, pets(id, data, files, submitted_at)').eq('id', customerId).maybeSingle();
  if (!c) return json({ error: 'not_found' }, 404);
  if (action === 'resend') return json({ ok: await resendCustomer(c as never) });
  if (action === 'unlock') {
    await sb.from('pets').update({ submitted_at: null }).eq('customer_id', customerId);
    return json({ ok: true });
  }
  return json({ error: 'action' }, 400);
}
