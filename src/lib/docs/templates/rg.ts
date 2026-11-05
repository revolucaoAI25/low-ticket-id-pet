'use client';

import { rgColors } from '@/config/brand';
import { clubNumber, defaultRgColor, formatDateBR, personalityLabel, petName, sexLabel } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { brandMark, DISCLAIMER, formatPhone, maskNumber, photoBox } from '../common';
import { dashedRect, field, fillRR, line, paw, pawPattern, rr, text } from '../draw';
import type { DocDef } from '../types';

const W = 1000;
const H = 630;

export const rgDoc: DocDef = {
  id: 'rg',
  title: 'RG do Pet',
  file: 'RG-do-{nome}',
  pages: [
    {
      id: 'rg-frente',
      label: 'Frente',
      w: W,
      h: H,
      mm: [85.6, 54],
      draw(ctx, c, a) {
        const color = rgColors[defaultRgColor(c.pet)];
        const p = c.pet;
        // Cartão
        ctx.save();
        rr(ctx, 0, 0, W, H, 40);
        ctx.clip();
        if (a.background) {
          ctx.drawImage(a.background, 0, 0, W, H);
        } else {
          ctx.fillStyle = color.light;
          ctx.fillRect(0, 0, W, H);
          pawPattern(ctx, 0, 110, W, H - 110, 'rgba(255,255,255,.55)', 120, 40);
          // Faixa do topo
          const grad = ctx.createLinearGradient(0, 0, W, 0);
          grad.addColorStop(0, color.main);
          grad.addColorStop(1, color.dark);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, 112);
          paw(ctx, 905, 40, 70, 'rgba(255,255,255,.18)', 0.3);
          paw(ctx, 960, 92, 44, 'rgba(255,255,255,.14)', -0.4);
          text(ctx, 'RG DO PET', 40, 76, { size: 54, weight: 700, family: 'display', color: '#fff', letterSpacing: 2 });
          brandMark(ctx, 950, 70, 26, 'rgba(255,255,255,.95)', 'right');
          // Rodapé
          ctx.fillStyle = color.dark;
          ctx.fillRect(0, H - 46, W, 46);
          text(ctx, `Kit Identidade Pet · ${DISCLAIMER}`, W / 2, H - 16, { size: 17, weight: 700, color: 'rgba(255,255,255,.9)', align: 'center', maxWidth: W - 60 });
        }
        ctx.restore();

        // Foto
        photoBox(ctx, a.photo, p, 44, 146, 262, 318, 26, { border: 7, borderColor: '#fff', bg: '#fff' });
        // Número do RG do Clube
        const num = maskNumber(clubNumber(c.seed), c.preview);
        fillRR(ctx, 44, 494, 262, 66, 16, '#fff');
        text(ctx, 'Nº DO CLUBE', 175, 518, { size: 15, weight: 800, color: color.dark, align: 'center', letterSpacing: 1.5 });
        text(ctx, num, 175, 549, { size: 27, weight: 900, color: '#3a2a22', align: 'center', letterSpacing: 1 });

        // Campos
        const x = 345;
        const full = W - x - 44;
        const half = (full - 30) / 2;
        const opt = { labelColor: color.dark, lineColor: 'rgba(73,56,47,.18)' };
        text(ctx, 'NOME', x, 160, { size: 17, weight: 800, color: color.dark, letterSpacing: 1.5 });
        text(ctx, petName(p) === 'seu pet' ? '' : petName(p), x, 214, { size: 50, weight: 700, family: 'display', color: '#3a2a22', maxWidth: full });
        line(ctx, x, 228, x + full, 228, 'rgba(73,56,47,.18)', 2);

        field(ctx, 'Raça', p.breed ?? '', x, 270, half, opt);
        field(ctx, 'Sexo', sexLabel(p), x + half + 30, 270, half, opt);
        const dateLabel = p.origin === 'adocao' ? 'Adoção' : 'Nascimento';
        field(ctx, dateLabel, formatDateBR(p.date), x, 348, half, opt);
        field(ctx, 'Espécie', getSpecies(p.species)?.label ?? '', x + half + 30, 348, half, opt);
        field(ctx, 'Personalidade', personalityLabel(p) ?? '', x, 426, half, opt);
        field(ctx, 'Cidade', p.city ?? '', x + half + 30, 426, half, opt);
        field(ctx, 'Tutores', p.tutors ?? '', x, 504, full, opt);
      },
    },
    {
      id: 'rg-verso',
      label: 'Verso',
      w: W,
      h: H,
      mm: [85.6, 54],
      needsQr: true,
      draw(ctx, c, a) {
        const color = rgColors[defaultRgColor(c.pet)];
        const p = c.pet;
        const ex = p.extras ?? {};
        ctx.save();
        rr(ctx, 0, 0, W, H, 40);
        ctx.clip();
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFFDF9';
          ctx.fillRect(0, 0, W, H);
          pawPattern(ctx, 0, 0, W, H, color.light, 130, 40);
          ctx.fillStyle = color.main;
          ctx.fillRect(0, 0, W, 78);
          text(ctx, 'Se me encontrar, fale com meu tutor ♥', W / 2, 52, { size: 32, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: W - 80 });
          ctx.fillStyle = color.dark;
          ctx.fillRect(0, H - 46, W, 46);
          text(ctx, 'Escaneie o QR Code para ver minha página com os contatos de emergência', W / 2, H - 16, { size: 17, weight: 700, color: 'rgba(255,255,255,.92)', align: 'center', maxWidth: W - 60 });
        }
        ctx.restore();

        // QR
        fillRR(ctx, 44, 108, 270, 270, 24, '#fff');
        rr(ctx, 44, 108, 270, 270, 24);
        ctx.strokeStyle = color.main;
        ctx.lineWidth = 4;
        ctx.stroke();
        if (a.qr) {
          ctx.save();
          if (c.preview) ctx.globalAlpha = 0.35;
          ctx.drawImage(a.qr, 64, 128, 230, 230);
          ctx.restore();
        }
        // Patinha
        dashedRect(ctx, 44, 400, 270, 140, 20, color.main, 3);
        paw(ctx, 179, 462, 60, color.light);
        text(ctx, 'PATINHA DO PET', 179, 528, { size: 15, weight: 800, color: color.dark, align: 'center', letterSpacing: 1.5 });

        const x = 345;
        const w = W - x - 44;
        const opt = { labelColor: color.dark, lineColor: 'rgba(73,56,47,.2)', size: 28 };
        field(ctx, 'Telefone do tutor', formatPhone(c.phone), x, 130, w, opt);
        field(ctx, 'Nº do microchip', ex.microchip ?? '', x, 210, w, opt);
        field(ctx, 'Nº do RG Animal (SinPatinhas)', ex.rgAnimal ?? '', x, 290, w, opt);
        field(ctx, 'Pelagem / sinais', ex.coat ?? '', x, 370, (w - 30) / 2, opt);
        field(ctx, 'Porte / peso', [ex.size, ex.weight].filter(Boolean).join(' · '), x + (w - 30) / 2 + 30, 370, (w - 30) / 2, opt);
        field(ctx, 'Alergias / cuidados', ex.allergies ?? ex.conditions ?? '', x, 450, w, opt);
        text(ctx, petName(p) === 'seu pet' ? '' : `${petName(p)} · ${maskNumber(clubNumber(c.seed), c.preview)}`, W - 44, 560, { size: 18, weight: 800, color: 'rgba(73,56,47,.45)', align: 'right', maxWidth: w });
      },
    },
  ],
};
