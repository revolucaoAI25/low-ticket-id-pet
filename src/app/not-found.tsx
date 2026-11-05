import Link from 'next/link';
import { Logo } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[480px] px-4 py-16 text-center">
      <Logo size={120} />
      <h1 className="h-display mt-6 text-3xl">Ops, essa página fugiu 🐾</h1>
      <p className="mt-2 font-semibold text-cacau/70">Não encontramos o que você procurava.</p>
      <Link href="/" className="btn-primary mt-6 w-full">
        Voltar ao início
      </Link>
    </div>
  );
}
