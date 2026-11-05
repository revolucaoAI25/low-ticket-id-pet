'use client';

import { useMemo, useState } from 'react';
import { normalize } from '@/lib/teams';

interface Props {
  breeds: string[];
  value: string;
  onChange: (v: string) => void;
}

/** Campo de raça com sugestões. Aceita qualquer texto. */
export function BreedPicker({ breeds, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const list = useMemo(() => {
    const n = normalize(value);
    if (!n) return breeds.slice(0, 8);
    return breeds.filter((b) => normalize(b).includes(n)).slice(0, 8);
  }, [breeds, value]);
  const exact = breeds.some((b) => normalize(b) === normalize(value));

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="Digite ou escolha a raça"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        enterKeyHint="done"
      />
      {open && list.length > 0 && !exact && (
        <div className="anim-fade-up absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-auto rounded-2xl border-2 border-linha bg-white p-1 shadow-card">
          {list.map((b) => (
            <button
              key={b}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(b);
                setOpen(false);
              }}
              className="block w-full rounded-xl px-4 py-3 text-left font-semibold hover:bg-areia active:bg-areia"
            >
              {b}
            </button>
          ))}
        </div>
      )}
      {!open && breeds[0] && !value && (
        <div className="mt-2 flex flex-wrap gap-2">
          {breeds.slice(0, 4).map((b) => (
            <button key={b} type="button" className="chip !py-1.5" onClick={() => onChange(b)}>
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
