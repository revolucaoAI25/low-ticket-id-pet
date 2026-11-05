'use client';

import { fontBody, fontDisplay } from '@/app/fonts';

export type Ctx = CanvasRenderingContext2D;

export const FONT_DISPLAY = fontDisplay.style.fontFamily;
export const FONT_BODY = fontBody.style.fontFamily;

let fontsReady: Promise<void> | null = null;
export function ensureFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!fontsReady) {
    const loads = [
      `500 40px ${FONT_DISPLAY}`,
      `600 40px ${FONT_DISPLAY}`,
      `700 40px ${FONT_DISPLAY}`,
      `400 40px ${FONT_BODY}`,
      `700 40px ${FONT_BODY}`,
      `800 40px ${FONT_BODY}`,
      `900 40px ${FONT_BODY}`,
    ].map((f) => document.fonts.load(f).catch(() => []));
    fontsReady = Promise.all(loads).then(() => undefined);
  }
  return fontsReady;
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();
export function loadImage(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return cached;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('/')) img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  if (!src.startsWith('data:') || src.length < 200_000) imageCache.set(src, p);
  return p;
}

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function fillRR(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

export interface TextOpts {
  size: number;
  weight?: number;
  family?: 'display' | 'body';
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  /** Menor tamanho aceito ao encolher para caber. */
  minSize?: number;
  letterSpacing?: number;
  italic?: boolean;
}

function setFont(ctx: Ctx, o: TextOpts, size: number) {
  const fam = o.family === 'display' ? FONT_DISPLAY : FONT_BODY;
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 700} ${size}px ${fam}`;
}

/** Escreve uma linha, encolhendo a fonte até caber em maxWidth. */
export function text(ctx: Ctx, str: string, x: number, y: number, o: TextOpts) {
  const lsCtx = ctx as unknown as { letterSpacing?: string };
  const canSpace = 'letterSpacing' in ctx;
  const ls = canSpace ? (o.letterSpacing ?? 0) : 0;
  if (canSpace) lsCtx.letterSpacing = '0px';
  let size = o.size;
  setFont(ctx, o, size);
  const measure = (t: string) => ctx.measureText(t).width + ls * Math.max(0, t.length - 1);
  if (o.maxWidth) {
    const min = o.minSize ?? o.size * 0.55;
    while (measure(str) > o.maxWidth && size > min) {
      size -= 1;
      setFont(ctx, o, size);
    }
  }
  let s = str;
  if (o.maxWidth && measure(s) > o.maxWidth) {
    while (s.length > 1 && measure(s + '…') > o.maxWidth) s = s.slice(0, -1);
    s = s + '…';
  }
  ctx.fillStyle = o.color ?? '#49382F';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  // Com espaçamento entre letras, o alinhamento central/direita precisa compensar o espaço extra.
  let dx = 0;
  if (ls) {
    lsCtx.letterSpacing = `${ls}px`;
    const align = o.align ?? 'left';
    if (align === 'center') dx = ls / 2;
    else if (align === 'right' || align === 'end') dx = ls;
  }
  ctx.textAlign = o.align ?? 'left';
  ctx.fillText(s, x + dx, y);
  if (ls) lsCtx.letterSpacing = '0px';
  return size;
}

/** Texto com quebra de linha. Retorna o y depois da última linha. */
export function wrap(ctx: Ctx, str: string, x: number, y: number, maxWidth: number, lineHeight: number, o: TextOpts & { maxLines?: number }) {
  setFont(ctx, o, o.size);
  ctx.fillStyle = o.color ?? '#49382F';
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  const words = str.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  const max = o.maxLines ?? lines.length;
  const out = lines.slice(0, max);
  if (lines.length > max) {
    let last = out[max - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    out[max - 1] = last + '…';
  }
  out.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + out.length * lineHeight;
}

/** Desenha a imagem cobrindo a área (como object-fit: cover). */
export function drawCover(ctx: Ctx, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const iw = (img as HTMLImageElement).naturalWidth || img.width;
  const ih = (img as HTMLImageElement).naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s;
  const sh = h / s;
  // Foto de pet: enquadra um pouco acima do centro (onde costuma estar o rosto).
  const sx = (iw - sw) / 2;
  const sy = Math.max(0, (ih - sh) * 0.38);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export function drawContain(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Pegada de patinha. */
export function paw(ctx: Ctx, cx: number, cy: number, size: number, color: string, rotate = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotate);
  ctx.fillStyle = color;
  const s = size / 100;
  ctx.beginPath();
  ctx.ellipse(0, 18 * s, 30 * s, 25 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes: [number, number, number, number][] = [
    [-34, -14, 11, 14],
    [-13, -34, 11, 15],
    [13, -34, 11, 15],
    [34, -14, 11, 14],
  ];
  for (const [x, y, rx, ry] of toes) {
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, rx * s, ry * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function heart(ctx: Ctx, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.7);
  ctx.bezierCurveTo(-s * 1.2, -s * 0.1, -s * 0.6, -s * 1.05, 0, -s * 0.4);
  ctx.bezierCurveTo(s * 0.6, -s * 1.05, s * 1.2, -s * 0.1, 0, s * 0.7);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function star(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Fundo com patinhas espalhadas. */
export function pawPattern(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, gap = 120, size = 34) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  let row = 0;
  for (let yy = y - gap / 2; yy < y + h + gap; yy += gap * 0.75) {
    const off = row % 2 ? gap / 2 : 0;
    for (let xx = x - gap + off; xx < x + w + gap; xx += gap) {
      paw(ctx, xx, yy, size, color, ((row * 7 + xx) % 5) * 0.12 - 0.25);
    }
    row++;
  }
  ctx.restore();
}

export function dashedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string, lw = 3, dash: number[] = [10, 8]) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.lineWidth = lw;
  ctx.strokeStyle = color;
  rr(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, lw = 2, dash?: number[]) {
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Campo de documento: rótulo pequeno em cima e valor numa linha. */
export function field(
  ctx: Ctx,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  o: { labelColor?: string; valueColor?: string; lineColor?: string; size?: number; labelSize?: number; gap?: number } = {},
) {
  const ls = o.labelSize ?? 17;
  text(ctx, label.toUpperCase(), x, y, { size: ls, weight: 800, color: o.labelColor ?? '#8a7566', letterSpacing: 1.5, maxWidth: w });
  const vy = y + (o.gap ?? (o.size ?? 30) + 8);
  if (value) text(ctx, value, x, vy, { size: o.size ?? 30, weight: 700, color: o.valueColor ?? '#49382F', maxWidth: w, family: 'body' });
  line(ctx, x, vy + 10, x + w, vy + 10, o.lineColor ?? 'rgba(73,56,47,.22)', 2);
}

export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function onColor(hex: string): string {
  return luminance(hex) > 0.45 ? '#2b211b' : '#FFFFFF';
}

export function confetti(ctx: Ctx, x: number, y: number, w: number, h: number, colors: string[], count = 40, seed = 7) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < count; i++) {
    const cx = x + rnd() * w;
    const cy = y + rnd() * h;
    ctx.save();
    ctx.fillStyle = colors[i % colors.length];
    ctx.translate(cx, cy);
    ctx.rotate(rnd() * Math.PI);
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 6 + rnd() * 6, 0, Math.PI * 2);
      ctx.fill();
    } else ctx.fillRect(-10, -4, 20 + rnd() * 10, 8);
    ctx.restore();
  }
}
