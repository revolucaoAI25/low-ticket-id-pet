'use client';

/**
 * Rastreamento do funil.
 * - Pixel da Meta (fbq), quando configurado no painel.
 * - Nosso próprio registro de etapas (/api/eventos), para ver em que tela as pessoas saem.
 * - UTMs guardadas na primeira visita e repassadas para o checkout (Utmify / Kiwify).
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const UTM_KEY = 'cdf:utms';
const SESSION_KEY = 'cdf:sid';
const FBC_KEY = 'cdf:fbc';
const TRACK_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'src', 'sck', 'xcod', 'fbclid'];

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* modo privado: segue sem salvar */
  }
}

export function sessionId(): string {
  let id = safeGet(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    safeSet(SESSION_KEY, id);
  }
  return id;
}

/** Guarda as UTMs da URL. Se a pessoa voltar por outro anúncio, as novas substituem. */
export function captureUtms(): Record<string, string> {
  const current = getUtms();
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const k of TRACK_KEYS) {
      const v = params.get(k);
      if (v) found[k] = v;
    }
    if (found.fbclid) safeSet(FBC_KEY, `fb.1.${Date.now()}.${found.fbclid}`);
    if (Object.keys(found).length) {
      safeSet(UTM_KEY, JSON.stringify(found));
      return found;
    }
  } catch {
    /* ignore */
  }
  return current;
}

export function getUtms(): Record<string, string> {
  try {
    return JSON.parse(safeGet(UTM_KEY) || '{}');
  } catch {
    return {};
  }
}

const STANDARD = new Set(['PageView', 'ViewContent', 'Lead', 'InitiateCheckout', 'AddToCart', 'CompleteRegistration', 'Contact', 'AddPaymentInfo']);

export function track(event: string, params: Record<string, unknown> = {}, opts: { step?: number; pixel?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  if (opts.pixel !== false && window.fbq) {
    try {
      if (STANDARD.has(event)) window.fbq('track', event, params);
      else window.fbq('trackCustom', event, params);
    } catch {
      /* ignore */
    }
  }
  const body = JSON.stringify({
    sessionId: sessionId(),
    event,
    step: opts.step ?? null,
    meta: params,
    utms: getUtms(),
    path: window.location.pathname,
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/eventos', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/eventos', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

/** Correspondência avançada do pixel (e-mail e telefone), depois que a pessoa preenche o contato. */
export function setPixelUserData(pixelId: string, email?: string, phone?: string) {
  if (!window.fbq || !pixelId) return;
  const ud: Record<string, string> = {};
  if (email) ud.em = email.trim().toLowerCase();
  if (phone) {
    const d = phone.replace(/\D/g, '');
    if (d) ud.ph = d.startsWith('55') ? d : '55' + d;
  }
  if (Object.keys(ud).length) {
    try {
      window.fbq('init', pixelId, ud);
    } catch {
      /* ignore */
    }
  }
}

export interface CheckoutInput {
  baseUrl: string;
  params: { name: string; email: string; phone: string };
  name?: string;
  email?: string;
  phone?: string;
}

/** Monta o link do checkout com os dados do quiz e as UTMs. */
export function buildCheckoutUrl(input: CheckoutInput): string {
  if (!input.baseUrl) return '';
  let url: URL;
  try {
    url = new URL(input.baseUrl);
  } catch {
    return input.baseUrl;
  }
  if (input.name) url.searchParams.set(input.params.name, input.name);
  if (input.email) url.searchParams.set(input.params.email, input.email.trim());
  if (input.phone) url.searchParams.set(input.params.phone, input.phone.replace(/\D/g, ''));
  const utms = { ...getUtms() };
  // Também repassa o que estiver na URL atual (caso o script da Utmify tenha acrescentado algo).
  try {
    new URLSearchParams(window.location.search).forEach((v, k) => {
      if (TRACK_KEYS.includes(k) && v) utms[k] = v;
    });
  } catch {
    /* ignore */
  }
  for (const [k, v] of Object.entries(utms)) {
    if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
  }
  return url.toString();
}

function cookie(name: string): string {
  try {
    return document.cookie.split('; ').find((c) => c.startsWith(name + '='))?.split('=')[1] ?? '';
  } catch {
    return '';
  }
}

/**
 * Identificadores do clique no anúncio (cookies do Pixel da Meta).
 * Guardados com o lead para o servidor enviar compras pela API de Conversões atribuídas à campanha certa.
 */
export function getMetaIds(): { fbp?: string; fbc?: string; ua?: string } {
  const fbp = cookie('_fbp');
  const fbc = cookie('_fbc') || safeGet(FBC_KEY) || '';
  return { fbp: fbp || undefined, fbc: fbc || undefined, ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined };
}
