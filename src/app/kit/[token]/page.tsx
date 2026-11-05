import type { Metadata } from 'next';
import { getSettings } from '@/lib/server/settings';
import { KitArea } from './KitArea';

export const metadata: Metadata = { title: 'Meu kit · Clube do Focinho', robots: { index: false, follow: false } };

export default async function KitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const settings = await getSettings();
  return <KitArea token={token} settings={settings} />;
}
