import 'server-only';
import { createHash } from 'crypto';
import { siteUrl } from '@/lib/site-url';

const sha = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

export interface CapiPurchase {
  pixelId: string;
  orderId: string;
  value: number;
  contentName: string;
  email?: string | null;
  phone?: string | null;
  externalId?: string;
  /** Guardado com o lead: cookies do pixel, IP e navegador de quem clicou no anúncio. */
  meta?: { fbp?: string; fbc?: string; ip?: string; ua?: string } | null;
  /** Hora da compra (segundos Unix). Padrão: agora. A Meta só aceita até 7 dias atrás. */
  eventTime?: number;
}

/**
 * Envia uma compra para a Meta pela API de Conversões (servidor).
 * Com fbc/fbp (clique no anúncio) e e-mail/telefone, a Meta atribui à campanha/anúncio de origem.
 * Precisa de META_CAPI_TOKEN na Vercel; sem ele, não faz nada.
 */
export async function sendCapiPurchase(p: CapiPurchase): Promise<boolean> {
  return (await capiPurchase(p)) === true;
}

/** Igual ao sendCapiPurchase, mas devolve o motivo quando a Meta não aceita (para o painel mostrar). */
export async function capiPurchase(p: CapiPurchase): Promise<true | string> {
  const token = process.env.META_CAPI_TOKEN;
  const pixel = p.pixelId.replace(/\D/g, '');
  if (!token) return 'falta META_CAPI_TOKEN na Vercel';
  if (!pixel) return 'falta o ID do Pixel da Meta no painel (Rastreamento)';
  const digits = (p.phone ?? '').replace(/\D/g, '');
  const user_data: Record<string, unknown> = {};
  if (p.email) user_data.em = [sha(p.email)];
  if (digits) user_data.ph = [sha(digits.startsWith('55') ? digits : '55' + digits)];
  if (p.externalId) user_data.external_id = [sha(p.externalId)];
  if (p.meta?.fbp) user_data.fbp = p.meta.fbp;
  if (p.meta?.fbc) user_data.fbc = p.meta.fbc;
  if (p.meta?.ip) user_data.client_ip_address = p.meta.ip;
  if (p.meta?.ua) user_data.client_user_agent = p.meta.ua;
  const body: Record<string, unknown> = {
    data: [
      {
        event_name: 'Purchase',
        event_time: p.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: `kiwify-${p.orderId}`,
        action_source: 'website',
        event_source_url: `${siteUrl()}/obrigado`,
        user_data,
        custom_data: { currency: 'BRL', value: Math.round(p.value * 100) / 100, content_name: p.contentName, order_id: p.orderId },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) return true;
    const txt = await r.text();
    console.error('capi', r.status, txt);
    let msg = txt.slice(0, 200);
    try {
      const e = JSON.parse(txt).error;
      msg = [e?.error_user_title, e?.error_user_msg || e?.message].filter(Boolean).join(': ').slice(0, 220);
    } catch {
      /* texto puro */
    }
    return `Meta HTTP ${r.status}: ${msg}`;
  } catch (e) {
    console.error('capi', e);
    return `erro de rede: ${String(e).slice(0, 80)}`;
  }
}

/** Kiwify manda valores em centavos (ex.: 990 = R$ 9,90). Aceita também reais, por segurança. */
export function kiwifyValue(raw: number | null | undefined): number {
  if (!raw || !Number.isFinite(raw)) return 0;
  return Number.isInteger(raw) && raw >= 100 ? raw / 100 : raw;
}
