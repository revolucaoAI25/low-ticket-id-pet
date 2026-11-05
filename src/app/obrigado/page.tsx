import type { Metadata } from 'next';
import { getSettings } from '@/lib/server/settings';
import { Obrigado } from './Obrigado';

export const metadata: Metadata = { title: 'Obrigado! · Clube do Focinho', robots: { index: false } };

export default async function ObrigadoPage() {
  const settings = await getSettings();
  return <Obrigado supportEmail={settings.support.email} />;
}
