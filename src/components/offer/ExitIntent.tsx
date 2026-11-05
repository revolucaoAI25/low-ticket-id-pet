'use client';

import { ArrowRight, Gift, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SiteSettings } from '@/config/site';
import { formatBRL } from '@/components/ui';
import { doPet, hasName, type PetData } from '@/lib/pet';
import { checkoutGroup } from '@/lib/species';
import { track } from '@/lib/tracking';

const KEY = 'cdf:exit-shown';

/**
 * Pop-up de saída na página de oferta. Aparece uma vez por visita quando a pessoa:
 * - no computador, leva o mouse para fora da janela (rumo às abas / fechar);
 * - no celular, aperta o botão voltar.
 * Com a oferta extra ligada e o checkout extra configurado no painel, oferece o preço especial.
 */
export function ExitIntent({ settings, pet, timer, onBuy }: { settings: SiteSettings; pet: PetData; timer: string; onBuy: (from: string, exit?: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const armed = useRef(false);
  const exitUrl = settings.exitOffer.checkout[checkoutGroup(pet.species)];
  const hasExtra = settings.exitOffer.enabled && !!exitUrl && settings.exitOffer.price < settings.price;

  useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem(KEY) === '1';
    } catch {
      /* ignore */
    }
    if (shown) return;
    // Só arma depois de alguns segundos na página (evita disparar ao chegar).
    const t = setTimeout(() => (armed.current = true), 6000);

    const show = () => {
      if (!armed.current) return false;
      armed.current = false;
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
      setOpen(true);
      track('SaidaPopup', { extra: hasExtra }, { pixel: false });
      return true;
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 8) return;
      show();
    };
    // Celular: segura o primeiro "voltar" para mostrar a oferta.
    try {
      history.pushState({ exitTrap: true }, '');
    } catch {
      /* ignore */
    }
    // Só intercepta o primeiro "voltar"; depois o botão volta a funcionar normalmente.
    const onPop = () => {
      window.removeEventListener('popstate', onPop);
      if (!show()) history.back();
    };
    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('popstate', onPop);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('popstate', onPop);
    };
  }, [hasExtra]);

  if (!open) return null;
  const doNome = hasName(pet) ? doPet(pet) : 'do seu pet';
  const off = Math.round((1 - settings.exitOffer.price / settings.anchorPrice) * 100);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-cacau/50 p-3 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
      <div className="anim-pop relative w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
          <X size={18} />
        </button>
        <div className="bg-gradient-to-br from-roxo to-roxo-escuro px-6 pb-6 pt-7 text-white">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <Gift size={30} />
          </span>
          <p className="mt-3 font-display text-[26px] font-semibold leading-tight">Espera! Não perca o kit {doNome}</p>
          <p className="mt-1 text-[15px] font-semibold text-white/85">Ele já está montado. Falta só liberar.</p>
        </div>
        <div className="px-6 pb-6 pt-5">
          {hasExtra ? (
            <>
              <p className="text-sm font-extrabold uppercase tracking-wide text-verde">Desconto extra só agora</p>
              <p className="mt-1 text-sm font-bold text-cacau/55">
                De <span className="line-through">{formatBRL(settings.price)}</span> por
              </p>
              <p className="font-display text-5xl font-semibold leading-none text-roxo">{formatBRL(settings.exitOffer.price)}</p>
              <p className="mt-1 text-xs font-bold text-cacau/55">{off}% de desconto sobre o valor total</p>
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold uppercase tracking-wide text-verde">Seu desconto ainda está reservado</p>
              <p className="font-display text-5xl font-semibold leading-none text-roxo">{formatBRL(settings.price)}</p>
              <p className="mt-1 text-xs font-bold text-cacau/55">reservado por mais {timer}</p>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              track('SaidaPopupClique', { extra: hasExtra }, { pixel: false });
              onBuy('popup-saida', hasExtra);
            }}
            className="btn-cta shine mt-5"
          >
            {hasExtra ? 'Quero com o desconto extra' : 'Liberar o meu kit'} <ArrowRight size={20} strokeWidth={2.6} />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="mt-3 text-sm font-bold text-cacau/45 underline">
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  );
}
