'use client';

/** Elementos gráficos de festa (desenhados em código) para o Kit Aniversário. */

import { text, type Ctx, type TextOpts } from './draw';

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export interface Palette {
  main: string;
  light: string;
  dark: string;
  /** Cores de apoio (balões, confete, bandeirinhas). */
  mix: string[];
  gold: string;
  cream: string;
}

export function palette(main = '#E8789E'): Palette {
  return {
    main,
    light: shade(main, 0.82),
    dark: shade(main, -0.35),
    mix: [main, '#F5B731', '#7CC6E8', '#F49AB8', '#8FD3AE', shade(main, 0.35)],
    gold: '#F2B33D',
    cream: '#FFF9F1',
  };
}

let seedState = 1;
const rnd = () => {
  seedState = (seedState * 9301 + 49297) % 233280;
  return seedState / 233280;
};
export function seed(n: number) {
  seedState = n;
}

/** Balão com brilho, nó e barbante. */
export function balloon(ctx: Ctx, x: number, y: number, r: number, color: string, tilt = 0, stringLen = 2.4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  // barbante
  ctx.beginPath();
  ctx.moveTo(0, r * 1.05);
  for (let i = 1; i <= 12; i++) ctx.lineTo(Math.sin(i * 0.9) * r * 0.12, r * 1.05 + (i / 12) * r * stringLen);
  ctx.strokeStyle = 'rgba(90,70,60,.45)';
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.stroke();
  // balão
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
  g.addColorStop(0, shade(color, 0.45));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shade(color, -0.25));
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.95, -r, r * 1.0, r * 0.35, 0, r);
  ctx.bezierCurveTo(-r * 1.0, r * 0.35, -r * 0.95, -r, 0, -r);
  ctx.fillStyle = g;
  ctx.fill();
  // nó
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, r * 1.1);
  ctx.lineTo(r * 0.1, r * 1.1);
  ctx.lineTo(0, r * 0.96);
  ctx.closePath();
  ctx.fillStyle = shade(color, -0.2);
  ctx.fill();
  // brilho
  ctx.beginPath();
  ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.13, r * 0.28, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.fill();
  ctx.restore();
}

/** Cacho de balões. */
export function balloonCluster(ctx: Ctx, x: number, y: number, s: number, colors: string[], flip = false) {
  const d = flip ? -1 : 1;
  const spots: [number, number, number, number][] = [
    [-0.55, 0.15, 0.9, -0.18],
    [0.5, 0.05, 0.95, 0.15],
    [0, -0.35, 1.05, 0],
    [-0.95, -0.45, 0.75, -0.3],
    [0.95, -0.55, 0.8, 0.28],
  ];
  spots.forEach(([dx, dy, rs, t], i) => balloon(ctx, x + dx * s * d, y + dy * s, s * 0.42 * rs, colors[i % colors.length], t * d, 2.6));
}

/** Varal de bandeirinhas com bolinhas. */
export function bunting(ctx: Ctx, x1: number, y: number, x2: number, sag: number, colors: string[], flag: number) {
  const w = x2 - x1;
  const n = Math.max(3, Math.round(w / (flag * 1.25)));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo(x1 + w / 2, y + sag * 2, x2, y);
  ctx.strokeStyle = 'rgba(90,70,60,.5)';
  ctx.lineWidth = Math.max(2, flag * 0.04);
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const px = x1 + w * t;
    // ponto e inclinação na curva quadrática do barbante
    const py = y + 4 * sag * t * (1 - t);
    const ang = Math.atan((4 * sag * (1 - 2 * t)) / w);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-flag / 2, 0);
    ctx.lineTo(flag / 2, 0);
    ctx.lineTo(0, flag * 1.05);
    ctx.closePath();
    const c = colors[i % colors.length];
    ctx.fillStyle = c;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (const [dx, dy] of [
      [-0.18, 0.18],
      [0.16, 0.22],
      [0, 0.5],
    ])
      {
        ctx.beginPath();
        ctx.arc(dx * flag, dy * flag, flag * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    ctx.restore();
  }
  ctx.restore();
}

