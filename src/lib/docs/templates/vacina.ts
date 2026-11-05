'use client';

import { formatDateBR, petName, sexLabel } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { formatPhone, photoBox } from '../common';
import { field, line, paw, pawPattern, rr, text } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';

const W = 1000;
const H = 1414;
const GREEN = '#5E8A63';
const GREEN_D = '#3F6644';
const SAGE = '#A9BAA6';

function header(ctx: Ctx, title: string, subtitle: string) {
  ctx.fillStyle = '#FBFCF8';
  ctx.fillRect(0, 0, W, H);
  pawPattern(ctx, 0, 0, W, H, 'rgba(169,186,166,.16)', 150, 46);
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, GREEN);
  grad.addColorStop(1, GREEN_D);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 170);
  text(ctx, title, 60, 92, { size: 58, weight: 700, family: 'display', color: '#fff', maxWidth: W - 200 });
  text(ctx, subtitle, 60, 136, { size: 26, weight: 700, color: 'rgba(255,255,255,.85)', maxWidth: W - 200 });
  paw(ctx, W - 90, 86, 100, 'rgba(255,255,255,.2)', 0.3);
}

function table(ctx: Ctx, x: number, y: number, w: number, cols: { label: string; w: number }[], rows: string[][], rowH: number, title?: string) {
  let yy = y;
  if (title) {
    text(ctx, title, x, yy, { size: 34, weight: 700, family: 'display', color: GREEN_D });
    yy += 22;
  }
  rr(ctx, x, yy, w, 54, 14);
  ctx.fillStyle = GREEN;
  ctx.fill();
  let cx = x;
  const total = cols.reduce((s, c) => s + c.w, 0);
  for (const col of cols) {
    const cw = (col.w / total) * w;
    text(ctx, col.label.toUpperCase(), cx + 16, yy + 35, { size: 17, weight: 900, color: '#fff', maxWidth: cw - 24, letterSpacing: 1 });
    cx += cw;
  }
  yy += 54;
  rows.forEach((r, i) => {
    ctx.fillStyle = i % 2 ? 'rgba(169,186,166,.12)' : '#fff';
    ctx.fillRect(x, yy, w, rowH);
    let cx2 = x;
    cols.forEach((col, j) => {
      const cw = (col.w / total) * w;
      if (r[j]) text(ctx, r[j], cx2 + 16, yy + rowH / 2 + 9, { size: 24, weight: 700, color: '#49382F', maxWidth: cw - 24 });
      if (j > 0) line(ctx, cx2, yy, cx2, yy + rowH, 'rgba(94,138,99,.25)', 2);
      cx2 += cw;
    });
    line(ctx, x, yy + rowH, x + w, yy + rowH, 'rgba(94,138,99,.25)', 2);
    yy += rowH;
  });
  ctx.strokeStyle = 'rgba(94,138,99,.45)';
  ctx.lineWidth = 2;
  rr(ctx, x, y + (title ? 22 : 0), w, yy - y - (title ? 22 : 0), 14);
  ctx.stroke();
  return yy;
}

