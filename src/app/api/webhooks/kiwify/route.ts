import { createHmac, timingSafeEqual } from 'crypto';
import { doPet } from '@/lib/pet';
import { bumpFiles, bumpsInPayload, personalBumps, productIsBump } from '@/lib/server/bumps';
import { sendBumpEmail, sendConfirmEmail, sendExtraPetEmail, sendPersonalBumpEmail } from '@/lib/server/email';
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
  const { data: logRow } = await sb.from('webhook_logs').insert({ provider: 'kiwify', payload: o, note: isTest ? 'teste (não processado)' : 'recebido' }).select('id').maybeSingle();
  if (isTest) return json({ ok: true, test: true });
  /** Anota no log o que foi feito com o aviso (aparece no /admin → Webhooks). */
  const note = async (s: string) => {
    if (logRow?.id) await sb.from('webhook_logs').update({ note: s }).eq('id', logRow.id);
  };
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

  // Chave do pedido: id do pedido + produto (kit e bump nunca se confundem, mesmo se a Kiwify usar o mesmo id).
  const productId = pickStr(product, 'product_id', 'id');
  const orderKey = productId ? `${orderId}:${productId}` : orderId;
  const { data: existingNew } = await sb.from('orders').select('id, status, customer_id').eq('provider', 'kiwify').eq('provider_order_id', orderKey).maybeSingle();
  // Pedidos gravados antes desta mudança usavam só o id do pedido.
  const existing = existingNew ?? (await sb.from('orders').select('id, status, customer_id').eq('provider', 'kiwify').eq('provider_order_id', orderId).maybeSingle()).data;

  // Trava contra aviso repetido: a Kiwify pode mandar o mesmo pedido mais de uma vez, ao mesmo tempo
  // (por exemplo, dois webhooks marcando o mesmo produto). Só um deles "pega" o pedido; os outros param aqui.
  const newStatus = isPaid ? 'paid' : isRefund ? 'refunded' : status || event;
  const orderRow = {
    provider: 'kiwify',
    provider_order_id: orderKey,
    status: newStatus,
    event,
    email: email || null,
    phone: phone || null,
    product_name: productName || null,
    amount,
    extra_pets: extraPets,
    payload: o,
    updated_at: new Date().toISOString(),
  };
  const inserted = await sb.from('orders').insert(orderRow).select('id').maybeSingle();
  let claimed = !inserted.error && !!inserted.data;
  if (!claimed) {
    const { data: upd } = await sb.from('orders').update(orderRow).eq('provider', 'kiwify').eq('provider_order_id', orderKey).neq('status', newStatus).select('id');
    claimed = !!upd?.length;
  }
  if (!claimed) {
    await note('repetido (já processado)');
    return json({ ok: true, skipped: 'duplicate' });
  }

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
    await note(addOn ? 'reembolso de bump/+1 pet' : 'reembolso do kit');
    return json({ ok: true, refunded: true });
  }

  if (!isPaid) {
    await note(`ignorado (${newStatus})`);
    return json({ ok: true, skipped: 'not paid' });
  }

  // ---------- encontra o lead ----------
  type Cust = { id: string; access_token: string; paid_at: string | null; extra_pet_slots: number; bumps: string[] | null; created_at: string; utms: Obj | null; pets: { data: Obj; submitted_at?: string | null }[] };
  const CUST_COLS = 'id, access_token, paid_at, extra_pet_slots, bumps, created_at, utms, pets(data, submitted_at)';
  let candidates: Cust[] = [];
  let matchedBy = '';
  // 1º: o código do quiz que vai no link do checkout (s3 = id do pet). É o jeito mais seguro:
  // funciona mesmo se a pessoa trocar o e-mail no checkout ou tiver feito o quiz mais de uma vez.
  const ref = pickStr(pickObj(o, 'TrackingParameters', 'tracking_parameters'), 's3');
  if (/^[0-9a-f-]{36}$/i.test(ref)) {
    const { data: pet } = await sb.from('pets').select('customer_id').eq('id', ref).maybeSingle();
    if (pet?.customer_id) {
      const { data } = await sb.from('customers').select(CUST_COLS).eq('id', pet.customer_id).limit(1);
      candidates = (data as unknown as Cust[]) ?? [];
      if (candidates.length) matchedBy = 'quiz';
    }
  }
  // 2º: e-mail E telefone. A pessoa pode trocar um dos dois no checkout, então busca pelos dois
  // e prefere o cadastro que bate nos dois; depois o que bate só no telefone; por último só no e-mail.
  if (!candidates.length) {
    const found = new Map<string, Cust & { score: number }>();
    const add = (rows: unknown, pts: number) => {
      for (const r of (rows as Cust[] | null) ?? []) {
        const prev = found.get(r.id);
        found.set(r.id, { ...r, score: (prev?.score ?? 0) + pts });
      }
    };
    if (email) add((await sb.from('customers').select(CUST_COLS).eq('email', email).order('created_at', { ascending: false }).limit(10)).data, 1);
    if (phone.length >= 10) add((await sb.from('customers').select(CUST_COLS).like('phone', `%${phone.slice(-8)}`).order('created_at', { ascending: false }).limit(10)).data, 2);
    const list = [...found.values()].sort((x, y) => y.score - x.score || y.created_at.localeCompare(x.created_at));
    candidates = list;
    const how = (c?: { score: number }) => (!c ? '' : c.score === 3 ? 'e-mail e telefone' : c.score === 2 ? 'telefone' : 'e-mail');
    matchedBy = how(list[0]);
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
    matchedBy = 'novo cliente (não achou o quiz)';
  }

  const wasPaid = !!cust.paid_at;
  const had = new Set(cust.bumps ?? []);
  const newBumps = bumps.filter((b) => !had.has(b));
  const patch: Obj = {
    name: fullName || undefined,
    bumps: [...had, ...newBumps],
    updated_at: new Date().toISOString(),
  };
  await sb.from('customers').update(patch).eq('id', cust.id);
  // +1 pet: soma a vaga com trava otimista. Antes a vaga ia no mesmo update do pedido com um valor lido no início,
  // e se o aviso do kit e o do +1 pet chegassem juntos, o do kit gravava por cima e a vaga se perdia.
  for (let i = 0; extraPets && i < 5; i++) {
    const { data: cur } = await sb.from('customers').select('extra_pet_slots').eq('id', cust.id).maybeSingle();
    const n = cur?.extra_pet_slots ?? 0;
    const { data: ok } = await sb.from('customers').update({ extra_pet_slots: n + extraPets }).eq('id', cust.id).eq('extra_pet_slots', n).select('id');
    if (ok?.length) break;
  }
  // Libera o kit uma vez só (condicional: dois avisos ao mesmo tempo não mandam dois e-mails).
  let kitPaidNow = false;
  if (!addOn && !wasPaid) {
    const { data: freed } = await sb
      .from('customers')
      .update({ paid_at: new Date().toISOString(), refunded_at: null })
      .eq('id', cust.id)
      .is('paid_at', null)
      .select('id');
    kitPaidNow = !!freed?.length;
  }
  await sb.from('orders').update({ customer_id: cust.id }).eq('provider', 'kiwify').eq('provider_order_id', orderKey);

  const doNome = cust.pets?.[0] ? doPet(cust.pets[0].data) : undefined;
  const kitIsPaid = wasPaid || kitPaidNow;
  if (email) {
    // 1) Kit aprovado: e-mail para conferir os dados (se comprou +1 pet junto, o formulário já abre os dois).
    if (kitPaidNow) await sendConfirmEmail(email, cust.access_token, doNome);
    // 2) +1 pet aprovado depois do kit (outro Pix, por exemplo): convite para montar o kit do novo pet.
    else if (extraPets && kitIsPaid) await sendExtraPetEmail(email, cust.access_token);
    // 3) Cada order bump de conteúdo: um e-mail próprio com o PDF, na hora em que for aprovado.
    for (const f of bumpFiles(newBumps, settings)) await sendBumpEmail(email, f);
    // 4) Bump personalizado (Kit Natal, Figurinhas) aprovado quando o kit já foi gerado: chama para gerar na área.
    //    Se o kit ainda não foi gerado, ele sai junto com o kit, sem precisar de nada.
    if (cust.pets?.some((p) => p.submitted_at)) for (const b of personalBumps(newBumps, settings)) await sendPersonalBumpEmail(email, cust.access_token, b.name, doNome);
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
  await note(`${addOn ? (productIsExtraPet ? '+1 pet' : 'order bump') : 'kit'} pago · achou por: ${matchedBy}${kitPaidNow ? ' · e-mail de confirmação enviado' : ''}`);
  return json({ ok: true, customer: cust.id, extraPets, bumps: newBumps, capi, utmify });
}
