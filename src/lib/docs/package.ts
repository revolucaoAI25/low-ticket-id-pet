'use client';

import { DOCS, BONUS_DOC_IDS, KIT_DOC_IDS, exportScale, fileName, isA4, renderPage } from './render';
import { composeSheets, plannedPageIds, sheetsToPdf, type RenderedPage } from './print';
import type { DocContext, DocDef } from './types';

export interface PackageFile {
  /** Nome do arquivo no Storage (sem pasta). */
  name: string;
  /** Nome amigável para o e-mail/download. */
  label: string;
  kind: 'kit-pdf' | 'zip' | 'ficha';
  blob: Blob;
  type: string;
}

const toBlob = (canvas: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), type, q));

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Junta PDFs prontos (bônus fixos e order bumps) no fim do PDF do kit. */
async function appendPdfs(main: Blob, urls: string[]): Promise<Blob> {
  if (!urls.length) return main;
  const { PDFDocument } = await import('pdf-lib');
  const out = await PDFDocument.load(await main.arrayBuffer());
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const src = await PDFDocument.load(await r.arrayBuffer(), { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((pg) => out.addPage(pg));
    } catch (e) {
      console.warn('não consegui juntar', url, e);
    }
  }
  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

/**
 * Gera o pacote final de um pet, desenhando cada página uma única vez:
 * - UM PDF com tudo, na ordem do plano de impressão (src/lib/docs/plan.ts): capa, sumário,
 *   instruções, documentos (peças pequenas em tamanho real, organizadas por documento),
 *   bônus e, no fim, os PDFs prontos (bônus fixos e order bumps comprados)
 * - ZIP com todas as imagens em alta resolução (para quem quiser as imagens soltas)
 * - Imagem da identidade (é o que abre ao escanear o QR Code)
 */
export async function buildPackage(c: DocContext, extraPdfUrls: string[] = [], onProgress?: (done: number, total: number) => void): Promise<PackageFile[]> {
  const ctx = { ...c, preview: false };
  const { zipSync } = await import('fflate');
  const groups: [string, DocDef[]][] = [
    ['', [DOCS.guia]],
    ['Documentos', KIT_DOC_IDS.map((id) => DOCS[id])],
    ['Bonus', BONUS_DOC_IDS.map((id) => DOCS[id])],
  ];
  const planned = plannedPageIds();
  const pageCount = groups.reduce((s, [, docs]) => s + docs.reduce((n, d) => n + d.pages.length, 0), 0);
  const total = pageCount + planned.size + 3;
  let done = 0;
  const tick = () => onProgress?.(++done, total);

  const zipFiles: Record<string, [Uint8Array, { level: 0 }]> = {};
  const rendered = new Map<string, RenderedPage>();
  let ficha: Blob | null = null;

  for (const [group, docs] of groups) {
    for (const doc of docs) {
      for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pages[i];
        const a4 = isA4(page);
        const canvas = await renderPage(doc, i, ctx, a4 ? 2 : exportScale(page));
        if (group) {
          // Imagem para o ZIP: PNG nos formatos recortados (fundo transparente), JPEG no resto.
          const png = !!page.shape;
          const img = await toBlob(canvas, png ? 'image/png' : 'image/jpeg', png ? undefined : 0.93);
          const suffix = doc.pages.length > 1 ? `-${slug(page.label)}` : '';
          zipFiles[`${group}/${fileName(doc, ctx, suffix)}.${png ? 'png' : 'jpg'}`] = [new Uint8Array(await img.arrayBuffer()), { level: 0 }];
        }
        if (doc.id === 'ficha') ficha = await toBlob(canvas, 'image/jpeg', 0.9);
        if (!planned.has(page.id)) console.warn('página fora do plano de impressão:', page.id);
        if (a4) {
          rendered.set(page.id, { page, data: canvas.toDataURL('image/jpeg', 0.92) });
          canvas.width = 0;
        } else rendered.set(page.id, { page, canvas });
        tick();
      }
    }
  }

  const sheets = composeSheets(rendered, tick);
  rendered.forEach((r) => {
    if (r.canvas) r.canvas.width = 0;
  });
  const name = fileName({ ...DOCS.rg, file: '{nome}' }, ctx);
  const pdf = await appendPdfs(await sheetsToPdf(sheets), extraPdfUrls);
  tick();
  const zip = zipSync(zipFiles);
  tick();
  tick();

  const files: PackageFile[] = [
    { name: 'kit.pdf', label: `Kit-Identidade-Pet-${name}.pdf`, kind: 'kit-pdf', blob: pdf, type: 'application/pdf' },
    { name: 'imagens.zip', label: `Imagens-${name}.zip`, kind: 'zip', blob: new Blob([zip as BlobPart], { type: 'application/zip' }), type: 'application/zip' },
  ];
  if (ficha) files.push({ name: 'ficha.jpg', label: `Identidade-${name}.jpg`, kind: 'ficha', blob: ficha, type: 'image/jpeg' });
  return files;
}
