import 'server-only';
import { PERSONALITIES, type PetData, type PetExtras } from '@/lib/pet';
import { SPECIES } from '@/lib/species';
import { BUCKET_PHOTOS, db, uploadDataUrl } from './supabase';
import { shortId, slugify } from './util';

const str = (v: unknown, max = 120): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
};

const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | undefined => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : undefined);

type Rec = Record<string, unknown>;

function sanitizeExtras(e: unknown): PetExtras | undefined {
  if (!e || typeof e !== 'object') return undefined;
  const x = e as Rec;
  const out: PetExtras = {};
  const short = ['coat', 'size', 'weight', 'microchip', 'rgAnimal', 'vetName', 'vetClinic', 'vetPhone'] as const;
  const long = ['allergies', 'medications', 'conditions', 'food', 'feedingTimes', 'walks', 'habits', 'forbidden'] as const;
  for (const k of short) out[k] = str(x[k], 80);
  for (const k of long) out[k] = str(x[k], 300);
  const color = str(x.favoriteColor, 9);
  if (color && /^#[0-9a-fA-F]{6}$/.test(color)) out.favoriteColor = color;
  if (Array.isArray(x.photos)) out.photos = x.photos.filter((u): u is string => typeof u === 'string' && /^https:\/\//.test(u)).slice(0, 3);
  if (Array.isArray(x.contacts)) {
    out.contacts = x.contacts
      .slice(0, 3)
      .map((c) => ({ name: str((c as Rec)?.name, 60) ?? '', phone: str((c as Rec)?.phone, 30) ?? '', relation: str((c as Rec)?.relation, 40) }))
      .filter((c) => c.name || c.phone);
  }
  return out;
}

/** Aceita só os campos conhecidos (o que vem do navegador não é confiável). As fotos são tratadas à parte. */
export function sanitizePet(input: unknown): PetData {
  const p = (input && typeof input === 'object' ? input : {}) as Rec;
  const team = p.team as Rec | undefined;
  const address = (p.address && typeof p.address === 'object' ? p.address : {}) as Rec;
  const date = str(p.date, 10);
  const tutors = Array.isArray(p.tutors)
    ? p.tutors
        .slice(0, 4)
        .map((t) => ({ name: str((t as Rec)?.name, 60) ?? '', phone: str((t as Rec)?.phone, 30) }))
        .filter((t) => t.name || t.phone)
    : undefined;
  return {
    species: oneOf(p.species, SPECIES.map((s) => s.id)),
    name: str(p.name, 40),
    breed: str(p.breed, 60),
    sex: oneOf(p.sex, ['macho', 'femea', 'nao-sei'] as const),
    personality: oneOf(p.personality, Object.keys(PERSONALITIES) as (keyof typeof PERSONALITIES)[]),
    origin: oneOf(p.origin, ['nascimento', 'adocao'] as const),
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    team: team && typeof team === 'object' ? { id: str(team.id, 40) ?? null, name: str(team.name, 60) ?? '', none: team.none === true || undefined } : undefined,
    tutors,
    address: { street: str(address.street, 120), district: str(address.district, 60), city: str(address.city, 60) },
    extras: sanitizeExtras(p.extras),
  };
}

/** Remove chaves vazias para não apagar dados ao mesclar. */
export function compact<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export interface PetRow {
  id: string;
  customer_id: string;
  slug: string;
  data: PetData;
  photo_url: string | null;
  files: { name: string; url: string; kind: string }[] | null;
  submitted_at: string | null;
  created_at: string;
}

export function petOut(r: PetRow) {
  return { id: r.id, slug: r.slug, data: { ...r.data, photo: r.photo_url ?? undefined }, files: r.files ?? [], submitted: !!r.submitted_at };
}

export function newSlug(name?: string): string {
  return `${slugify(name || 'pet').slice(0, 14)}-${shortId(6)}`;
}

/** Envia a foto (dataURL) e devolve a URL pública. */
export async function savePhoto(petId: string, photo?: unknown, tag = 'foto'): Promise<string | null> {
  if (typeof photo !== 'string' || !photo.startsWith('data:image/')) return null;
  return uploadDataUrl(BUCKET_PHOTOS, `${petId}/${tag}-${Date.now()}.jpg`, photo);
}

/** Fotos extras: envia as novas (dataURL) e mantém as que já são URL. */
export async function saveExtraPhotos(petId: string, photos: unknown): Promise<string[]> {
  if (!Array.isArray(photos)) return [];
  const out: string[] = [];
  for (const [i, ph] of photos.slice(0, 3).entries()) {
    if (typeof ph !== 'string') continue;
    if (ph.startsWith('https://')) out.push(ph);
    else {
      const url = await savePhoto(petId, ph, `extra${i}`);
      if (url) out.push(url);
    }
  }
  return out;
}

export async function createPet(customerId: string, data: PetData, photo?: unknown): Promise<PetRow | null> {
  const sb = db();
  if (!sb) return null;
  for (let i = 0; i < 3; i++) {
    const { data: row, error } = await sb.from('pets').insert({ customer_id: customerId, slug: newSlug(data.name), data }).select('*').single();
    if (!error && row) {
      const url = await savePhoto(row.id, photo);
      if (url) {
        await sb.from('pets').update({ photo_url: url }).eq('id', row.id);
        row.photo_url = url;
      }
      return row as PetRow;
    }
    if (error && !String(error.message).includes('duplicate')) {
      console.error('createPet', error.message);
      return null;
    }
  }
  return null;
}
