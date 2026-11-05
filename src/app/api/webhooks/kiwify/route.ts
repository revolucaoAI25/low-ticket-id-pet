import { createHmac, timingSafeEqual } from 'crypto';
import { doPet } from '@/lib/pet';
import { sendConfirmEmail } from '@/lib/server/email';
import { getSettingsFresh } from '@/lib/server/settings';
import { db } from '@/lib/server/supabase';
import { json, normEmail, normPhone, token } from '@/lib/server/util';
import { normalize } from '@/lib/teams';

export const runtime = 'nodejs';

type Obj = Record<string, unknown>;
const pickObj = (o: Obj, ...keys: string[]): Obj => {
  for (const k of keys) if (o[k] && typeof o[k] === 'object') return o[k] as Obj;
  return {};
};
const pickStr = (o: Obj, ...keys: string[]): string => {
  for (const k of keys) if (typeof o[k] === 'string' || typeof o[k] === 'number') return String(o[k]);
  return '';
};

function validSignature(raw: string, sig: string | null): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_TOKEN;
  if (!secret) return true; // sem token configurado, aceita (configure em produção)
  if (!sig) return false;
  const expected = createHmac('sha1', secret).update(raw).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/**
 * Webhook da Kiwify (Apps → Webhooks). Eventos: compra aprovada, reembolso e chargeback.
 * Pagamento aprovado → libera a área do pet do lead com o mesmo e-mail (ou telefone) e envia o acesso.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const url = new URL(req.url);
  if (!validSignature(raw, url.searchParams.get('signature'))) return json({ error: 'signature' }, 401);

  let body: Obj;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'json' }, 400);
  }
  const sb = db();
  if (!sb) return json({ error: 'db' }, 503);

  const o: Obj = body.order && typeof body.order === 'object' ? (body.order as Obj) : body;
  await sb.from('webhook_logs').insert({ provider: 'kiwify', payload: o });

  const status = pickStr(o, 'order_status', 'status').toLowerCase();
  const event = pickStr(o, 'webhook_event_type', 'event').toLowerCase();
  const orderId = pickStr(o, 'order_id', 'id', 'order_ref');
  const customer = pickObj(o, 'Customer', 'customer');
  const product = pickObj(o, 'Product', 'product');
  const email = normEmail(pickStr(customer, 'email'));
  const phone = normPhone(pickStr(customer, 'mobile', 'phone', 'mobile_phone'));
  const fullName = pickStr(customer, 'full_name', 'name');
  const productName = pickStr(product, 'product_name', 'name') || pickStr(o, 'product_name');
  const commissions = pickObj(o, 'Commissions', 'commissions');
  const amount = Number(pickStr(commissions, 'charge_amount', 'product_base_price')) || null;

  if (!orderId) return json({ ok: true, ignored: 'no order id' });

  const isPaid = status === 'paid' || status === 'approved' || event === 'order_approved';
  const isRefund = ['refunded', 'chargedback', 'chargeback'].includes(status) || ['order_refunded', 'chargeback'].includes(event);

  // "+1 pet": no nome do produto (checkout do pet adicional) ou em algum order bump do pedido.
  const settings = await getSettingsFresh();
  const keywords = settings.extraPetKeywords.map(normalize).filter(Boolean);
  const productIsExtraPet = keywords.some((k) => normalize(productName).includes(k));
  const payloadText = normalize(JSON.stringify(o));
  const bumpExtraPet = !productIsExtraPet && keywords.some((k) => payloadText.includes(k));
  const extraPets = productIsExtraPet || bumpExtraPet ? 1 : 0;

  const { data: existing } = await sb.from('orders').select('id, status, customer_id').eq('provider', 'kiwify').eq('provider_order_id', orderId).maybeSingle();
  const alreadyPaid = existing?.status === 'paid';

  await sb.from('orders').upsert(
    {
      provider: 'kiwify',
      provider_order_id: orderId,
      status: isPaid ? 'paid' : isRefund ? 'refunded' : status || event,
      event,
      email: email || null,
      phone: phone || null,
      product_name: productName || null,
      amount,
      extra_pets: extraPets,
      payload: o,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider,provider_order_id' },
  );

  if (isRefund) {
    const custId = existing?.customer_id;
    if (custId && !productIsExtraPet) await sb.from('customers').update({ refunded_at: new Date().toISOString() }).eq('id', custId);
    else if (custId && productIsExtraPet) {
      const { data: c } = await sb.from('customers').select('extra_pet_slots').eq('id', custId).maybeSingle();
      if (c) await sb.from('customers').update({ extra_pet_slots: Math.max(0, (c.extra_pet_slots ?? 0) - 1) }).eq('id', custId);
    }
    return json({ ok: true, refunded: true });
  }

  if (!isPaid || alreadyPaid) return json({ ok: true, skipped: !isPaid ? 'not paid' : 'duplicate' });

  // ---------- encontra o lead ----------
  type Cust = { id: string; access_token: string; paid_at: string | null; extra_pet_slots: number; created_at: string; pets: { data: Obj }[] };
  let candidates: Cust[] = [];
  if (email) {
    const { data } = await sb.from('customers').select('id, access_token, paid_at, extra_pet_slots, created_at, pets(data)').eq('email', email).order('created_at', { ascending: false }).limit(10);
    candidates = (data as unknown as Cust[]) ?? [];
  }
  if (!candidates.length && phone.length >= 10) {
    const { data } = await sb
      .from('customers')
      .select('id, access_token, paid_at, extra_pet_slots, created_at, pets(data)')
      .like('phone', `%${phone.slice(-8)}`)
      .order('created_at', { ascending: false })
      .limit(10);
    candidates = (data as unknown as Cust[]) ?? [];
  }

  let cust: Cust | undefined;
  if (productIsExtraPet) {
    cust = candidates.find((c) => c.paid_at) ?? candidates[0];
  } else {
    cust = candidates.find((c) => !c.paid_at && c.pets?.length) ?? candidates.find((c) => !c.paid_at) ?? candidates[0];
  }

  if (!cust) {
    // Comprou sem passar pelo quiz (ou com outro e-mail): cria o acesso vazio; o pet é cadastrado na área.
    const { data } = await sb
      .from('customers')
      .insert({ email: email || null, phone: phone || null, name: fullName || null, access_token: token() })
      .select('id, access_token, paid_at, extra_pet_slots, created_at')
      .single();
    if (!data) return json({ error: 'customer' }, 500);
    cust = { ...(data as Omit<Cust, 'pets'>), pets: [] };
  }

  const wasPaid = !!cust.paid_at;
  const patch: Obj = {
    name: fullName || undefined,
    extra_pet_slots: (cust.extra_pet_slots ?? 0) + extraPets,
    updated_at: new Date().toISOString(),
  };
  if (!productIsExtraPet && !wasPaid) {
    patch.paid_at = new Date().toISOString();
    patch.refunded_at = null;
  }
  await sb.from('customers').update(patch).eq('id', cust.id);
  await sb.from('orders').update({ customer_id: cust.id }).eq('provider', 'kiwify').eq('provider_order_id', orderId);

  if (!productIsExtraPet && !wasPaid && email) {
    await sendConfirmEmail(email, cust.access_token, cust.pets?.[0] ? doPet(cust.pets[0].data) : undefined);
  }
  return json({ ok: true, customer: cust.id, extraPets });
}
