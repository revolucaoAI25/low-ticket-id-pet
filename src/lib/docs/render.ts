'use client';

import { brand } from '@/config/brand';
import { petName } from '@/lib/pet';
import { watermark } from './common';
import { ensureFonts, loadImage } from './draw';
import { drawSlots } from './layout';
import { aniversarioDoc } from './templates/aniversario';
import { certidaoDoc } from './templates/certidao';
import { cnhDoc } from './templates/cnh';
import { fichaDoc } from './templates/ficha';
import { guiaDoc } from './templates/guia';
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
  cnh: cnhDoc,
  certidao: certidaoDoc,
  passaporte: passaporteDoc,
  tag: tagDoc,
  vacina: vacinaDoc,
  torcedor: torcedorDoc,
  ficha: fichaDoc,
  aniversario: aniversarioDoc,
  guia: guiaDoc,
  quemcuida: quemCuidaDoc,
};

export const KIT_DOC_IDS = ['rg', 'cnh', 'certidao', 'passaporte', 'tag', 'ficha', 'vacina', 'torcedor'] as const;
export const BONUS_DOC_IDS = ['aniversario', 'quemcuida'] as const;

/** Lista de todos os ids de página (para o painel cadastrar fundos prontos). */
export function allPages(): { doc: string; page: DocPage }[] {
  return Object.values(DOCS).flatMap((d) => d.pages.map((page) => ({ doc: d.title, page })));
}

export function qrUrl(c: DocContext): string {
  // Link curto: /q/[código] redireciona para a imagem da identidade do pet.
  return `${c.siteUrl}/q/${c.slug || 'exemplo'}`;
}

const qrCache = new Map<string, Promise<HTMLCanvasElement | null>>();
function makeQr(text: string): Promise<HTMLCanvasElement | null> {
  const hit = qrCache.get(text);
  if (hit) return hit;
  const p = import('qrcode')
    .then(async (QR) => {
      const canvas = document.createElement('canvas');
      await QR.toCanvas(canvas, text, { margin: 0, width: 600, errorCorrectionLevel: 'L', color: { dark: '#2b1f19', light: '#ffffff' } });
      return canvas;
    })
    .catch(() => null);
  qrCache.set(text, p);
  return p;
}

async function loadAssets(page: DocPage, c: DocContext, templateSrc: string | null): Promise<Assets> {
  const extra = c.pet.extras?.photos ?? [];
  const [photo, crest, logo, qr, background, ...photos] = await Promise.all([
    loadImage(c.pet.photo),
    page.needsCrest ? loadImage(c.team?.crest ?? null) : Promise.resolve(null),
    loadImage(brand.logo),
    page.needsQr ? makeQr(qrUrl(c)) : Promise.resolve(null),
    loadImage(templateSrc),
    ...extra.map((u) => loadImage(u)),
  ]);
  return {
    photo: photo as HTMLImageElement | null,
    crest: crest as HTMLImageElement | null,
    logo: logo as HTMLImageElement | null,
    qr: qr as HTMLCanvasElement | null,
    background: background as HTMLImageElement | null,
    photos: photos.filter(Boolean) as HTMLImageElement[],
  };
}

/**
 * Desenha uma página do documento num canvas.
 * scale: multiplicador sobre o tamanho lógico (0.4 para miniatura, 2 para arquivo final).
 */
