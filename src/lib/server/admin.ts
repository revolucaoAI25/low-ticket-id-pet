import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'cdf_admin';

function sign(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac('sha256', pw).update('clube-do-focinho-admin').digest('hex');
}

export function checkPassword(pw: string): string | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !pw) return null;
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return sign();
}

export async function isAdmin(): Promise<boolean> {
  const sig = sign();
  if (!sig) return false;
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!c || c.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(c), Buffer.from(sig));
}
