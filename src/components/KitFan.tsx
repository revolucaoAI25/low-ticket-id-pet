'use client';

import { useMemo } from 'react';
import type { SiteSettings } from '@/config/site';
import { buildDocContext } from '@/lib/doc-context';
import type { PetData } from '@/lib/pet';
import { SAMPLE_PET } from '@/lib/sample';
import { DocImage } from './DocImage';


/** Mockup do kit montado pelo próprio gerador (enquanto não chega a imagem pronta). */
export function KitFan({ settings, pet = SAMPLE_PET }: { settings: Pick<SiteSettings, 'extraTeams' | 'images'>; pet?: PetData }) {
  const ctx = useMemo(() => buildDocContext({ pet, settings, seed: 'exemplo', slug: 'exemplo', phone: '31999990000' }), [pet, settings]);
  return (
    <div className="relative mx-auto h-[260px] w-full max-w-[360px]">
      <div className="absolute left-[0%] top-[6px] w-[50%] -rotate-[8deg] drop-shadow-xl">
        <DocImage doc="certidao" ctx={ctx} scale={0.32} className="overflow-hidden rounded-lg" />
      </div>
      <div className="absolute right-[-2%] top-[22px] w-[60%] rotate-[8deg] drop-shadow-xl">
        <DocImage doc="cnh" ctx={ctx} scale={0.38} className="overflow-hidden rounded-xl" />
      </div>
      <div className="absolute left-1/2 top-[96px] w-[76%] -translate-x-1/2 -rotate-[2deg] drop-shadow-2xl">
        <DocImage doc="rg" ctx={ctx} scale={0.42} className="overflow-hidden rounded-xl" />
      </div>
      <div className="absolute bottom-[-8px] right-[-2%] w-[36%] rotate-[10deg] drop-shadow-xl">
        <DocImage doc="tag" ctx={ctx} scale={0.25} format="png" />
      </div>
    </div>
  );
}