/** Estrelinha de brilho (4 pontas). */
export function sparkle(ctx: Ctx, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? s : s * 0.22;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Confete variado: bolinhas, retângulos, serpentinas e estrelinhas. */
export function confettiFancy(ctx: Ctx, x: number, y: number, w: number, h: number, colors: string[], count: number, s = 1, avoid?: { x: number; y: number; w: number; h: number }) {
  for (let i = 0; i < count; i++) {
    const cx = x + rnd() * w;
    const cy = y + rnd() * h;
    if (avoid && cx > avoid.x && cx < avoid.x + avoid.w && cy > avoid.y && cy < avoid.y + avoid.h) continue;
    const c = colors[i % colors.length];
    const k = i % 5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rnd() * Math.PI * 2);
    ctx.fillStyle = c;
    ctx.strokeStyle = c;
    if (k === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, (5 + rnd() * 6) * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (k === 1 || k === 2) {
      ctx.fillRect(-9 * s, -4 * s, 18 * s, 8 * s);
    } else if (k === 3) {
      ctx.lineWidth = 4 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j <= 10; j++) ctx.lineTo(j * 3.2 * s, Math.sin(j * 0.9) * 6 * s);
      ctx.stroke();
    } else sparkle(ctx, 0, 0, 10 * s, c);
    ctx.restore();
  }
}

/** Chapéu de festa com listras e pompom. */
export function partyHat(ctx: Ctx, x: number, y: number, w: number, h: number, c1: string, c2: string, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(0, -h);
  ctx.lineTo(w / 2, 0);
  ctx.quadraticCurveTo(0, h * 0.12, -w / 2, 0);
  ctx.closePath();
  ctx.fillStyle = c1;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = c2;
  ctx.lineWidth = w * 0.12;
  for (let i = -3; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.2 * i);
    ctx.lineTo(w, -h * 0.2 * i - h * 0.5);
    ctx.stroke();
  }
  ctx.restore();
  // borda franjada
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(-w / 2 + (i + 0.5) * (w / 7), h * 0.02, w * 0.075, 0, Math.PI * 2);
    ctx.fill();
  }
  // pompom
  ctx.beginPath();
  ctx.arc(0, -h, w * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = '#F2B33D';
  ctx.fill();
  ctx.restore();
}

