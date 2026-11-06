'use client';

import { FONT_BODY, FONT_DISPLAY, rr } from './draw';
import type { Ctx } from './draw';
import { BONUS_PLAN, KIT_PLAN, pageOf, type Sheet } from './plan';
import type { DocPage } from './types';

/** Resolução das folhas montadas: 300 dpi (1 mm = 11,81 px). */
const PX = 300 / 25.4;
const A4W = 210;
const A4H = 297;
const ROXO = '#6F2A7A';
const INK = '#3a2a22';
const MUTED = 'rgba(58,42,34,.6)';
const CUT = 'rgba(120,100,90,.75)';

export interface RenderedPage {
  page: DocPage;
  /** Peças pequenas: o canvas fica guardado para montar a folha. */
  canvas?: HTMLCanvasElement;
  /** Páginas A4 inteiras: já viram JPEG (libera memória no celular). */
  data?: string;
}

function font(ctx: Ctx, size: number, weight: number, family: 'body' | 'display' = 'body') {
  ctx.font = `${weight} ${size}px ${family === 'display' ? FONT_DISPLAY : FONT_BODY}`;
}

function label(ctx: Ctx, s: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = 'left', family: 'body' | 'display' = 'body') {
  font(ctx, size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

/** Linha de corte pontilhada em volta da peça (0,8 mm para fora). */
function cutLine(ctx: Ctx, x: number, y: number, w: number, h: number, round: boolean) {
  ctx.save();
  ctx.strokeStyle = CUT;
  ctx.lineWidth = 0.22;
  ctx.setLineDash([1.3, 1.1]);
  if (round) {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2 + 0.8, 0, Math.PI * 2);
  } else rr(ctx, x - 0.8, y - 0.8, w + 1.6, h + 1.6, 2.2);
  ctx.stroke();
  ctx.restore();
}

/** Régua de 5 cm para conferir a escala da impressão. */
function ruler(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 50, y);
  for (let i = 0; i <= 50; i++) {
    const t = i % 10 === 0 ? 3 : i % 5 === 0 ? 2 : 1.2;
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y - t);
  }
  ctx.stroke();
  ctx.restore();
  for (let cm = 0; cm <= 5; cm++) label(ctx, String(cm), x + cm * 10, y + 3.4, 2.4, 700, MUTED, 'center');
  label(ctx, 'Régua de conferência: de 0 a 5 tem que dar 5 cm na régua de verdade.', x + 56, y - 0.4, 2.7, 700, MUTED);
}

function wrapLines(ctx: Ctx, s: string, maxW: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(/\s+/)) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      out.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) out.push(cur);
  return out;
}

/** Monta uma folha A4 com as peças pequenas em tamanho real. */
function composePieces(sheet: Extract<Sheet, { kind: 'pieces' }>, pages: Map<string, RenderedPage>): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(A4W * PX);
  canvas.height = Math.round(A4H * PX);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(PX, PX);
  ctx.imageSmoothingQuality = 'high';

  const n = pageOf(sheet.key);
  // Cabeçalho
  label(ctx, 'KIT IDENTIDADE PET', 10, 12, 2.6, 900, '#F5A524');
  label(ctx, `pág. ${n}`, A4W - 10, 12, 2.6, 800, MUTED, 'right');
  label(ctx, sheet.title, 10, 21, 7, 700, ROXO, 'left', 'display');
  label(ctx, sheet.hint, 10, 27.6, 3.3, 700, 'rgba(58,42,34,.82)');
  ctx.fillStyle = 'rgba(58,42,34,.12)';
  ctx.fillRect(10, 31, A4W - 20, 0.3);

  for (const pl of sheet.places) {
    const r = pages.get(pl.page);
    if (!r?.canvas) continue;
    const [w, h] = (pl.copy != null ? r.page.printCopies?.[pl.copy] : undefined) ?? r.page.mm;
    label(ctx, pl.caption.toUpperCase(), pl.x, pl.y - 2.6, 2.4, 800, MUTED);
    ctx.drawImage(r.canvas, pl.x, pl.y, w, h);
    if (r.page.shape !== 'bone') cutLine(ctx, pl.x, pl.y, w, h, r.page.shape === 'round');
  }

  if (sheet.steps) {
    const { title, y, items } = sheet.steps;
    const x = 10;
    const w = A4W - 20;
    font(ctx, 3.3, 600);
    const blocks = items.map((s) => wrapLines(ctx, s, w - 20));
    const h = 14 + blocks.reduce((s, b) => s + b.length * 4.6 + 2.2, 0) + 3;
    rr(ctx, x, y, w, h, 3);
    ctx.fillStyle = '#FBF6FC';
    ctx.fill();
    label(ctx, title, x + 6, y + 9, 4.6, 700, INK, 'left', 'display');
    let cy = y + 16.5;
    blocks.forEach((b, i) => {
      ctx.beginPath();
      ctx.arc(x + 8.5, cy - 1.2, 2.3, 0, Math.PI * 2);
      ctx.fillStyle = ROXO;
      ctx.fill();
      label(ctx, String(i + 1), x + 8.5, cy, 2.8, 900, '#fff', 'center');
      b.forEach((ln, li) => label(ctx, ln, x + 14, cy + li * 4.6, 3.3, 600, 'rgba(58,42,34,.86)'));
      cy += b.length * 4.6 + 2.2;
    });
  }

  if (sheet.ruler) ruler(ctx, 10, 284);
  label(ctx, 'Imprima em tamanho real (100%) · Recorte na linha pontilhada · Clube do Focinho', A4W / 2, 292, 2.4, 700, MUTED, 'center');
  return canvas;
}

export interface SheetImage {
  data: string;
  landscape: boolean;
}

/**
 * Monta as folhas do PDF na ordem do plano.
 * pages: todas as páginas já desenhadas (A4 inteiras e peças pequenas), por id.
 */
export function composeSheets(plan: Sheet[], pages: Map<string, RenderedPage>, onSheet?: () => void): SheetImage[] {
  const out: SheetImage[] = [];
  for (const sheet of plan) {
    if (sheet.kind === 'page') {
      const r = pages.get(sheet.page);
      const data = r?.data ?? r?.canvas?.toDataURL('image/jpeg', 0.92);
      if (!r || !data) continue;
      out.push({ data, landscape: r.page.mm[0] > r.page.mm[1] });
    } else {
      const canvas = composePieces(sheet, pages);
      out.push({ data: canvas.toDataURL('image/jpeg', 0.92), landscape: false });
      canvas.width = 0;
    }
    onSheet?.();
  }
  return out;
}

export async function sheetsToPdf(sheets: SheetImage[]): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: sheets[0]?.landscape ? 'landscape' : 'portrait', compress: true });
  sheets.forEach((s, i) => {
    if (i) pdf.addPage('a4', s.landscape ? 'landscape' : 'portrait');
    const [w, h] = s.landscape ? [A4H, A4W] : [A4W, A4H];
    pdf.addImage(s.data, 'JPEG', 0, 0, w, h, `sheet${i}`, 'FAST');
  });
  return pdf.output('blob');
}

/** Ids de todas as páginas que o plano usa (para conferir que nenhuma ficou de fora). */
export function plannedPageIds(): Set<string> {
  const ids = new Set<string>();
  for (const s of [...KIT_PLAN, ...BONUS_PLAN]) {
    if (s.kind === 'page') ids.add(s.page);
    else s.places.forEach((p) => ids.add(p.page));
  }
  return ids;
}
