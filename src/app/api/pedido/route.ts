import { doPet, type PetData } from '@/lib/pet';
import { sendExtrasEmail, sendKitEmail, type KitFile } from '@/lib/server/email';
import { bumpFiles, personalBumps } from '@/lib/server/bumps';
import { fixedBonusLinks } from '@/lib/server/notify';
import { getSettings } from '@/lib/server/settings';
import { createPet, petOut, sanitizePet, saveExtraPhotos, savePhoto, type PetRow } from '@/lib/server/pets';
import { BUCKET_KITS, db, fichaPath } from '@/lib/server/supabase';
import { json, normPhone } from '@/lib/server/util';
import { siteUrl } from '@/lib/site-url';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function loadCustomer(tokenValue: unknown) {
  const sb = db();
  if (!sb || typeof tokenValue !== 'string' || tokenValue.length < 16) return null;
  const { data } = await sb
    .from('customers')
    .select('id, email, phone, name, paid_at, refunded_at, extra_pet_slots, bumps, access_token')
    .eq('access_token', tokenValue)
    .maybeSingle();
  return data;
}

/** Página de confirmação: dados do pedido e dos pets. */
export async function GET(req: Request) {
  const sb = db();
  if (!sb) return json({ error: 'offline' }, 503);
  const cust = await loadCustomer(new URL(req.url).searchParams.get('token'));
  if (!cust) return json({ error: 'not_found' }, 404);
  const paid = !!cust.paid_at && !cust.refunded_at;
  if (!paid) return json({ paid: false, refunded: !!cust.refunded_at });
  const { data: pets } = await sb.from('pets').select('*').eq('customer_id', cust.id).order('created_at');
  const list = ((pets as PetRow[]) ?? []).map(petOut);
  // PDFs prontos que entram no fim do PDF do kit: bônus fixos + order bumps comprados.
  const settings = await getSettings();
  const bonus = [...(await fixedBonusLinks(list[0]?.data ?? {})), ...bumpFiles(cust.bumps, settings)];
  return json({
    // Order bumps personalizados comprados (gerados no navegador com a foto do pet).
    extras: personalBumps(cust.bumps, settings),
    paid: true,
    customer: { email: cust.email, phone: cust.phone, name: cust.name },
    petsAllowed: 1 + (cust.extra_pet_slots ?? 0),
    pets: list,
    bonusLinks: bonus,
  });
}

