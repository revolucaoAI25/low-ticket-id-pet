'use client';

import { DOCS, BONUS_DOC_IDS, KIT_DOC_IDS, composePdf, exportScale, fileName, isA4, pdfData, renderPage, type PdfItem } from './render';
import type { DocContext } from './types';

export interface PackageFile {
  /** Nome do arquivo no Storage (sem pasta). */
  name: string;
  /** Nome amigável para o e-mail/download. */
  label: string;
  kind: 'kit-pdf' | 'bonus-pdf' | 'zip' | 'ficha';
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

/**
 * Gera o pacote final de um pet, desenhando cada página uma única vez:
 * - PDF de impressão do kit e PDF dos bônus (A4, tamanho real, linha de corte)
 * - ZIP com todas as imagens em alta resolução
 * - Imagem da identidade (é o que abre ao escanear o QR Code)
 */
export async function buildPackage(c: DocContext, onProgress?: (done: number, total: number) => void): Promise<PackageFile[]> {
  const ctx = { ...c, preview: false };
  const { zipSync } = await import('fflate');
  const kitDocs = KIT_DOC_IDS.map((id) => DOCS[id]);
  const bonusDocs = BONUS_DOC_IDS.map((id) => DOCS[id]);
  const total = [...kitDocs, ...bonusDocs].reduce((s, d) => s + d.pages.length, 0) + 3;
  let done = 0;
  const tick = () => onProgress?.(++done, total);

  const zipFiles: Record<string, [Uint8Array, { level: 0 }]> = {};
  const kitItems: PdfItem[] = [];
  const bonusItems: PdfItem[] = [];
  let ficha: Blob | null = null;

  for (const [group, docs, items] of [
    ['Documentos', kitDocs, kitItems],
    ['Bonus', bonusDocs, bonusItems],
  ] as const) {
    for (const doc of docs) {
      for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pages[i];
        const canvas = await renderPage(doc, i, ctx, isA4(page) ? 2 : exportScale(page));
        // Imagem para o ZIP: PNG nos formatos recortados (fundo transparente), JPEG no resto.
        const png = !!page.shape;
        const img = await toBlob(canvas, png ? 'image/png' : 'image/jpeg', png ? undefined : 0.93);
        const suffix = doc.pages.length > 1 ? `-${slug(page.label)}` : '';
        zipFiles[`${group}/${fileName(doc, ctx, suffix)}.${png ? 'png' : 'jpg'}`] = [new Uint8Array(await img.arrayBuffer()), { level: 0 }];
        if (doc.id === 'ficha') {
          ficha = await toBlob(canvas, 'image/jpeg', 0.9);
        }
        items.push({ data: pdfData(canvas, page), page });
        canvas.width = 0;
        tick();
      }
    }
  }

  const name = fileName({ ...DOCS.rg, file: '{nome}' }, ctx);
  const kitPdf = await composePdf(kitItems);
  tick();
  const bonusPdf = await composePdf(bonusItems);
  tick();
  const zip = zipSync(zipFiles);
  tick();

  const files: PackageFile[] = [
    { name: 'kit.pdf', label: `Kit-Identidade-Pet-${name}.pdf`, kind: 'kit-pdf', blob: kitPdf, type: 'application/pdf' },
    { name: 'bonus.pdf', label: `Bonus-${name}.pdf`, kind: 'bonus-pdf', blob: bonusPdf, type: 'application/pdf' },
    { name: 'imagens.zip', label: `Imagens-${name}.zip`, kind: 'zip', blob: new Blob([zip as BlobPart], { type: 'application/zip' }), type: 'application/zip' },
  ];
  if (ficha) files.push({ name: 'ficha.jpg', label: `Identidade-${name}.jpg`, kind: 'ficha', blob: ficha, type: 'image/jpeg' });
  return files;
}
