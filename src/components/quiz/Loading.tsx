'use client';

import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SiteSettings } from '@/config/site';
import { Avatar, Stars, formatInt } from '@/components/ui';
import { doPet, type PetData } from '@/lib/pet';

const DURATION = 4800;

export function Loading({ pet, settings, onDone }: { pet: PetData; settings: SiteSettings; onDone: () => void }) {
  const items = [
    `RG ${doPet(pet)}`,
    'CNH Pet',
    pet.origin === 'adocao' ? 'Certidão de adoção' : 'Certidão de nascimento',
    'Passaporte de aventuras',
    'Tag ossinho com QR Code',
    'Carteira de vacinação',
    'Carteirinha de torcedor',
  ];
  const [t, setT] = useState(0);
  const done = useRef(false);
  const reviews = settings.proof.reviews.filter((r) => r.text);
  const [ri, setRi] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(onDone, 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  useEffect(() => {
    if (reviews.length < 2) return;
    const id = setInterval(() => setRi((i) => (i + 1) % reviews.length), 2200);
    return () => clearInterval(id);
  }, [reviews.length]);

  // ease-out para parecer natural
  const eased = 1 - Math.pow(1 - t, 2.2);
  const pct = Math.round(eased * 100);
  const R = 72;
  const C = 2 * Math.PI * R;
  const current = Math.min(items.length - 1, Math.floor(eased * items.length));

  return (
    <section className="flex flex-1 flex-col items-center pt-10 text-center">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={R} fill="none" stroke="#EADBC8" strokeWidth="14" />
          <circle
            cx="90"
            cy="90"
            r={R}
            fill="none"
            stroke="url(#ring)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - eased)}
          />
          <defs>
            <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E9A092" />
              <stop offset="100%" stopColor="#6F2A7A" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold text-roxo">{pct}%</span>
        </div>
      </div>
      <h1 className="h-display mt-6 text-2xl">Montando o kit {doPet(pet)}…</h1>
      <ul className="mt-6 w-full space-y-2 text-left">
        {items.map((label, i) => {
          const state = i < current || pct === 100 ? 'done' : i === current ? 'doing' : 'todo';
          return (
            <li key={label} className={`flex items-center gap-3 rounded-2xl bg-white px-4 py-3 font-bold shadow-card transition-opacity ${state === 'todo' ? 'opacity-40' : ''}`}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-white transition-colors ${state === 'done' ? 'bg-verde' : state === 'doing' ? 'bg-mel' : 'bg-linha'}`}
              >
                {state === 'done' ? <Check size={15} strokeWidth={3.5} /> : state === 'doing' ? '…' : ''}
              </span>
              {state === 'doing' ? `Gerando ${label.charAt(0).toLowerCase() + label.slice(1)}…` : label}
            </li>
          );
        })}
      </ul>
      <div className="mt-6 min-h-[110px] w-full">
        {reviews.length > 0 ? (
          <div key={ri} className="anim-fade-up rounded-2xl bg-white p-4 text-left shadow-card">
            <div className="flex items-center gap-3">
              <Avatar name={reviews[ri].name} photo={reviews[ri].photo} size={38} />
              <div className="min-w-0">
                <p className="text-sm font-extrabold leading-tight">{reviews[ri].name}</p>
                <p className="text-xs font-bold text-cacau/55">{reviews[ri].city}</p>
              </div>
              <Stars value={reviews[ri].stars} size={14} className="ml-auto" />
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-snug">“{reviews[ri].text}”</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Stars value={settings.rating} />
            <p className="text-sm font-bold text-cacau/70">
              Nota {settings.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
              {settings.tutorsCount > 0 ? ` · +${formatInt(settings.tutorsCount)} tutores` : ''}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
