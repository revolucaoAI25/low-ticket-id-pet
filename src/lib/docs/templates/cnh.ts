'use client';

import { clubNumber, cityOf, formatDateBR, isFemale, petName, tutorNames, type Personality } from '@/lib/pet';
import { maskNumber, photoBox } from '../common';
import { line, paw, rr, text } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';
import { clubSeal, guilloche } from './rg';

const W = 1000;
const H = 630;
const CNH = { paper: '#E6EBC9', paper2: '#F4F2DA', ink: '#2F4F2A', line: 'rgba(47,79,42,.35)', guilloche: 'rgba(120,140,60,.16)', accent: '#C9A227' };

/** Categorias divertidas. As marcadas dependem da personalidade. */
const CATEGORIES: { cat: string; label: string; who: Personality[] }[] = [
  { cat: 'A', label: 'Andar de coleira pela vizinhança', who: ['aventureiro', 'brincalhao', 'grudinho', 'comilao', 'dorminhoco'] },
  { cat: 'B', label: 'Banco de trás com a cabeça na janela', who: ['aventureiro', 'brincalhao'] },
  { cat: 'C', label: 'Cama dos tutores (sem pedir licença)', who: ['grudinho', 'dorminhoco'] },
  { cat: 'D', label: 'Dono do sofá, controle e almofadas', who: ['dorminhoco', 'comilao'] },
  { cat: 'E', label: 'Expedições, trilhas e parques', who: ['aventureiro'] },
  { cat: 'F', label: 'Fiscal da cozinha e da geladeira', who: ['comilao'] },
];

function label(ctx: Ctx, s: string, x: number, y: number, w: number) {
  text(ctx, s, x, y, { size: 14, weight: 800, color: CNH.ink, letterSpacing: 1, maxWidth: w });
}
function value(ctx: Ctx, s: string, x: number, y: number, w: number, size = 25) {
  if (s) text(ctx, s.toUpperCase(), x, y, { size, weight: 700, color: '#1d2a1a', maxWidth: w, letterSpacing: 0.4 });
}

function frame(ctx: Ctx, bg: HTMLImageElement | null, seed: number) {
  ctx.save();
  rr(ctx, 0, 0, W, H, 34);
  ctx.clip();
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  else {
    guilloche(ctx, W, H, CNH, seed);
    ctx.fillStyle = 'rgba(47,79,42,.92)';
    ctx.fillRect(0, 0, W, 104);
  }
  ctx.restore();
}

function cats(p: { personality?: Personality }): string[] {
  const list = CATEGORIES.filter((c) => !p.personality || c.who.includes(p.personality)).map((c) => c.cat);
  return list.length ? list : ['A'];
}