export async function renderPage(doc: DocDef, pageIndex: number, c: DocContext, scale = 1): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const page = doc.pages[pageIndex];
  // Template enviado no painel > template escolhido pelo layout > template fixo da página.
  const layout = page.layout?.(c);
  const templateSrc = c.templates?.[page.id] || layout?.template || page.template || null;
  const slots = layout?.slots ?? page.slots;
  const assets = await loadAssets(page, c, templateSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(page.w * scale);
  canvas.height = Math.round(page.h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.imageSmoothingQuality = 'high';
  // Template pronto + campos mapeados → escreve por cima. Senão, desenho provisório.
  if (assets.background && slots?.length) drawSlots(ctx, page, c, assets, slots, layout?.box);
  else page.draw(ctx, c, assets);
  if (c.preview) {
    ctx.save();
    if (page.shape === 'round') {
      ctx.beginPath();
      ctx.arc(page.w / 2, page.h / 2, page.w / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (page.shape === 'bone') {
      ctx.globalCompositeOperation = 'source-atop';
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
  const file = c.pet.sex === 'femea' ? doc.file.replace('-do-', '-da-') : doc.file;
  return file.replace('{nome}', safe) + suffix;
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

/** Uma página já desenhada, pronta para entrar no PDF de impressão. */
export interface PdfItem {
  /** dataURL (PNG para formatos recortados, JPEG para o resto). */
  data: string;
  page: DocPage;
}

const A4: [number, number] = [210, 297];
const MARGIN = 8;
const GAP = 5;

export function isA4(page: DocPage): boolean {
  return (page.mm[0] === 210 && page.mm[1] === 297) || (page.mm[0] === 297 && page.mm[1] === 210);
}

/** Converte um canvas na imagem que vai para o PDF. */
export function pdfData(canvas: HTMLCanvasElement, page: DocPage): string {
  return page.shape ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Monta o PDF de impressão em A4.
 * Páginas do tamanho A4 ocupam a folha inteira; peças menores (RG, CNH, tag, passaporte…)
 * são encaixadas em tamanho real, com linha de corte, gastando o mínimo de papel.
 */
export async function composePdf(input: PdfItem[] | PdfItem[][]): Promise<Blob> {
  // Grupos (ex.: capa, documentos, bônus) ficam em sequência: cada grupo com suas folhas A4 e depois as peças encaixadas.
  const groups: PdfItem[][] = Array.isArray(input[0]) ? (input as PdfItem[][]) : [input as PdfItem[]];
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  let first = true;
  let aliasBase = 0;
  const addImg = (it: PdfItem, idx: number, x: number, y: number, w: number, h: number) => {
    // Alias: cada imagem entra uma vez no arquivo, mesmo com várias cópias (tags).
    pdf.addImage(it.data, it.page.shape ? 'PNG' : 'JPEG', x, y, w, h, `img${aliasBase + idx}`, 'FAST');
  };

  for (const items of groups) {
    items.forEach((it, idx) => {
      if (!isA4(it.page)) return;
      const landscape = it.page.mm[0] > it.page.mm[1];
      if (!first) pdf.addPage('a4', landscape ? 'landscape' : 'portrait');
      else if (landscape) {
        pdf.deletePage(1);
        pdf.addPage('a4', 'landscape');
      }
      first = false;
      const [pw, ph] = landscape ? [A4[1], A4[0]] : A4;
      addImg(it, idx, 0, 0, pw, ph);
    });

    type Piece = { idx: number; w: number; h: number };
    const pieces: Piece[] = [];
    items.forEach((it, idx) => {
      if (isA4(it.page)) return;
      for (const [w, h] of it.page.printCopies ?? [it.page.mm]) pieces.push({ idx, w, h });
    });

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
          const it = items[pc.idx];
          addImg(it, pc.idx, x, y, pc.w, pc.h);
          pdf.setLineDashPattern([1.2, 1.2], 0);
          pdf.setDrawColor(170, 150, 140);
          pdf.setLineWidth(0.2);
          if (it.page.shape === 'round') pdf.circle(x + pc.w / 2, y + pc.h / 2, pc.w / 2 + 0.6, 'S');
          else if (!it.page.shape) pdf.roundedRect(x - 0.6, y - 0.6, pc.w + 1.2, pc.h + 1.2, 2, 2, 'S');
          pdf.setLineDashPattern([], 0);
        }
      }
    }
    aliasBase += items.length;
  }
  return pdf.output('blob');
}

/** Desenha os documentos e monta o PDF de impressão. */
export async function buildPdf(docs: DocDef[], c: DocContext, onProgress?: (n: number, total: number) => void): Promise<Blob> {
  const items: PdfItem[] = [];
  const total = docs.reduce((s, d) => s + d.pages.length, 0);
  let done = 0;
  for (const doc of docs) {
    for (let i = 0; i < doc.pages.length; i++) {
      const page = doc.pages[i];
      const canvas = await renderPage(doc, i, { ...c, preview: false }, isA4(page) ? 2 : exportScale(page));
      items.push({ data: pdfData(canvas, page), page });
      canvas.width = 0;
      onProgress?.(++done, total);
    }
  }
  return composePdf(items);
}

export async function downloadPdf(docs: DocDef[], c: DocContext, name: string, onProgress?: (n: number, total: number) => void) {
  const blob = await buildPdf(docs, c, onProgress);
  saveBlob(blob, `${name}.pdf`);
}
