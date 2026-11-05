'use client';

import { useEffect, useState } from 'react';
import { kitItems } from '@/config/offer';
import type { SiteSettings } from '@/config/site';
import { formatBRL } from '@/components/ui';
import { buildDocContext } from '@/lib/doc-context';
import { loadImage } from '@/lib/docs/draw';
import { DOCS, renderPage } from '@/lib/docs/render';
import type { DocContext } from '@/lib/docs/types';
import { doPet, fill, hasName, type PetData } from '@/lib/pet';
import { EXAMPLE_PETS } from '@/lib/sample';

/* Imagens de exemplo de cada documento, preenchidas com um pet-modelo (nunca com o pet da pessoa). */

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

function shadowed(ctx: CanvasRenderingContext2D, draw: () => void) {
  ctx.save();
  ctx.shadowColor = 'rgba(60,40,30,.28)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  draw();
  ctx.restore();
}

async function page(doc: string, i: number, ctx: DocContext, scale: number) {
  return renderPage(DOCS[doc], i, ctx, scale);
}

/** Passaporte: capa (frente) atrás e a página de dados por cima. */
async function passportMockup(ctx: DocContext): Promise<HTMLCanvasElement> {
  const out = canvas(760, 560);
  const o = out.getContext('2d')!;
  const cover = await loadImage('/templates/passaporte-capa.webp');
  const miolo = await page('passaporte', 2, ctx, 0.8); // folha com as páginas 2 | 7
  const mm = (1240 * 0.8) / 210;
  const bw = 88 * mm;
  const bh = 125 * mm;
  const sx = (1240 * 0.8 - bw * 2) / 2;
  if (cover) {
    shadowed(o, () => {
      o.translate(250, 285);
      o.rotate(-0.12);
      const half = cover.naturalWidth / 2;
      o.drawImage(cover, half + 6, 0, half - 6, cover.naturalHeight, -175, -245, 350, 490);
    });
  }
  shadowed(o, () => {
    o.translate(500, 290);
    o.rotate(0.06);
    o.drawImage(miolo, sx, 120 * 0.8, bw, bh, -175, -248, 350, 496);
  });
  return out;
}

/** Carteira de vacinação: capa e a parte de dentro (identificação). */
async function vaccineMockup(ctx: DocContext): Promise<HTMLCanvasElement> {
  const fora = await page('vacina', 0, ctx, 0.5);
  const dentro = await page('vacina', 1, ctx, 0.5);
  const pw = fora.width / 2.97; // ~100 mm
  const out = canvas(760, 560);
  const o = out.getContext('2d')!;
  shadowed(o, () => o.drawImage(dentro, 0, 0, pw, dentro.height, 60, 40, pw * 0.82, dentro.height * 0.82));
  shadowed(o, () => {
    o.translate(470, 290);
    o.rotate(0.05);
    o.drawImage(fora, fora.width - pw, 0, pw, fora.height, -pw * 0.41, -fora.height * 0.41, pw * 0.82, fora.height * 0.82);
  });
  return out;
}

/** Tag ossinho: frente e verso. */
async function tagMockup(ctx: DocContext): Promise<HTMLCanvasElement> {
  const a = await page('tag', 0, ctx, 0.5);
  const b = await page('tag', 1, ctx, 0.5);
  const out = canvas(760, 560);
  const o = out.getContext('2d')!;
  shadowed(o, () => {
    o.translate(330, 200);
    o.rotate(-0.12);
    o.drawImage(a, -a.width * 0.6, -a.height * 0.6, a.width * 1.2, a.height * 1.2);
  });
  shadowed(o, () => {
    o.translate(430, 370);
    o.rotate(0.08);
    o.drawImage(b, -b.width * 0.6, -b.height * 0.6, b.width * 1.2, b.height * 1.2);
  });
  return out;
}

async function single(doc: string, i: number, ctx: DocContext): Promise<HTMLCanvasElement> {
  const d = DOCS[doc];
  const p = d.pages[i];
  return page(doc, i, ctx, Math.min(1, 700 / p.w));
}

const MAKERS: Record<string, (c: DocContext) => Promise<HTMLCanvasElement>> = {
  rg: (c) => single('rg', 0, c),
  cnh: (c) => single('cnh', 0, c),
  certidao: (c) => single('certidao', 0, c),
  passaporte: passportMockup,
  tag: tagMockup,
  vacina: vaccineMockup,
  torcedor: (c) => single('torcedor', 0, c),
};

/** Documentos cujo exemplo é uma imagem pronta em public/demo/examples (gerada com os pets de exemplo). */
const STATIC_IDS = ['rg', 'cnh', 'certidao', 'passaporte', 'tag', 'vacina'];

export function KitList({ settings, pet }: { settings: SiteSettings; pet: PetData }) {
  // Exemplos prontos (imagens estáticas, leves). Só a carteirinha de torcedor é desenhada na hora, com o time da pessoa.
  const [srcs, setSrcs] = useState<Record<string, string>>(() => Object.fromEntries(STATIC_IDS.map((id) => [id, `/demo/examples/${id}.webp`])));
  // Carteirinha de torcedor: com o time que a pessoa escolheu (ou genérica, sem time).
  const teamKey = pet.team?.none || !pet.team?.name ? 'none' : `${pet.team.id ?? ''}:${pet.team.name}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      // Espera a página ficar ociosa para não disputar com o carregamento.
      await new Promise((r) => ('requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => r(null)) : setTimeout(r, 600)));
      for (const it of kitItems) {
        if (STATIC_IDS.includes(it.id)) continue;
        const make = MAKERS[it.id];
        const ex = EXAMPLE_PETS[it.id];
        if (!make || !ex) continue;
        const exPet: PetData = it.id === 'torcedor' ? { ...ex, team: teamKey === 'none' ? { id: null, name: '', none: true } : pet.team } : ex;
        const ctx = buildDocContext({ pet: exPet, settings, seed: `exemplo-${it.id}`, slug: 'exemplo', phone: exPet.tutors?.find((t) => t.phone)?.phone, preview: false });
        const cv = await make(ctx);
        if (!alive) return;
        const url = cv.toDataURL('image/webp', 0.85);
        setSrcs((cur) => ({ ...cur, [it.id]: url }));
      }
    })().catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamKey]);

  return (
    <div>
      <ul className="space-y-3">
        {kitItems.map((it, i) => (
          <li key={it.id} className="card flex items-center gap-3 overflow-hidden p-3">
            <div className="flex aspect-[4/3] w-[48%] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FBF4EC] to-[#F2E6D8] p-2">
              {srcs[it.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={srcs[it.id]} alt={`${it.title} de exemplo`} loading="lazy" decoding="async" className="anim-fade-up max-h-full max-w-full rounded-md object-contain drop-shadow-md" />
              ) : (
                <div className="h-3/4 w-3/4 animate-pulse rounded-lg bg-white/70" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-coral">Documento {i + 1}</p>
              <p className="font-display text-[16px] font-semibold leading-tight">{fill(it.title, pet)}</p>
              <p className="mt-1 text-[12.5px] font-semibold leading-snug text-cacau/70">{fill(it.lines[0], pet)}</p>
              <p className="mt-1 text-[12.5px] font-bold">
                <span className="text-cacau/40 line-through">{formatBRL(it.value)}</span> <span className="text-verde">incluso</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-xs font-bold text-cacau/50">
        Imagens de exemplo com pets de outros tutores (Mel, Thor, Nina, Bob…). O seu kit sai com a foto e os dados {hasName(pet) ? doPet(pet) : 'do seu pet'}.
      </p>
    </div>
  );
}
