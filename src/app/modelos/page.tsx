import type { Metadata } from 'next';
import { getSettings } from '@/lib/server/settings';
import { Modelos } from './Modelos';

export const metadata: Metadata = { title: 'Modelos · Clube do Focinho', robots: { index: false, follow: false } };

export default async function ModelosPage() {
  return <Modelos settings={await getSettings()} />;
}
