'use client';

/**
 * Kit Natal e Ano Novo do Seu Pet: 7 artes com a foto e o nome do pet.
 * Feed 1080×1350, cartões 1800×1200 (15×10 cm em 300 dpi) e papel de parede 1080×1920.
 */

import type { Ctx } from '@/lib/docs/draw';
import {
  BODY,
  BOLD,
  COR,
  SCRIPT,
  canvas,
  el,
  goldGradient,
  loadAll,
  makePattern,
  paragraph,
  pattern,
  photo,
  put,
  rand,
  tile,
  tint,
  title,
  twinkle,
  type Img,
} from './base';

export interface NatalPet {
  name: string;
  female: boolean;
  /** Fotos do pet (a 1ª é a principal). */
  photos: Img[];
}

export interface Arte {
  id: string;
  label: string;
  /** Nome do arquivo (sem extensão). */
  file: string;
  canvas: HTMLCanvasElement;
}

const TILES = ['tartan.webp', 'xadrez.webp', 'neve-vermelha.webp', 'arvores.webp', 'flocos.png', 'confete.png'] as const;
const ELS = [
  'gorro.png',
  'azevinho.png',
  'floco-dourado.png',
  'bola-dourada.png',
  'christmas-tree',
  'wrapped-gift',
  'snowman',
  'bell',
  'candy',
  'socks',
  'cookie',
  'star',
  'glowing-star',
  'sparkles',
  'clinking-glasses',
  'bottle-with-popping-cork',
  'party-popper',
  'confetti-ball',
  'red-heart',
  'paw-prints',
  'ribbon',
  'snowflake',
  'deer',
  'snowman',
] as const;

type Tiles = Record<(typeof TILES)[number], Img | null>;
type Els = Record<(typeof ELS)[number], Img | null>;

/** Padrões modernos montados com os elementos (papel de presente). */
interface Pads {
  vermelho: HTMLCanvasElement;
  verde: HTMLCanvasElement;
  creme: HTMLCanvasElement;
  noite: HTMLCanvasElement;
  dourado: HTMLCanvasElement;
}
let pads: Pads | null = null;
function padroes(e: Els): Pads {
  if (pads) return pads;
  const natal = [e['christmas-tree'], e['wrapped-gift'], e['socks'], e['candy'], e['star'], e['azevinho.png'], e['snowflake'], e['bell']];
  const festa = [e['star'], e['sparkles'], e['glowing-star'], e['clinking-glasses'], e['party-popper'], e['bottle-with-popping-cork']];
  pads = {
    vermelho: makePattern({ bg: '#A70F1C', icons: natal, color: '#F7E9D2', grid: 4, scale: 0.5, alpha: 0.95, seed: 3 }),
    verde: makePattern({ bg: '#0D4A2D', icons: natal, color: ['#F7E9D2', '#E3B54A'], grid: 4, scale: 0.5, alpha: 0.9, seed: 5 }),
    creme: makePattern({ bg: '#FBF3E4', icons: [e['christmas-tree'], e['wrapped-gift'], e['socks'], e['candy'], e['azevinho.png'], e['snowman'], e['bell'], e['deer']], grid: 4, scale: 0.5, seed: 9 }),
    noite: makePattern({ bg: '#0D0D12', icons: festa, color: ['#E2B44B', '#F3D77E'], grid: 4, scale: 0.46, alpha: 0.5, seed: 7 }),
    dourado: makePattern({ bg: '#FFFBF2', icons: festa, color: '#D9AE45', grid: 4, scale: 0.46, alpha: 0.35, seed: 8 }),
  };
  return pads;
}

const pick = (p: NatalPet, i: number) => p.photos[i % Math.max(1, p.photos.length)] ?? null;

/* ------------------------------------------------------------------ */

