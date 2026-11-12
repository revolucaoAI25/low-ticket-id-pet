'use client';

/**
 * Figurinhas Personalizadas do Seu Pet: 34 figurinhas 512×512 com fundo transparente,
 * a foto real do pet recortada (círculo, coração ou quadrado), frase e contorno branco de figurinha.
 */

import type { Ctx } from '@/lib/docs/draw';
import { BOLD, MEME, canvas, el, ensureNatalFonts, goldGradient, loadAll, photo, put, toBlob, type Img, type Shape } from './base';
import type { NatalPet } from './artes';

export interface Figurinha {
  id: string;
  label: string;
  file: string;
  canvas: HTMLCanvasElement;
}

type Layout = 'baixo' | 'cima' | 'meme' | 'meme-cima';

interface Def {
  id: string;
  text: (p: NatalPet) => string;
  color: string;
  dark: string;
  shape: Shape;
  layout: Layout;
  /** Emojis: [nome, x, y, largura, rotação] em px no quadro de 512. */
  emojis: [string, number, number, number, number][];
  /** Elementos desenhados por cima da foto (ex.: gorro, coroa). */
  top?: [string, number, number, number, number][];
  tilt?: number;
  natal?: boolean;
}

const DEFS: Def[] = [
  { id: 'bom-dia', text: () => 'Bom dia!', color: '#FFB703', dark: '#7A4A00', shape: 'circle', layout: 'baixo', emojis: [['sun', 410, 92, 120, 0], ['hot-beverage', 92, 330, 84, -10]] },
  { id: 'boa-noite', text: () => 'Boa noite!', color: '#6C63FF', dark: '#211A66', shape: 'rounded', layout: 'cima', emojis: [['crescent-moon', 420, 220, 100, 10], ['zzz', 96, 250, 86, -12]] },
  { id: 'quero-petisco', text: () => 'Quero\npetisco!', color: '#F77F00', dark: '#6B2E00', shape: 'circle', layout: 'baixo', emojis: [['bone', 412, 96, 118, 30], ['drooling-face', 92, 104, 82, -8]] },
  { id: 'eu-que-mando', text: () => 'Eu que\nmando!', color: '#F4C430', dark: '#5C3D00', shape: 'circle', layout: 'baixo', emojis: [], top: [['crown', 256, 42, 150, -6]] },
  { id: 'to-de-olho', text: () => 'Tô de olho!', color: '#00B4B4', dark: '#004747', shape: 'rounded', layout: 'cima', emojis: [['eyes', 418, 240, 104, 8]] },
  { id: 'me-da-atencao', text: () => 'Me dá\natenção!', color: '#FF5D8F', dark: '#6E0D2E', shape: 'heart', layout: 'baixo', emojis: [['pleading-face', 420, 90, 100, 10]] },
  { id: 'partiu-passeio', text: () => 'Partiu\npasseio!', color: '#2BB673', dark: '#0B4A2B', shape: 'circle', layout: 'baixo', emojis: [['paw-prints', 412, 100, 110, 20]], tilt: -5 },
  { id: 'nao-fui-eu', text: () => 'Não fui eu!', color: '#3A86FF', dark: '#0B2A66', shape: 'circle', layout: 'baixo', emojis: [], top: [['face-with-halo', 404, 86, 112, 10]] },
  { id: 'to-on', text: () => 'Tô on!', color: '#8AC926', dark: '#2E4A00', shape: 'rounded', layout: 'cima', emojis: [['smiling-face-with-sunglasses', 96, 250, 100, -10], ['high-voltage', 420, 250, 90, 12]] },
  { id: 'fofoqueiro', text: (p) => (p.female ? 'Fofoqueira!' : 'Fofoqueiro!'), color: '#9D4EDD', dark: '#3A0A63', shape: 'rounded', layout: 'cima', emojis: [['face-with-hand-over-mouth', 420, 250, 104, 8], ['speech-balloon', 94, 250, 90, -8]] },
  { id: 'te-amo', text: () => 'Te amo!', color: '#E63946', dark: '#5E0A12', shape: 'heart', layout: 'baixo', emojis: [['red-heart', 416, 84, 96, 14], ['sparkling-heart', 88, 110, 76, -14]] },
  { id: 'saudade', text: () => 'Tô com\nsaudade!', color: '#7B6CF6', dark: '#241A75', shape: 'circle', layout: 'baixo', emojis: [['growing-heart', 414, 96, 100, 12]] },
  // Memes (estilo meme clássico: letra branca com contorno preto por cima da foto)
  { id: 'calma-calabreso', text: () => 'Calma,\ncalabreso', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['raising-hands', 436, 66, 92, 10]] },
  { id: 'pai-ta-on', text: (p) => (p.female ? 'Mãe tá on' : 'Pai tá on'), color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['smiling-face-with-sunglasses', 436, 70, 100, 10], ['fire', 76, 70, 84, -10]] },
  { id: 'nao-tanko', text: () => 'Não tanko', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['melting-face', 436, 70, 100, 10]] },
  { id: 'sextou', text: () => 'Sextou!', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme-cima', emojis: [['party-popper', 436, 440, 104, 10], ['partying-face', 78, 440, 92, -10]] },
  { id: 'me-erra', text: () => 'Me erra', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['face-with-rolling-eyes', 436, 70, 100, 10]] },
  { id: 'to-passado', text: (p) => (p.female ? 'Tô passada' : 'Tô passado'), color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['exploding-head', 436, 70, 104, 10]] },
  { id: 'aceita', text: () => 'Aceita que\ndói menos', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['smirking-face', 436, 70, 100, 10]] },
  { id: 'e-sobre-isso', text: () => 'É sobre isso', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['sparkles', 436, 70, 100, 10]] },
  { id: 'rapaz', text: () => 'Rapaz...', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['neutral-face', 436, 70, 100, 10]] },
  { id: 'eita', text: () => 'Eita!', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme-cima', emojis: [['flushed-face', 436, 440, 104, 10]] },
  { id: 'brabo', text: (p) => (p.female ? 'Braba' : 'Brabo'), color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['flexed-biceps', 436, 70, 100, 10], ['hundred-points', 76, 70, 84, -10]] },
  { id: 'sem-condicoes', text: () => 'Sem\ncondições', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['face-with-tears-of-joy', 436, 70, 104, 10]] },
  { id: 'oxe', text: () => 'Oxe?!', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme-cima', emojis: [['face-with-monocle', 436, 440, 104, 10]] },
  { id: 'chorei', text: () => 'Chorei', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['loudly-crying-face', 436, 70, 104, 10]] },
  { id: 'faz-o-pix', text: () => 'Faz o pix\ndo petisco', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['money-with-wings', 436, 70, 104, 10], ['bone', 80, 70, 96, -20]] },
  { id: 'preguica', text: () => 'Que\npreguiça...', color: '#fff', dark: '#000', shape: 'rounded', layout: 'meme', emojis: [['sloth', 436, 70, 104, 10], ['zzz', 80, 70, 80, -10]] },
  { id: 'feliz-natal', text: () => 'Feliz\nNatal!', color: '#E01E37', dark: '#4E0711', shape: 'circle', layout: 'baixo', emojis: [['christmas-tree', 420, 150, 96, 8]], top: [['gorro.png', 168, 70, 200, -26]], natal: true },
  { id: 'ho-ho-ho', text: () => 'Ho Ho Ho!', color: '#1FA45B', dark: '#0A3D21', shape: 'circle', layout: 'baixo', emojis: [['wrapped-gift', 94, 330, 92, -10], ['santa-claus', 416, 104, 104, 10]], top: [['gorro.png', 168, 70, 200, -26]], natal: true },
  { id: 'cade-presente', text: () => 'Cadê meu\npresente?', color: '#E01E37', dark: '#4E0711', shape: 'rounded', layout: 'cima', emojis: [['wrapped-gift', 96, 250, 100, -12], ['eyes', 420, 250, 90, 10]], natal: true },
  { id: 'fui-bonzinho', text: (p) => (p.female ? 'Fui boazinha\no ano todo!' : 'Fui bonzinho\no ano todo!'), color: '#1FA45B', dark: '#0A3D21', shape: 'circle', layout: 'baixo', emojis: [['face-with-halo', 416, 100, 104, 10]], top: [['gorro.png', 168, 70, 200, -26]], natal: true },
  { id: 'feliz-ano-novo', text: () => 'Feliz\nAno Novo!', color: 'gold', dark: '#2A1E00', shape: 'circle', layout: 'baixo', emojis: [['glowing-star', 414, 92, 110, 8], ['sparkles', 94, 96, 84, -8], ['clinking-glasses', 420, 330, 90, 10]], natal: true },
  { id: 'partiu-2027', text: () => 'Partiu 2027!', color: 'gold', dark: '#2A1E00', shape: 'rounded', layout: 'cima', emojis: [['party-popper', 96, 250, 100, -12], ['confetti-ball', 420, 250, 96, 10]], natal: true },
];