export const vacinaDoc: DocDef = {
  id: 'vacina',
  title: 'Carteira de Vacinação',
  file: 'Carteira-de-Vacinacao-do-{nome}',
  pages: [
    {
      id: 'vacina-capa',
      label: 'Identificação',
      w: W,
      h: H,
      mm: [148, 210],
      draw(ctx, c, a) {
        const p = c.pet;
        const ex = p.extras ?? {};
        const sp = getSpecies(p.species);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else header(ctx, sp?.vaccines.length ? 'Carteira de Vacinação' : 'Carteira de Saúde', 'Kit Identidade Pet · Clube do Focinho');
        photoBox(ctx, a.photo, p, 60, 230, 330, 400, 28, { border: 8, borderColor: '#fff' });
        ctx.strokeStyle = SAGE;
        ctx.lineWidth = 4;
        rr(ctx, 52, 222, 346, 416, 34);
        ctx.stroke();
        const x = 440;
        const w = W - x - 60;
        const opt = { labelColor: GREEN_D, size: 32, labelSize: 18 };
        field(ctx, 'Nome', petName(p) === 'seu pet' ? '' : petName(p), x, 260, w, opt);
        field(ctx, 'Espécie', sp?.label ?? '', x, 360, w, opt);
        field(ctx, 'Raça', p.breed ?? '', x, 460, w, opt);
        field(ctx, 'Sexo', sexLabel(p), x, 560, (w - 20) / 2, opt);
        field(ctx, p.origin === 'adocao' ? 'Adoção' : 'Nascimento', formatDateBR(p.date), x + (w - 20) / 2 + 20, 560, (w - 20) / 2, opt);
        const full = W - 120;
        field(ctx, 'Pelagem / sinais', ex.coat ?? '', 60, 700, (full - 30) / 2, opt);
        field(ctx, 'Nº do microchip', ex.microchip ?? '', 60 + (full - 30) / 2 + 30, 700, (full - 30) / 2, opt);
        field(ctx, 'Tutores', p.tutors ?? '', 60, 800, full, opt);
        field(ctx, 'Telefone', formatPhone(c.phone), 60, 900, (full - 30) / 2, opt);
        field(ctx, 'Cidade', p.city ?? '', 60 + (full - 30) / 2 + 30, 900, (full - 30) / 2, opt);
        field(ctx, 'Veterinário(a) / clínica', [ex.vetName, ex.vetClinic].filter(Boolean).join(' · '), 60, 1000, (full - 30) / 2, opt);
        field(ctx, 'Telefone da clínica', formatPhone(ex.vetPhone), 60 + (full - 30) / 2 + 30, 1000, (full - 30) / 2, opt);
        field(ctx, 'Alergias / condições', [ex.allergies, ex.conditions].filter(Boolean).join(' · '), 60, 1100, full, opt);
        rr(ctx, 60, 1210, full, 120, 20);
        ctx.fillStyle = 'rgba(169,186,166,.22)';
        ctx.fill();
        text(ctx, 'Para organização pessoal. Não substitui a carteira', W / 2, 1260, { size: 24, weight: 700, color: GREEN_D, align: 'center' });
        text(ctx, 'assinada pelo médico-veterinário.', W / 2, 1296, { size: 24, weight: 700, color: GREEN_D, align: 'center' });
      },
    },
    {
      id: 'vacina-vacinas',
      label: 'Vacinas',
      w: W,
      h: H,
      mm: [148, 210],
      draw(ctx, c, a) {
        const sp = getSpecies(c.pet.species);
        const name = petName(c.pet);
        const hasVaccines = !!sp?.vaccines.length;
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else header(ctx, hasVaccines ? 'Vacinas' : 'Consultas e cuidados', name === 'seu pet' ? 'Controle de saúde' : `Controle de saúde de ${name}`);
        const rows: string[][] = [];
        if (hasVaccines) {
          for (const v of sp!.vaccines) {
            rows.push([v, '', '', '']);
            rows.push(['', '', '', '']);
          }
        }
        while (rows.length < 18) rows.push(['', '', '', '']);
        table(
          ctx,
          60,
          230,
          W - 120,
          hasVaccines
            ? [
                { label: 'Vacina', w: 3.2 },
                { label: 'Data', w: 1.6 },
                { label: 'Próxima', w: 1.6 },
                { label: 'Carimbo / vet.', w: 2.2 },
              ]
            : [
                { label: 'Consulta / cuidado', w: 3.2 },
                { label: 'Data', w: 1.6 },
                { label: 'Retorno', w: 1.6 },
                { label: 'Observação', w: 2.2 },
              ],
          rows.slice(0, 18),
          60,
        );
      },
    },
    {
      id: 'vacina-tratamentos',
      label: 'Vermífugo e antipulgas',
      w: W,
      h: H,
      mm: [148, 210],
      draw(ctx, c, a) {
        const sp = getSpecies(c.pet.species);
        const treatments = sp?.treatments ?? ['Vermífugo', 'Antipulgas'];
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else header(ctx, sp?.vaccines.length ? 'Vermífugo e antipulgas' : 'Cuidados e tratamentos', 'Datas, produtos e próximas doses');
        const cols = [
          { label: 'Data', w: 1.5 },
          { label: 'Produto', w: 2.6 },
          { label: 'Peso', w: 1.1 },
          { label: 'Próxima', w: 1.5 },
        ];
        const empty = Array.from({ length: 7 }, () => ['', '', '', '']);
        let y = table(ctx, 60, 250, W - 120, cols, empty, 58, treatments[0]);
        y = table(ctx, 60, y + 70, W - 120, cols, empty, 58, treatments[1] ?? 'Outros cuidados');
      },
    },
  ],
};