/** 1. Natal clássico: xadrez escocês, cartão creme, foto polaroide com gorro. */
function natal1(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1080;
  const H = 1350;
  pattern(ctx, padroes(e).vermelho, 0, 0, W, H, 0.85);
  ctx.fillStyle = 'rgba(20,0,0,.08)';
  ctx.fillRect(0, 0, W, H);
  // cartão
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = COR.creme;
  ctx.beginPath();
  ctx.roundRect(70, 70, W - 140, H - 140, 36);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = goldGradient(ctx, 0, 0, W, H);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(92, 92, W - 184, H - 184, 26);
  ctx.stroke();
  pattern(ctx, tint(t['flocos.png'], '#C9B79A'), 96, 96, W - 192, H - 192, 0.55, 0.22);

  title(ctx, 'Feliz Natal', W / 2, 250, { font: SCRIPT, size: 160, color: COR.vermelho, maxWidth: 820, shadow: { color: 'rgba(120,0,0,.18)', blur: 6, y: 3 } });

  // polaroide inclinada
  ctx.save();
  ctx.translate(W / 2, 745);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(60,30,10,.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-305, -320, 610, 720);
  ctx.shadowColor = 'transparent';
  photo(ctx, pick(p, 0), 'rounded', -278, -293, 556, 556, { r: 0.02 });
  title(ctx, p.name, 0, 350, { font: SCRIPT, size: 90, color: COR.verde, maxWidth: 540 });
  put(ctx, e['gorro.png'], -282, -318, 205, -30);
  ctx.restore();

  put(ctx, e['azevinho.png'], 185, 1165, 210, -18);
  put(ctx, e['azevinho.png'], 930, 1010, 150, 150);
  put(ctx, e['bola-dourada.png'], 920, 1130, 105, 8);
  put(ctx, e['wrapped-gift'], 860, 1185, 120, 10);
  title(ctx, 'NATAL 2026', W / 2, 1222, { font: BODY, weight: 800, size: 30, color: COR.verde, letterSpacing: 0.3 });
}