const EMOJIS = [...new Set(DEFS.flatMap((d) => [...d.emojis, ...(d.top ?? [])].map((x) => x[0])))];

/** Frase em uma ou duas linhas, letra gorda com contorno escuro (o contorno branco vem depois, no conjunto). */
function phrase(ctx: Ctx, str: string, cx: number, cy: number, maxW: number, color: string, dark: string, rot: number) {
  const ls = str.split('\n');
  let size = ls.length > 1 ? 74 : 84;
  const font = () => `800 ${size}px ${BOLD}`;
  ctx.save();
  ctx.font = font();
  while (Math.max(...ls.map((l) => ctx.measureText(l).width)) > maxW && size > 30) {
    size -= 2;
    ctx.font = font();
  }
  const lh = size * 0.92;
  ctx.translate(cx, cy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const fill = color === 'gold' ? goldGradient(ctx, -maxW / 2, -lh, maxW, lh * 2) : color;
  ls.forEach((l, i) => {
    const y = (i - (ls.length - 1) / 2) * lh;
    ctx.strokeStyle = dark;
    ctx.lineWidth = size * 0.2;
    ctx.strokeText(l, 0, y + size * 0.05);
    ctx.fillStyle = fill;
    ctx.fillText(l, 0, y);
  });
  ctx.restore();
}

/** Texto de meme: maiúsculas, branco com contorno preto, por cima da foto. */
function memeText(ctx: Ctx, str: string, where: 'baixo' | 'cima') {
  const ls = str.toUpperCase().split('\n');
  let size = ls.length > 1 ? 66 : 80;
  ctx.save();
  const font = () => (ctx.font = `400 ${size}px ${MEME}`);
  font();
  while (Math.max(...ls.map((l) => ctx.measureText(l).width)) > 410 && size > 30) {
    size -= 2;
    font();
  }
  const lh = size * 1.02;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const top = where === 'cima' ? 60 + size : 478 - 26 - (ls.length - 1) * lh;
  ls.forEach((l, i) => {
    const y = top + i * lh;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = size * 0.18;
    ctx.strokeText(l, 256, y);
    ctx.fillStyle = '#fff';
    ctx.fillText(l, 256, y);
  });
  ctx.restore();
}

/** Contorno branco único em volta de tudo (o "recorte" de figurinha) e uma sombra leve. */
function outline(layer: HTMLCanvasElement, R = 13): HTMLCanvasElement {
  const [sil, s] = canvas(layer.width, layer.height);
  s.drawImage(layer, 0, 0);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = '#fff';
  s.fillRect(0, 0, sil.width, sil.height);
  const [out, o] = canvas(layer.width, layer.height);
  const [ring, r] = canvas(layer.width, layer.height);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    r.drawImage(sil, Math.cos(a) * R, Math.sin(a) * R);
  }
  r.drawImage(sil, 0, 0);
  o.save();
  o.shadowColor = 'rgba(0,0,0,.28)';
  o.shadowBlur = 7;
  o.shadowOffsetY = 3;
  o.drawImage(ring, 0, 0);
  o.restore();
  o.drawImage(layer, 0, 0);
  return out;
}

