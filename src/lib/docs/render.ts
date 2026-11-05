'use client';

import { brand } from '@/config/brand';
import { petName } from '@/lib/pet';
import { watermark } from './common';
import { ensureFonts, loadImage } from './draw';
import { aniversarioDoc } from './templates/aniversario';
import { certidaoDoc } from './templates/certidao';
import { passaporteDoc } from './templates/passaporte';
import { quemCuidaDoc } from './templates/quemcuida';
import { rgDoc } from './templates/rg';
import { tagDoc } from './templates/tag';
import { torcedorDoc } from './templates/torcedor';
import { vacinaDoc } from './templates/vacina';
import type { Assets, DocContext, DocDef, DocPage } from './types';

export type { DocContext, DocDef, DocPage } from './types';

export const DOCS: Record<string, DocDef> = {
  rg: rgDoc,
  certidao: certidaoDoc,
  passaporte: passaporteDoc,
  tag: tagDoc,
  vacina: vacinaDoc,
  torcedor: torcedorDoc,
  aniversario: aniversarioDoc,
  quemcuida: quemCuidaDoc,
};

export const KIT_DOC_IDS = ['rg', 'certidao', 'passaporte', 'tag', 'vacina', 'torcedor'] as const;
export const BONUS_DOC_IDS = ['aniversario', 'quemcuida'] as const;

/** Lista de todos os ids de página (para o painel cadastrar fundos prontos). */
export function allPages(): { doc: string; page: DocPage }[] {
  return Object.values(DOCS).flatMap((d) => d.pages.map((page) => ({ doc: d.title, page })));
}

export function qrUrl(c: DocContext): string {
  return `${c.siteUrl}/p/${c.slug || 'exemplo'}`;
}

const qrCache = new Map<string, Promise<HTMLCanvasElement | null>>();
function makeQr(text: string): Promise<HTMLCanvasElement | null> {
  const hit = qrCache.get(text);
  if (hit) return hit;
  const p = import('qrcode')
    .then(async (QR) => {
      const canvas = document.createElement('canvas');
      await QR.toCanvas(canvas, text, { margin: 0, width: 600, errorCorrectionLevel: 'M', color: { dark: '#2b1f19', light: '#ffffff' } });
      return canvas;
    })
    .catch(() => null);
  qrCache.set(text, p);
  return p;
}

async function loadAssets(page: DocPage, c: DocContext): Promise<Assets> {
  const [photo, crest, logo, qr, background] = await Promise.all([
    loadImage(c.pet.photo),
    page.needsCrest ? loadImage(c.team?.crest ?? null) : Promise.resolve(null),
    loadImage(brand.logo),
    page.needsQr ? makeQr(qrUrl(c)) : Promise.resolve(null),
    loadImage(c.templates?.[page.id] ?? null),
  ]);
  return { photo, crest, logo, qr, background };
}

/**
 * Desenha uma página do documento num canvas.
 * scale: multiplicador sobre o tamanho lógico (0.4 para miniatura, 2 para arquivo final).
 */
export async function renderPage(doc: DocDef, pageIndex: number, c: DocContext, scale = 1): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const page = doc.pages[pageIndex];
  const assets = await loadAssets(page, c);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(page.w * scale);
  canvas.height = Math.round(page.h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = 'high';
  page.draw(ctx, c, assets);
  if (c.preview) {
    ctx.save();
    if (page.round) {
      ctx.beginPath();
      ctx.arc(page.w / 2, page.h / 2, page.w / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    watermark(ctx, page.w, page.h);
    ctx.restore();
  }
  return canvas;
}

/** Escala para ~300 dpi no tamanho impresso (mínimo 2x para ficar nítido na tela). */
export function exportScale(page: DocPage): number {
  const px300 = (page.mm[0] / 25.4) * 300;
  return Math.min(4, Math.max(2, px300 / page.w));
}

export function fileName(doc: DocDef, c: DocContext, suffix = ''): string {
  const name = petName(c.pet) === 'seu pet' ? 'meu-pet' : petName(c.pet);
  const safe = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return doc.file.replace('{nome}', safe) + suffix;
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), type, quality));
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Baixa cada página do documento como PNG em alta resolução. */
export async function downloadPng(doc: DocDef, c: DocContext) {
  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i];
    const canvas = await renderPage(doc, i, { ...c, preview: false }, exportScale(page));
    const blob = await canvasToBlob(canvas);
    const suffix = doc.pages.length > 1 ? `-${page.label.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-')}` : '';
    saveBlob(blob, `${fileName(doc, c, suffix)}.png`);
    if (i < doc.pages.length - 1) await new Promise((r) => setTimeout(r, 400));
  }
}

interface Piece {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  round?: boolean;
}

const A4: [number, number] = [210, 297];
const MARGIN = 8;
const GAP = 5;

/**
 * Gera um PDF pronto para imprimir em A4.
 * Páginas do tamanho A4 ocupam a folha inteira; peças menores (RG, tag, passaporte…)
 * são encaixadas lado a lado em tamanho real, com linha de corte.
 */
