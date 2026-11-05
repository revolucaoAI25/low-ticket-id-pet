import { getSettings } from '@/lib/server/settings';
import { compact, createPet, petOut, sanitizePet, savePhoto, type PetRow } from '@/lib/server/pets';
import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

async function loadCustomer(tokenValue: unknown) {
  const sb = db();
  if (!sb || typeof tokenValue !== 'string' || tokenValue.length < 16) return null;
  const { data } = await sb
    .from('customers')
    .select('id, email, phone, name, paid_at, refunded_at, extra_pet_slots, access_token')
    .eq('access_token', tokenValue)
    .maybeSingle();
  return data;
}

/** Área do pet: dados do tutor, pets e arquivos dos bônus. Acesso pelo link mágico (token). */
export async function GET(req: Request) {
  const sb = db();
  if (!sb) return json({ error: 'offline' }, 503);
  const cust = await loadCustomer(new URL(req.url).searchParams.get('token'));
  if (!cust) return json({ error: 'not_found' }, 404);
  const paid = !!cust.paid_at && !cust.refunded_at;
  if (!paid) return json({ paid: false, refunded: !!cust.refunded_at });
  const { data: pets } = await sb.from('pets').select('*').eq('customer_id', cust.id).order('created_at');
  const settings = await getSettings();
  return json({
    paid: true,
    customer: { email: cust.email, phone: cust.phone, name: cust.name },
    petsAllowed: 1 + (cust.extra_pet_slots ?? 0),
    pets: ((pets as PetRow[]) ?? []).map(petOut),
    files: settings.files,
    extraPetCheckout: settings.checkout.extraPet,
  });
}

export async function POST(req: Request) {
  const sb = db();
  if (!sb) return json({ error: 'offline' }, 503);
  const body = await req.json().catch(() => ({}));
  const cust = await loadCustomer(body.token);
  if (!cust || !cust.paid_at || cust.refunded_at) return json({ error: 'forbidden' }, 403);

  if (body.action === 'contact') {
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '').slice(0, 13) : undefined;
    await sb.from('customers').update({ phone: phone || null, updated_at: new Date().toISOString() }).eq('id', cust.id);
    return json({ ok: true });
  }

  if (body.action === 'create') {
    const { count } = await sb.from('pets').select('id', { count: 'exact', head: true }).eq('customer_id', cust.id);
    if ((count ?? 0) >= 1 + (cust.extra_pet_slots ?? 0)) return json({ error: 'limit' }, 402);
    const row = await createPet(cust.id, sanitizePet(body.data), body.data?.photo);
    if (!row) return json({ error: 'db' }, 500);
    return json({ pet: petOut(row) });
  }

  const { data: row } = await sb.from('pets').select('*').eq('id', body.petId).eq('customer_id', cust.id).maybeSingle();
  if (!row) return json({ error: 'pet_not_found' }, 404);
  const pet = row as PetRow;

  if (body.action === 'lost') {
    const on = body.on === true;
    const { data } = await sb
      .from('pets')
      .update({ lost_mode: on, lost_since: on ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq('id', pet.id)
      .select('*')
      .single();
    return json({ pet: petOut(data as PetRow) });
  }

  if (body.action === 'update') {
    const clean = sanitizePet({ ...pet.data, ...(body.data ?? {}) });
    const merged = { ...pet.data, ...compact(clean) };
    // permite apagar campos de texto (o compact só tira undefined)
    for (const k of Object.keys(body.data ?? {})) if (body.data[k] === '' || body.data[k] === null) delete (merged as Record<string, unknown>)[k];
    const url = await savePhoto(pet.id, body.data?.photo);
    const { data } = await sb
      .from('pets')
      .update({ data: merged, ...(url ? { photo_url: url } : {}), updated_at: new Date().toISOString() })
      .eq('id', pet.id)
      .select('*')
      .single();
    return json({ pet: petOut(data as PetRow) });
  }

  return json({ error: 'action' }, 400);
}
