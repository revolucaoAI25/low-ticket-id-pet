import 'server-only';

/**
 * Repasse de pedidos para a Utmify pela API de credenciais
 * (https://docs.utmify.com.br/envio-de-vendas). Usado para os pedidos que a Utmify não recebe
 * pelo webhook dela (order bumps e +1 pet, que a Kiwify registra como compras à parte).
 * Precisa de UTMIFY_API_TOKEN na Vercel (Utmify → Integrações → Webhooks → Credenciais de API).
 */

type Obj = Record<string, unknown>;

/** UTC no formato que a Utmify pede: YYYY-MM-DD HH:MM:SS */
function utc(d?: string | null): string | null {
  if (!d) return null;
  // A Kiwify manda as datas no horário de Brasília e sem fuso ("2026-11-18 01:40:12").
  // Antes isso era lido como UTC e a venda aparecia 3 h mais cedo na Utmify (bump das 23h caía no dia anterior).
  const iso = d.trim().replace(' ', 'T');
  const hasTz = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const t = new Date(hasTz ? iso : `${iso}-03:00`);
  if (isNaN(t.getTime())) return null;
  return t.toISOString().replace('T', ' ').slice(0, 19);
}

export interface UtmifyOrder {
  orderId: string;
  status: 'paid' | 'refunded' | 'chargedback' | 'waiting_payment' | 'refused';
  paymentMethod?: string;
  createdAt?: string | null;
  approvedAt?: string | null;
  refundedAt?: string | null;
  customer: { name?: string | null; email?: string | null; phone?: string | null; document?: string | null; ip?: string | null };
  product: { id: string; name: string; priceInCents: number };
  feeInCents?: number;
  netInCents?: number;
  /** UTMs guardadas com o lead (vindas do anúncio). */
  utms?: Obj | null;
}

/** Retorna true quando a Utmify aceitou, ou o motivo da falha (texto curto, vai para o log do painel). */
export async function sendUtmifyOrder(o: UtmifyOrder): Promise<true | string> {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) return 'sem UTMIFY_API_TOKEN';
  if (!o.product.priceInCents) return 'pedido sem valor';
  const u = (o.utms ?? {}) as Record<string, string | undefined>;
  const pm = (o.paymentMethod ?? '').toLowerCase();
  const created = utc(o.createdAt) ?? utc(new Date().toISOString())!;
  const body = {
    orderId: o.orderId,
    platform: 'Kiwify',
    paymentMethod: pm.includes('pix') ? 'pix' : pm.includes('boleto') ? 'boleto' : 'credit_card',
    status: o.status,
    createdAt: created,
    approvedDate: o.status === 'paid' || o.status === 'refunded' || o.status === 'chargedback' ? utc(o.approvedAt) ?? created : null,
    refundedAt: o.status === 'refunded' || o.status === 'chargedback' ? utc(o.refundedAt) ?? utc(new Date().toISOString()) : null,
    customer: {
      name: o.customer.name || 'Cliente',
      email: o.customer.email || '',
      phone: o.customer.phone || null,
      document: o.customer.document || null,
      country: 'BR',
      ...(o.customer.ip ? { ip: o.customer.ip } : {}),
    },
    products: [{ id: o.product.id, name: o.product.name, planId: null, planName: null, quantity: 1, priceInCents: o.product.priceInCents }],
    trackingParameters: {
      src: u.src ?? null,
      sck: u.sck ?? null,
      utm_source: u.utm_source ?? null,
      utm_campaign: u.utm_campaign ?? null,
      utm_medium: u.utm_medium ?? null,
      utm_content: u.utm_content ?? null,
      utm_term: u.utm_term ?? null,
    },
    commission: {
      totalPriceInCents: o.product.priceInCents,
      gatewayFeeInCents: o.feeInCents ?? 0,
      // Sem o líquido, a doc pede para repetir o total.
      userCommissionInCents: o.netInCents || o.product.priceInCents,
    },
    isTest: process.env.UTMIFY_TEST === '1',
  };
  try {
    const r = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-token': token },
      body: JSON.stringify(body),
    });
    if (r.ok) return true;
    const txt = (await r.text()).slice(0, 160);
    console.error('utmify', r.status, txt);
    return `HTTP ${r.status} ${txt}`;
  } catch (e) {
    console.error('utmify', e);
    return `erro de rede: ${String(e).slice(0, 80)}`;
  }
}
