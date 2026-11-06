'use client';

import { clubNumber, cityOf, formatDateBR, petName, sexLabel, tutorNames } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { maskNumber, photoBox } from '../common';
import { dashedRect, line, paw, rr, text } from '../draw';
import type { Ctx } from '../draw';
import type { DocContext, DocDef } from '../types';
import { RG_COR_VERSO, RG_FRENTE, RG_VERSO, rgCorFrente } from './slots';

const W = 1000;
const H = 640;
// Tamanho do template de imagem (proporção da arte em public/templates).
const TW = 1000;
const TH = 782;

/** Cor do RG colorido: azul (macho), rosa (fêmea), verde (não informado). */
/** Versão colorida: rosa para fêmea, azul para macho ou sexo não informado. (A verde vai para todo mundo.) */
const COR = (c: DocContext) => (c.pet.sex === 'femea' ? { k: 'rosa', pill: '#fdf8f9' } : { k: 'azul', pill: '#f9fbfd' });
const VERDE_PILL = '#fafcf3';
export const RG_GREEN = { paper: '#DFEBD3', paper2: '#EEF4E4', ink: '#2C5A36', line: 'rgba(44,90,54,.35)', guilloche: 'rgba(60,120,75,.13)' };

/** Fundo com guilhochê (as ondinhas finas do papel de documento). */
export function guilloche(ctx: Ctx, w: number, h: number, colors: { paper: string; paper2: string; guilloche: string }, seed = 1) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, colors.paper2);
  grad.addColorStop(0.5, colors.paper);
  grad.addColorStop(1, colors.paper2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.strokeStyle = colors.guilloche;
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 26; k++) {
    ctx.beginPath();
    const base = (k / 26) * h * 1.2 - h * 0.1;
    for (let x = 0; x <= w; x += 6) {
      const y = base + Math.sin((x / w) * Math.PI * (3 + seed) + k * 0.45) * 26 + Math.sin((x / w) * Math.PI * 11 + k) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // roseta central
  ctx.translate(w / 2, h / 2);
  for (let i = 0; i < 36; i++) {
    ctx.rotate(Math.PI / 18);
    ctx.beginPath();
    ctx.ellipse(0, 0, h * 0.36, h * 0.12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Emblema do clube (no lugar do brasão: nada de símbolo oficial). */
export function clubSeal(ctx: Ctx, cx: number, cy: number, r: number, ink: string) {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  paw(ctx, cx, cy + r * 0.05, r * 1.05, ink);
}

function label(ctx: Ctx, s: string, x: number, y: number, w: number, ink: string) {
  text(ctx, s, x, y, { size: 15, weight: 800, color: ink, letterSpacing: 1.2, maxWidth: w });
}

function value(ctx: Ctx, s: string, x: number, y: number, w: number, size = 27) {
  if (s) text(ctx, s.toUpperCase(), x, y, { size, weight: 700, color: '#1f2a22', maxWidth: w, family: 'body', letterSpacing: 0.5 });
}

function frame(ctx: Ctx, bg: HTMLImageElement | null, seed: number) {
  ctx.save();
  rr(ctx, 0, 0, W, H, 34);
  ctx.clip();
  if (bg) ctx.drawImage(bg, 0, 0, W, H);
  else guilloche(ctx, W, H, RG_GREEN, seed);
  ctx.restore();
  ctx.strokeStyle = RG_GREEN.line;
  ctx.lineWidth = 3;
  rr(ctx, 14, 14, W - 28, H - 28, 24);
  ctx.stroke();
}

export const rgDoc: DocDef = {
  id: 'rg',
  title: 'RG do Pet',
  file: 'RG-do-{nome}',
  pages: [
    {
      id: 'rg-frente',
      label: 'Verde · frente',
      w: TW,
      h: TH,
      mm: [86, 67],
      needsQr: true,
      layout: () => ({ template: '/templates/rg-verde-frente.webp', slots: rgCorFrente(VERDE_PILL) }),
      draw(ctx, c, a) {
        const ink = RG_GREEN.ink;
        frame(ctx, a.background, 1);
        if (!a.background) {
          clubSeal(ctx, 92, 92, 46, ink);
          text(ctx, 'CLUBE DO FOCINHO', W / 2 + 40, 76, { size: 26, weight: 800, color: ink, align: 'center', letterSpacing: 3 });
          text(ctx, 'CARTEIRA DE IDENTIDADE PET', W / 2 + 40, 116, { size: 36, weight: 900, color: ink, align: 'center', letterSpacing: 2, maxWidth: 760 });
        }
        // Foto 3x4
        photoBox(ctx, a.photo, c.pet, 70, 168, 290, 370, 10, { border: 5, borderColor: '#fff', bg: '#F1F5EC' });
        // Patinha (no lugar do polegar)
        dashedRect(ctx, 420, 168, 230, 260, 14, RG_GREEN.line, 3, [8, 7]);
        paw(ctx, 535, 290, 110, 'rgba(44,90,54,.12)');
        label(ctx, 'PATINHA DIREITA', 435, 455, 220, ink);
        // Nome e nº
        label(ctx, 'NOME', 690, 190, 260, ink);
        value(ctx, petName(c.pet) === 'seu pet' ? '' : petName(c.pet), 690, 230, 260, 30);
        line(ctx, 690, 242, 930, 242, RG_GREEN.line, 2);
        label(ctx, 'REGISTRO GERAL', 690, 290, 260, ink);
        value(ctx, maskNumber(clubNumber(c.seed), c.preview), 690, 330, 260, 30);
        line(ctx, 690, 342, 930, 342, RG_GREEN.line, 2);
        label(ctx, 'ESPÉCIE', 690, 390, 260, ink);
        value(ctx, getSpecies(c.pet.species)?.label ?? '', 690, 430, 260);
        line(ctx, 690, 442, 930, 442, RG_GREEN.line, 2);
        // Assinatura
        line(ctx, 420, 530, 930, 530, '#1f2a22', 2);
        label(ctx, 'ASSINATURA DO TUTOR', 420, 560, 400, ink);
        text(ctx, 'Uso pessoal · sem validade oficial', W - 40, H - 30, { size: 14, weight: 700, color: 'rgba(44,90,54,.6)', align: 'right' });
      },
    },
    {
      id: 'rg-verso',
      label: 'Verde · verso',
      w: TW,
      h: TH,
      mm: [86, 67],
      layout: () => ({ template: '/templates/rg-verde-verso.webp', slots: RG_COR_VERSO }),
      draw(ctx, c, a) {
        const ink = RG_GREEN.ink;
        const p = c.pet;
        const ex = p.extras ?? {};
        frame(ctx, a.background, 2);
        const x1 = 60;
        const full = W - 120;
        const half = (full - 40) / 2;
        const x2 = x1 + half + 40;
        // linha 1
        label(ctx, 'REGISTRO GERAL', x1, 70, half, ink);
        value(ctx, maskNumber(clubNumber(c.seed), c.preview), x1, 106, half, 30);
        label(ctx, 'DATA DE EXPEDIÇÃO', x2, 70, half, ink);
        value(ctx, formatDateBR(new Date().toISOString().slice(0, 10)), x2, 106, half, 30);
        line(ctx, x1, 122, x1 + full, 122, RG_GREEN.line, 2);
        // nome
        label(ctx, 'NOME', x1, 162, full, ink);
        value(ctx, petName(p) === 'seu pet' ? '' : petName(p), x1, 200, full, 32);
        line(ctx, x1, 214, x1 + full, 214, RG_GREEN.line, 2);
        // filiação
        label(ctx, 'FILIAÇÃO (TUTORES)', x1, 254, full, ink);
        const tutors = (p.tutors ?? []).map((t) => t.name.trim()).filter(Boolean);
        value(ctx, tutors.slice(0, 2).join(', '), x1, 290, full);
        if (tutors.length > 2) value(ctx, tutors.slice(2).join(', '), x1, 324, full);
        else if (!tutors.length) value(ctx, tutorNames(p), x1, 290, full);
        line(ctx, x1, 338, x1 + full, 338, RG_GREEN.line, 2);
        // naturalidade + nascimento
        label(ctx, 'NATURALIDADE', x1, 378, half, ink);
        value(ctx, cityOf(p), x1, 414, half);
        label(ctx, p.origin === 'adocao' ? 'DATA DE ADOÇÃO' : 'DATA DE NASCIMENTO', x2, 378, half, ink);
        value(ctx, formatDateBR(p.date), x2, 414, half);
        line(ctx, x1, 428, x1 + full, 428, RG_GREEN.line, 2);
        // raça e sexo
        label(ctx, 'RAÇA', x1, 468, half, ink);
        value(ctx, p.breed ?? '', x1, 504, half);
        label(ctx, 'SEXO', x2, 468, (half - 20) / 2, ink);
        value(ctx, sexLabel(p), x2, 504, (half - 20) / 2);
        label(ctx, 'MICROCHIP', x2 + (half + 20) / 2, 468, (half - 20) / 2, ink);
        value(ctx, ex.microchip ?? '', x2 + (half + 20) / 2, 504, (half - 20) / 2, 22);
        line(ctx, x1, 518, x1 + full, 518, RG_GREEN.line, 2);
        text(ctx, 'VÁLIDA EM TODO O CORAÇÃO DOS TUTORES', W / 2, 570, { size: 18, weight: 900, color: ink, align: 'center', letterSpacing: 3 });
        text(ctx, 'Clube do Focinho · produto personalizado de uso pessoal, sem validade oficial', W / 2, 600, { size: 14, weight: 700, color: 'rgba(44,90,54,.65)', align: 'center' });
      },
    },
    {
      id: 'rg-cor-frente',
      label: 'Colorido · frente',
      w: TW,
      h: TH,
      mm: [86, 67],
      needsQr: true,
      layout: (c) => ({ template: `/templates/rg-${COR(c).k}-frente.webp`, slots: rgCorFrente(COR(c).pill) }),
      draw: () => undefined,
    },
    {
      id: 'rg-cor-verso',
      label: 'Colorido · verso',
      w: TW,
      h: TH,
      mm: [86, 67],
      layout: (c) => ({ template: `/templates/rg-${COR(c).k}-verso.webp`, slots: RG_COR_VERSO }),
      draw: () => undefined,
    },
    {
      id: 'rg-br-frente',
      label: 'Brasil · frente',
      w: TW,
      h: TH,
      mm: [86, 67],
      needsQr: true,
      layout: () => ({ template: '/templates/rg-frente.webp', slots: RG_FRENTE }),
      draw: () => undefined,
    },
    {
      id: 'rg-br-verso',
      label: 'Brasil · verso',
      w: TW,
      h: TH,
      mm: [86, 67],
      layout: () => ({ template: '/templates/rg-verso.webp', slots: RG_VERSO }),
      draw: () => undefined,
    },
  ],
};
