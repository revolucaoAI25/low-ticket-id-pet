'use client';

/**
 * Base dos order bumps personalizados (Kit Natal e Ano Novo, Figurinhas):
 * padrões, elementos e fontes de public/natal (origem e licenças em public/natal/LICENCAS.txt),
 * mais os recortes da foto do pet. Tudo desenhado no navegador, com a foto real do pet (sem IA).
 */

import { FONT_BODY, FONT_DISPLAY, ensureFonts, loadImage, type Ctx } from '@/lib/docs/draw';

export type Img = HTMLImageElement;

export const SCRIPT = '"NatalScript", "Great Vibes", cursive';
export const BOLD = `"NatalBold", ${FONT_DISPLAY}`;
export const MEME = '"NatalMeme", Impact, "Arial Black", sans-serif';
export const DISPLAY = FONT_DISPLAY;
export const BODY = FONT_BODY;

export const COR = {
  vermelho: '#B3121F',
  vermelhoEscuro: '#7E0C16',
  verde: '#0F5132',
  verdeEscuro: '#0A3622',
  dourado: '#D4A537',
  douradoClaro: '#F3D77E',
  creme: '#FBF6EC',
  preto: '#0D0D12',
};

let fontes: Promise<void> | null = null;
/** Fontes extras dos bumps (script elegante e letra gorda das figurinhas). */
export function ensureNatalFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!fontes) {
    const add = async (family: string, url: string, weight = '400') => {
      try {
        const f = new FontFace(family, `url(${url})`, { weight });
        await f.load();
        document.fonts.add(f);
      } catch {
        /* sem a fonte, usa a reserva */
      }
    };
    fontes = Promise.all([ensureFonts(), add('NatalScript', '/natal/fonts/great-vibes.woff2'), add('NatalBold', '/natal/fonts/baloo-2-800.woff2', '800'), add('NatalMeme', '/natal/fonts/anton.woff2')]).then(() => undefined);
  }
  return fontes;
}

const cache = new Map<string, Promise<Img | null>>();
/** Elemento de public/natal/el (emoji .svg ou recorte .png). */
export function el(name: string): Promise<Img | null> {
  const src = /\.(png|webp|svg)$/.test(name) ? `/natal/el/${name}` : `/natal/el/${name}.svg`;
  if (!cache.has(src)) cache.set(src, loadImage(src));
  return cache.get(src)!;
}
/** Padrão de public/natal/p. */
export function tile(name: string): Promise<Img | null> {
  const src = `/natal/p/${name}`;
  if (!cache.has(src)) cache.set(src, loadImage(src));
  return cache.get(src)!;
}

export async function loadAll<T extends string>(names: readonly T[], loader: (n: T) => Promise<Img | null>): Promise<Record<T, Img | null>> {
  const imgs = await Promise.all(names.map(loader));
  return Object.fromEntries(names.map((n, i) => [n, imgs[i]])) as Record<T, Img | null>;
}

export function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  return [c, ctx];
}

