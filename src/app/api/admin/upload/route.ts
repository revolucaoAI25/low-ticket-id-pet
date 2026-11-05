import { isAdmin } from '@/lib/server/admin';
import { BUCKET_ASSETS, db } from '@/lib/server/supabase';
import { json, shortId } from '@/lib/server/util';

export const runtime = 'nodejs';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];

export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const form = await req.formData();
  const file = form.get('file');
  const folder = String(form.get('folder') ?? 'geral').replace(/[^a-z0-9-]/gi, '').slice(0, 30) || 'geral';
  if (!(file instanceof File)) return json({ error: 'arquivo' }, 400);
  if (!ALLOWED.includes(file.type)) return json({ error: 'Tipo de arquivo não aceito' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'Arquivo maior que 4 MB' }, 400);
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const base = file.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40) || 'arquivo';
  const path = `${folder}/${base}-${shortId(6)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET_ASSETS).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) return json({ error: error.message }, 500);
  return json({ url: sb.storage.from(BUCKET_ASSETS).getPublicUrl(path).data.publicUrl });
}
