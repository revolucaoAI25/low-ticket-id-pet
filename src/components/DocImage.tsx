'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DOCS, renderPage, type DocContext } from '@/lib/docs/render';

// Fila simples: desenha um documento por vez para não travar o celular.
let chain: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

function ctxKey(c: DocContext, doc: string, page: number, scale: number) {
  const photo = c.pet.photo ? `${c.pet.photo.length}:${c.pet.photo.slice(-32)}` : '';
  return JSON.stringify([doc, page, scale, { ...c.pet, photo }, c.seed, c.slug, c.team?.id, c.team?.crest, c.phone, c.preview, c.templates]);
}

interface Props {
  doc: string;
  page?: number;
  ctx: DocContext;
  /** Escala sobre o tamanho lógico. 0.5 é bom para miniaturas. */
  scale?: number;
  className?: string;
  alt?: string;
  /** Formato da imagem gerada. PNG mantém a transparência (tag redonda). */
  format?: 'png' | 'jpeg';
}

export function DocImage({ doc, page = 0, ctx, scale = 0.6, className = '', alt, format }: Props) {
  const def = DOCS[doc];
  const p = def?.pages[page];
  const [src, setSrc] = useState<string | null>(null);
  const key = useMemo(() => ctxKey(ctx, doc, page, scale), [ctx, doc, page, scale]);
  const latest = useRef(key);

  useEffect(() => {
    if (!def) return;
    latest.current = key;
    const t = setTimeout(() => {
      enqueue(async () => {
        if (latest.current !== key) return;
        const canvas = await renderPage(def, page, ctx, scale);
        if (latest.current !== key) return;
        const fmt = format ?? (p?.round ? 'png' : 'jpeg');
        setSrc(fmt === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88));
      }).catch(() => undefined);
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!def || !p) return null;
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${p.w} / ${p.h}` }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? def.title} className="block h-full w-full select-none" draggable={false} />
      ) : (
        <div className={`h-full w-full animate-pulse bg-areia ${p.round ? 'rounded-full' : 'rounded-xl'}`} />
      )}
    </div>
  );
}
