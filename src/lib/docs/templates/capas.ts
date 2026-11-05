'use client';

/**
 * Capas dos bônus (só para a página de oferta, não entram no PDF).
 * Mockup de livro com ilustração própria; nada do pet da pessoa aparece aqui.
 * Dá para trocar cada uma por uma imagem pronta no painel (Imagens → Capas dos bônus).
 */

import { FONT_DISPLAY, heart, paw, rr, text } from '../draw';
import type { Ctx } from '../draw';
import { balloon, cake, confettiFancy, outlinedText, palette, seed, shade, sparkle } from '../party';
import type { DocDef, DocPage } from '../types';

const W = 800;
const H = 1000;

/** Livro em pé: capa, lombada, páginas e sombra. */
function book(ctx: Ctx, color: string, draw: () => void) {
  const x = 90;
  const y = 50;
  const w = 600;
  const h = 860;
  // sombra no chão
  const sh = ctx.createRadialGradient(W / 2, y + h + 24, 10, W / 2, y + h + 24, 380);
  sh.addColorStop(0, 'rgba(60,40,30,.28)');
  sh.addColorStop(1, 'rgba(60,40,30,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, y + h - 40, W, 120);
  // páginas
  rr(ctx, x + 18, y + 14, w, h - 8, 18);
  ctx.fillStyle = '#F4EEE4';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w + 4 + i * 3, y + 30);
    ctx.lineTo(x + w + 4 + i * 3, y + h - 6);
    ctx.stroke();
  }
  // capa
  ctx.save();
  rr(ctx, x, y, w, h, 18);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(color, 0.15));
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.translate(x, y);
  draw();
  ctx.restore();
  // lombada e brilho
  ctx.save();
  rr(ctx, x, y, w, h, 18);
  ctx.clip();
  const sp = ctx.createLinearGradient(x, 0, x + 60, 0);
  sp.addColorStop(0, 'rgba(0,0,0,.28)');
  sp.addColorStop(0.6, 'rgba(0,0,0,.05)');
  sp.addColorStop(1, 'rgba(255,255,255,.12)');
  ctx.fillStyle = sp;
  ctx.fillRect(x, y, 60, h);
  const gl = ctx.createLinearGradient(x, y, x + w, y + h * 0.6);
  gl.addColorStop(0, 'rgba(255,255,255,.18)');
  gl.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Selo "BÔNUS", título e assinatura. */
function cover(ctx: Ctx, color: string, title: string[], art: () => void) {
  book(ctx, color, () => {
    // poá discreto
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    for (let yy = 20; yy < 860; yy += 44) for (let xx = (yy / 44) % 2 ? 40 : 18; xx < 600; xx += 44) {
      ctx.beginPath();
      ctx.arc(xx, yy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    rr(ctx, 210, 56, 180, 54, 27);
    ctx.fillStyle = '#F2B33D';
    ctx.fill();
    text(ctx, 'BÔNUS', 300, 93, { size: 28, weight: 900, color: '#4a2d05', align: 'center', letterSpacing: 4 });
    title.forEach((t, i) => outlinedText(ctx, t, 300, 200 + i * 78, { size: 72, family: FONT_DISPLAY, fill: '#fff', stroke: shade(color, -0.45), strokeW: 12, maxWidth: 520 }));
    art();
    text(ctx, 'Clube do Focinho', 300, 830, { size: 26, weight: 600, family: 'display', color: 'rgba(255,255,255,.85)', align: 'center' });
  });
}

function clipboard(ctx: Ctx, cx: number, cy: number, accent: string) {
  rr(ctx, cx - 170, cy - 210, 340, 430, 26);
  ctx.fillStyle = '#B07A4A';
  ctx.fill();
  rr(ctx, cx - 145, cy - 175, 290, 375, 12);
  ctx.fillStyle = '#fff';
  ctx.fill();
  rr(ctx, cx - 70, cy - 235, 140, 60, 18);
  ctx.fillStyle = '#9AA3AD';
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const y = cy - 120 + i * 62;
    rr(ctx, cx - 115, y - 18, 36, 36, 8);
    ctx.fillStyle = i < 3 ? accent : '#E8E2DA';
    ctx.fill();
    if (i < 3) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 106, y);
      ctx.lineTo(cx - 98, y + 8);
      ctx.lineTo(cx - 86, y - 8);
      ctx.stroke();
    }
    rr(ctx, cx - 60, y - 7, 160 - (i % 2) * 40, 14, 7);
    ctx.fillStyle = '#E3DBD0';
    ctx.fill();
  }
  paw(ctx, cx + 120, cy + 170, 90, shade(accent, -0.2), 0.3);
}

