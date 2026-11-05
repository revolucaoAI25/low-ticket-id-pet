import { resendCustomer } from '@/lib/server/notify';
import { db } from '@/lib/server/supabase';
import { json, normEmail } from '@/lib/server/util';

export const runtime = 'nodejs';

/** Reenvia o kit (ou o link de confirmação) para o e-mail da compra. Nunca revela se o e-mail existe. */
export async function POST(req: Request) {
  const sb = db();
  const { email: raw } = await req.json().catch(() => ({ email: '' }));
  const email = normEmail(raw);
  if (sb && email) {
    const { data } = await sb
      .from('customers')
      .select('email, access_token, pets(data, files, submitted_at)')
      .eq('email', email)
      .not('paid_at', 'is', null)
      .is('refunded_at', null)
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) await resendCustomer(data as never);
  }
  return json({ ok: true });
}