/** 2. Ho Ho Ho: verde com neve, foto redonda com aro dourado e enfeites. */
function natal2(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1080;
  const H = 1350;
  const g = ctx.createRadialGradient(W / 2, 560, 80, W / 2, 620, 900);
  g.addColorStop(0, '#1B6B45');
  g.addColorStop(1, COR.verdeEscuro);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  pattern(ctx, padroes(e).verde, 0, 0, W, H, 0.85, 0.8);
  const v = ctx.createRadialGradient(W / 2, 640, 200, W / 2, 640, 760);
  v.addColorStop(0, 'rgba(10,54,34,.55)');
  v.addColorStop(1, 'rgba(10,54,34,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // faixa de xadrez embaixo
  pattern(ctx, t['xadrez.webp'], 0, H - 120, W, 120, 0.45);
  ctx.fillStyle = goldGradient(ctx, 0, H - 128, W, 8);
  ctx.fillRect(0, H - 128, W, 8);

  title(ctx, 'Ho Ho Ho!', W / 2, 190, { font: BOLD, weight: 800, size: 132, color: '#fff', maxWidth: 900, stroke: [{ color: COR.vermelho, width: 22 }], shadow: { color: 'rgba(0,0,0,.35)', blur: 14, y: 8 } });

  const cx = W / 2;
  const cy = 670;
  const r = 315;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 26, 0, Math.PI * 2);
  ctx.fillStyle = goldGradient(ctx, cx - r, cy - r, r * 2, r * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  photo(ctx, pick(p, 0), 'circle', cx - r, cy - r, r * 2, r * 2);
  // azevinhos e bolas no aro
  put(ctx, e['azevinho.png'], cx - 250, cy + 270, 190, -40);
  put(ctx, e['azevinho.png'], cx + 250, cy + 270, 190, 220);
  put(ctx, e['bell'], cx, cy + r - 30, 96, 0);
  put(ctx, e['gorro.png'], cx - 262, cy - 292, 205, -34);
  put(ctx, e['floco-dourado.png'], 130, 360, 90, 10);
  put(ctx, e['floco-dourado.png'], 960, 420, 70, -12);
  put(ctx, e['floco-dourado.png'], 940, 980, 90, 18);
  put(ctx, e['floco-dourado.png'], 140, 940, 64, -8);

  title(ctx, p.name, W / 2, 1125, { font: SCRIPT, size: 116, color: goldGradient(ctx, 300, 1020, 480, 110), maxWidth: 820, shadow: { color: 'rgba(0,0,0,.35)', blur: 8, y: 3 } });
  paragraph(ctx, `deseja a você um Natal cheio de amor e petiscos`, W / 2, 1185, 820, 36, '#F2EBDD', { weight: 700 });
}

/** Fundo preto e dourado do Ano Novo, com confete dourado. */
function fundoAnoNovo(ctx: Ctx, t: Tiles, W: number, H: number, claro = false, e?: Els) {
  if (claro) {
    ctx.fillStyle = '#FFFDF6';
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.5, Math.max(W, H) * 0.8);
    g.addColorStop(0, '#2A2418');
    g.addColorStop(0.55, '#121016');
    g.addColorStop(1, '#07070A');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (e) pattern(ctx, claro ? padroes(e).dourado : padroes(e).noite, 0, 0, W, H, 0.8, claro ? 1 : 0.9);
  if (!claro) {
    const v = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, Math.max(W, H) * 0.6);
    v.addColorStop(0, 'rgba(42,36,24,.75)');
    v.addColorStop(1, 'rgba(7,7,10,.2)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  rand(11);
  for (let i = 0; i < 26; i++) twinkle(ctx, rand() * W, rand() * H, 6 + rand() * 16, claro ? '#D9AE45' : '#F6DC8C', 0.5 + rand() * 0.5);
}

/** 3. Feliz Ano Novo: preto e dourado, foto em arco, 2027 gigante. */
function anoNovo1(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1080;
  const H = 1350;
  fundoAnoNovo(ctx, t, W, H, false, e);
  title(ctx, 'Feliz Ano Novo', W / 2, 190, { font: SCRIPT, size: 150, color: '#fff', maxWidth: 900, shadow: { color: 'rgba(246,220,140,.45)', blur: 24 } });
  const x = 250;
  const y = 250;
  const w = 580;
  const h = 700;
  photo(ctx, pick(p, 1), 'arch', x, y, w, h, { border: 14, borderColor: goldGradient(ctx, x, y, w, h), shadow: 40 });
  put(ctx, e['glowing-star'], 150, 380, 130, -10);
  put(ctx, e['sparkles'], 945, 340, 120, 12);
  put(ctx, e['clinking-glasses'], 175, 900, 200, -8);
  put(ctx, e['bottle-with-popping-cork'], 915, 880, 190, 14);
  title(ctx, '2027', W / 2, 1200, { font: BOLD, weight: 800, size: 270, color: goldGradient(ctx, 250, 1000, 580, 220), maxWidth: 760, shadow: { color: 'rgba(0,0,0,.6)', blur: 20, y: 8 } });
  title(ctx, `com ${p.name}`, W / 2, 1272, { font: BODY, weight: 800, size: 40, color: '#F3D77E', letterSpacing: 0.06, maxWidth: 800 });
}

/** 4. Partiu 2027: claro e dourado, foto redonda, estrelas e confete. */
function anoNovo2(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1080;
  const H = 1350;
  fundoAnoNovo(ctx, t, W, H, true, e);
  ctx.strokeStyle = goldGradient(ctx, 0, 0, W, H);
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 3;
  ctx.strokeRect(62, 62, W - 124, H - 124);

  const cx = W / 2;
  const cy = 560;
  const r = 320;
  ctx.save();
  ctx.shadowColor = 'rgba(120,90,20,.35)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  ctx.fillStyle = goldGradient(ctx, cx - r, cy - r, r * 2, r * 2);
  ctx.fill();
  ctx.restore();
  photo(ctx, pick(p, 2), 'circle', cx - r, cy - r, r * 2, r * 2);
  put(ctx, e['party-popper'], cx - 330, cy - 250, 170, -12);
  put(ctx, e['confetti-ball'], cx + 330, cy - 260, 150, 10);
  put(ctx, e['glowing-star'], cx + 320, cy + 260, 120, 8);
  put(ctx, e['sparkles'], cx - 330, cy + 250, 120, -6);

  title(ctx, 'Partiu 2027!', W / 2, 1050, { font: BOLD, weight: 800, size: 140, color: COR.preto, maxWidth: 900, stroke: [{ color: '#F3D77E', width: 10 }] });
  paragraph(ctx, `${p.name} deseja um ano novo cheio de alegria, saúde e muitos passeios!`, W / 2, 1140, 820, 38, '#5A4A2A', { weight: 700 });
}

/** Moldura para os cartões. */
function holly(ctx: Ctx, e: Els, x: number, y: number, w: number, rot: number) {
  put(ctx, e['azevinho.png'], x, y, w, rot);
}

/** 5. Cartão de Feliz Natal (15×10 cm): foto à esquerda, mensagem à direita. */
function cartaoNatal(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1800;
  const H = 1200;
  ctx.fillStyle = COR.creme;
  ctx.fillRect(0, 0, W, H);
  pattern(ctx, tint(t['flocos.png'], '#C9B79A'), 0, 0, W, H, 0.7, 0.22);
  // faixa de xadrez à esquerda com a foto
  pattern(ctx, padroes(e).vermelho, 0, 0, 760, H, 0.85);
  ctx.fillStyle = goldGradient(ctx, 752, 0, 16, H);
  ctx.fillRect(752, 0, 16, H);
  ctx.save();
  ctx.translate(380, 610);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,.45)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-300, -380, 600, 740);
  ctx.shadowColor = 'transparent';
  photo(ctx, pick(p, 0), 'rounded', -272, -352, 544, 600, { r: 0.02 });
  title(ctx, p.name, 0, 330, { font: SCRIPT, size: 84, color: COR.verde, maxWidth: 520 });
  put(ctx, e['gorro.png'], -282, -398, 230, -30);
  ctx.restore();

  const cx = 1280;
  title(ctx, 'Feliz Natal', cx, 330, { font: SCRIPT, size: 200, color: COR.vermelho, maxWidth: 900 });
  paragraph(ctx, 'Que o seu Natal seja cheio de amor, carinho, abraços apertados e muitos petiscos!', cx, 470, 820, 50, '#4A3B2C', { weight: 700, lh: 1.4 });
  title(ctx, `Com amor, ${p.name}`, cx, 860, { font: SCRIPT, size: 110, color: COR.verde, maxWidth: 880 });
  put(ctx, e['paw-prints'], cx, 960, 110, -8);
  holly(ctx, e, 1700, 110, 180, 160);
  holly(ctx, e, 870, 1100, 170, -20);
  put(ctx, e['bola-dourada.png'], 1690, 1080, 90, 6);
}

