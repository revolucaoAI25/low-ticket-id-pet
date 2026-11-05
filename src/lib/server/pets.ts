import 'server-only';
import { rgColors } from '@/config/brand';
import { PERSONALITIES, PLACES, type PetData, type PetExtras } from '@/lib/pet';
import { SPECIES } from '@/lib/species';
import { BUCKET_PHOTOS, db, uploadDataUrl } from './supabase';
import { shortId, slugify } from './util';

const str = (v: unknown, max = 120): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
};

const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | undefined => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : undefined);

function sanitizeExtras(e: unknown): PetExtras | undefined {
  if (!e || typeof e !== 'object') return undefined;
  const x = e as Record<string, unknown>;
  const out: PetExtras = {};
  for (const k of ['coat', 'size', 'weight', 'microchip', 'rgAnimal', 'vetName', 'vetClinic', 'vetPhone', 'reward'] as const) out[k] = str(x[k], 80);
  for (const k of ['allergies', 'medications', 'conditions', 'food', 'feedingTimes', 'walks', 'habits', 'forbidden', 'lostMessage'] as const) out[k] = str(x[k], 400);
  if (typeof x.showPhone === 'boolean') out.showPhone = x.showPhone;
  if (Array.isArray(x.contacts)) {
    out.contacts = x.contacts
      .slice(0, 4)
      .map((c) => ({ name: str((c as Record<string, unknown>)?.name, 60) ?? '', phone: str((c as Record<string, unknown>)?.phone, 30) ?? '', relation: str((c as Record<string, unknown>)?.relation, 40) }))
      .filter((c) => c.name || c.phone);
  }
  return out;
}

/** Aceita só os campos conhecidos (o que vem do navegador não é confiável). A foto é tratada à parte. */
export function sanitizePet(input: unknown): PetData {
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const team = p.team as Record<string, unknown> | undefined;
  const date = str(p.date, 10);
  return {
    species: oneOf(p.species, SPECIES.map((s) => s.id)),
    name: str(p.name, 40),
    breed: str(p.breed, 60),
    sex: oneOf(p.sex, ['macho', 'femea', 'nao-sei'] as const),
    personality: oneOf(p.personality, Object.keys(PERSONALITIES) as (keyof typeof PERSONALITIES)[]),
    origin: oneOf(p.origin, ['nascimento', 'adocao'] as const),
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    place: oneOf(p.place, Object.keys(PLACES) as (keyof typeof PLACES)[]),
    team: team && typeof team === 'object' ? { id: str(team.id, 40) ?? null, name: str(team.name, 60) ?? '', none: team.none === true || undefined } : undefined,
    tutors: str(p.tutors, 80),
    city: str(p.city, 60),
    rgColor: oneOf(p.rgColor, Object.keys(rgColors) as (keyof typeof rgColors)[]),
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
  lost_mode: boolean;
  lost_since: string | null;
  created_at: string;
}

export function petOut(r: PetRow) {
  return { id: r.id, slug: r.slug, data: { ...r.data, photo: r.photo_url ?? undefined }, lostMode: r.lost_mode, lostSince: r.lost_since };
}

export function newSlug(name?: string): string {
  return `${slugify(name || 'pet')}-${shortId(4)}`;
}

/** Envia a foto (dataURL) e devolve a URL pública. */
export async function savePhoto(petId: string, photo?: unknown): Promise<string | null> {
  if (typeof photo !== 'string' || !photo.startsWith('data:image/')) return null;
  return uploadDataUrl(BUCKET_PHOTOS, `${petId}/${Date.now()}.jpg`, photo);
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