export async function POST(req: Request) {
  const sb = db();
  if (!sb) return json({ error: 'offline' }, 503);
  const body = await req.json().catch(() => ({}));
  const cust = await loadCustomer(body.token);
  if (!cust || !cust.paid_at || cust.refunded_at) return json({ error: 'forbidden' }, 403);

  // 1) Salvar os dados conferidos (e as fotos)
  if (body.action === 'save') {
    const input = body.pet ?? {};
    const raw = (input.data ?? {}) as PetData & Record<string, unknown>;
    const clean = sanitizePet(raw);
    let row: PetRow | null = null;
    if (input.id) {
      const { data } = await sb.from('pets').select('*').eq('id', input.id).eq('customer_id', cust.id).maybeSingle();
      if (!data) return json({ error: 'pet_not_found' }, 404);
      if ((data as PetRow).submitted_at) return json({ error: 'locked' }, 409);
      row = data as PetRow;
    } else {
      const { count } = await sb.from('pets').select('id', { count: 'exact', head: true }).eq('customer_id', cust.id);
      if ((count ?? 0) >= 1 + (cust.extra_pet_slots ?? 0)) return json({ error: 'limit' }, 402);
      row = await createPet(cust.id, clean);
      if (!row) return json({ error: 'db' }, 500);
    }
    const photoUrl = await savePhoto(row.id, raw.photo);
    const extraPhotos = await saveExtraPhotos(row.id, raw.extras?.photos);
    const data: PetData = { ...clean, extras: { ...(clean.extras ?? {}), photos: extraPhotos } };
    const { data: saved } = await sb
      .from('pets')
      .update({ data, ...(photoUrl ? { photo_url: photoUrl } : {}), updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .select('*')
      .single();
    // Telefone principal: o do primeiro tutor, se informado.
    const firstPhone = normPhone(data.tutors?.find((t) => t.phone)?.phone);
    if (firstPhone && !cust.phone) await sb.from('customers').update({ phone: firstPhone }).eq('id', cust.id);
    return json({ pet: petOut(saved as PetRow) });
  }

  // 2) URLs para o navegador enviar os arquivos gerados direto para o Storage
  if (body.action === 'upload-urls') {
    const { data: pet } = await sb.from('pets').select('id, slug, submitted_at').eq('id', body.petId).eq('customer_id', cust.id).maybeSingle();
    if (!pet) return json({ error: 'pet_not_found' }, 404);
    if (pet.submitted_at) return json({ error: 'locked' }, 409);
    const names: string[] = Array.isArray(body.files) ? body.files.slice(0, 80) : [];
    const out: Record<string, { signedUrl: string; path: string }> = {};
    for (const n of names) {
      const safe = String(n).replace(/[^a-zA-Z0-9._-]/g, '');
      if (!safe) continue;
      const path = safe === 'ficha.jpg' ? fichaPath(pet.slug) : `${pet.id}/${safe}`;
      const { data, error } = await sb.storage.from(BUCKET_KITS).createSignedUploadUrl(path, { upsert: true });
      if (error || !data) return json({ error: error?.message ?? 'storage' }, 500);
      out[safe] = { signedUrl: data.signedUrl, path };
    }
    return json({ urls: out });
  }

  // 3) Finalizar: grava os arquivos, trava a edição e manda o e-mail
  if (body.action === 'finish') {
    const { data: row } = await sb.from('pets').select('*').eq('id', body.petId).eq('customer_id', cust.id).maybeSingle();
    if (!row) return json({ error: 'pet_not_found' }, 404);
    const pet = row as PetRow;
    const incoming: { name: string; path: string; kind: KitFile['kind'] }[] = Array.isArray(body.files) ? body.files : [];
    const files: KitFile[] = incoming
      .filter((f) => typeof f.path === 'string' && (f.path.startsWith(`${pet.id}/`) || f.path === fichaPath(pet.slug)))
      .map((f) => ({ name: String(f.name).slice(0, 80), kind: f.kind, url: sb.storage.from(BUCKET_KITS).getPublicUrl(f.path).data.publicUrl }));
    await sb.from('pets').update({ files, submitted_at: new Date().toISOString() }).eq('id', pet.id);
    // Guias fixos (anexados) e order bumps (link; o PDF de cada um já foi num e-mail próprio).
    const extras = [...(await fixedBonusLinks(pet.data)), ...bumpFiles(cust.bumps, await getSettings())];
    const emailed = cust.email ? await sendKitEmail(cust.email, doPet(pet.data), files, extras, `${siteUrl()}/confirmar/${cust.access_token}`) : false;
    return json({ ok: true, files, emailed });
  }

  // 4) Order bumps personalizados de um pet que já recebeu o kit (bump aprovado depois, ou gerar de novo).
  if (body.action === 'extra-upload-urls' || body.action === 'extra-finish' || body.action === 'extra-photos') {
    const owned = new Set(personalBumps(cust.bumps, await getSettings()).map((b) => (b.kind === 'natal' ? 'natal' : 'figurinha')));
    const allowed = (n: string) => [...owned].some((k) => n.startsWith(k));
    const { data: row } = await sb.from('pets').select('*').eq('id', body.petId).eq('customer_id', cust.id).maybeSingle();
    if (!row) return json({ error: 'pet_not_found' }, 404);
    const pet = row as PetRow;
    if (!owned.size) return json({ error: 'not_owned' }, 403);
    // Fotos novas para os bumps personalizados (o kit já gerado não muda): até 6 no total.
    if (body.action === 'extra-photos') {
      const current = pet.data.extras?.photos ?? [];
      const incoming: unknown[] = Array.isArray(body.photos) ? body.photos.slice(0, 5) : [];
      const added: string[] = [];
      for (const [i, ph] of incoming.entries()) {
        if (current.length + added.length + (pet.photo_url ? 1 : 0) >= 6) break;
        const url = await savePhoto(pet.id, ph, `bump${i}`);
        if (url) added.push(url);
      }
      const data: PetData = { ...pet.data, extras: { ...(pet.data.extras ?? {}), photos: [...current, ...added] } };
      const { data: saved } = await sb.from('pets').update({ data, updated_at: new Date().toISOString() }).eq('id', pet.id).select('*').single();
      return json({ pet: petOut(saved as PetRow) });
    }
    if (body.action === 'extra-upload-urls') {
      const names: string[] = Array.isArray(body.files) ? body.files.slice(0, 80) : [];
      const out: Record<string, { signedUrl: string; path: string }> = {};
      for (const n of names) {
        const safe = String(n).replace(/[^a-zA-Z0-9._-]/g, '');
        if (!safe || !allowed(safe)) return json({ error: 'not_owned' }, 403);
        const path = `${pet.id}/${safe}`;
        const { data, error } = await sb.storage.from(BUCKET_KITS).createSignedUploadUrl(path, { upsert: true });
        if (error || !data) return json({ error: error?.message ?? 'storage' }, 500);
        out[safe] = { signedUrl: data.signedUrl, path };
      }
      return json({ urls: out });
    }
    const incoming: { name: string; path: string; kind: KitFile['kind'] }[] = Array.isArray(body.files) ? body.files : [];
    const fresh: KitFile[] = incoming
      .filter((f) => typeof f.path === 'string' && f.path.startsWith(`${pet.id}/`) && allowed(f.path.slice(pet.id.length + 1)))
      .map((f) => ({ name: String(f.name).slice(0, 80), kind: f.kind, url: sb.storage.from(BUCKET_KITS).getPublicUrl(f.path).data.publicUrl }));
    const kinds = new Set(fresh.map((f) => f.kind));
    const files = [...(pet.files ?? []).filter((f) => !kinds.has(f.kind as KitFile['kind'])), ...fresh];
    await sb.from('pets').update({ files }).eq('id', pet.id);
    const emailed = cust.email ? await sendExtrasEmail(cust.email, doPet(pet.data), fresh, `${siteUrl()}/confirmar/${cust.access_token}`) : false;
    return json({ ok: true, files, emailed });
  }

  return json({ error: 'action' }, 400);
}
