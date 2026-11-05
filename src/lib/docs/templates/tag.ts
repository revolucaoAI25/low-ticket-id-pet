'use client';

import { tagColors } from '@/config/brand';
import { petName } from '@/lib/pet';
import { heart, paw, text } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';

const W = 1000;
const H = 560;
const C = tagColors;

/** Contorno de ossinho: retângulo + 4 círculos (união pela regra nonzero). */
export function bonePath(ctx: Ctx, w: number, h: number, grow = 0) {
  const r = h * 0.25 + grow;
  const cx1 = h * 0.27;
  const cx2 = w - h * 0.27;
  const cy1 = h * 0.3;
  const cy2 = h * 0.7;
  ctx.beginPath();
  ctx.rect(cx1, h * 0.25 - grow, cx2 - cx1, h * 0.5 + grow * 2);
  for (const [cx, cy] of [
    [cx1, cy1],
    [cx1, cy2],
    [cx2, cy1],
    [cx2, cy2],
  ]) {
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
}

function bone(ctx: Ctx, bg: HTMLImageElement | null) {
  if (bg) {
    ctx.drawImage(bg, 0, 0, W, H);
    return;
  }
  bonePath(ctx, W, H, 0);
  ctx.fillStyle = C.dark;
  ctx.fill('nonzero');
  bonePath(ctx, W, H, -9);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, C.light);
  grad.addColorStop(1, C.base);
  ctx.fillStyle = grad;
  ctx.fill('nonzero');
  // furo da argola
  ctx.beginPath();
  ctx.arc(H * 0.17, H * 0.5, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = C.dark;
  ctx.stroke();
}

const copies: [number, number][] = [
  [55, 31],
  [55, 31],
  [55, 31],
  [45, 25],
  [45, 25],
];

export const tagDoc: DocDef = {
  id: 'tag',
  title: 'Tag Ossinho com QR Code',
  file: 'Tag-Ossinho-do-{nome}',
  pages: [
    {
      id: 'tag-nome',
      label: 'Frente (nome)',
      w: W,
      h: H,
      mm: [55, 31],
      printCopies: copies,
      shape: 'bone',
      draw(ctx, c, a) {
        bone(ctx, a.background);
        const name = petName(c.pet) === 'seu pet' ? 'Meu nome' : petName(c.pet);
        text(ctx, name, W / 2 + 20, H / 2 + 34, { size: 120, weight: 700, family: 'display', color: C.ink, align: 'center', maxWidth: 560, minSize: 60 });
        paw(ctx, W / 2 + 20, H / 2 - 92, 50, 'rgba(74,54,38,.55)');
        heart(ctx, W - 175, H / 2, 40, '#D98C7A');
      },
    },
    {
      id: 'tag-qr',
      label: 'Verso (QR Code)',
      w: W,
      h: H,
      mm: [55, 31],
      printCopies: copies,
      shape: 'bone',
      needsQr: true,
      draw(ctx, c, a) {
        bone(ctx, a.background);
        const s = 250;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect?.(W / 2 + 20 - s / 2 - 14, H / 2 - s / 2 - 14, s + 28, s + 28, 18);
        ctx.fill();
        if (a.qr) {
          ctx.save();
          if (c.preview) ctx.globalAlpha = 0.35;
          ctx.drawImage(a.qr, W / 2 + 20 - s / 2, H / 2 - s / 2, s, s);
          ctx.restore();
        }
        text(ctx, 'ME', 260, H / 2 - 6, { size: 34, weight: 900, color: C.ink, align: 'center', letterSpacing: 2 });
        text(ctx, 'ESCANEIE', 260, H / 2 + 30, { size: 26, weight: 900, color: C.ink, align: 'center', letterSpacing: 1 });
        paw(ctx, W - 190, H / 2, 70, 'rgba(74,54,38,.6)');
      },
    },
  ],
};
