import 'server-only';
import { randomBytes } from 'crypto';

export function token(len = 24): string {
  return randomBytes(len).toString('base64url');
}

const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
export function shortId(n = 4): string {
  const b = randomBytes(n);
  return Array.from(b, (x) => ALPHA[x % ALPHA.length]).join('');
}

export function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'pet'
  );
}

export function digits(s?: string | null): string {
  return (s ?? '').replace(/\D/g, '');
}

/** Telefone brasileiro só com dígitos, sem o 55. */
export function normPhone(s?: string | null): string {
  const d = digits(s);
  return d.length > 11 && d.startsWith('55') ? d.slice(2) : d;
}

export function normEmail(s?: string | null): string {
  return (s ?? '').trim().toLowerCase();
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}