/** 6. Cartão de Feliz Ano Novo (15×10 cm): preto e dourado. */
function cartaoAnoNovo(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1800;
  const H = 1200;
  fundoAnoNovo(ctx, t, W, H, false, e);
  ctx.strokeStyle = goldGradient(ctx, 0, 0, W, H);
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  const x = 1110;
  const y = 170;
  const w = 560;
  const h = 860;
  photo(ctx, pick(p, 1), 'arch', x, y, w, h, { border: 12, borderColor: goldGradient(ctx, x, y, w, h), shadow: 36 });
  put(ctx, e['glowing-star'], 1110, 210, 120, -10);
  put(ctx, e['sparkles'], 1680, 980, 110, 8);

  const cx = 560;
  title(ctx, 'Feliz', cx, 290, { font: SCRIPT, size: 170, color: '#fff' });
  title(ctx, 'Ano Novo', cx, 470, { font: SCRIPT, size: 190, color: goldGradient(ctx, 160, 330, 800, 180), maxWidth: 900 });
  paragraph(ctx, 'Que 2027 venha com muita saúde, passeios, brincadeiras e alegria pra todo mundo!', cx, 600, 860, 48, '#EDE3CC', { weight: 700, lh: 1.4 });
  title(ctx, `Com carinho, ${p.name}`, cx, 930, { font: SCRIPT, size: 100, color: '#F3D77E', maxWidth: 900 });
  put(ctx, e['clinking-glasses'], cx, 1050, 130, 0);
}

