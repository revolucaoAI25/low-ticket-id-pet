'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui';
import { doPet, hasName } from '@/lib/pet';
import { useHydrated, useQuiz } from '@/lib/quiz-store';
import { track } from '@/lib/tracking';

export function Obrigado({ supportEmail }: { supportEmail: string }) {
  const hydrated = useHydrated();
  const s = useQuiz();
  const router = useRouter();
  const token = s.lead?.token;
  const [paid, setPaid] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    track('PaginaObrigado', {}, { pixel: false });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !token) return;
    let stop = false;
    const started = Date.now();
    const check = async () => {
      if (stop) return;
      try {
        const r = await fetch(`/api/status?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
        const d = await r.json();
        if (d.paid) {
          setPaid(true);
          setTimeout(() => router.push(`/kit/${token}`), 1600);
          return;
        }
      } catch {
        /* tenta de novo */
      }
      if (Date.now() - started > 90_000) setSlow(true);
      setTimeout(check, Date.now() - started > 120_000 ? 8000 : 3000);
    };
    check();
    return () => {
      stop = true;
    };
  }, [hydrated, token, router]);

  if (!hydrated) return <div className="min-h-dvh" />;
  const doNome = hasName(s.pet) ? doPet(s.pet) : 'do seu pet';

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center px-4 pb-10 pt-6 text-center">
      <Logo size={120} priority />
      {token ? (
        paid ? (
          <div className="anim-pop mt-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-verde text-4xl text-white">✓</div>
            <h1 className="h-display mt-5 text-3xl">Pronto! O kit {doNome} está liberado 🎉</h1>
            <p className="mt-2 font-semibold text-cacau/70">Abrindo seus documentos…</p>
            <a href={`/kit/${token}`} className="btn-primary mt-6 w-full">
              Abrir o kit →
            </a>
          </div>
        ) : (
          <div className="mt-8 w-full">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-[6px] border-linha border-t-roxo" />
            <h1 className="h-display mt-6 text-[26px] leading-tight">Confirmando seu pagamento…</h1>
            <p className="mt-2 font-semibold text-cacau/70">Deixe esta página aberta. Assim que confirmar, o kit {doNome} abre sozinho.</p>
            {slow && (
              <div className="anim-fade-up card mt-6 p-4 text-left text-[15px] font-semibold">
                <p>
                  ⏳ Pagou com Pix? Às vezes o banco leva alguns minutos para confirmar. Pode fechar esta página: <b>o link de acesso vai para o seu e-mail</b> assim que o
                  pagamento cair.
                </p>
                <a href={`/kit/${token}`} className="mt-3 block font-bold text-roxo underline">
                  Guardar o link do meu kit
                </a>
              </div>
            )}
          </div>
        )
      ) : (
        <NoToken supportEmail={supportEmail} />
      )}
    </div>
  );
}

function NoToken({ supportEmail }: { supportEmail: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div className="mt-8 w-full">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-verde text-4xl text-white">✓</div>
      <h1 className="h-display mt-5 text-3xl">Obrigado pela compra! 💛</h1>
      <p className="mt-2 font-semibold text-cacau/70">Assim que o pagamento for confirmado, o link do kit chega no e-mail que você usou na compra.</p>
      <form
        className="card mt-6 p-4 text-left"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch('/api/reenviar-acesso', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => undefined);
          setSent(true);
        }}
      >
        <p className="font-extrabold">Não chegou? Reenvie o acesso</p>
        <input className="input mt-3" type="email" required placeholder="E-mail da compra" value={email} onChange={(e) => setEmail(e.target.value.trim())} />
        <button className="btn-primary mt-3 w-full" type="submit">
          Reenviar link
        </button>
        {sent && <p className="mt-3 text-sm font-bold text-verde">Se esse e-mail tiver uma compra aprovada, o link chega em instantes. Olhe também o spam.</p>}
      </form>
      <p className="mt-6 text-sm font-semibold text-cacau/60">Precisa de ajuda? {supportEmail}</p>
    </div>
  );
}
