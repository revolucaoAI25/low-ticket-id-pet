import type { Metadata } from 'next';
import { isAdmin } from '@/lib/server/admin';
import { Teste } from './Teste';

export const metadata: Metadata = { title: 'Teste dos bumps · Clube do Focinho', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Teste do Kit Natal e das Figurinhas no celular, sem compra. Só para quem está logado no /admin. */
export default async function Page() {
  if (!(await isAdmin()))
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center">
        <p className="card p-6 font-bold">
          Página de teste. Entre primeiro no <a href="/admin" className="text-roxo underline">/admin</a> com a senha do painel e depois abra esta página de novo.
        </p>
      </div>
    );
  return <Teste />;
}
