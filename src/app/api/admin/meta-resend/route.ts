import { isAdmin } from '@/lib/server/admin';
import { capiPurchase, kiwifyValue } from '@/lib/server/meta-capi';
import { getSettingsFresh } from '@/lib/server/settings';
import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Obj = Record<string, unknown>;

/** Data da Kiwify (horário de Brasília, sem fuso) → segundos Unix. */
function unix(d: unknown): number | null {
  if (typeof d !== 'string' || !d) return null;
  const iso = d.trim().replace(' ', 'T');
  const t = new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}-03:00`).getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

/**
 * Reenvia para a Meta (API de Conversões) as compras do kit principal a partir de uma data.
 * Usado quando a Utmify deixou de mandar a compra do kit. Cada compra vai com o id do pedido
 * (event_id kiwify-<pedido>), então repetir o envio não conta duas vezes no que o site mandou.
 * dryRun: só lista o que seria enviado.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const { from, dryRun } = (await req.json().catch(() => ({}))) as { from?: string; dryRun?: boolean };
  const settings = await getSettingsFresh();
  const now = Math.floor(Date.now() / 1000);
  const limit = now - 7 * 24 * 3600 + 3600; // a Meta recusa mais de 7 dias
  const fromTs = Math.max(limit, unix(from ? `${from} 00:00:00` : '') ?? limit);
  const { data, error } = await sb
    .from('orders')
    .select('provider_order_id, product_name, amount, email, phone, status, payload, customer_id, created_at')
    .eq('provider', 'kiwify')
    .eq('status', 'paid')
    .ilike('product_name', '%identidade pet%')
    .gte('created_at', new Date((fromTs - 86400) * 1000).toISOString())
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) return json({ error: error.message }, 500);
  const rows = [];
  for (const o of data ?? []) {
    const p = (o.payload ?? {}) as Obj;
    const t = unix(p.approved_date) ?? unix(p.created_at) ?? Math.floor(new Date(o.created_at as string).getTime() / 1000);
    if (t < fromTs || t > now) continue;
    // "+1 pet" também tem "pet" no nome: só o kit em si
    if (/mais 1 pet|\+1 pet|pet adicional|adicione/i.test(String(o.product_name))) continue;
    const orderId = String(o.provider_order_id).split(':')[0];
    let meta = null;
    let externalId: string | undefined;
    if (o.customer_id) {
      const { data: c } = await sb.from('customers').select('id, utms').eq('id', o.customer_id).maybeSingle();
      meta = ((c?.utms as Obj | null)?._meta as never) ?? null;
      externalId = c?.id;
    }
    const row = { orderId, at: new Date(t * 1000).toISOString(), email: o.email, value: kiwifyValue(Number(o.amount)), withClick: !!(meta as Obj | null)?.fbc, sent: false, reason: '' };
    if (!dryRun) {
      const r = await capiPurchase({
        pixelId: settings.tracking.metaPixelId,
        orderId,
        value: row.value,
        contentName: String(o.product_name || 'Kit Identidade Pet'),
        email: o.email,
        phone: o.phone,
        externalId,
        meta,
        eventTime: t,
      });
      row.sent = r === true;
      row.reason = r === true ? '' : r;
    }
    rows.push(row);
  }
  const sent = rows.filter((r) => r.sent).length;
  // Fica registrado no log de webhooks do painel (dá para conferir depois que o reenvio foi feito).
  if (!dryRun) {
    await sb.from('webhook_logs').insert({
      provider: 'meta-resend',
      payload: { from: new Date(fromTs * 1000).toISOString(), rows },
      note: `reenvio para a Meta: ${sent} de ${rows.length} compra(s) do kit aceitas${rows.length - sent ? ` · ${rows.length - sent} recusada(s) · motivo: ${rows.find((r) => !r.sent)?.reason}` : ''}`,
    });
  }
  return json({ ok: true, from: new Date(fromTs * 1000).toISOString(), total: rows.length, sent, rows });
}