/** Preenche uma área com o padrão repetido (escala = tamanho do ladrilho). */
export function pattern(ctx: Ctx, img: Img | HTMLCanvasElement | null, x: number, y: number, w: number, h: number, scale = 1, alpha = 1, offset: [number, number] = [0, 0]) {
  if (!img) return;
  const p = ctx.createPattern(img, 'repeat');
  if (!p) return;
  p.setTransform(new DOMMatrix().translate(x + offset[0], y + offset[1]).scale(scale));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Recolore uma máscara (PNG branco com transparência) numa cor ou gradiente. */
export function tint(img: Img | null, fill: string | ((ctx: Ctx, w: number, h: number) => CanvasGradient)): HTMLCanvasElement | null {
  if (!img) return null;
  const [c, ctx] = canvas(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = typeof fill === 'string' ? fill : fill(ctx, c.width, c.height);
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

export function goldGradient(ctx: Ctx, x: number, y: number, w: number, h: number): CanvasGradient {
  const g = ctx.createLinearGradient(x, y, x + w * 0.35, y + h);
  g.addColorStop(0, '#F9E7A6');
  g.addColorStop(0.35, '#E2B44B');
  g.addColorStop(0.6, '#B98322');
  g.addColorStop(0.85, '#F1D27A');
  g.addColorStop(1, '#C8952E');
  return g;
}

/** Desenha um elemento centrado em (cx, cy), com largura w e rotação em graus. */
export function put(ctx: Ctx, img: Img | HTMLCanvasElement | null, cx: number, cy: number, w: number, rot = 0, alpha = 1) {
  if (!img) return;
  const iw = img instanceof HTMLImageElement ? img.naturalWidth || img.width : img.width;
  const ih = img instanceof HTMLImageElement ? img.naturalHeight || img.height : img.height;
  const h = (w * ih) / (iw || 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/**
 * Foto preenchendo a área (corte central, um pouco para cima: o rosto do pet costuma ficar no alto da foto).
 */
export function cover(ctx: Ctx, img: Img, x: number, y: number, w: number, h: number, focusY = 0.38) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s;
  const sh = h / s;
  const sx = (iw - sw) / 2;
  const sy = Math.max(0, Math.min(ih - sh, ih * focusY - sh / 2));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export type Shape = 'circle' | 'rounded' | 'arch' | 'heart' | 'star';

export function shapePath(ctx: Ctx, shape: Shape, x: number, y: number, w: number, h: number, r = 0.12) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'arch') {
    const rad = w / 2;
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + rad);
    ctx.arc(x + rad, y + rad, rad, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  } else if (shape === 'heart') {
    const cx = x + w / 2;
    ctx.moveTo(cx, y + h);
    ctx.bezierCurveTo(x - w * 0.05, y + h * 0.62, x - w * 0.02, y + h * 0.05, x + w * 0.27, y + h * 0.04);
    ctx.bezierCurveTo(x + w * 0.42, y + h * 0.03, cx, y + h * 0.14, cx, y + h * 0.24);
    ctx.bezierCurveTo(cx, y + h * 0.14, x + w * 0.58, y + h * 0.03, x + w * 0.73, y + h * 0.04);
    ctx.bezierCurveTo(x + w * 1.02, y + h * 0.05, x + w * 1.05, y + h * 0.62, cx, y + h);
    ctx.closePath();
  } else if (shape === 'star') {
    const cx = x + w / 2;
    const cy = y + h * 0.53;
    const R = w / 2;
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? R * 0.55 : R;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
  } else {
    const rad = Math.min(w, h) * r;
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
}

/** Foto recortada num formato, com borda e sombra opcionais. */
export function photo(
  ctx: Ctx,
  img: Img | null,
  shape: Shape,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { border?: number; borderColor?: string | CanvasGradient; shadow?: number; r?: number; focusY?: number; placeholder?: string } = {},
) {
  const b = o.border ?? 0;
  ctx.save();
  if (o.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = o.shadow;
    ctx.shadowOffsetY = o.shadow * 0.35;
  }
  if (b) {
    shapePath(ctx, shape, x - b, y - b, w + b * 2, h + b * 2, o.r);
    ctx.fillStyle = o.borderColor ?? '#fff';
    ctx.fill();
  } else if (o.shadow) {
    shapePath(ctx, shape, x, y, w, h, o.r);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  shapePath(ctx, shape, x, y, w, h, o.r);
  ctx.clip();
  if (img) cover(ctx, img, x, y, w, h, o.focusY);
  else {
    ctx.fillStyle = o.placeholder ?? '#EADFCC';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

export interface TextStyle {
  font: string;
  size: number;
  weight?: number | string;
  color?: string | CanvasGradient;
  stroke?: { color: string; width: number }[];
  shadow?: { color: string; blur: number; y?: number };
  align?: CanvasTextAlign;
  maxWidth?: number;
  letterSpacing?: number;
  rotate?: number;
}

/** Texto com contornos (do mais grosso ao mais fino), sombra e redução automática para caber. */
export function title(ctx: Ctx, str: string, x: number, y: number, st: TextStyle): number {
  ctx.save();
  let size = st.size;
  const set = () => {
    ctx.font = `${st.weight ?? 400} ${size}px ${st.font}`;
    if (st.letterSpacing !== undefined && 'letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${st.letterSpacing * size}px`;
  };
  set();
  if (st.maxWidth) {
    while (ctx.measureText(str).width > st.maxWidth && size > 10) {
      size *= 0.95;
      set();
    }
  }
  ctx.translate(x, y);
  if (st.rotate) ctx.rotate((st.rotate * Math.PI) / 180);
  ctx.textAlign = st.align ?? 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  if (st.shadow) {
    ctx.shadowColor = st.shadow.color;
    ctx.shadowBlur = st.shadow.blur;
    ctx.shadowOffsetY = st.shadow.y ?? 0;
  }
  for (const s of st.stroke ?? []) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.strokeText(str, 0, 0);
    ctx.shadowColor = 'transparent';
  }
  ctx.fillStyle = st.color ?? '#000';
  ctx.fillText(str, 0, 0);
  ctx.shadowColor = 'transparent';
  ctx.restore();
  return size;
}

/** Quebra o texto em linhas que caibam na largura. */
export function lines(ctx: Ctx, str: string, font: string, maxWidth: number): string[] {
  ctx.save();
  ctx.font = font;
  const out: string[] = [];
  let cur = '';
  for (const word of str.split(/\s+/)) {
    const t = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(t).width > maxWidth && cur) {
      out.push(cur);
      cur = word;
    } else cur = t;
  }
  if (cur) out.push(cur);
  ctx.restore();
  return out;
}

export function paragraph(ctx: Ctx, str: string, x: number, y: number, maxWidth: number, size: number, color: string, o: { weight?: number; font?: string; lh?: number; align?: CanvasTextAlign } = {}) {
  const font = `${o.weight ?? 600} ${size}px ${o.font ?? BODY}`;
  const ls = lines(ctx, str, font, maxWidth);
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = o.align ?? 'center';
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * size * (o.lh ?? 1.35)));
  ctx.restore();
  return ls.length;
}

/** Brilho de 4 pontas (estrelinha). */
export function twinkle(ctx: Ctx, x: number, y: number, s: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.12, -s * 0.12, s, 0);
  ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
  ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s, 0);
  ctx.quadraticCurveTo(-s * 0.12, -s * 0.12, 0, -s);
  ctx.fill();
  ctx.restore();
}

let seedState = 7;
export function rand(seed?: number): number {
  if (seed !== undefined) seedState = seed;
  seedState = (seedState * 9301 + 49297) % 233280;
  return seedState / 233280;
}

export const toBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), type, q));

