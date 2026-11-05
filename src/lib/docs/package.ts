'use client';

import { DOCS, BONUS_DOC_IDS, KIT_DOC_IDS, composePdf, exportScale, fileName, isA4, pdfData, renderPage, type PdfItem } from './render';
import type { DocContext } from './types';

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
 * - UM PDF com tudo: capa, instruções de montagem, documentos (A4, tamanho real, linha de corte),
 *   bônus personalizados e, no fim, os PDFs prontos (bônus fixos e order bumps comprados)
 * - ZIP com todas as imagens em alta resolução (opcional, para quem quiser as imagens soltas)
 * - Imagem da identidade (é o que abre ao escanear o QR Code)
 */
export async function buildPackage(c: DocContext, extraPdfUrls: string[] = [], onProgress?: (done: number, total: number) => void): Promise<PackageFile[]> {
  const ctx = { ...c, preview: false };
  const { zipSync } = await import('fflate');
  const guideDocs = [DOCS.guia];
  const kitDocs = KIT_DOC_IDS.map((id) => DOCS[id]);
  const bonusDocs = BONUS_DOC_IDS.map((id) => DOCS[id]);
  const total = [...guideDocs, ...kitDocs, ...bonusDocs].reduce((s, d) => s + d.pages.length, 0) + 3;
  let done = 0;
  const tick = () => onProgress?.(++done, total);

  const zipFiles: Record<string, [Uint8Array, { level: 0 }]> = {};
  const groups: PdfItem[][] = [[], [], []];
  let ficha: Blob | null = null;

  for (const [gi, group, docs] of [
    [0, '', guideDocs],
    [1, 'Documentos', kitDocs],
    [2, 'Bonus', bonusDocs],
  ] as const) {
    for (const doc of docs) {
      for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pages[i];
        const canvas = await renderPage(doc, i, ctx, isA4(page) ? 2 : exportScale(page));
        if (group) {
          // Imagem para o ZIP: PNG nos formatos recortados (fundo transparente), JPEG no resto.
          const png = !!page.shape;
          const img = await toBlob(canvas, png ? 'image/png' : 'image/jpeg', png ? undefined : 0.93);
          const suffix = doc.pages.length > 1 ? `-${slug(page.label)}` : '';
          zipFiles[`${group}/${fileName(doc, ctx, suffix)}.${png ? 'png' : 'jpg'}`] = [new Uint8Array(await img.arrayBuffer()), { level: 0 }];
        }
        if (doc.id === 'ficha') ficha = await toBlob(canvas, 'image/jpeg', 0.9);
        groups[gi].push({ data: pdfData(canvas, page), page });
        canvas.width = 0;
        tick();
      }
    }
  }

  const name = fileName({ ...DOCS.rg, file: '{nome}' }, ctx);
  const pdf = await appendPdfs(await composePdf(groups), extraPdfUrls);
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
