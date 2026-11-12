'use client';

import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { Personal } from '@/app/confirmar/[token]/Confirmar';
import { compressImage } from '@/lib/image';
import type { ExtraKind } from '@/lib/natal/pacote';

const EXTRAS: { id: string; name: string; kind: ExtraKind }[] = [
  { id: 'kit-natal', name: 'Kit Natal e Ano Novo do Seu Pet', kind: 'natal' },
  { id: 'figurinhas', name: 'Figurinhas Personalizadas do Seu Pet', kind: 'figurinhas' },
];

/** Gera tudo no próprio celular, sem salvar nada no servidor e sem mandar e-mail. */
export function Teste() {
  const [fotos, setFotos] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [femea, setFemea] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [files, setFiles] = useState<{ name: string; url: string; kind: string }[] | null>(null);

  async function gerar() {
    setPct(1);
    const { buildExtras } = await import('@/lib/natal/pacote');
    const out = await buildExtras({ name: nome || 'Pet', sex: femea ? 'femea' : 'macho', species: 'cachorro', photo: fotos[0], extras: { photos: fotos.slice(1) } }, ['natal', 'figurinhas'], (n, t) =>
      setPct(Math.round((n / t) * 100)),
    );
    setFiles(out.map((f) => ({ name: f.label, url: URL.createObjectURL(f.blob), kind: f.kind })));
    setPct(null);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[520px] px-4 pb-16 pt-6">
      <h1 className="h-display text-center text-2xl">Teste: Kit Natal e Figurinhas</h1>
      <p className="mt-1 text-center text-sm font-semibold text-cacau/65">Tudo é feito aqui no celular. Nada é salvo e nenhum e-mail é enviado.</p>
      {!files && (
        <section className="card mt-5 space-y-3 p-4">
          <input className="input !min-h-[50px] !text-base" placeholder="Nome do pet" value={nome} onChange={(e) => setNome(e.target.value)} />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" className="h-5 w-5" checked={femea} onChange={(e) => setFemea(e.target.checked)} /> É fêmea
          </label>
          <div className="flex flex-wrap gap-2">
            {fotos.map((f, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="Remover" onClick={() => setFotos((x) => x.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cacau/80 text-white">
                  <X size={13} />
                </button>
              </div>
            ))}
            {fotos.length < 6 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-coral bg-white text-roxo">
                <ImagePlus size={22} />
                <span className="text-[11px] font-bold text-cacau/60">Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const d = await compressImage(f);
                      setFotos((x) => [...x, d]);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
          <button type="button" disabled={!fotos.length || pct !== null} onClick={gerar} className="btn-cta shine disabled:opacity-50">
            {pct !== null ? `Gerando… ${pct}%` : 'Gerar artes e figurinhas'}
          </button>
        </section>
      )}
      {files && (
        <div className="card mt-5 p-4">
          <Personal pet={{ id: 'teste', slug: 'teste', data: { name: nome || 'Pet', sex: femea ? 'femea' : 'macho' }, files, submitted: true }} extras={EXTRAS} onGenerate={() => undefined} />
          <button type="button" onClick={() => setFiles(null)} className="btn-ghost mt-6 w-full">
            Testar de novo
          </button>
        </div>
      )}
    </div>
  );
}
