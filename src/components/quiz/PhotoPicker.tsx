'use client';

import { Camera, ImagePlus, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';
import { SPECIES_ICON } from '@/components/icons';
import { compressImage } from '@/lib/image';
import type { Species } from '@/lib/species';

interface Props {
  value?: string;
  species?: Species;
  /** Depois de escolher: mostra só os botões de trocar. */
  compact?: boolean;
  onChange: (dataUrl: string) => void;
}

export function PhotoPicker({ value, species, compact, onChange }: Props) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const Icon = SPECIES_ICON[species ?? 'outro'];

  async function handle(file?: File) {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onChange(await compressImage(file));
    } catch {
      setError('Não consegui abrir essa foto. Tenta outra?');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {!compact && (
        <button
          type="button"
          onClick={() => gallery.current?.click()}
          className="relative flex h-52 w-52 flex-col items-center justify-center gap-2 overflow-hidden rounded-full border-[3px] border-dashed border-coral bg-white text-roxo shadow-card transition-transform active:scale-95"
          aria-label="Escolher foto"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Foto do pet" className="anim-pop h-full w-full object-cover" />
          ) : (
            <>
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F7EEF8]">
                <Icon size={40} strokeWidth={2} />
              </span>
              <span className="text-sm font-bold text-cacau/60">Toque para escolher</span>
            </>
          )}
          {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/75 font-bold text-cacau">Carregando…</span>}
        </button>
      )}
      {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
      <div className={`grid w-full grid-cols-2 gap-3 ${compact ? '' : 'mt-6'}`}>
        <button type="button" className="btn-ghost !min-h-[52px] !text-base" onClick={() => gallery.current?.click()}>
          {compact ? <RefreshCw size={18} /> : <ImagePlus size={19} />} {compact ? 'Trocar foto' : 'Galeria'}
        </button>
        <button type="button" className="btn-ghost !min-h-[52px] !text-base" onClick={() => camera.current?.click()}>
          <Camera size={19} /> {busy ? 'Carregando…' : 'Câmera'}
        </button>
      </div>
      <input ref={gallery} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  );
}
