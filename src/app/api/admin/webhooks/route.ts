import { isAdmin } from '@/lib/server/admin';
import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

type Obj = Record<string, unknown>;
const str = (o: unknown, ...keys: string[]) => {
  if (!o || typeof o !== 'object') return '';
  for (const k of keys) {
    const v = (o as Obj)[k];
    if (typeof v === 'string' || typeof v === 'number') return String(v);
  }
  return '';
};

/** Últimos avisos da Kiwify que chegaram no site (para conferir os testes de webhook). */
export async function GET() {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const { data, error } = await sb.from('webhook_logs').select('id, payload, note, created_at').order('created_at', { ascending: false }).limit(40);
  if (error) return json({ error: error.message }, 500);
  const rows = (data ?? []).map((r) => {
    const p = (r.payload ?? {}) as Obj;
    return {
      id: r.id,
      at: r.created_at,
      note: r.note ?? 'recebido',
      event: str(p, 'webhook_event_type', 'event'),
      status: str(p, 'order_status', 'status'),
      orderId: str(p, 'order_id', 'id'),
      product: str(p.Product, 'product_name', 'name') || str(p, 'product_name'),
      email: str(p.Customer, 'email') || str(p, 'email'),
      payload: p,
    };
  });
  return json({ rows });
}
