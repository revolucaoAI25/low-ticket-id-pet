import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Cliente do Supabase com a service role (só no servidor). Retorna null se não estiver configurado. */
export function db(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export const BUCKET_PHOTOS = 'pet-photos';
export const BUCKET_ASSETS = 'site-assets';
export const BUCKET_KITS = 'kits';

/** Caminho fixo da identidade do pet (o QR Code aponta para ela via /q/[código]). */
export const fichaPath = (slug: string) => `fichas/${slug}.jpg`;

/** Envia um dataURL (imagem) para o Storage e devolve a URL pública. */
export async function uploadDataUrl(bucket: string, path: string, dataUrl: string): Promise<string | null> {
  const sb = db();
  if (!sb) return null;
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 4 * 1024 * 1024) return null;
  const { error } = await sb.storage.from(bucket).upload(path, buf, { contentType: m[1], upsert: true });
  if (error) {
    console.error('upload error', error.message);
    return null;
  }
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
