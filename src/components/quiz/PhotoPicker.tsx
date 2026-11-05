'use client';

import { useRef, useState } from 'react';
import { compressImage } from '@/lib/image';

interface Props {
  value?: string;
  emoji: string;
  onChange: (dataUrl: string) => void;
}

export function PhotoPicker({ value, emoji, onChange }: Props) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
      <button
        type="button"
        onClick={() => gallery.current?.click()}
        className="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-coral bg-white shadow-card transition-transform active:scale-95"
        aria-label="Escolher foto"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Foto do pet" className="anim-pop h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-cacau/60">
            <span className="text-6xl">{emoji}</span>
            <span className="text-sm font-bold">Toque para escolher</span>
          </span>
        )}
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-bold">Carregando…</span>}
        {value && !busy && <span className="absolute bottom-3 rounded-full bg-cacau/80 px-3 py-1 text-xs font-bold text-white">Trocar</span>}
      </button>
      {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <button type="button" className="btn-ghost !min-h-[52px] !text-base" onClick={() => gallery.current?.click()}>
          🖼️ Galeria
        </button>
        <button type="button" className="btn-ghost !min-h-[52px] !text-base" onClick={() => camera.current?.click()}>
          📸 Câmera
        </button>
      </div>
      <input ref={gallery} type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      <p className="mt-4 text-center text-sm text-cacau/70">💡 Dica: foto de frente, com boa luz e o rostinho bem aparecendo.</p>
    </div>
  );
}