/** 7. Papel de parede do celular (1080×1920): topo livre para o relógio. */
function papelDeParede(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1080;
  const H = 1920;
  pattern(ctx, padroes(e).verde, 0, 0, W, H, 0.9);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(6,30,18,.55)');
  g.addColorStop(0.3, 'rgba(6,30,18,.1)');
  g.addColorStop(0.75, 'rgba(6,30,18,.25)');
  g.addColorStop(1, 'rgba(6,30,18,.8)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const x = 190;
  const y = 640;
  const w = 700;
  const h = 860;
  photo(ctx, pick(p, 0), 'arch', x, y, w, h, { border: 16, borderColor: '#fff', shadow: 46 });
  put(ctx, e['gorro.png'], x + 60, y - 10, 280, -26);
  put(ctx, e['azevinho.png'], x + w - 30, y + h - 30, 220, 200);
  put(ctx, e['candy'], x - 10, y + h - 20, 130, -20);
  title(ctx, 'Feliz Natal', W / 2, 1690, { font: SCRIPT, size: 170, color: '#fff', maxWidth: 900, shadow: { color: 'rgba(0,0,0,.5)', blur: 16, y: 4 } });
  title(ctx, p.name.toUpperCase(), W / 2, 1770, { font: BODY, weight: 900, size: 44, color: '#F3D77E', letterSpacing: 0.25, maxWidth: 800 });
}

/** Etiqueta de presente para imprimir e recortar (9 × 5,5 cm em 300 dpi). */
function etiqueta(ctx: Ctx, p: NatalPet, t: Tiles, e: Els) {
  const W = 1063;
  const H = 650;
  ctx.fillStyle = COR.creme;
  ctx.fillRect(0, 0, W, H);
  pattern(ctx, tint(t['flocos.png'], '#C9B79A'), 0, 0, W, H, 0.5, 0.25);
  pattern(ctx, padroes(e).vermelho, 0, 0, 400, H, 0.6);
  ctx.fillStyle = goldGradient(ctx, 396, 0, 10, H);
  ctx.fillRect(396, 0, 10, H);
  photo(ctx, pick(p, 0), 'circle', 70, 155, 260, 260, { border: 10, borderColor: '#fff', shadow: 18 });
  put(ctx, e['gorro.png'], 100, 160, 120, -30);
  // furo da fita
  ctx.beginPath();
  ctx.arc(200, 70, 26, 0, Math.PI * 2);
  ctx.fillStyle = COR.creme;
  ctx.fill();
  ctx.strokeStyle = goldGradient(ctx, 170, 40, 60, 60);
  ctx.lineWidth = 5;
  ctx.stroke();
  title(ctx, 'Feliz Natal', 735, 150, { font: SCRIPT, size: 112, color: COR.vermelho, maxWidth: 600 });
  ctx.strokeStyle = '#B9A98A';
  ctx.lineWidth = 3;
  for (const [y, label] of [
    [330, 'Para:'],
    [470, 'De:'],
  ] as const) {
    title(ctx, label, 470, y, { font: BODY, weight: 800, size: 42, color: COR.verde, align: 'left' });
    ctx.beginPath();
    ctx.moveTo(label === 'De:' ? 545 : 590, y + 6);
    ctx.lineTo(1000, y + 6);
    ctx.stroke();
  }
  title(ctx, p.name, 775, 462, { font: SCRIPT, size: 76, color: COR.verde, maxWidth: 420 });
  put(ctx, e['paw-prints'], 980, 590, 70, -10);
  put(ctx, e['azevinho.png'], 980, 70, 110, 160);
}

/** Etiquetas de presente (para o PDF de impressão). */
export async function renderEtiqueta(p: NatalPet): Promise<HTMLCanvasElement> {
  const { ensureNatalFonts } = await import('./base');
  await ensureNatalFonts();
  const { t, e } = await loadNatalAssets();
  const [c, ctx] = canvas(1063, 650);
  etiqueta(ctx, p, t, e);
  return c;
}

/* ------------------------------------------------------------------ */

const ARTES: { id: string; label: string; file: string; w: number; h: number; draw: (ctx: Ctx, p: NatalPet, t: Tiles, e: Els) => void }[] = [
  { id: 'natal-1', label: 'Arte de Natal 1', file: '1-Arte-Natal-1', w: 1080, h: 1350, draw: natal1 },
  { id: 'natal-2', label: 'Arte de Natal 2', file: '2-Arte-Natal-2', w: 1080, h: 1350, draw: natal2 },
  { id: 'ano-novo-1', label: 'Arte de Ano Novo 1', file: '3-Arte-Ano-Novo-1', w: 1080, h: 1350, draw: anoNovo1 },
  { id: 'ano-novo-2', label: 'Arte de Ano Novo 2', file: '4-Arte-Ano-Novo-2', w: 1080, h: 1350, draw: anoNovo2 },
  { id: 'cartao-natal', label: 'Cartão de Feliz Natal', file: '5-Cartao-Feliz-Natal', w: 1800, h: 1200, draw: cartaoNatal },
  { id: 'cartao-ano-novo', label: 'Cartão de Feliz Ano Novo', file: '6-Cartao-Feliz-Ano-Novo', w: 1800, h: 1200, draw: cartaoAnoNovo },
  { id: 'papel-de-parede', label: 'Papel de parede para celular', file: '7-Papel-de-Parede-Celular', w: 1080, h: 1920, draw: papelDeParede },
];

export async function loadNatalAssets(): Promise<{ t: Tiles; e: Els }> {
  const [t, e] = await Promise.all([loadAll(TILES, tile), loadAll(ELS, el)]);
  return { t, e };
}

/** Desenha as 7 artes (ou só as pedidas). */
export async function renderArtes(p: NatalPet, only?: string[]): Promise<Arte[]> {
  const { ensureNatalFonts } = await import('./base');
  await ensureNatalFonts();
  const { t, e } = await loadNatalAssets();
  const out: Arte[] = [];
  for (const a of ARTES) {
    if (only && !only.includes(a.id)) continue;
    const [c, ctx] = canvas(a.w, a.h);
    a.draw(ctx, p, t, e);
    out.push({ id: a.id, label: a.label, file: a.file, canvas: c });
  }
  return out;
}

export const ARTES_INFO = ARTES.map(({ id, label, w, h }) => ({ id, label, w, h }));
