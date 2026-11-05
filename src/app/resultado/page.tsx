import type { Metadata } from 'next';
import { Offer } from '@/components/offer/Offer';
import { withDemoProof } from '@/config/demo-proof';
import { getSettings } from '@/lib/server/settings';

export const metadata: Metadata = { title: 'O kit do seu pet está pronto! · Clube do Focinho', robots: { index: false } };

export default async function ResultadoPage() {
  const settings = withDemoProof(await getSettings());
  return <Offer settings={settings} />;
}