function calendar(ctx: Ctx, cx: number, cy: number, accent: string) {
  rr(ctx, cx - 190, cy - 170, 380, 380, 28);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.save();
  rr(ctx, cx - 190, cy - 170, 380, 380, 28);
  ctx.clip();
  ctx.fillStyle = '#E55B5B';
  ctx.fillRect(cx - 190, cy - 170, 380, 86);
  ctx.restore();
  for (const dx of [-110, 110]) {
    rr(ctx, cx + dx - 12, cy - 200, 24, 64, 12);
    ctx.fillStyle = '#7C8796';
    ctx.fill();
  }
  text(ctx, 'SAÚDE', cx, cy - 112, { size: 38, weight: 900, color: '#fff', align: 'center', letterSpacing: 4 });
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const x = cx - 150 + c * 68;
      const y = cy - 60 + r * 64;
      rr(ctx, x, y, 48, 44, 8);
      ctx.fillStyle = r === 1 && c === 2 ? accent : '#EEF1F5';
      ctx.fill();
    }
  heart(ctx, cx - 150 + 2 * 68 + 24, cy - 60 + 64 + 24, 30, '#fff');
  // seringa estilizada
  ctx.save();
  ctx.translate(cx + 170, cy + 180);
  ctx.rotate(-0.7);
  rr(ctx, -20, -90, 40, 140, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.fillStyle = shade(accent, 0.3);
  ctx.fillRect(-14, -40, 28, 80);
  ctx.fillStyle = '#7C8796';
  ctx.fillRect(-4, 50, 8, 50);
  ctx.fillRect(-30, -100, 60, 14);
  ctx.restore();
}

function suitcase(ctx: Ctx, cx: number, cy: number, accent: string) {
  rr(ctx, cx - 60, cy - 220, 120, 70, 24);
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#6B4A33';
  ctx.stroke();
  rr(ctx, cx - 200, cy - 160, 400, 320, 34);
  ctx.fillStyle = '#F2B33D';
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(cx - 120, cy - 160, 26, 320);
  ctx.fillRect(cx + 94, cy - 160, 26, 320);
  // adesivos
  const stickers: [number, number, number, string][] = [
    [cx - 30, cy - 50, 52, '#fff'],
    [cx + 60, cy + 60, 40, accent],
    [cx - 150, cy + 90, 34, '#7CC6E8'],
  ];
  for (const [x, y, r, col] of stickers) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  }
  paw(ctx, cx - 30, cy - 50, 60, accent);
  heart(ctx, cx + 60, cy + 58, 34, '#fff');
  // aviãozinho e trajeto
  ctx.save();
  ctx.setLineDash([10, 12]);
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath();
  ctx.moveTo(cx - 240, cy + 220);
  ctx.quadraticCurveTo(cx, cy + 300, cx + 210, cy + 210);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(cx + 225, cy + 200);
  ctx.rotate(-0.4);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-25, -40);
  ctx.lineTo(-5, -40);
  ctx.lineTo(18, 0);
  ctx.lineTo(-5, 40);
  ctx.lineTo(-25, 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const page = (id: string, label: string, color: string, title: string[], art: (ctx: Ctx) => void): DocPage => ({
  id,
  label,
  w: W,
  h: H,
  mm: [80, 100],
  shape: 'free',
  draw(ctx, _c, a) {
    if (a.background) {
      ctx.drawImage(a.background, 0, 0, W, H);
      return;
    }
    cover(ctx, color, title, () => art(ctx));
  },
});

export const capasDoc: DocDef = {
  id: 'capas',
  title: 'Capas dos bônus',
  file: 'Capa-{nome}',
  pages: [
    page('capa-aniversario', 'Kit Aniversário', '#E8789E', ['Kit', 'Aniversário'], (ctx) => {
      seed(4);
      const p = palette('#E8789E');
      confettiFancy(ctx, 30, 340, 540, 420, ['#fff', '#F2B33D', '#7CC6E8'], 30, 1.3);
      balloon(ctx, 120, 470, 70, '#F2B33D', -0.2, 1.4);
      balloon(ctx, 480, 450, 64, '#7CC6E8', 0.2, 1.4);
      cake(ctx, 300, 760, 300, p, 3);
      sparkle(ctx, 470, 610, 22, '#fff');
    }),
    page('capa-quemcuida', 'Kit Quem Cuida', '#3E9A8F', ['Kit Quem', 'Cuida'], (ctx) => clipboard(ctx, 300, 560, '#F2B33D')),
    page('capa-calendario', 'Calendário de Saúde', '#4D8FD6', ['Calendário', 'de Saúde'], (ctx) => calendar(ctx, 300, 570, '#E8789E')),
    page('capa-viagem', 'Guia de Viagem', '#E8833A', ['Viajando', 'com seu Pet'], (ctx) => suitcase(ctx, 300, 560, '#E8789E')),
  ],
};

export const COVER_PAGE: Record<string, number> = { aniversario: 0, quemcuida: 1, calendario: 2, viagem: 3 };
