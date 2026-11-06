import { db } from '@/lib/server/supabase';
import { compact, createPet, sanitizePet, savePhoto } from '@/lib/server/pets';
import { json, normEmail, normPhone, token } from '@/lib/server/util';

export const runtime = 'nodejs';

/** Salva o que a pessoa respondeu no quiz, ligado ao e-mail e telefone (tela de contato). */
export async function POST(req: Request) {
  const sb = db();
  if (!sb) return json({ offline: true }, 503);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json' }, 400);
  }
  const contact = (body.contact ?? {}) as Record<string, unknown>;
  if (contact.consent !== true) return json({ error: 'consent' }, 400);
  const email = normEmail(contact.email as string);
  const phone = normPhone(contact.phone as string);
  if (!email && phone.length < 10) return json({ error: 'contact' }, 400);

  const rawPet = (body.pet ?? {}) as Record<string, unknown>;
  const pet = sanitizePet(rawPet);
  // UTMs + identificadores do clique (fbp/fbc), IP e navegador: usados para atribuir compras à campanha (API de Conversões).
  const m = (body.meta && typeof body.meta === 'object' ? body.meta : {}) as Record<string, unknown>;
  const str = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : undefined);
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
  const utms = {
    ...(typeof body.utms === 'object' && body.utms ? body.utms : {}),
    _meta: { fbp: str(m.fbp, 120), fbc: str(m.fbc, 300), ua: str(m.ua, 400) ?? str(req.headers.get('user-agent'), 400), ip },
  };
  const lead = (body.lead ?? null) as { token?: string; petId?: string } | null;

  // Mesmo navegador refazendo o quiz antes de pagar: atualiza o mesmo registro.
  if (lead?.token && lead.petId) {
    const { data: cust } = await sb.from('customers').select('id, paid_at').eq('access_token', lead.token).maybeSingle();
    if (cust && !cust.paid_at) {
      await sb.from('customers').update({ email: email || null, phone: phone || null, utms, updated_at: new Date().toISOString() }).eq('id', cust.id);
      const { data: row } = await sb.from('pets').select('id, slug, data, photo_url').eq('id', lead.petId).eq('customer_id', cust.id).maybeSingle();
      if (row) {
        const url = await savePhoto(row.id, rawPet.photo);
        await sb
          .from('pets')
          .update({ data: { ...(row.data ?? {}), ...compact(pet) }, ...(url ? { photo_url: url } : {}), updated_at: new Date().toISOString() })
          .eq('id', row.id);
        return json({ token: lead.token, petId: row.id, slug: row.slug, photoUrl: url ?? row.photo_url });
      }
    }
  }

  const accessToken = token();
  const { data: cust, error } = await sb
    .from('customers')
    .insert({
      email: email || null,
      phone: phone || null,
      access_token: accessToken,
      consent_at: new Date().toISOString(),
      utms,
      session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
    })
    .select('id')
    .single();
  if (error || !cust) {
    console.error('lead insert', error?.message);
    return json({ error: 'db' }, 500);
  }
  const row = await createPet(cust.id, pet, rawPet.photo);
  if (!row) return json({ error: 'pet' }, 500);
  return json({ token: accessToken, petId: row.id, slug: row.slug, photoUrl: row.photo_url });
}
