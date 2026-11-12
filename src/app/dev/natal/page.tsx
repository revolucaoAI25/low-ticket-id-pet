import { notFound } from 'next/navigation';
import { Preview } from './Preview';

/** Pré-visualização interna dos order bumps personalizados (só em desenvolvimento). */
export default function Page() {
  if (process.env.NODE_ENV === 'production' && process.env.DEV_PAGES !== '1') notFound();
  return <Preview />;
}
