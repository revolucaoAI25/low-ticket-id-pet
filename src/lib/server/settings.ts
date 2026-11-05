import 'server-only';
import { unstable_cache } from 'next/cache';
import { mergeSettings, type SiteSettings } from '@/config/site';
import { db } from './supabase';

export const SETTINGS_TAG = 'settings';

async function load(): Promise<SiteSettings> {
  const sb = db();
  if (!sb) return mergeSettings(null);
  const { data, error } = await sb.from('settings').select('data').eq('id', 'site').maybeSingle();
  if (error) {
    console.error('settings load', error.message);
    return mergeSettings(null);
  }
  return mergeSettings((data?.data as Partial<SiteSettings>) ?? null);
}

/** Configurações do site (cache de 5 min, renovado na hora quando o painel salva). */
export const getSettings = unstable_cache(load, ['site-settings'], { tags: [SETTINGS_TAG], revalidate: 300 });

export async function getSettingsFresh(): Promise<SiteSettings> {
  return load();
}