export const cnhDoc: DocDef = {
  id: 'cnh',
  title: 'CNH Pet',
  file: 'CNH-Pet-do-{nome}',
  pages: [
    {
      id: 'cnh-frente',
      label: 'Frente',
      w: W,
      h: H,
      mm: [85.6, 54],
      draw(ctx, c, a) {
        const p = c.pet;
        frame(ctx, a.background, 3);
        if (!a.background) {
          clubSeal(ctx, 70, 52, 32, '#F4E9A8');
          text(ctx, 'CNH PET', 125, 66, { size: 44, weight: 900, color: '#F4E9A8', letterSpacing: 3 });
          text(ctx, 'CARTEIRA DE HABILITAÇÃO PET', W - 40, 50, { size: 22, weight: 800, color: '#fff', align: 'right', letterSpacing: 2 });
          text(ctx, 'Clube do Focinho', W - 40, 82, { size: 20, weight: 600, family: 'display', color: 'rgba(255,255,255,.8)', align: 'right' });
        }
        photoBox(ctx, a.photo, p, 44, 136, 250, 320, 10, { border: 5, borderColor: '#fff', bg: '#F3F2E3' });
        line(ctx, 44, 548, 294, 548, '#1d2a1a', 2);
        label(ctx, 'ASSINATURA DO PORTADOR', 44, 574, 260);
        paw(ctx, 170, 515, 46, 'rgba(47,79,42,.35)', -0.3);

        const x = 330;
        const full = W - x - 44;
        const half = (full - 24) / 2;
        const x2 = x + half + 24;
        label(ctx, 'NOME', x, 150, full);
        value(ctx, petName(p) === 'seu pet' ? '' : petName(p), x, 184, full, 30);
        line(ctx, x, 196, x + full, 196, CNH.line, 2);
        label(ctx, 'DOC. IDENTIDADE (RG DO PET)', x, 230, half);
        value(ctx, maskNumber(clubNumber(c.seed), c.preview), x, 262, half);
        label(ctx, p.origin === 'adocao' ? 'DATA DE ADOÇÃO' : 'DATA DE NASCIMENTO', x2, 230, half);
        value(ctx, formatDateBR(p.date), x2, 262, half);
        line(ctx, x, 274, x + full, 274, CNH.line, 2);
        label(ctx, 'FILIAÇÃO (TUTORES)', x, 308, full);
        value(ctx, tutorNames(p), x, 340, full, 23);
        line(ctx, x, 352, x + full, 352, CNH.line, 2);
        label(ctx, 'PERMISSÃO', x, 386, half / 2);
        value(ctx, 'PASSEAR', x, 418, half / 2 + 20, 22);
        label(ctx, 'CAT. HAB.', x + half / 2 + 30, 386, half / 2);
        value(ctx, cats(p).join(' · '), x + half / 2 + 30, 418, half / 2 + 30, 22);
        label(ctx, 'VALIDADE', x2, 386, half);
        value(ctx, 'ETERNA', x2, 418, half);
        line(ctx, x, 430, x + full, 430, CNH.line, 2);
        label(ctx, 'Nº REGISTRO', x, 464, half);
        value(ctx, maskNumber(clubNumber(c.seed + 'cnh').replace(/\./g, ''), c.preview), x, 496, half);
        label(ctx, '1ª HABILITAÇÃO', x2, 464, half);
        value(ctx, formatDateBR(new Date().toISOString().slice(0, 10)), x2, 496, half);
        line(ctx, x, 508, x + full, 508, CNH.line, 2);
        label(ctx, 'LOCAL', x, 542, full);
        value(ctx, cityOf(p), x, 574, full, 22);
        text(ctx, 'Uso pessoal · sem validade oficial', W - 44, H - 18, { size: 13, weight: 700, color: 'rgba(47,79,42,.6)', align: 'right' });
      },
    },
    {
      id: 'cnh-verso',
      label: 'Verso',
      w: W,
      h: H,
      mm: [85.6, 54],
      draw(ctx, c, a) {
        const p = c.pet;
        frame(ctx, a.background, 4);
        if (!a.background) text(ctx, 'CATEGORIAS', 44, 66, { size: 36, weight: 900, color: '#F4E9A8', letterSpacing: 3 });
        if (!a.background) text(ctx, 'Clube do Focinho', W - 40, 66, { size: 22, weight: 600, family: 'display', color: 'rgba(255,255,255,.85)', align: 'right' });
        const mine = new Set(cats(p));
        CATEGORIES.forEach((cat, i) => {
          const y = 140 + i * 62;
          const on = mine.has(cat.cat);
          rr(ctx, 44, y, 60, 46, 10);
          ctx.fillStyle = on ? CNH.ink : 'rgba(47,79,42,.12)';
          ctx.fill();
          text(ctx, cat.cat, 74, y + 34, { size: 28, weight: 900, color: on ? '#F4E9A8' : 'rgba(47,79,42,.5)', align: 'center' });
          text(ctx, cat.label, 124, y + 32, { size: 24, weight: 700, color: on ? '#1d2a1a' : 'rgba(29,42,26,.45)', maxWidth: 700 });
          text(ctx, on ? 'HABILITADO' : '—', W - 44, y + 32, { size: 18, weight: 900, color: on ? CNH.ink : 'rgba(29,42,26,.35)', align: 'right', letterSpacing: 1 });
        });
        rr(ctx, 44, 520, W - 88, 70, 14);
        ctx.fillStyle = 'rgba(201,162,39,.22)';
        ctx.fill();
        text(ctx, 'OBSERVAÇÕES:', 64, 563, { size: 18, weight: 900, color: CNH.ink, letterSpacing: 1 });
        text(ctx, `${isFemale(p) ? 'Habilitada' : 'Habilitado'} a pôr a cabeça pra fora da janela e a pedir carinho no trânsito.`, 220, 563, {
          size: 19,
          weight: 700,
          color: '#1d2a1a',
          maxWidth: W - 290,
        });
      },
    },
  ],
};
