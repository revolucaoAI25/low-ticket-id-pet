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
    <div className="relative mx-auto h-[250px] w-full max-w-[360px]">
      <div className="absolute left-[2%] top-[10px] w-[52%] -rotate-[8deg] drop-shadow-xl">
        <DocImage doc="certidao" ctx={ctx} scale={0.32} className="overflow-hidden rounded-lg" />
      </div>
      <div className="absolute right-[0%] top-[24px] w-[44%] rotate-[9deg] drop-shadow-xl">
        <DocImage doc="passaporte" ctx={ctx} scale={0.35} className="overflow-hidden rounded-lg" />
      </div>
      <div className="absolute left-1/2 top-[86px] w-[74%] -translate-x-1/2 -rotate-[2deg] drop-shadow-2xl">
        <DocImage doc="rg" ctx={ctx} scale={0.42} />
      </div>
      <div className="absolute bottom-[-6px] right-[6%] w-[22%] rotate-[12deg] drop-shadow-xl">
        <DocImage doc="tag" ctx={ctx} scale={0.25} />
      </div>
    </div>
  );
}
