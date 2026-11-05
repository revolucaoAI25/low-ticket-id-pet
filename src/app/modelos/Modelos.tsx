'use client';

import { useMemo, useState } from 'react';
import type { SiteSettings } from '@/config/site';
import { DocImage } from '@/components/DocImage';
import { buildDocContext } from '@/lib/doc-context';
import { DOCS } from '@/lib/docs/render';
import type { PetData } from '@/lib/pet';
import { SAMPLE_PET } from '@/lib/sample';

/** Galeria de conferência: todos os documentos com um pet de exemplo (para validar templates e posições). */
export function Modelos({ settings }: { settings: SiteSettings }) {
  const [preview, setPreview] = useState(false);
  const [variant, setVariant] = useState<'completo' | 'vazio' | 'gata'>('completo');
  const pet: PetData = useMemo(() => {
    if (variant === 'vazio') return { species: 'cachorro' };
    if (variant === 'gata')
      return { species: 'gato', name: 'Mel', sex: 'femea', breed: 'Siamês', personality: 'dorminhoco', origin: 'nascimento', date: '2020-08-02', place: 'sofa', team: { id: null, name: 'Tupi', none: false }, tutors: 'Carla', city: 'Juiz de Fora - MG' };
    return {
      ...SAMPLE_PET,
      extras: { microchip: '985 112 004 567 890', coat: 'Caramelo com mancha branca', allergies: 'Frango', vetName: 'Dra. Júlia', vetClinic: 'Clínica Patas', vetPhone: '3133334444', food: 'Ração premium', feedingTimes: '8h e 18h', walks: '2 passeios por dia', contacts: [{ name: 'Vó Lúcia', phone: '31988887777', relation: 'avó' }] },
    };
  }, [variant]);
  const ctx = useMemo(() => buildDocContext({ pet, settings, seed: 'modelo', slug: 'exemplo', phone: '31999990000', preview }), [pet, settings, preview]);
  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="h-display text-2xl">Modelos dos documentos</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {(['completo', 'vazio', 'gata'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setVariant(v)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${variant === v ? 'bg-roxo text-white' : 'bg-white shadow-card'}`}>
            {v === 'completo' ? 'Pet completo' : v === 'vazio' ? 'Quiz pulado' : 'Gata sem foto, time sem escudo'}
          </button>
        ))}
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Prévia (marca d&apos;água)
        </label>
      </div>
      <div className="mt-6 space-y-10">
        {Object.values(DOCS).map((d) => (
          <section key={d.id}>
            <h2 className="font-display text-xl font-semibold">{d.title}</h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {d.pages.map((p, i) => (
                <figure key={p.id} data-page={p.id} className="rounded-2xl bg-white p-3 shadow-card">
                  <DocImage doc={d.id} page={i} ctx={ctx} scale={1} format="png" />
                  <figcaption className="mt-2 text-xs font-bold text-cacau/60">
                    {p.label} · id <code>{p.id}</code> · {p.mm[0]}×{p.mm[1]} mm
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
