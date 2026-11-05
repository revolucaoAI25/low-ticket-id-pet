'use client';

import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/config/site';
import { buildDocContext } from '@/lib/doc-context';
import { DOCS, renderPage } from '@/lib/docs/render';
import { g, petName } from '@/lib/pet';
import { examplePetFor } from '@/lib/sample';

/** Documentos de exemplo, preenchidos com um pet-modelo (nunca com o pet da pessoa). */
const ITEMS: { doc: string; page: number; label: string; w: number }[] = [
  { doc: 'rg', page: 0, label: 'RG do Pet', w: 250 },
  { doc: 'cnh', page: 0, label: 'CNH Pet', w: 250 },
  { doc: 'certidao', page: 0, label: 'Certidão', w: 150 },
  { doc: 'tag', page: 0, label: 'Tag ossinho', w: 210 },
  { doc: 'vacina', page: 0, label: 'Carteira de vacinação', w: 300 },
  { doc: 'torcedor', page: 0, label: 'Carteirinha de torcedor', w: 250 },
];

export function ExampleDocs({ settings, species }: { settings: SiteSettings; species?: string }) {
  const pet = examplePetFor(species);
  const [srcs, setSrcs] = useState<(string | null)[]>(ITEMS.map(() => null));

  useEffect(() => {
    let alive = true;
    const ctx = buildDocContext({ pet, settings, seed: 'exemplo', slug: 'exemplo', phone: pet.tutors?.[0]?.phone, preview: false });
    (async () => {
      for (const [i, it] of ITEMS.entries()) {
        const def = DOCS[it.doc];
        const page = def.pages[it.page];
        const canvas = await renderPage(def, it.page, ctx, Math.min(0.6, (it.w * 2) / page.w));
        if (!alive) return;
        const url = page.shape ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
        setSrcs((cur) => cur.map((x, j) => (j === i ? url : x)));
      }
    })().catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [species]);

  const row = (hidden?: boolean) => (
    <div className="flex items-center gap-4 pl-4" aria-hidden={hidden}>
      {ITEMS.map((it, i) => (
        <figure key={it.doc} className="shrink-0" style={{ width: it.w }}>
          {srcs[i] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={srcs[i]!} alt={hidden ? '' : `${it.label} de exemplo`} className="w-full rounded-xl shadow-card" />
          ) : (
            <div className="aspect-[3/2] w-full animate-pulse rounded-xl bg-areia" />
          )}
          <figcaption className="mt-1.5 text-center text-xs font-bold text-cacau/60">{it.label}</figcaption>
        </figure>
      ))}
    </div>
  );

  return (
    <div>
      <div className="marquee -mx-4 overflow-hidden py-2">
        <div className="marquee-track flex w-max items-center" style={{ animationDuration: '45s' }}>
          {row()}
          {row(true)}
        </div>
      </div>
      <p className="mt-1 text-center text-xs font-bold text-cacau/50">
        Exemplo com {g(pet, 'o', 'a')} {petName(pet)}. O seu kit sai com a foto e os dados do seu pet.
      </p>
    </div>
  );
}
