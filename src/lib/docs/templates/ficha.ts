'use client';

import { tagColors } from '@/config/brand';
import { addressLine, ageLabel, petName, personalityLabel, sexLabel } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { formatPhone, photoBox } from '../common';
import { line, paw, rr, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';

const W = 900;
const H = 1600;
const C = tagColors;

function block(ctx: Ctx, y: number, title: string, rows: [string, string][], opts: { big?: boolean } = {}): number {
  const filled = rows.filter(([, v]) => v);
  if (!filled.length) return y;
  const rowH = opts.big ? 74 : 58;
  const h = 70 + filled.length * rowH;
  rr(ctx, 50, y, W - 100, h, 28);
  ctx.fillStyle = '#fff';
  ctx.fill();
  text(ctx, title, 84, y + 50, { size: 26, weight: 900, color: C.dark, letterSpacing: 2 });
  filled.forEach(([k, v], i) => {
    const yy = y + 70 + i * rowH + rowH * 0.62;
    if (k) text(ctx, k, 84, yy, { size: opts.big ? 28 : 24, weight: 700, color: 'rgba(74,54,38,.7)', maxWidth: 300 });
    text(ctx, v, W - 84, yy, { size: opts.big ? 38 : 28, weight: opts.big ? 900 : 800, color: C.ink, align: 'right', maxWidth: k ? W - 420 : W - 168 });
    if (i < filled.length - 1) line(ctx, 84, y + 70 + (i + 1) * rowH, W - 84, y + 70 + (i + 1) * rowH, 'rgba(138,106,74,.18)', 2);
  });
  return y + h + 24;
}

/** Identidade completa: é a imagem que abre ao escanear o QR Code da tag. */
export const fichaDoc: DocDef = {
  id: 'ficha',
  title: 'Identidade do Pet (QR Code)',
  file: 'Identidade-do-{nome}',
  pages: [
    {
      id: 'ficha',
      label: 'Identidade',
      w: W,
      h: H,
      mm: [90, 160],
      draw(ctx, c, a) {
        const p = c.pet;
        const ex = p.extras ?? {};
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = C.light;
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = C.base;
          ctx.fillRect(0, 0, W, 420);
          paw(ctx, 90, 80, 70, 'rgba(138,106,74,.18)', -0.3);
          paw(ctx, W - 90, 330, 80, 'rgba(138,106,74,.18)', 0.4);
        }
        text(ctx, 'SE ME ENCONTROU, FALE COM MEU TUTOR', W / 2, 70, { size: 28, weight: 900, color: C.ink, align: 'center', letterSpacing: 2, maxWidth: W - 80 });
        photoBox(ctx, a.photo, p, W / 2 - 190, 110, 380, 380, 190, { border: 12, borderColor: '#fff', bg: C.light });
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        text(ctx, name, W / 2, 590, { size: 92, weight: 700, family: 'display', color: C.ink, align: 'center', maxWidth: W - 100 });
        const sub = [getSpecies(p.species)?.label, p.breed, sexLabel(p), ageLabel(p)].filter(Boolean).join(' · ');
        wrap(ctx, sub, W / 2, 645, W - 120, 36, { size: 28, weight: 700, color: 'rgba(74,54,38,.75)', align: 'center', maxLines: 2 });

        let y = 710;
        const tutors = (p.tutors ?? []).filter((t) => t.name || t.phone);
        // Tutor sem telefone continua aparecendo (valor ' ' mantém a linha).
        const tutorRows: [string, string][] = tutors.map((t, i) => [t.name || `Tutor ${i + 1}`, formatPhone(t.phone || (i === 0 ? c.phone : '')) || ' ']);
        if (!tutorRows.length && c.phone) tutorRows.push(['Tutor', formatPhone(c.phone)]);
        y = block(ctx, y, 'TUTORES', tutorRows, { big: true });
        const addr = addressLine(p);
        if (addr) {
          rr(ctx, 50, y, W - 100, 120, 28);
          ctx.fillStyle = '#fff';
          ctx.fill();
          text(ctx, 'ENDEREÇO', 84, y + 46, { size: 26, weight: 900, color: C.dark, letterSpacing: 2 });
          wrap(ctx, addr, 84, y + 90, W - 168, 32, { size: 26, weight: 800, color: C.ink, maxLines: 1 });
          y += 144;
        }
        y = block(ctx, y, 'CONTATOS DE EMERGÊNCIA', (ex.contacts ?? []).map((ct) => [`${ct.name}${ct.relation ? ` (${ct.relation})` : ''}`, formatPhone(ct.phone)]));
        y = block(ctx, y, 'SAÚDE', [
          ['Alergias', ex.allergies ?? ''],
          ['Remédios', ex.medications ?? ''],
          ['Cuidados', ex.conditions ?? ''],
          ['Veterinário', [ex.vetName, ex.vetClinic].filter(Boolean).join(' · ')],
          ['Tel. veterinário', formatPhone(ex.vetPhone)],
        ]);
        y = block(ctx, y, 'IDENTIFICAÇÃO', [
          ['Pelagem', ex.coat ?? ''],
          ['Porte / peso', [ex.size, ex.weight].filter(Boolean).join(' · ')],
          ['Microchip', ex.microchip ?? ''],
          ['Personalidade', personalityLabel(p) ?? ''],
        ]);
        text(ctx, 'Identidade Pet · Clube do Focinho', W / 2, H - 40, { size: 22, weight: 700, color: 'rgba(74,54,38,.55)', align: 'center' });
      },
    },
  ],
};
