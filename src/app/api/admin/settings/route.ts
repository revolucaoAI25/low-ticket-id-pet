import { revalidateTag } from 'next/cache';
import { mergeSettings, type SiteSettings } from '@/config/site';
import { isAdmin } from '@/lib/server/admin';
import { SETTINGS_TAG, getSettingsFresh } from '@/lib/server/settings';
import { db } from '@/lib/server/supabase';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  return json({ settings: await getSettingsFresh(), db: !!db() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return json({ error: 'unauthorized' }, 401);
  const sb = db();
  if (!sb) return json({ error: 'Supabase não configurado' }, 503);
  const body = (await req.json().catch(() => null)) as Partial<SiteSettings> | null;
  if (!body) return json({ error: 'json' }, 400);
  const settings = mergeSettings(body);
  const { error } = await sb.from('settings').upsert({ id: 'site', data: settings, updated_at: new Date().toISOString() });
  if (error) return json({ error: error.message }, 500);
  revalidateTag(SETTINGS_TAG);
  return json({ ok: true, settings });
}
