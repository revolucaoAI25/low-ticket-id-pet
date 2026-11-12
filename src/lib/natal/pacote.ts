'use client';

/**
 * Arquivos dos order bumps personalizados de um pet, gerados no navegador:
 * - Kit Natal e Ano Novo: as 7 artes (JPG, uma a uma), PDF para imprimir (cartões e etiquetas de presente) e ZIP com tudo
 * - Figurinhas: as 34 figurinhas (WebP para o WhatsApp, ou PNG se o navegador não gerar WebP) e ZIP com WebP + PNG + instruções
 */

import { isFemale, petName, type PetData } from '@/lib/pet';
import type { PackageFile } from '@/lib/docs/package';
import { petPhotos, toBlob } from './base';
import type { NatalPet } from './artes';

export type ExtraKind = 'natal' | 'figurinhas';

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export async function natalPet(pet: PetData): Promise<NatalPet> {
  return { name: petName(pet), female: isFemale(pet), photos: await petPhotos(pet.photo, pet.extras?.photos) };
}

const COMO_USAR = `FIGURINHAS DO SEU PET: COMO USAR NO WHATSAPP

As imagens já vêm sem fundo, no formato de figurinha.

Android e iPhone (pelo próprio WhatsApp):
1. Salve as figurinhas no celular (pela sua área no site, tocando nelas, ou por esta pasta).
2. No WhatsApp, abra uma conversa, toque no ícone de figurinha e em "Criar" / "Criar figurinha".
3. Escolha a imagem salva e envie.
4. Toque na figurinha enviada e escolha "Adicionar aos favoritos". Pronto: ela fica na aba de figurinhas.

Android (pacote completo de uma vez):
- Instale o app gratuito "Sticker.ly", crie um pacote, importe as imagens da pasta "WEBP (Android)"
  e toque em "Adicionar ao WhatsApp".

WhatsApp Web / computador:
- Abra uma conversa, clique no clipe > "Figurinha" (ou em figurinhas > "Criar") e escolha um .png desta pasta.
`;

/** Marcas de corte nos cantos de um retângulo (mm). */
function cropMarks(pdf: import('jspdf').jsPDF, x: number, y: number, w: number, h: number) {
  const m = 4;
  const g = 1.5;
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.2);
  for (const [cx, cy, dx, dy] of [
    [x, y, -1, -1],
    [x + w, y, 1, -1],
    [x, y + h, -1, 1],
    [x + w, y + h, 1, 1],
  ] as const) {
    pdf.line(cx + dx * g, cy, cx + dx * (g + m), cy);
    pdf.line(cx, cy + dy * g, cx, cy + dy * (g + m));
  }
}

export async function buildExtras(pet: PetData, kinds: ExtraKind[], onProgress?: (done: number, total: number) => void): Promise<PackageFile[]> {
  const p = await natalPet(pet);
  const name = slug(p.name) || 'pet';
  const files: PackageFile[] = [];
  const { zipSync, strToU8 } = await import('fflate');
  const steps = (kinds.includes('natal') ? 10 : 0) + (kinds.includes('figurinhas') ? 35 : 0);
  let done = 0;
  const tick = () => onProgress?.(++done, steps || 1);

  if (kinds.includes('natal')) {
    const { renderArtes, renderEtiqueta } = await import('./artes');
    const artes = await renderArtes(p);
    const zip: Record<string, [Uint8Array, { level: 0 }]> = {};
    const jpgs: Record<string, string> = {};
    for (const [i, a] of artes.entries()) {
      const blob = await toBlob(a.canvas, 'image/jpeg', 0.92);
      zip[`Kit-Natal-${name}/${a.file}.jpg`] = [new Uint8Array(await blob.arrayBuffer()), { level: 0 }];
      files.push({ name: `natal-${i + 1}.jpg`, label: `${a.label} - ${p.name}.jpg`, kind: 'natal-arte', blob, type: 'image/jpeg' });
      if (a.id.startsWith('cartao')) jpgs[a.id] = a.canvas.toDataURL('image/jpeg', 0.92);
      a.canvas.width = 0;
      tick();
    }
    // PDF para imprimir: 2 cartões por folha (15 × 10 cm) e 8 etiquetas de presente (9 × 5,5 cm), com marcas de corte.
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const cards = [jpgs['cartao-natal'], jpgs['cartao-ano-novo']].filter(Boolean);
    cards.forEach((img, i) => {
      if (i) pdf.addPage();
      for (const y of [28, 158]) {
        pdf.addImage(img, 'JPEG', 30, y, 150, 100);
        cropMarks(pdf, 30, y, 150, 100);
      }
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text('Imprima em tamanho real (100%), em papel fotográfico ou couchê, e recorte nas marcas.', 105, 285, { align: 'center' });
    });
    const tag = await renderEtiqueta(p);
    const tagImg = tag.toDataURL('image/jpeg', 0.92);
    tag.width = 0;
    pdf.addPage();
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 2; c++) {
        const x = 12 + c * 96;
        const y = 22 + r * 62;
        pdf.addImage(tagImg, 'JPEG', x, y, 90, 55);
        cropMarks(pdf, x, y, 90, 55);
      }
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text('Etiquetas de presente: recorte, fure no círculo e amarre com uma fitinha.', 105, 285, { align: 'center' });
    const pdfBlob = pdf.output('blob');
    zip[`Kit-Natal-${name}/Para-imprimir-cartoes-e-etiquetas.pdf`] = [new Uint8Array(await pdfBlob.arrayBuffer()), { level: 0 }];
    files.push({ name: 'natal-imprimir.pdf', label: `Kit-Natal-para-imprimir-${name}.pdf`, kind: 'natal-pdf', blob: pdfBlob, type: 'application/pdf' });
    tick();
    const z = zipSync(zip);
    files.push({ name: 'natal.zip', label: `Kit-Natal-e-Ano-Novo-${name}.zip`, kind: 'natal-zip', blob: new Blob([z as BlobPart], { type: 'application/zip' }), type: 'application/zip' });
    tick();
  }

  if (kinds.includes('figurinhas')) {
    const { renderFigurinhas, toStickerWebp } = await import('./figurinhas');
    const figs = await renderFigurinhas(p);
    const zip: Record<string, [Uint8Array, { level: 0 }]> = {};
    for (const [i, f] of figs.entries()) {
      const png = await toBlob(f.canvas, 'image/png');
      const webp = await toStickerWebp(f.canvas);
      zip[`Figurinhas-${name}/PNG (iPhone e computador)/${f.file}.png`] = [new Uint8Array(await png.arrayBuffer()), { level: 0 }];
      if (webp) zip[`Figurinhas-${name}/WEBP (Android)/${f.file}.webp`] = [new Uint8Array(await webp.arrayBuffer()), { level: 0 }];
      const blob = webp ?? png;
      files.push({ name: `figurinha-${String(i + 1).padStart(2, '0')}.${webp ? 'webp' : 'png'}`, label: f.label, kind: 'figurinha', blob, type: blob.type });
      f.canvas.width = 0;
      tick();
    }
    zip[`Figurinhas-${name}/COMO-USAR.txt`] = [strToU8(COMO_USAR), { level: 0 }];
    const z = zipSync(zip);
    files.push({ name: 'figurinhas.zip', label: `Figurinhas-${name}.zip`, kind: 'figurinhas-zip', blob: new Blob([z as BlobPart], { type: 'application/zip' }), type: 'application/zip' });
    tick();
  }
  return files;
}
