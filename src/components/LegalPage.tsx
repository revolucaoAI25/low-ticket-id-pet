import Link from 'next/link';
import { Logo } from './ui';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <Link href="/" className="flex justify-center">
        <Logo size={100} />
      </Link>
      <h1 className="h-display mt-4 text-3xl">{title}</h1>
      <p className="mt-1 text-sm font-bold text-cacau/60">Atualizado em {updated}</p>
      <div className="legal mt-6 space-y-4 text-[15px] leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </div>
  );
}
