import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

/** A página de obrigado consulta aqui até o pagamento ser confirmado pelo webhook. */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('token');
  const sb = db();
  if (!sb || !t) return json({ paid: false });
  const { data } = await sb.from('customers').select('paid_at, refunded_at').eq('access_token', t).maybeSingle();
  return json({ paid: !!data?.paid_at && !data?.refunded_at, found: !!data });
}
