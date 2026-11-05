import { isAdmin } from '@/lib/server/admin';
import { BUCKET_ASSETS, db } from '@/lib/server/supabase';
import { json, shortId } from '@/lib/server/util';

export const runtime = 'nodejs';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];

/**
 * Devolve uma URL assinada para o navegador enviar o arquivo direto para o Storage
 * (sem passar pelo servidor da Vercel, que limita o tamanho do envio).
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const { name, type, folder: rawFolder } = await req.json().catch(() => ({}));
  if (!ALLOWED.includes(type)) return json({ error: 'Tipo de arquivo não aceito' }, 400);
  const folder = String(rawFolder ?? 'geral').replace(/[^a-z0-9-]/gi, '').slice(0, 30) || 'geral';
  const ext = String(name ?? '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const base =
    String(name ?? 'arquivo')
      .replace(/\.[^.]+$/, '')
      .normalize('NFD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .slice(0, 40) || 'arquivo';
  const path = `${folder}/${base}-${shortId(6)}.${ext}`;
  const { data, error } = await sb.storage.from(BUCKET_ASSETS).createSignedUploadUrl(path);
  if (error || !data) return json({ error: error?.message ?? 'storage' }, 500);
  return json({ signedUrl: data.signedUrl, url: sb.storage.from(BUCKET_ASSETS).getPublicUrl(path).data.publicUrl });
}