function draw(d: Def, p: NatalPet, img: Img | null, e: Record<string, Img | null>): HTMLCanvasElement {
  const [layer, ctx] = canvas(512, 512);
  ctx.save();
  if (d.tilt) {
    ctx.translate(256, 256);
    ctx.rotate((d.tilt * Math.PI) / 180);
    ctx.translate(-256, -256);
  }
  const ph = d.shape === 'heart' ? 330 : 318;
  if (d.layout === 'meme' || d.layout === 'meme-cima') {
    photo(ctx, img, 'rounded', 34, 34, 444, 444, { r: 0.12 });
    memeText(ctx, d.text(p), d.layout === 'meme' ? 'baixo' : 'cima');
    for (const [n, x, y, w, r] of d.emojis) put(ctx, e[n], x, y, w, r);
    ctx.restore();
    const [fit, f] = canvas(512, 512);
    f.drawImage(layer, 22, 22, 468, 468);
    return outline(fit);
  }
  if (d.layout === 'baixo') {
    const x = 256 - ph / 2;
    const y = d.shape === 'heart' ? 34 : 40;
    photo(ctx, img, d.shape, x, y, ph, d.shape === 'heart' ? ph * 0.92 : ph, { r: 0.18, border: 6, borderColor: d.color === 'gold' ? goldGradient(ctx, x, y, ph, ph) : d.color });
  } else {
    photo(ctx, img, d.shape, 256 - ph / 2, 168, ph, ph, { r: 0.18, border: 6, borderColor: d.color === 'gold' ? goldGradient(ctx, 0, 168, 512, ph) : d.color });
  }
  for (const [n, x, y, w, r] of d.top ?? []) put(ctx, e[n], x, y, w, r);
  for (const [n, x, y, w, r] of d.emojis) put(ctx, e[n], x, y, w, r);
  const str = d.text(p);
  if (d.layout === 'baixo') phrase(ctx, str, 256, str.includes('\n') ? 412 : d.shape === 'heart' ? 405 : 430, 452, d.color, d.dark, -4);
  else phrase(ctx, str, 256, 92, 452, d.color, d.dark, -5);
  ctx.restore();

  // Encolhe um pouco para o contorno caber dentro dos 512 px.
  const [fit, f] = canvas(512, 512);
  f.drawImage(layer, 22, 22, 468, 468);
  return outline(fit);
}

export async function renderFigurinhas(p: NatalPet, only?: string[]): Promise<Figurinha[]> {
  await ensureNatalFonts();
  const e = await loadAll(EMOJIS, el);
  const out: Figurinha[] = [];
  DEFS.forEach((d, i) => {
    if (only && !only.includes(d.id)) return;
    const img = p.photos.length ? p.photos[i % p.photos.length] : null;
    out.push({ id: d.id, label: d.text(p).replace('\n', ' '), file: `${String(i + 1).padStart(2, '0')}-${d.id}`, canvas: draw(d, p, img, e) });
  });
  return out;
}

/**
 * WebP de figurinha (o WhatsApp pede 512×512 e até 100 KB). Navegador sem WebP (Safari antigo) devolve null.
 */
export async function toStickerWebp(c: HTMLCanvasElement): Promise<Blob | null> {
  for (const q of [0.9, 0.8, 0.7, 0.6, 0.5]) {
    const b = await toBlob(c, 'image/webp', q);
    if (b.type !== 'image/webp') return null;
    if (b.size <= 100_000) return b;
  }
  return null;
}