export async function buildPdf(docs: DocDef[], c: DocContext, onProgress?: (n: number, total: number) => void): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  let first = true;
  const total = docs.reduce((s, d) => s + d.pages.length, 0);
  let done = 0;

  const fullPages: { canvas: HTMLCanvasElement; landscape: boolean }[] = [];
  const pieces: Piece[] = [];

  for (const doc of docs) {
    for (let i = 0; i < doc.pages.length; i++) {
      const page = doc.pages[i];
      const isA4 = (page.mm[0] === 210 && page.mm[1] === 297) || (page.mm[0] === 297 && page.mm[1] === 210);
      const canvas = await renderPage(doc, i, { ...c, preview: false }, isA4 ? 2 : exportScale(page));
      if (isA4) fullPages.push({ canvas, landscape: page.mm[0] > page.mm[1] });
      else for (const [w, h] of page.printCopies ?? [page.mm]) pieces.push({ canvas, w, h, round: page.round });
      onProgress?.(++done, total);
    }
  }

  const aliases = new Map<HTMLCanvasElement, string>();
  const addImg = (canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number, round?: boolean) => {
    // Cada imagem entra uma vez no PDF, mesmo com várias cópias (tags).
    let alias = aliases.get(canvas);
    const fresh = !alias;
    if (!alias) {
      alias = `img${aliases.size}`;
      aliases.set(canvas, alias);
    }
    // Peças redondas em PNG (fundo transparente); o resto em JPEG (arquivo menor).
    const data = fresh ? (round ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92)) : '';
    pdf.addImage(fresh ? data : canvas, round ? 'PNG' : 'JPEG', x, y, w, h, alias, 'FAST');
  };

  for (const fp of fullPages) {
    if (!first) pdf.addPage('a4', fp.landscape ? 'landscape' : 'portrait');
    else if (fp.landscape) {
      pdf.deletePage(1);
      pdf.addPage('a4', 'landscape');
    }
    first = false;
    const [pw, ph] = fp.landscape ? [A4[1], A4[0]] : A4;
    addImg(fp.canvas, 0, 0, pw, ph);
  }

  // Encaixe em prateleiras nas folhas A4: peças maiores primeiro, e cada peça entra
  // na primeira prateleira (de qualquer folha) onde couber, para gastar menos papel.
  if (pieces.length) {
    const usableW = A4[0] - MARGIN * 2;
    const usableH = A4[1] - MARGIN * 2;
    type Shelf = { sheet: number; y: number; h: number; x: number };
    const shelves: Shelf[] = [];
    const sheetBottom: number[] = [];
    const placed: { pc: Piece; sheet: number; x: number; y: number }[] = [];
    const order = pieces.map((pc, i) => ({ pc, i })).sort((a, b) => b.pc.h - a.pc.h || a.i - b.i);
    for (const { pc } of order) {
      let shelf = shelves.find((sh) => sh.x + pc.w <= usableW + 0.01 && pc.h <= sh.h + 0.01);
      if (!shelf) {
        let sheet = sheetBottom.findIndex((bottom) => bottom + pc.h <= usableH + 0.01);
        if (sheet === -1) {
          sheetBottom.push(0);
          sheet = sheetBottom.length - 1;
        }
        shelf = { sheet, y: sheetBottom[sheet], h: pc.h, x: 0 };
        sheetBottom[sheet] += pc.h + GAP;
        shelves.push(shelf);
      }
      placed.push({ pc, sheet: shelf.sheet, x: MARGIN + shelf.x, y: MARGIN + shelf.y });
      shelf.x += pc.w + GAP;
    }
    for (let sheet = 0; sheet < sheetBottom.length; sheet++) {
      if (!first) pdf.addPage('a4', 'portrait');
      first = false;
      pdf.setFontSize(7);
      pdf.setTextColor(140, 120, 110);
      pdf.text('Recorte na linha pontilhada · Clube do Focinho · Kit Identidade Pet', A4[0] / 2, A4[1] - 3, { align: 'center' });
      for (const { pc, x, y } of placed.filter((pl) => pl.sheet === sheet)) {
        addImg(pc.canvas, x, y, pc.w, pc.h, pc.round);
        pdf.setLineDashPattern([1.2, 1.2], 0);
        pdf.setDrawColor(170, 150, 140);
        pdf.setLineWidth(0.2);
        if (pc.round) pdf.circle(x + pc.w / 2, y + pc.h / 2, pc.w / 2 + 0.6, 'S');
        else pdf.roundedRect(x - 0.6, y - 0.6, pc.w + 1.2, pc.h + 1.2, 2, 2, 'S');
        pdf.setLineDashPattern([], 0);
      }
    }
  }
  return pdf.output('blob');
}

export async function downloadPdf(docs: DocDef[], c: DocContext, name: string, onProgress?: (n: number, total: number) => void) {
  const blob = await buildPdf(docs, c, onProgress);
  saveBlob(blob, `${name}.pdf`);
}