/** Fotos do pet: a principal e as extras (sem repetir). */
export async function petPhotos(main?: string | null, extras?: string[] | null): Promise<Img[]> {
  const urls = [main, ...(extras ?? [])].filter((u, i, a): u is string => !!u && a.indexOf(u) === i);
  return (await Promise.all(urls.map((u) => loadImage(u)))).filter((i): i is Img => !!i);
}

export interface PatternSpec {
  /** Cor de fundo do ladrilho. */
  bg: string;
  /** Elementos (imagens) repetidos. */
  icons: (Img | null)[];
  /** Cor única dos elementos (silhuetas). Sem cor = cores originais. Pode ser uma lista (alterna). */
  color?: string | string[];
  /** Tamanho do ladrilho (px) e quantidade de colunas/linhas. */
  tile?: number;
  grid?: number;
  /** Tamanho de cada elemento em fração da célula. */
  scale?: number;
  alpha?: number;
  seed?: number;
}

/**
 * Padrão moderno de papel de presente: elementos em grade intercalada, com leve giro.
 * O ladrilho fecha sem emenda (cada elemento é desenhado também do outro lado da borda).
 */
export function makePattern(sp: PatternSpec): HTMLCanvasElement {
  const T = sp.tile ?? 600;
  const n = sp.grid ?? 4;
  const cell = T / n;
  const [c, ctx] = canvas(T, T);
  ctx.fillStyle = sp.bg;
  ctx.fillRect(0, 0, T, T);
  const colors = Array.isArray(sp.color) ? sp.color : sp.color ? [sp.color] : [];
  const icons = sp.icons.filter((i): i is Img => !!i);
  if (!icons.length) return c;
  const tinted = new Map<string, HTMLCanvasElement | Img>();
  const get = (img: Img, color?: string) => {
    if (!color) return img;
    const key = `${img.src}|${color}`;
    if (!tinted.has(key)) tinted.set(key, tint(img, color) ?? img);
    return tinted.get(key)!;
  };
  rand(sp.seed ?? 3);
  let k = 0;
  for (let r = 0; r < n; r++)
    for (let q = 0; q < n; q++) {
      const img = icons[(k + r) % icons.length];
      const col = colors.length ? colors[(k + r * 2) % colors.length] : undefined;
      k++;
      const x = q * cell + cell / 2 + (r % 2 ? cell / 2 : 0);
      const y = r * cell + cell / 2;
      const w = cell * (sp.scale ?? 0.5) * (0.85 + rand() * 0.3);
      const rot = (rand() - 0.5) * 36;
      for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) put(ctx, get(img, col), x + dx, y + dy, w, rot, sp.alpha ?? 1);
    }
  // pontinhos entre os elementos
  ctx.fillStyle = colors[0] ?? 'rgba(255,255,255,.6)';
  ctx.globalAlpha = 0.35 * (sp.alpha ?? 1);
  for (let r = 0; r < n; r++)
    for (let q = 0; q < n; q++) {
      const x = q * cell + (r % 2 ? 0 : cell / 2) + cell / 2;
      const y = r * cell + cell;
      for (const dx of [-T, 0, T]) {
        ctx.beginPath();
        ctx.arc((x % T) + dx, y % T, cell * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  ctx.globalAlpha = 1;
  return c;
}
