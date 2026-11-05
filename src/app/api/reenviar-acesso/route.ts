import { doPet } from '@/lib/pet';
import { sendAccessEmail } from '@/lib/server/email';
import { db } from '@/lib/server/supabase';
import { json, normEmail } from '@/lib/server/util';

export const runtime = 'nodejs';

/** Reenvia o link de acesso para o e-mail da compra. Nunca revela se o e-mail existe. */
export async function POST(req: Request) {
  const sb = db();
  const { email: raw } = await req.json().catch(() => ({ email: '' }));
  const email = normEmail(raw);
  if (sb && email) {
    const { data } = await sb
      .from('customers')
      .select('id, access_token, pets(data)')
      .eq('email', email)
      .not('paid_at', 'is', null)
      .is('refunded_at', null)
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      const pets = (data as unknown as { pets?: { data: Record<string, unknown> }[] }).pets ?? [];
      await sendAccessEmail(email, data.access_token, pets[0] ? doPet(pets[0].data) : undefined);
    }
  }
  return json({ ok: true });
}
