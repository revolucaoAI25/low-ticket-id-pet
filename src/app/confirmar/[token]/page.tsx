import type { Metadata } from 'next';
import { getSettings } from '@/lib/server/settings';
import { Confirmar } from './Confirmar';

export const metadata: Metadata = { title: 'Confirme os dados do kit · Clube do Focinho', robots: { index: false, follow: false } };

export default async function ConfirmarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <Confirmar token={token} settings={await getSettings()} />;
}
