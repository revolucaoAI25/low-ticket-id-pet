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
  const t = new Date(d.includes('T') || d.includes('Z') ? d : d.replace(' ', 'T') + 'Z');
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

export async function sendUtmifyOrder(o: UtmifyOrder): Promise<boolean> {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token || !o.product.priceInCents) return false;
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
    if (!r.ok) console.error('utmify', r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error('utmify', e);
    return false;
  }
}
