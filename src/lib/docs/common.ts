'use client';

import { getSpecies } from '@/lib/species';
import type { PetData } from '@/lib/pet';
import { drawCover, paw, rr, text, type Ctx } from './draw';

export { formatPhone } from '@/lib/format';

export const INK = '#49382F';
export const MUTED = '#8a7566';
export const CREAM = '#FFF8EF';
export const DISCLAIMER = 'Produto personalizado de uso pessoal. Sem validade oficial.';

/** Moldura de foto retangular. Sem foto: ilustração da espécie. */
export function photoBox(
  ctx: Ctx,
  photo: HTMLImageElement | null,
  pet: PetData,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  o: { border?: number; borderColor?: string; bg?: string } = {},
) {
  const b = o.border ?? 0;
  if (b) {
    rr(ctx, x - b, y - b, w + b * 2, h + b * 2, r + b);
    ctx.fillStyle = o.borderColor ?? '#fff';
    ctx.fill();
  }
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  if (photo) drawCover(ctx, photo, x, y, w, h);
  else noPhoto(ctx, pet, x, y, w, h, o.bg);
  ctx.restore();
}

export function photoCircle(
  ctx: Ctx,
  photo: HTMLImageElement | null,
  pet: PetData,
  cx: number,
  cy: number,
  radius: number,
  o: { ring?: number; ringColor?: string; bg?: string } = {},
) {
  if (o.ring) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + o.ring, 0, Math.PI * 2);
    ctx.fillStyle = o.ringColor ?? '#fff';
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  if (photo) drawCover(ctx, photo, cx - radius, cy - radius, radius * 2, radius * 2);
  else noPhoto(ctx, pet, cx - radius, cy - radius, radius * 2, radius * 2, o.bg);
  ctx.restore();
}

/** Ilustração padrão quando não tem foto. */
export function noPhoto(ctx: Ctx, pet: PetData, x: number, y: number, w: number, h: number, bg = '#F6E9DA') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  const m = Math.min(w, h);
  paw(ctx, x + w * 0.2, y + h * 0.22, m * 0.18, 'rgba(73,56,47,.07)', -0.3);
  paw(ctx, x + w * 0.82, y + h * 0.8, m * 0.2, 'rgba(73,56,47,.07)', 0.4);
  const emoji = getSpecies(pet.species)?.emoji ?? '🐾';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(m * 0.48)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.fillText(emoji, x + w / 2, y + h / 2 + m * 0.03);
  ctx.textBaseline = 'alphabetic';
}

/** Assinatura "Clube do Focinho" com patinha. */
export function brandMark(ctx: Ctx, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left') {
  ctx.save();
  const label = 'Clube do Focinho';
  text(ctx, label, x, y, { size, weight: 600, family: 'display', color, align });
  const w = ctx.measureText(label).width;
  const start = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  paw(ctx, start - size * 0.75, y - size * 0.34, size * 0.9, color);
  ctx.restore();
}

/** Na prévia, esconde os dígitos do número. */
export function maskNumber(num: string, preview?: boolean): string {
  return preview ? num.replace(/\d/g, '•') : num;
}

/** Marca d'água "PRÉVIA" na diagonal. */
export function watermark(ctx: Ctx, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 7);
  const size = Math.max(28, Math.min(w, h) * 0.085);
  ctx.font = `800 ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = size * 3.4;
  const diag = Math.hypot(w, h);
  for (let yy = -diag / 2; yy < diag / 2; yy += step) {
    const off = (Math.round(yy / step) % 2) * step;
    for (let xx = -diag / 2 + off; xx < diag / 2; xx += step * 3.2) {
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillText('PRÉVIA', xx + 2, yy + 2);
      ctx.fillStyle = 'rgba(73,56,47,.17)';
      ctx.fillText('PRÉVIA', xx, yy);
    }
  }
  ctx.restore();
}

