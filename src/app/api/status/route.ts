import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

/**
 * A página de obrigado consulta aqui até o pagamento ser confirmado pelo webhook.
 * Se a compra caiu em outro cadastro com o mesmo e-mail (quiz feito em outro aparelho, por exemplo),
 * devolve o link desse cadastro pago, para a pessoa não ficar presa esperando.
 */
export async function GET(req: Request) {
  const t = new URL(req.url).searchParams.get('token');
  const sb = db();
  if (!sb || !t) return json({ paid: false });
  const { data } = await sb.from('customers').select('email, paid_at, refunded_at').eq('access_token', t).maybeSingle();
  if (data?.paid_at && !data.refunded_at) return json({ paid: true, found: true });
  if (data?.email) {
    const since = new Date(Date.now() - 6 * 3600_000).toISOString();
    const { data: other } = await sb
      .from('customers')
      .select('access_token')
      .eq('email', data.email)
      .gte('paid_at', since)
      .is('refunded_at', null)
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (other?.access_token) return json({ paid: true, found: true, token: other.access_token });
  }
  return json({ paid: false, found: !!data });
}