/** Bolo de dois andares com cobertura escorrendo e velinhas. */
export function cake(ctx: Ctx, cx: number, base: number, w: number, p: Palette, candles = 3) {
  const tier = (y: number, tw: number, th: number, color: string, drip: string) => {
    ctx.beginPath();
    ctx.roundRect?.(cx - tw / 2, y - th, tw, th, th * 0.15);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2, y - th + th * 0.12);
    const drops = 7;
    for (let i = 0; i <= drops; i++) {
      const dx = cx - tw / 2 + (i / drops) * tw;
      ctx.lineTo(dx, y - th + th * (i % 2 ? 0.45 : 0.25));
    }
    ctx.lineTo(cx + tw / 2, y - th);
    ctx.lineTo(cx - tw / 2, y - th);
    ctx.closePath();
    ctx.fillStyle = drip;
    ctx.fill();
  };
  // prato
  ctx.beginPath();
  ctx.ellipse(cx, base, w * 0.62, w * 0.07, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E9DCCB';
  ctx.fill();
  tier(base, w, w * 0.38, shade(p.main, 0.55), '#FFFFFF');
  tier(base - w * 0.38, w * 0.66, w * 0.3, shade(p.main, 0.2), '#FFFFFF');
  // bolinhas de confeito
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(cx - w * 0.38 + i * w * 0.15, base - w * 0.12, w * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = p.mix[i % p.mix.length];
    ctx.fill();
  }
  const top = base - w * 0.68;
  for (let i = 0; i < candles; i++) {
    const x = cx + (i - (candles - 1) / 2) * w * 0.14;
    ctx.fillStyle = p.mix[(i + 1) % p.mix.length];
    ctx.fillRect(x - w * 0.022, top - w * 0.16, w * 0.044, w * 0.16);
    ctx.beginPath();
    ctx.ellipse(x, top - w * 0.2, w * 0.03, w * 0.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFB020';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, top - w * 0.19, w * 0.014, w * 0.025, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF3C4';
    ctx.fill();
  }
}

/** Estrela de explosão (para números e selos). */
export function starBurst(ctx: Ctx, cx: number, cy: number, r: number, color: string, points = 14, inner = 0.82) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Círculo com borda ondulada (tipo forminha de doce). */
export function scallop(ctx: Ctx, cx: number, cy: number, r: number, bumps: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < bumps; i++) {
    const a0 = (i / bumps) * Math.PI * 2;
    const a1 = ((i + 1) / bumps) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    if (i === 0) ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx + Math.cos(am) * r * 1.13, cy + Math.sin(am) * r * 1.13, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Faixa de fita com pontas dobradas e texto. */
export function ribbon(ctx: Ctx, cx: number, cy: number, w: number, h: number, color: string, label: string, opts: Partial<TextOpts> = {}) {
  const tail = h * 0.9;
  const dark = shade(color, -0.3);
  // pontas
  for (const s of [-1, 1]) {
    ctx.beginPath();
    const x = cx + s * (w / 2 - tail * 0.2);
    ctx.moveTo(x, cy - h * 0.3);
    ctx.lineTo(x + s * tail, cy - h * 0.3);
    ctx.lineTo(x + s * tail * 0.72, cy + h * 0.2);
    ctx.lineTo(x + s * tail, cy + h * 0.7);
    ctx.lineTo(x, cy + h * 0.7);
    ctx.closePath();
    ctx.fillStyle = dark;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2);
  ctx.quadraticCurveTo(cx, cy - h / 2 - h * 0.18, cx + w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy + h / 2);
  ctx.quadraticCurveTo(cx, cy + h / 2 - h * 0.18, cx - w / 2, cy + h / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  text(ctx, label, cx, cy + h * 0.17, { size: h * 0.48, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: w * 0.88, letterSpacing: 1, ...opts });
}

/** Texto em arco (acima de um círculo). */
export function arcText(ctx: Ctx, label: string, cx: number, cy: number, radius: number, size: number, color: string, family: string) {
  ctx.save();
  ctx.font = `700 ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = [...label];
  const widths = chars.map((ch) => ctx.measureText(ch).width + size * 0.08);
  const total = widths.reduce((s, x) => s + x, 0);
  let a = -Math.PI / 2 - total / radius / 2;
  chars.forEach((ch, i) => {
    const step = widths[i] / radius;
    ctx.save();
    ctx.translate(cx + Math.cos(a + step / 2) * radius, cy + Math.sin(a + step / 2) * radius);
    ctx.rotate(a + step / 2 + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    a += step;
  });
  ctx.restore();
}

/** Coroa de louros (duas ramas). */
export function laurel(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI / 2 + side * (0.35 + i * 0.27);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + (side > 0 ? -0.6 : 0.6) + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.07, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? color : shade(color, 0.2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/** Selo roseta com fitas. */
export function rosette(ctx: Ctx, cx: number, cy: number, r: number, color: string, gold: string) {
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * r * 0.2, cy);
    ctx.lineTo(cx + s * r * 0.75, cy + r * 1.7);
    ctx.lineTo(cx + s * r * 0.45, cy + r * 1.5);
    ctx.lineTo(cx + s * r * 0.2, cy + r * 1.75);
    ctx.lineTo(cx - s * r * 0.15, cy + r * 0.2);
    ctx.closePath();
    ctx.fillStyle = s < 0 ? color : shade(color, -0.2);
    ctx.fill();
  }
  scallop(ctx, cx, cy, r, 22, gold);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = shade(gold, -0.12);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = r * 0.04;
  ctx.setLineDash([r * 0.06, r * 0.05]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Presente com laço. */
export function gift(ctx: Ctx, x: number, y: number, s: number, color: string, ribbonColor: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - s / 2, y - s * 0.7, s, s * 0.7);
  ctx.fillStyle = shade(color, -0.12);
  ctx.fillRect(x - s * 0.56, y - s * 0.86, s * 1.12, s * 0.2);
  ctx.fillStyle = ribbonColor;
  ctx.fillRect(x - s * 0.08, y - s * 0.86, s * 0.16, s * 0.86);
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + d * s * 0.17, y - s * 0.95, s * 0.17, s * 0.1, d * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------- efeitos de acabamento ---------- */

/**
 * Efeito adesivo: contorno branco + sombra em volta de qualquer desenho.
 * draw recebe o contexto já posicionado; box é a área (no espaço lógico) que o desenho ocupa.
 */
export function sticker(ctx: Ctx, box: { x: number; y: number; w: number; h: number }, draw: (c: Ctx) => void, outline = 14, shadow = true) {
  const scale = ctx.getTransform().a || 1;
  const pad = outline + 30;
  const cw = Math.ceil((box.w + pad * 2) * scale);
  const ch = Math.ceil((box.h + pad * 2) * scale);
  const art = document.createElement('canvas');
  art.width = cw;
  art.height = ch;
  const a = art.getContext('2d')!;
  a.scale(scale, scale);
  a.translate(pad - box.x, pad - box.y);
  draw(a);
  // silhueta branca dilatada
  const sil = document.createElement('canvas');
  sil.width = cw;
  sil.height = ch;
  const s = sil.getContext('2d')!;
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    s.drawImage(art, Math.cos(ang) * outline * scale, Math.sin(ang) * outline * scale);
  }
  s.drawImage(art, 0, 0);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = '#fff';
  s.fillRect(0, 0, cw, ch);
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(60,40,30,.22)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
  }
  ctx.drawImage(sil, box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2);
  ctx.restore();
  ctx.drawImage(art, box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2);
}

/** Bolinhas (poá) — chame dentro de um clip. */
export function polkaDots(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, gap = 40, r = 6) {
  ctx.fillStyle = color;
  let row = 0;
  for (let yy = y; yy < y + h + gap; yy += gap * 0.87) {
    for (let xx = x + (row % 2 ? gap / 2 : 0); xx < x + w + gap; xx += gap) {
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    row++;
  }
}

/** Texto com contorno (fica legível sobre qualquer fundo). */
export function outlinedText(ctx: Ctx, str: string, x: number, y: number, o: { size: number; family: string; fill: string | CanvasGradient; stroke: string; strokeW: number; align?: CanvasTextAlign; maxWidth?: number; weight?: number }) {
  ctx.save();
  let size = o.size;
  const setFont = () => (ctx.font = `${o.weight ?? 700} ${size}px ${o.family}`);
  setFont();
  if (o.maxWidth) while (ctx.measureText(str).width > o.maxWidth && size > o.size * 0.5) (size -= 2), setFont();
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = o.strokeW * (size / o.size);
  ctx.strokeStyle = o.stroke;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = o.fill;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** Número dourado metalizado (estilo balão de número). */
export function foilNumber(ctx: Ctx, n: string, x: number, y: number, size: number, family: string) {
  ctx.save();
  ctx.font = `700 ${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const g = ctx.createLinearGradient(x, y - size * 0.8, x, y);
  g.addColorStop(0, '#FFE9A8');
  g.addColorStop(0.35, '#F2B33D');
  g.addColorStop(0.55, '#FFF4D0');
  g.addColorStop(0.75, '#E39B1F');
  g.addColorStop(1, '#C47A12');
  ctx.shadowColor = 'rgba(120,70,10,.35)';
  ctx.shadowBlur = size * 0.08;
  ctx.shadowOffsetY = size * 0.04;
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.12;
  ctx.strokeStyle = '#fff';
  ctx.strokeText(n, x, y);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = g;
  ctx.fillText(n, x, y);
  // reflexo
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = size * 0.015;
  ctx.strokeStyle = '#FFF8E0';
  ctx.strokeText(n, x - size * 0.015, y - size * 0.02);
  ctx.restore();
}

/** Faixa de baixo com o topo em ondas (como cobertura de bolo). */
export function frostingEdge(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, waves = 9) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y);
  const step = w / waves;
  for (let i = 0; i < waves; i++) {
    const x0 = x + i * step;
    ctx.quadraticCurveTo(x0 + step / 2, y - h * 0.32 * (i % 2 ? 1.2 : 0.85), x0 + step, y);
  }
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
