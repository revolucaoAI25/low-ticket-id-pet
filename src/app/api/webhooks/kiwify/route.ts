import { createHmac, timingSafeEqual } from 'crypto';
import { doPet } from '@/lib/pet';
import { bumpFiles, bumpsInPayload, productIsBump } from '@/lib/server/bumps';
import { sendBumpEmail, sendConfirmEmail, sendExtraPetEmail } from '@/lib/server/email';
import { kiwifyValue, sendCapiPurchase } from '@/lib/server/meta-capi';
import { sendUtmifyOrder } from '@/lib/server/utmify';
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
  // Um token por webhook da Kiwify: vários separados por vírgula, espaço ou quebra de linha.
  const secrets = (process.env.KIWIFY_WEBHOOK_TOKEN ?? '').split(/[\s,;]+/).filter(Boolean);
  if (!secrets.length) return true; // sem token configurado, aceita (configure em produção)
  if (!sig) return false;
  return secrets.some((secret) => {
    const expected = createHmac('sha1', secret).update(raw).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    } catch {
      return false;
    }
  });
}

/**
 * Webhook da Kiwify (Apps → Webhooks). Eventos: compra aprovada, reembolso e chargeback.
 * Pagamento aprovado → libera a área do pet do lead com o mesmo e-mail (ou telefone) e envia o acesso.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const url = new URL(req.url);
  const sb = db();
  let body: Obj;
  try {
    body = JSON.parse(raw);
  } catch {
    if (sb) await sb.from('webhook_logs').insert({ provider: 'kiwify', payload: { raw: raw.slice(0, 2000) }, note: 'corpo inválido (não é JSON)' });
    return json({ error: 'json' }, 400);
  }
  const o: Obj = body.order && typeof body.order === 'object' ? (body.order as Obj) : body;
  if (!validSignature(raw, url.searchParams.get('signature'))) {
    // Fica registrado para aparecer no /admin → Webhooks (token errado ou faltando na Vercel).
    if (sb) await sb.from('webhook_logs').insert({ provider: 'kiwify', payload: o, note: 'recusado: token não confere' });
    return json({ error: 'signature' }, 401);
  }
  if (!sb) return json({ error: 'db' }, 503);
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

  // Botão "Testar" da Kiwify: cliente fictício (domínio de exemplo ou sem e-mail e sem pedido).
  // Só registra, sem criar pedido, mandar e-mail ou repassar para a Utmify.
  const isTest = /@example\.(com|org|net)$/.test(email) || (!email && !orderId);
  await sb.from('webhook_logs').insert({ provider: 'kiwify', payload: o, note: isTest ? 'teste (não processado)' : 'recebido' });
  if (isTest) return json({ ok: true, test: true });
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
  // Order bumps de conteúdo (PDF): no próprio pedido ou como pedido separado.
  const bumps = bumpsInPayload(JSON.stringify(o), settings);
  const onlyBump = !productIsExtraPet && productIsBump(productName, settings);
  /** Pedido que não é o kit em si (só "+1 pet" ou só um bump): não libera o kit sozinho. */
  const addOn = productIsExtraPet || onlyBump;
  const cents = Math.round(kiwifyValue(amount) * 100);
  const utmifyBase = {
    orderId,
    paymentMethod: pickStr(o, 'payment_method'),
    createdAt: pickStr(o, 'created_at') || null,
    approvedAt: pickStr(o, 'approved_date') || null,
    refundedAt: pickStr(o, 'refunded_at') || null,
    customer: { name: fullName, email, phone, document: pickStr(customer, 'CPF', 'cpf', 'cnpj') || null, ip: pickStr(customer, 'ip') || null },
    product: { id: pickStr(product, 'product_id', 'id') || orderId, name: productName || 'Order bump', priceInCents: cents },
    // Commissions da Kiwify já vêm em centavos (ex.: kiwify_fee 789 = R$ 7,89).
    feeInCents: Math.round(Number(pickStr(commissions, 'kiwify_fee')) || 0) || undefined,
    netInCents: Math.round(Number(pickStr(commissions, 'my_commission')) || 0) || undefined,
  };
  /** UTMs que a própria Kiwify registrou no pedido (TrackingParameters): reserva quando o lead não tem. */
  const kiwifyUtms: Obj = {};
  for (const [k, v] of Object.entries(pickObj(o, 'TrackingParameters', 'tracking_parameters'))) if (v) kiwifyUtms[k] = v;
  const utmsFor = (lead: Obj | null | undefined): Obj => {
    const l = { ...(lead ?? {}) };
    delete l._meta;
    return Object.values(l).some(Boolean) ? l : kiwifyUtms;
  };

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
    if (custId && !addOn) await sb.from('customers').update({ refunded_at: new Date().toISOString() }).eq('id', custId);
    else if (custId && productIsExtraPet) {
      const { data: c } = await sb.from('customers').select('extra_pet_slots').eq('id', custId).maybeSingle();
      if (c) await sb.from('customers').update({ extra_pet_slots: Math.max(0, (c.extra_pet_slots ?? 0) - 1) }).eq('id', custId);
    }
    if (addOn) {
      const { data: c } = custId ? await sb.from('customers').select('utms').eq('id', custId).maybeSingle() : { data: null };
      await sendUtmifyOrder({ ...utmifyBase, status: status.includes('charge') || event.includes('charge') ? 'chargedback' : 'refunded', utms: utmsFor(c?.utms as Obj) });
    }
    return json({ ok: true, refunded: true });
  }

  if (!isPaid || alreadyPaid) return json({ ok: true, skipped: !isPaid ? 'not paid' : 'duplicate' });

  // ---------- encontra o lead ----------
  type Cust = { id: string; access_token: string; paid_at: string | null; extra_pet_slots: number; bumps: string[] | null; created_at: string; utms: Obj | null; pets: { data: Obj }[] };
  let candidates: Cust[] = [];
  if (email) {
    const { data } = await sb.from('customers').select('id, access_token, paid_at, extra_pet_slots, bumps, created_at, utms, pets(data)').eq('email', email).order('created_at', { ascending: false }).limit(10);
    candidates = (data as unknown as Cust[]) ?? [];
  }
  if (!candidates.length && phone.length >= 10) {
    const { data } = await sb
      .from('customers')
      .select('id, access_token, paid_at, extra_pet_slots, bumps, created_at, utms, pets(data)')
      .like('phone', `%${phone.slice(-8)}`)
      .order('created_at', { ascending: false })
      .limit(10);
    candidates = (data as unknown as Cust[]) ?? [];
  }

  let cust: Cust | undefined;
  if (addOn) {
    cust = candidates.find((c) => c.paid_at) ?? candidates[0];
  } else {
    cust = candidates.find((c) => !c.paid_at && c.pets?.length) ?? candidates.find((c) => !c.paid_at) ?? candidates[0];
  }

  if (!cust) {
    // Comprou sem passar pelo quiz (ou com outro e-mail): cria o acesso vazio; o pet é cadastrado na área.
    const { data } = await sb
      .from('customers')
      .insert({ email: email || null, phone: phone || null, name: fullName || null, access_token: token() })
      .select('id, access_token, paid_at, extra_pet_slots, bumps, created_at, utms')
      .single();
    if (!data) return json({ error: 'customer' }, 500);
    cust = { ...(data as Omit<Cust, 'pets'>), pets: [] };
  }

  const wasPaid = !!cust.paid_at;
  const had = new Set(cust.bumps ?? []);
  const newBumps = bumps.filter((b) => !had.has(b));
  const patch: Obj = {
    name: fullName || undefined,
    extra_pet_slots: (cust.extra_pet_slots ?? 0) + extraPets,
    bumps: [...had, ...newBumps],
    updated_at: new Date().toISOString(),
  };
  if (!addOn && !wasPaid) {
    patch.paid_at = new Date().toISOString();
    patch.refunded_at = null;
  }
  await sb.from('customers').update(patch).eq('id', cust.id);
  await sb.from('orders').update({ customer_id: cust.id }).eq('provider', 'kiwify').eq('provider_order_id', orderId);

  const doNome = cust.pets?.[0] ? doPet(cust.pets[0].data) : undefined;
  const kitPaidNow = !addOn && !wasPaid;
  const kitIsPaid = wasPaid || kitPaidNow;
  if (email) {
    // 1) Kit aprovado: e-mail para conferir os dados (se comprou +1 pet junto, o formulário já abre os dois).
    if (kitPaidNow) await sendConfirmEmail(email, cust.access_token, doNome);
    // 2) +1 pet aprovado depois do kit (outro Pix, por exemplo): convite para montar o kit do novo pet.
    else if (extraPets && kitIsPaid) await sendExtraPetEmail(email, cust.access_token);
    // 3) Cada order bump de conteúdo: um e-mail próprio com o PDF, na hora em que for aprovado.
    for (const f of bumpFiles(newBumps, settings)) await sendBumpEmail(email, f);
  }
  // Pedidos à parte (order bump ou +1 pet): a Utmify só recebe o webhook da oferta principal,
  // então a compra vai para a Meta daqui, pela API de Conversões, atribuída ao clique do anúncio.
  // A compra principal continua sendo enviada pela Utmify (não duplica).
  let capi = false;
  let utmify = false;
  if (addOn) {
    utmify = await sendUtmifyOrder({ ...utmifyBase, status: 'paid', utms: utmsFor(cust.utms), customer: { ...utmifyBase.customer, ip: ((cust.utms?._meta as Obj | undefined)?.ip as string) || utmifyBase.customer.ip } });
    capi = await sendCapiPurchase({
      pixelId: settings.tracking.metaPixelId,
      orderId,
      value: kiwifyValue(amount),
      contentName: productName || 'Order bump',
      email,
      phone,
      externalId: cust.id,
      meta: (cust.utms?._meta as never) ?? null,
    });
  }
  return json({ ok: true, customer: cust.id, extraPets, bumps: newBumps, capi, utmify });
}
